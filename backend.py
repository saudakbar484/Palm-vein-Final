#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PalmVein Backend — Wraps XRCommonVeinPlusAPI.dll via ctypes
Serves the static frontend and provides REST endpoints for:
  - device init / deinit / status
  - live frame capture
  - enrollment (10 samples) & matching
  - CSV-backed user register / login
"""

from __future__ import annotations

import base64
import csv
import hashlib
import json
import os
import sys
import time
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

from flask import Flask, jsonify, request, send_from_directory, Response, stream_with_context
from flask_cors import CORS
from PIL import Image
import io

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.resolve()
SDK_DIR = BASE_DIR / "XRCommonVeinPlus" / "XRCommonVeinPlus_V3.1.3_t113s" / "Library file" / "win_x64"
CSV_PATH = BASE_DIR / "users.csv"
LOGS_PATH = BASE_DIR / "auth_logs.csv"
IMG_DIR = BASE_DIR / "MagicVeinPlus" / "img"
IMG_DIR.mkdir(parents=True, exist_ok=True)

# Ensure SDK directory is on DLL search path
os.environ["PATH"] = str(SDK_DIR) + os.pathsep + os.environ.get("PATH", "")
if sys.platform == "win32":
    import ctypes
    from ctypes import wintypes
    kernel32 = ctypes.windll.kernel32
    kernel32.SetDllDirectoryW(str(SDK_DIR))

# ── Flask App ────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
CORS(app)

# ── CSV Helpers ─────────────────────────────────────────────────────────────
CSV_LOCK = Lock()


def ensure_csv():
    if not CSV_PATH.exists():
        with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "name", "username", "password_hash", "role", "features_b64", "created_at"])


def ensure_logs_csv():
    if not LOGS_PATH.exists():
        with open(LOGS_PATH, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "timestamp", "username", "method", "result", "confidence", "ip"])


def read_users() -> List[Dict[str, Any]]:
    ensure_csv()
    with open(CSV_PATH, "r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_users(users: List[Dict[str, Any]]):
    ensure_csv()
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        if users:
            w = csv.DictWriter(f, fieldnames=list(users[0].keys()))
            w.writeheader()
            w.writerows(users)
        else:
            w = csv.writer(f)
            w.writerow(["id", "name", "username", "password_hash", "role", "features_b64", "created_at"])


def append_log(entry: Dict[str, Any]):
    ensure_logs_csv()
    with open(LOGS_PATH, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id", "timestamp", "username", "method", "result", "confidence", "ip"])
        if LOGS_PATH.stat().st_size == 0:
            w.writeheader()
        w.writerow(entry)


# ── DLL Wrapper (best-effort ctypes) ─────────────────────────────────────────
class VeinDevice:
    """Wraps XRCommonVeinPlusAPI.dll using the discovered ctx-handle calling convention."""

    # Actual image dimensions returned by XR_Vein_GetStdVeinImage.
    # NOTE: XR_Vein_GetSrcImgSize reports 600x800=480000 which is the *buffer*
    # size, NOT the image size. Empirical inspection shows the SDK fills only
    # the first 307200 bytes (= 480 x 640 portrait). The remaining 172800 bytes
    # are zero padding — using 600x800 produces tiled hands due to stride mismatch.
    IMG_W = 480
    IMG_H = 640
    IMG_BYTES = IMG_W * IMG_H        # 307200
    BUFFER_BYTES = 600 * 800         # 480000 (full buffer the SDK expects)

    def __init__(self):
        self._dll: Optional[Any] = None
        self._ctx: Optional[ctypes.c_void_p] = None  # opaque SDK context handle
        self._feat_size: int = 0
        self._last_frame: Optional[bytes] = None
        self._lock = Lock()
        self._connected = False
        # Per-instance image dimensions, populated from GetSrcImgSize on init()
        self.img_w: int = self.IMG_W
        self.img_h: int = self.IMG_H
        self.img_channels: int = 1
        self.img_bytes: int = self.IMG_BYTES
        self._volume: int = 50
        self._rgb_state: int = 0

    def load(self) -> bool:
        try:
            dll_path = str(SDK_DIR / "XRCommonVeinPlusAPI.dll")
            self._dll = ctypes.CDLL(dll_path)
            self._bind_signatures()
            return True
        except Exception as e:
            print(f"[DLL] Load failed: {e}")
            return False

    def _bind_signatures(self):
        d = self._dll
        VOIDP = ctypes.c_void_p
        INTP = ctypes.POINTER(ctypes.c_int)
        UBP = ctypes.POINTER(ctypes.c_ubyte)
        FP = ctypes.POINTER(ctypes.c_float)

        # All API functions take ctx (void*) as the first argument.
        # Discovered via reverse-engineering against XRTECH device (VID a7a9 PID 0620).
        d.XR_Vein_Init.argtypes = [ctypes.POINTER(VOIDP)]
        d.XR_Vein_Init.restype = ctypes.c_int

        d.XR_Vein_DeInit.argtypes = [VOIDP]
        d.XR_Vein_DeInit.restype = ctypes.c_int

        d.XR_Vein_GetDevCnt.argtypes = [VOIDP, INTP]
        d.XR_Vein_GetDevCnt.restype = ctypes.c_int

        d.XR_Vein_OpenDev.argtypes = [VOIDP, ctypes.c_int]
        d.XR_Vein_OpenDev.restype = ctypes.c_int

        d.XR_Vein_CloseDev.argtypes = [VOIDP]
        d.XR_Vein_CloseDev.restype = ctypes.c_int

        d.XR_Vein_GetFeatSize.argtypes = [VOIDP, INTP]
        d.XR_Vein_GetFeatSize.restype = ctypes.c_int

        # GetSrcImgSize takes (ctx, &w, &h, &channels)
        d.XR_Vein_GetSrcImgSize.argtypes = [VOIDP, INTP, INTP, INTP]
        d.XR_Vein_GetSrcImgSize.restype = ctypes.c_int

        d.XR_Vein_GetStdVeinImage.argtypes = [VOIDP, UBP, INTP]
        d.XR_Vein_GetStdVeinImage.restype = ctypes.c_int

        d.XR_Vein_CapRecgFeat.argtypes = [VOIDP, UBP, INTP]
        d.XR_Vein_CapRecgFeat.restype = ctypes.c_int

        d.XR_Vein_StartEnrollPalm.argtypes = [VOIDP]
        d.XR_Vein_StartEnrollPalm.restype = ctypes.c_int

        d.XR_Vein_GetEnrollState.argtypes = [VOIDP, INTP, INTP]
        d.XR_Vein_GetEnrollState.restype = ctypes.c_int

        d.XR_Vein_FinishEnroll.argtypes = [VOIDP, UBP, INTP]
        d.XR_Vein_FinishEnroll.restype = ctypes.c_int

        d.XR_Vein_CalcFeatureDist.argtypes = [UBP, UBP, FP]
        d.XR_Vein_CalcFeatureDist.restype = ctypes.c_int

        if hasattr(d, "XR_Vein_CheckFeat"):
            d.XR_Vein_CheckFeat.argtypes = [VOIDP, UBP, ctypes.c_int]
            d.XR_Vein_CheckFeat.restype = ctypes.c_int

        if hasattr(d, "XR_Vein_SetRgbState"):
            d.XR_Vein_SetRgbState.argtypes = [VOIDP, ctypes.c_int]
            d.XR_Vein_SetRgbState.restype = ctypes.c_int

        if hasattr(d, "XR_Vein_SetVolume"):
            d.XR_Vein_SetVolume.argtypes = [VOIDP, ctypes.c_int]
            d.XR_Vein_SetVolume.restype = ctypes.c_int

    def init(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {"success": False, "stage": "", "code": None, "message": ""}
        if not self._dll:
            result.update(stage="load", message="XRCommonVeinPlusAPI.dll not loaded")
            return result
        # Reset prior state
        if self._connected:
            self.deinit()

        try:
            ctx = ctypes.c_void_p(0)
            rc = self._dll.XR_Vein_Init(ctypes.byref(ctx))
            print(f"[DLL] XR_Vein_Init -> {rc}, ctx={hex(ctx.value or 0)}")
            result["init_rc"] = rc
            if rc != 0 or not ctx.value:
                result.update(stage="XR_Vein_Init", code=rc,
                              message=f"SDK init failed ({_libusb_err_str(rc)})")
                return result
            self._ctx = ctx

            cnt = ctypes.c_int(0)
            rc = self._dll.XR_Vein_GetDevCnt(self._ctx, ctypes.byref(cnt))
            print(f"[DLL] XR_Vein_GetDevCnt -> rc={rc}, cnt={cnt.value}")
            result["device_count"] = cnt.value
            if rc != 0 or cnt.value <= 0:
                result.update(stage="XR_Vein_GetDevCnt", code=rc,
                              message=f"No XR scanner detected ({_libusb_err_str(rc)}). "
                                      "Plug in the device and bind WinUSB/libusbK driver via Zadig.")
                self._dll.XR_Vein_DeInit(self._ctx)
                self._ctx = None
                return result

            rc = self._dll.XR_Vein_OpenDev(self._ctx, 0)
            print(f"[DLL] XR_Vein_OpenDev(ctx, 0) -> {rc}")
            if rc != 0:
                result.update(stage="XR_Vein_OpenDev", code=rc,
                              message=f"Failed to open device: {_libusb_err_str(rc)}")
                self._dll.XR_Vein_DeInit(self._ctx)
                self._ctx = None
                return result

            fs = ctypes.c_int(0)
            rc = self._dll.XR_Vein_GetFeatSize(self._ctx, ctypes.byref(fs))
            print(f"[DLL] XR_Vein_GetFeatSize -> rc={rc}, sz={fs.value}")
            self._feat_size = fs.value if rc == 0 else 560

            # XR_Vein_GetSrcImgSize is informational — it reports the BUFFER size
            # (600x800=480000), not the actual image size. The real image is 480x640
            # (307200 bytes) followed by zero padding. We use fixed dimensions.
            iw, ih, ic = ctypes.c_int(0), ctypes.c_int(0), ctypes.c_int(0)
            rc = self._dll.XR_Vein_GetSrcImgSize(
                self._ctx, ctypes.byref(iw), ctypes.byref(ih), ctypes.byref(ic)
            )
            print(f"[DLL] XR_Vein_GetSrcImgSize (buffer dims) -> rc={rc}, "
                  f"w={iw.value}, h={ih.value}, c={ic.value}")
            print(f"[DLL] using actual image dims: {self.IMG_W}x{self.IMG_H} "
                  f"({self.IMG_BYTES} bytes), buffer alloc: {self.BUFFER_BYTES}")
            self.img_w = self.IMG_W
            self.img_h = self.IMG_H
            self.img_channels = 1
            self.img_bytes = self.IMG_BYTES

            self._connected = True
            result.update(
                success=True, stage="connected", message="XR Scanner connected",
                info={
                    "feat_size": self._feat_size,
                    "img_size": f"{self.img_w}x{self.img_h}",
                    "channels": self.img_channels,
                },
            )
            return result
        except Exception as e:
            print(f"[DLL] Init error: {e}")
            import traceback; traceback.print_exc()
            result.update(stage="exception", message=str(e))
            return result

    def deinit(self):
        if self._dll and self._ctx is not None:
            try:
                self._dll.XR_Vein_CloseDev(self._ctx)
            except Exception as e:
                print(f"[DLL] CloseDev error: {e}")
            try:
                self._dll.XR_Vein_DeInit(self._ctx)
            except Exception as e:
                print(f"[DLL] DeInit error: {e}")
        self._ctx = None
        self._connected = False

    def is_connected(self) -> bool:
        return self._connected and self._ctx is not None

    def get_frame(self) -> Optional[bytes]:
        """Capture a single frame.

        The SDK requires a full BUFFER_BYTES allocation (600x800=480000) but
        only fills the first IMG_BYTES (480x640=307200) with actual image data.
        We slice off the zero-padded tail before returning.
        """
        if not self.is_connected():
            return None
        with self._lock:
            try:
                buf = (ctypes.c_ubyte * self.BUFFER_BYTES)()
                got = ctypes.c_int(self.BUFFER_BYTES)
                rc = self._dll.XR_Vein_GetStdVeinImage(self._ctx, buf, ctypes.byref(got))
                if rc != 0:
                    return None
                if got.value <= 0:
                    return None
                # Return only the IMG_BYTES of valid image data
                valid = min(self.img_bytes, got.value)
                self._last_frame = bytes(buf[:valid])
                return self._last_frame
            except Exception as e:
                print(f"[DLL] get_frame error: {e}")
                return None

    def capture_feature(self) -> Optional[bytes]:
        if not self.is_connected() or self._feat_size <= 0:
            return None
        with self._lock:
            try:
                feat = (ctypes.c_ubyte * self._feat_size)()
                got = ctypes.c_int(self._feat_size)
                rc = self._dll.XR_Vein_CapRecgFeat(self._ctx, feat, ctypes.byref(got))
                if rc == 0 and got.value > 0:
                    return bytes(feat[:got.value])
                print(f"[DLL] CapRecgFeat -> rc={rc}, got={got.value}")
                return None
            except Exception as e:
                print(f"[DLL] capture_feature error: {e}")
                return None

    def start_enroll(self) -> bool:
        if not self.is_connected():
            return False
        try:
            rc = self._dll.XR_Vein_StartEnrollPalm(self._ctx)
            print(f"[DLL] StartEnrollPalm -> {rc}")
            return rc == 0
        except Exception as e:
            print(f"[DLL] start_enroll error: {e}")
            return False

    def get_enroll_status(self) -> Dict[str, Any]:
        if not self.is_connected():
            return {"state": -1, "progress": 0}
        try:
            state = ctypes.c_int()
            progress = ctypes.c_int()
            rc = self._dll.XR_Vein_GetEnrollState(self._ctx, ctypes.byref(state), ctypes.byref(progress))
            if rc == 0:
                return {"state": state.value, "progress": progress.value}
            return {"state": -1, "progress": 0}
        except Exception as e:
            print(f"[DLL] get_enroll_status error: {e}")
            return {"state": -1, "progress": 0}

    def finish_enroll(self) -> Optional[bytes]:
        if not self.is_connected() or self._feat_size <= 0:
            return None
        try:
            feat = (ctypes.c_ubyte * self._feat_size)()
            got = ctypes.c_int(self._feat_size)
            rc = self._dll.XR_Vein_FinishEnroll(self._ctx, feat, ctypes.byref(got))
            if rc == 0 and got.value > 0:
                return bytes(feat[:got.value])
            return None
        except Exception as e:
            print(f"[DLL] finish_enroll error: {e}")
            return None

    def calc_dist(self, feat_a: bytes, feat_b: bytes) -> Optional[float]:
        if not self._dll or not feat_a or not feat_b:
            return None
        try:
            a = (ctypes.c_ubyte * len(feat_a)).from_buffer_copy(feat_a)
            b = (ctypes.c_ubyte * len(feat_b)).from_buffer_copy(feat_b)
            dist = ctypes.c_float()
            rc = self._dll.XR_Vein_CalcFeatureDist(a, b, ctypes.byref(dist))
            if rc == 0:
                return float(dist.value)
            return None
        except Exception as e:
            print(f"[DLL] calc_dist error: {e}")
            return None

    def set_rgb_state(self, state: int) -> bool:
        """Set RGB LED state (0-7 for different color patterns).
        
        SDK supports different RGB states:
        0 = off/default
        1-7 = various color patterns
        """
        if not self.is_connected():
            return False
        try:
            if hasattr(self._dll, "XR_Vein_SetRgbState"):
                rc = self._dll.XR_Vein_SetRgbState(self._ctx, ctypes.c_int(state))
                print(f"[DLL] SetRgbState({state}) -> {rc}")
                return rc == 0
            return False
        except Exception as e:
            print(f"[DLL] set_rgb_state error: {e}")
            return False

    def set_volume(self, level: int) -> bool:
        """Set speaker volume (0-100).
        
        Level: 0 = mute, 100 = max
        """
        if not self.is_connected():
            return False
        try:
            if hasattr(self._dll, "XR_Vein_SetVolume"):
                # Clamp to 0-100
                level = max(0, min(100, level))
                rc = self._dll.XR_Vein_SetVolume(self._ctx, ctypes.c_int(level))
                print(f"[DLL] SetVolume({level}) -> {rc}")
                self._volume = level
                return rc == 0
            return False
        except Exception as e:
            print(f"[DLL] set_volume error: {e}")
            return False

    def check_feature(self, feat: bytes) -> Optional[Dict[str, Any]]:
        """Validate a feature template and get quality metrics.
        
        Returns: {"valid": bool, "quality": float}
        """
        if not self.is_connected() or not feat:
            return None
        try:
            if hasattr(self._dll, "XR_Vein_CheckFeat"):
                feat_ptr = (ctypes.c_ubyte * len(feat)).from_buffer_copy(feat)
                rc = self._dll.XR_Vein_CheckFeat(self._ctx, feat_ptr, ctypes.c_int(len(feat)))
                # Return code indicates validity; 0 = OK, non-zero = issues
                return {
                    "valid": rc == 0,
                    "quality": float(max(0, 100 - abs(rc * 10))),  # Rough quality estimate
                    "check_code": rc
                }
            return None
        except Exception as e:
            print(f"[DLL] check_feature error: {e}")
            return None

    def info(self) -> Dict[str, Any]:
        return {
            "loaded": self._dll is not None,
            "connected": self.is_connected(),
            "img_size": f"{self.img_w}x{self.img_h}" if self.is_connected() else None,
            "channels": self.img_channels if self.is_connected() else None,
            "feat_size": self._feat_size if self.is_connected() else None,
            "volume": self._volume,
            "rgb_state": self._rgb_state,
        }


# Global device instance
DEVICE = VeinDevice()

# libusb error code mapping for diagnostics
_LIBUSB_ERRORS = {
    0: "SUCCESS",
    -1: "IO error",
    -2: "Invalid parameter",
    -3: "Access denied (driver issue?)",
    -4: "No such device — not plugged in or driver not bound",
    -5: "Entity not found",
    -6: "Resource busy",
    -7: "Operation timed out",
    -8: "Overflow",
    -9: "Pipe error",
    -10: "System call interrupted",
    -11: "Insufficient memory",
    -12: "Operation not supported",
    -99: "Other error",
}


def _libusb_err_str(code: int) -> str:
    if code is None:
        return "unknown"
    if code == 0:
        return "OK"
    return _LIBUSB_ERRORS.get(code, f"code {code}")


def _enumerate_usb() -> List[Dict[str, Any]]:
    """List all USB devices visible to libusb (for diagnostics)."""
    out: List[Dict[str, Any]] = []
    try:
        libusb = ctypes.CDLL(str(SDK_DIR / "libusb-1.0.dll"))
        libusb.libusb_init.argtypes = [ctypes.c_void_p]
        libusb.libusb_init.restype = ctypes.c_int
        libusb.libusb_get_device_list.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_void_p)]
        libusb.libusb_get_device_list.restype = ctypes.c_ssize_t
        libusb.libusb_get_device_descriptor.argtypes = [ctypes.c_void_p, ctypes.c_void_p]
        libusb.libusb_get_device_descriptor.restype = ctypes.c_int
        libusb.libusb_free_device_list.argtypes = [ctypes.c_void_p, ctypes.c_int]

        class DevDesc(ctypes.Structure):
            _fields_ = [
                ("bLength", ctypes.c_uint8), ("bDescriptorType", ctypes.c_uint8),
                ("bcdUSB", ctypes.c_uint16), ("bDeviceClass", ctypes.c_uint8),
                ("bDeviceSubClass", ctypes.c_uint8), ("bDeviceProtocol", ctypes.c_uint8),
                ("bMaxPacketSize0", ctypes.c_uint8), ("idVendor", ctypes.c_uint16),
                ("idProduct", ctypes.c_uint16), ("bcdDevice", ctypes.c_uint16),
                ("iManufacturer", ctypes.c_uint8), ("iProduct", ctypes.c_uint8),
                ("iSerialNumber", ctypes.c_uint8), ("bNumConfigurations", ctypes.c_uint8),
            ]

        libusb.libusb_init(None)
        list_ptr = ctypes.c_void_p()
        n = libusb.libusb_get_device_list(None, ctypes.byref(list_ptr))
        arr = ctypes.cast(list_ptr, ctypes.POINTER(ctypes.c_void_p))
        for i in range(n):
            desc = DevDesc()
            libusb.libusb_get_device_descriptor(arr[i], ctypes.byref(desc))
            out.append({
                "vid": f"{desc.idVendor:04x}",
                "pid": f"{desc.idProduct:04x}",
                "class": desc.bDeviceClass,
            })
        libusb.libusb_free_device_list(list_ptr, 1)
    except Exception as e:
        print(f"[USB enum] {e}")
    return out

# ── Helpers ─────────────────────────────────────────────────────────────────
def now_iso() -> str:
    return datetime.now().isoformat()


def hash_pw(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()


def check_pw(p: str, h: str) -> bool:
    return hashlib.sha256(p.encode()).hexdigest() == h


# ── Routes: Static ───────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(str(BASE_DIR), "index.html")


# ── Routes: Device ───────────────────────────────────────────────────────────
@app.route("/api/device/load", methods=["POST"])
def device_load():
    ok = DEVICE.load()
    return jsonify({"loaded": ok})


@app.route("/api/device/init", methods=["POST"])
def device_init():
    res = DEVICE.init()
    res["info"] = DEVICE.info()
    res["usb_devices"] = _enumerate_usb()
    return jsonify(res)


@app.route("/api/device/usb", methods=["GET"])
def device_usb():
    return jsonify({"usb_devices": _enumerate_usb()})


@app.route("/api/device/deinit", methods=["POST"])
def device_deinit():
    DEVICE.deinit()
    return jsonify({"success": True, "info": DEVICE.info()})


@app.route("/api/device/status", methods=["GET"])
def device_status():
    return jsonify(DEVICE.info())


# ── Routes: LED RGB Control ─────────────────────────────────────────────────
@app.route("/api/device/rgb/set", methods=["POST"])
def device_rgb_set():
    """Set RGB LED state.
    
    Note: The SDK uses a simple state parameter (0-7).
    Advanced RGB color mixing (r, g, b) may not be supported by this hardware.
    """
    data = request.get_json(force=True) or {}
    state = data.get("state", 0)  # 0-7 for different patterns
    
    # Alternative: if data contains r, g, b values, we could encode them
    # But the SDK likely just uses preset states
    if not 0 <= state <= 7:
        return jsonify({"success": False, "message": "State must be 0-7"}), 400
    
    ok = DEVICE.set_rgb_state(state)
    DEVICE._rgb_state = state if ok else DEVICE._rgb_state
    return jsonify({"success": ok, "state": DEVICE._rgb_state})


@app.route("/api/device/rgb/status", methods=["GET"])
def device_rgb_status():
    """Get current RGB LED state."""
    return jsonify({
        "state": DEVICE._rgb_state,
        "states_available": {
            0: "Off/Default",
            1: "Red",
            2: "Green",
            3: "Blue",
            4: "Cyan",
            5: "Magenta",
            6: "Yellow",
            7: "White"
        }
    })


@app.route("/api/device/rgb/preset", methods=["POST"])
def device_rgb_preset():
    """Set RGB to a named preset: 'red', 'green', 'blue', 'cyan', 'magenta', 'yellow', 'white', 'off'."""
    data = request.get_json(force=True) or {}
    preset = (data.get("preset") or "off").lower()
    
    presets = {
        "off": 0, "default": 0,
        "red": 1, "green": 2, "blue": 3,
        "cyan": 4, "magenta": 5, "yellow": 6, "white": 7
    }
    
    if preset not in presets:
        return jsonify({"success": False, "message": f"Unknown preset: {preset}"}), 400
    
    state = presets[preset]
    ok = DEVICE.set_rgb_state(state)
    DEVICE._rgb_state = state if ok else DEVICE._rgb_state
    return jsonify({"success": ok, "preset": preset, "state": DEVICE._rgb_state})


# ── Routes: Volume Control ──────────────────────────────────────────────────
@app.route("/api/device/volume/set", methods=["POST"])
def device_volume_set():
    """Set speaker volume (0-100)."""
    data = request.get_json(force=True) or {}
    level = data.get("level", 50)
    
    if not 0 <= level <= 100:
        return jsonify({"success": False, "message": "Level must be 0-100"}), 400
    
    ok = DEVICE.set_volume(level)
    return jsonify({"success": ok, "level": DEVICE._volume})


@app.route("/api/device/volume/status", methods=["GET"])
def device_volume_status():
    """Get current volume level."""
    return jsonify({"level": DEVICE._volume})


# ── Routes: Feature Validation ──────────────────────────────────────────────
@app.route("/api/feature/check", methods=["POST"])
def feature_check():
    """Validate a feature template and get quality metrics."""
    data = request.get_json(force=True) or {}
    feature_b64 = data.get("feature")
    
    if not feature_b64:
        return jsonify({"success": False, "message": "No feature provided"}), 400
    
    try:
        feat = base64.b64decode(feature_b64)
        result = DEVICE.check_feature(feat)
        
        if result is None:
            return jsonify({"success": False, "message": "Feature check not supported"}), 501
        
        return jsonify({
            "success": True,
            "valid": result["valid"],
            "quality": round(result["quality"], 1),
            "check_code": result.get("check_code", 0)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


@app.route("/api/device/raw")
def device_raw():
    """DEBUG: return raw frame bytes from the SDK (no encoding)."""
    raw = DEVICE.get_frame()
    if raw:
        return Response(raw, mimetype="application/octet-stream")
    return Response(b"", status=503)


# ── Routes: Frame / Stream ──────────────────────────────────────────────────
def _encode_frame_jpeg(raw: bytes, w: int, h: int, channels: int) -> bytes:
    """Encode the raw frame as JPEG with NO enhancement.

    Note: XR_Vein_GetStdVeinImage returns a binary vein mask with pixel values
    in {0, 1}. The only conversion applied here is the mandatory 0->0, 1->255
    mapping so the mask is actually visible; without it the image is pure black.
    No gamma, autocontrast, brightness, sharpening, or filtering is applied.
    """
    mode = "L" if channels == 1 else ("RGB" if channels == 3 else ("RGBA" if channels == 4 else "L"))
    img = Image.frombytes(mode, (w, h), raw[: w * h * channels])

    if channels == 1:
        try:
            mx = img.getextrema()[1]
            if mx <= 1:
                # Binary mask: scale to 0/255 so it renders visibly.
                img = img.point(lambda v: 255 if v else 0)
            # else: leave as-is (no enhancement of any kind)
        except Exception:
            pass

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


@app.route("/api/stream")
def video_stream():
    """Live MJPEG stream from the XR scanner — renders in <img> tag."""
    def generate():
        boundary = b"--frame"
        consecutive_errors = 0
        frame_count = 0
        
        while consecutive_errors < 100:
            try:
                if not DEVICE.is_connected():
                    consecutive_errors += 1
                    time.sleep(0.1)
                    continue
                
                raw = DEVICE.get_frame()
                if not raw:
                    consecutive_errors += 1
                    time.sleep(0.05)
                    continue
                
                consecutive_errors = 0
                jpeg = _encode_frame_jpeg(raw, DEVICE.img_w, DEVICE.img_h, DEVICE.img_channels)
                frame_count += 1
                
                # Proper MJPEG frame format
                frame_header = (
                    boundary + b"\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n"
                    b"Content-Disposition: inline; filename=frame.jpg\r\n"
                    b"\r\n"
                )
                
                yield frame_header + jpeg + b"\r\n"
                time.sleep(0.02)  # ~50 fps
                
            except Exception as e:
                consecutive_errors += 1
                print(f"[Stream] Error on frame {frame_count}: {e}")
                time.sleep(0.1)

    response = Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Connection": "close",
            "X-Accel-Buffering": "no",
            "Transfer-Encoding": "chunked"
        },
    )
    response.direct_passthrough = True
    return response


@app.route("/api/frame", methods=["GET"])
def get_frame():
    """Return a single still frame as JPEG from XRTECH scanner."""
    raw = DEVICE.get_frame()
    if raw:
        try:
            jpeg = _encode_frame_jpeg(raw, DEVICE.img_w, DEVICE.img_h, DEVICE.img_channels)
            return Response(jpeg, mimetype="image/jpeg",
                            headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
        except Exception as e:
            print(f"[Frame] encode error: {e}")
    return Response(b"", mimetype="image/jpeg", status=503)


def _make_grayscale_bmp(raw: bytes, w: int, h: int) -> bytes:
    """Build a valid 8-bit grayscale BMP with palette."""
    row = (w + 3) // 4 * 4
    palette_size = 256 * 4
    pixel_offset = 54 + palette_size
    file_size = pixel_offset + row * h
    bmp = bytearray(file_size)
    # BMP file header (14 bytes)
    bmp[0:2] = b"BM"
    bmp[2:6] = file_size.to_bytes(4, "little")
    bmp[10:14] = pixel_offset.to_bytes(4, "little")
    # DIB header (40 bytes)
    bmp[14:18] = (40).to_bytes(4, "little")
    bmp[18:22] = w.to_bytes(4, "little")
    bmp[22:26] = h.to_bytes(4, "little")
    bmp[26:28] = (1).to_bytes(2, "little")   # planes
    bmp[28:30] = (8).to_bytes(2, "little")   # bits per pixel
    bmp[34:38] = (row * h).to_bytes(4, "little")
    bmp[46:50] = (256).to_bytes(4, "little")  # colors used
    # Grayscale palette
    for i in range(256):
        off = 54 + i * 4
        bmp[off:off + 4] = bytes([i, i, i, 0])
    # Pixel data (BMP is bottom-up by default)
    for y in range(h):
        src_off = y * w
        dst_off = pixel_offset + (h - 1 - y) * row
        bmp[dst_off:dst_off + w] = raw[src_off:src_off + w]
    return bytes(bmp)


# ── Routes: Auth ────────────────────────────────────────────────────────────
@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    name = (data.get("name") or username).strip()
    role = data.get("role") or "user"
    features_b64_list = data.get("features") or []  # list of base64 strings

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400

    users = read_users()
    if any(u["username"] == username for u in users):
        return jsonify({"success": False, "message": "Username already exists"}), 409

    # Validate: require at least 1 feature if device is available, but allow fallback
    features_joined = "|".join(features_b64_list) if features_b64_list else ""

    new_user = {
        "id": str(uuid.uuid4()),
        "name": name,
        "username": username,
        "password_hash": hash_pw(password),
        "role": role,
        "features_b64": features_joined,
        "created_at": now_iso(),
    }
    users.append(new_user)
    write_users(users)

    return jsonify({"success": True, "user": {"id": new_user["id"], "name": name, "username": username, "role": role}})


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    feature_b64 = data.get("feature")  # optional palm-vein feature

    users = read_users()
    user = next((u for u in users if u["username"] == username), None)

    if not user:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    # If palm feature provided, try biometric match first
    matched = False
    confidence = 0.0
    if feature_b64 and user.get("features_b64"):
        try:
            probe = base64.b64decode(feature_b64)
            stored_list = user["features_b64"].split("|")
            best_score = float("inf")
            for sf in stored_list:
                if not sf:
                    continue
                templ = base64.b64decode(sf)
                dist = DEVICE.calc_dist(probe, templ)
                if dist is not None and dist < best_score:
                    best_score = dist
            if best_score != float("inf"):
                # Convert distance-like score to confidence
                # Device docs say <0.95 success. Map 0..0.95 -> 100..50%
                confidence = max(0.0, min(100.0, (1.0 - best_score / 0.95) * 100))
                matched = best_score < 0.95
        except Exception as e:
            print(f"[Match error] {e}")

    # Fall back to password if no feature or match failed
    if not matched:
        if not check_pw(password, user.get("password_hash", "")):
            append_log({
                "id": str(uuid.uuid4()),
                "timestamp": now_iso(),
                "username": username,
                "method": "Palm Vein" if feature_b64 else "Password",
                "result": "Failed",
                "confidence": f"{confidence:.1f}" if feature_b64 else "",
                "ip": request.remote_addr or "",
            })
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
        confidence = 0.0

    append_log({
        "id": str(uuid.uuid4()),
        "timestamp": now_iso(),
        "username": username,
        "method": "Palm Vein" if matched else "Password",
        "result": "Success",
        "confidence": f"{confidence:.1f}",
        "ip": request.remote_addr or "",
    })

    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "role": user["role"],
        },
        "confidence": round(confidence, 1),
        "matched_biometric": matched,
    })


@app.route("/api/users", methods=["GET"])
def api_users():
    users = read_users()
    # Don't return password hashes
    safe = []
    for u in users:
        safe.append({
            "id": u["id"],
            "name": u["name"],
            "username": u["username"],
            "role": u["role"],
            "has_palm": bool(u.get("features_b64")),
            "created_at": u.get("created_at", ""),
        })
    return jsonify({"users": safe})


@app.route("/api/logs", methods=["GET"])
def api_logs():
    ensure_logs_csv()
    with open(LOGS_PATH, "r", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return jsonify({"logs": rows})


# ── Routes: Enrollment / Capture ──────────────────────────────────────────────
ENROLLMENT_SESSION = {
    "active": False,
    "username": None,
    "samples": [],  # list of {feature_b64, timestamp, quality}
    "target_count": 3,  # Number of samples to collect
}


@app.route("/api/enroll/session/start", methods=["POST"])
def enroll_session_start():
    """Start a new enrollment session (collect multiple samples)."""
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    target_count = data.get("target_count", 3)
    
    if not username:
        return jsonify({"success": False, "message": "Username required"}), 400
    
    if not DEVICE.is_connected():
        return jsonify({"success": False, "message": "Device not connected"}), 503
    
    ENROLLMENT_SESSION.update({
        "active": True,
        "username": username,
        "samples": [],
        "target_count": max(1, min(10, target_count)),
    })
    
    # Start enrollment mode
    ok = DEVICE.start_enroll()
    if not ok:
        ENROLLMENT_SESSION["active"] = False
        return jsonify({"success": False, "message": "Failed to start enrollment"}), 500
    
    return jsonify({
        "success": True,
        "session_id": ENROLLMENT_SESSION["username"],
        "target_count": ENROLLMENT_SESSION["target_count"],
        "samples_collected": 0
    })


@app.route("/api/enroll/session/status", methods=["GET"])
def enroll_session_status():
    """Get current enrollment session status."""
    if not ENROLLMENT_SESSION["active"]:
        return jsonify({"active": False})
    
    return jsonify({
        "active": True,
        "username": ENROLLMENT_SESSION["username"],
        "samples_collected": len(ENROLLMENT_SESSION["samples"]),
        "target_count": ENROLLMENT_SESSION["target_count"],
        "progress": (len(ENROLLMENT_SESSION["samples"]) / ENROLLMENT_SESSION["target_count"]) * 100,
        "samples": [
            {
                "index": i,
                "timestamp": s.get("timestamp"),
                "quality": s.get("quality", 0)
            }
            for i, s in enumerate(ENROLLMENT_SESSION["samples"])
        ]
    })


@app.route("/api/enroll/session/capture", methods=["POST"])
def enroll_session_capture():
    """Capture and store one sample in the current enrollment session."""
    if not ENROLLMENT_SESSION["active"]:
        return jsonify({"success": False, "message": "No active enrollment session"}), 400
    
    if len(ENROLLMENT_SESSION["samples"]) >= ENROLLMENT_SESSION["target_count"]:
        return jsonify({"success": False, "message": "Target sample count reached"}), 409
    
    if not DEVICE.is_connected():
        return jsonify({"success": False, "message": "Device not connected"}), 503
    
    try:
        feat = DEVICE.capture_feature()
        if not feat:
            return jsonify({"success": False, "message": "Failed to capture feature"}), 500
        
        # Optionally validate feature quality
        quality_info = DEVICE.check_feature(feat)
        quality = quality_info.get("quality", 75) if quality_info else 75
        
        ENROLLMENT_SESSION["samples"].append({
            "feature_b64": base64.b64encode(feat).decode(),
            "timestamp": now_iso(),
            "quality": round(quality, 1)
        })
        
        progress = (len(ENROLLMENT_SESSION["samples"]) / ENROLLMENT_SESSION["target_count"]) * 100
        
        return jsonify({
            "success": True,
            "sample_index": len(ENROLLMENT_SESSION["samples"]) - 1,
            "samples_collected": len(ENROLLMENT_SESSION["samples"]),
            "target_count": ENROLLMENT_SESSION["target_count"],
            "progress": round(progress, 1),
            "quality": quality
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/enroll/session/finish", methods=["POST"])
def enroll_session_finish():
    """Finish enrollment session and save features to user."""
    if not ENROLLMENT_SESSION["active"]:
        return jsonify({"success": False, "message": "No active enrollment session"}), 400
    
    username = ENROLLMENT_SESSION["username"]
    samples = ENROLLMENT_SESSION["samples"]
    
    if len(samples) == 0:
        ENROLLMENT_SESSION["active"] = False
        return jsonify({"success": False, "message": "No samples collected"}), 400
    
    try:
        # Finish SDK enrollment
        merged_feat = DEVICE.finish_enroll()
        if not merged_feat:
            return jsonify({"success": False, "message": "SDK enrollment finish failed"}), 500
        
        # Store merged feature + all sample features
        features_list = [base64.b64encode(merged_feat).decode()] + [s["feature_b64"] for s in samples]
        
        # Update user
        users = read_users()
        user = next((u for u in users if u["username"] == username), None)
        
        if user:
            # Append new features to existing
            existing = user.get("features_b64", "").split("|") if user.get("features_b64") else []
            existing = [f for f in existing if f]  # Filter empty
            all_features = features_list + existing
            user["features_b64"] = "|".join(all_features)
            write_users(users)
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        ENROLLMENT_SESSION["active"] = False
        
        return jsonify({
            "success": True,
            "username": username,
            "samples_collected": len(samples),
            "avg_quality": round(sum(s.get("quality", 75) for s in samples) / len(samples), 1),
            "message": f"Enrollment complete: {len(samples)} samples captured"
        })
    except Exception as e:
        ENROLLMENT_SESSION["active"] = False
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/enroll/session/cancel", methods=["POST"])
def enroll_session_cancel():
    """Cancel current enrollment session without saving."""
    ENROLLMENT_SESSION["active"] = False
    ENROLLMENT_SESSION["samples"] = []
    return jsonify({"success": True, "message": "Enrollment session cancelled"})


@app.route("/api/enroll/start", methods=["POST"])
def enroll_start():
    ok = DEVICE.start_enroll()
    return jsonify({"success": ok})


@app.route("/api/enroll/status", methods=["GET"])
def enroll_status():
    return jsonify(DEVICE.get_enroll_status())


@app.route("/api/enroll/finish", methods=["POST"])
def enroll_finish():
    feat = DEVICE.finish_enroll()
    if feat:
        return jsonify({"success": True, "feature_b64": base64.b64encode(feat).decode()})
    return jsonify({"success": False, "message": "Enrollment failed or incomplete"})


def _safe_label(s: str) -> str:
    """Sanitize a user-supplied string for use in a filename."""
    s = (s or "").strip() or "anon"
    return "".join(c if c.isalnum() or c in "-_" else "_" for c in s)[:40]


def _save_capture_image(label: str = "scan") -> Optional[str]:
    """Save the current frame as a PNG in IMG_DIR.

    Always tries to grab a FRESH frame from the device first; falls back to
    the most recent cached frame from the MJPEG stream if direct capture fails.
    """
    raw = DEVICE.get_frame() or DEVICE._last_frame
    if not raw:
        print("[Capture] No frame available (device may be disconnected)")
        return None
    try:
        jpg_bytes = _encode_frame_jpeg(raw, DEVICE.img_w, DEVICE.img_h, DEVICE.img_channels)
        img = Image.open(io.BytesIO(jpg_bytes))
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        fname = f"{ts}_{_safe_label(label)}.png"
        img.save(IMG_DIR / fname, format="PNG")
        print(f"[Capture] Saved image -> img/{fname}")
        return fname
    except Exception as e:
        print(f"[Capture] Failed to save image: {e}")
        return None


@app.route("/api/capture", methods=["POST"])
def api_capture():
    """Save the current frame to img/. Feature extraction is best-effort."""
    data = request.get_json(silent=True) or {}
    label = data.get("label") or data.get("username") or "scan"

    if not DEVICE.is_connected():
        return jsonify({
            "success": False,
            "message": "Device not connected",
            "image_saved": None,
        })

    saved = _save_capture_image(label)
    feat = None
    try:
        feat = DEVICE.capture_feature()
    except Exception as e:
        print(f"[Capture] feature extraction errored: {e}")

    return jsonify({
        "success": bool(saved),
        "image_saved": saved,
        "feature_b64": base64.b64encode(feat).decode() if feat else None,
        "message": None if saved else "No frame available from scanner",
    })


# ── Main ─────────────────────────────────────────────────────────────────────
import atexit
import signal


def _graceful_shutdown(*_args):
    """Release the USB device so libusb doesn't leave the endpoint stuck."""
    try:
        print("\n[Shutdown] Releasing device...")
        DEVICE.deinit()
        print("[Shutdown] Device released.")
    except Exception as e:
        print(f"[Shutdown] Error: {e}")
    # If called from a signal, exit now.
    if _args:
        sys.exit(0)


if __name__ == "__main__":
    print("=" * 60)
    print(" PalmVein Backend")
    print(f" SDK dir: {SDK_DIR}")
    print(f" CSV:     {CSV_PATH}")
    print("=" * 60)
    # Try loading DLL on startup (no init yet — wait for frontend call)
    loaded = DEVICE.load()
    print(f" DLL load: {'OK' if loaded else 'FAILED (fallback mode)'}")

    # Register cleanup hooks so the USB device is always released.
    atexit.register(_graceful_shutdown)
    for sig in (signal.SIGINT, signal.SIGTERM, getattr(signal, "SIGBREAK", signal.SIGTERM)):
        try:
            signal.signal(sig, _graceful_shutdown)
        except (ValueError, OSError):
            pass

    print(" Serving at http://0.0.0.0:5000")
    try:
        app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
    finally:
        _graceful_shutdown()
