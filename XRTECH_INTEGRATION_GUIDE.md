# XRTECH Sensor Integration Guide — Authentication Kiosk

## Overview
The XRTECH palm vein sensor integrates with the Authentication Kiosk via:
1. **USB Hardware Connection** → libusb + XRCommonVeinPlusAPI.dll
2. **Backend (Python/Flask)** → Wraps SDK, exposes REST endpoints
3. **Frontend (React)** → Live MJPEG stream + biometric authentication

---

## Architecture Flow

```
[XRTECH USB Device] 
    ↓ (libusb/XRCommonVeinPlusAPI.dll)
[Python Backend - VeinDevice]
    ├── Device Init/Deinit
    ├── Frame Capture
    ├── Feature Extraction
    └── Biometric Matching
    ↓ (REST API)
[Flask HTTP Endpoints]
    ├── /api/stream (MJPEG live feed)
    ├── /api/capture (single frame + feature)
    ├── /api/enroll/* (enrollment)
    └── /api/login (biometric auth)
    ↓
[React Frontend - PalmVeinCamera]
    ├── Displays live stream in <img> tag
    ├── Shows "● XR LIVE" status when connected
    └── Handles frame capture and feature submission
```

---

## Step-by-Step How It Works

### Step 1: Device Connection (Backend)

**File:** `backend.py` → `VeinDevice.init()`

```python
def init(self) -> Dict[str, Any]:
    """Initialize XRTECH device and validate connection."""
    
    # 1. Load DLL (if not already loaded)
    if not self._dll:
        return {"success": False, "stage": "load", "message": "DLL not loaded"}
    
    # 2. Initialize SDK context
    ctx = ctypes.c_void_p(0)
    rc = self._dll.XR_Vein_Init(ctypes.byref(ctx))
    if rc != 0 or not ctx.value:
        return {"success": False, "stage": "XR_Vein_Init", "code": rc, 
                "message": "SDK init failed"}
    self._ctx = ctx
    
    # 3. Count connected devices
    cnt = ctypes.c_int(0)
    rc = self._dll.XR_Vein_GetDevCnt(self._ctx, ctypes.byref(cnt))
    if rc != 0 or cnt.value <= 0:
        return {"success": False, "stage": "XR_Vein_GetDevCnt", "code": rc,
                "message": "No XR scanner detected. Plug in device and bind WinUSB driver."}
    
    # 4. Open the first device (index 0)
    rc = self._dll.XR_Vein_OpenDev(self._ctx, 0)
    if rc != 0:
        return {"success": False, "stage": "XR_Vein_OpenDev", "code": rc,
                "message": "Failed to open device"}
    
    # 5. Query image size and feature size
    fs = ctypes.c_int(0)
    rc = self._dll.XR_Vein_GetFeatSize(self._ctx, ctypes.byref(fs))
    self._feat_size = fs.value if rc == 0 else 560
    
    # 6. Get image dimensions (NOTE: SDK reports buffer size, not actual image size)
    # Actual image is 480x640, SDK allocates 600x800 buffer
    self.img_w = 480
    self.img_h = 640
    self.img_channels = 1  # Grayscale vein mask
    
    self._connected = True
    return {
        "success": True, 
        "stage": "connected",
        "message": "XR Scanner connected",
        "info": {
            "feat_size": self._feat_size,
            "img_size": "480x640",
            "channels": 1,
        },
    }
```

**REST Endpoint:**
```python
@app.route("/api/device/init", methods=["POST"])
def device_init():
    res = DEVICE.init()
    res["info"] = DEVICE.info()
    res["usb_devices"] = _enumerate_usb()  # Diagnostics
    return jsonify(res)
```

---

### Step 2: Live Stream (Frontend)

**File:** `page-auth.jsx` → `PalmVeinCamera` component

```jsx
function PalmVeinCamera({ onCapture, captureLabel = "Capture" }) {
  const [connected, setConnected] = useA(false);
  const [connecting, setConnecting] = useA(false);
  const imgRef = useAR(null);
  const toast = useToast();

  // 1. CONNECT ON MOUNT
  useAE(() => {
    connectDevice();
    return stopPolling;
  }, []);

  // 2. CONNECT DEVICE (probe status → init)
  async function connectDevice() {
    setConnecting(true);
    
    // Check if device is already live
    const stat = await api("/api/device/status");
    if (stat.data?.connected) {
      setConnected(true);
      setConnecting(false);
      setTimeout(startStream, 50);  // Attach MJPEG stream
      return;
    }

    // Try initializing
    const res = await api("/api/device/init", { method: "POST" });
    setConnecting(false);
    
    if (res.data?.success) {
      setConnected(true);
      toast("XR Scanner connected", "success");
      setTimeout(startStream, 50);
    } else {
      setConnected(false);
      toast("XR Scanner not found", "error");
    }
  }

  // 3. START MJPEG STREAM
  function startStream() {
    if (imgRef.current) {
      imgRef.current.src = `${API_BASE}/api/stream?_t=${Date.now()}`;
    }
  }

  // 4. ENSURE <img> ELEMENT MOUNTS BEFORE ATTACHING STREAM
  useAE(() => {
    if (!connected) return;
    let attempts = 0;
    const id = setInterval(() => {
      if (imgRef.current) {
        imgRef.current.src = `${API_BASE}/api/stream?_t=${Date.now()}`;
        clearInterval(id);
      } else if (++attempts > 20) {
        clearInterval(id);
      }
    }, 50);
    return () => clearInterval(id);
  }, [connected]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Live feed display */}
      <div style={{
        position: "relative", width: 420, height: 315,
        borderRadius: 14, overflow: "hidden", background: "#000",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {connected ? (
          <img ref={imgRef}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            alt="XR Scanner palm vein feed" />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "var(--text3)", fontFamily: "var(--mono)",
          }}>
            {connecting ? (
              <>
                <Spinner size={24} />
                <div style={{ color: "var(--amber)" }}>CONNECTING TO XR SCANNER</div>
              </>
            ) : (
              <div>INITIALIZING...</div>
            )}
          </div>
        )}

        {/* Status badge "● XR LIVE" or "✕ Disconnected" */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(7,7,12,0.75)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, fontFamily: "var(--mono)",
          color: connected ? "var(--green)" : "var(--red)"
        }}>
          {connected ? "● XR LIVE" : "✕ Disconnected"}
        </div>
      </div>

      {/* Capture button */}
      <button onClick={handleCapture} disabled={!connected}>
        {captureLabel}
      </button>
    </div>
  );
}
```

---

### Step 3: Stream Endpoint (Backend)

**File:** `backend.py` → `/api/stream` endpoint

```python
@app.route("/api/stream")
def video_stream():
    """Live MJPEG stream from XR scanner.
    
    Browser natively renders multipart/x-mixed-replace as video.
    Stream runs indefinitely while device is connected.
    """
    def generate():
        while True:
            if not DEVICE.is_connected():
                time.sleep(0.5)
                continue
            
            # Get raw frame from device (480x640 grayscale)
            raw = DEVICE.get_frame()
            if not raw:
                time.sleep(0.05)
                continue
            
            try:
                # Encode frame as JPEG
                # Important: Binary vein mask (0,1) is scaled to (0,255)
                jpeg = _encode_frame_jpeg(raw, DEVICE.img_w, DEVICE.img_h, DEVICE.img_channels)
            except Exception as e:
                print(f"[Stream] encode error: {e}")
                time.sleep(0.1)
                continue
            
            # Yield MJPEG frame with boundary markers
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n\r\n"
                + jpeg + b"\r\n"
            )
            time.sleep(0.03)  # ~30 fps
    
    return Response(
        stream_with_context(generate()),
        mimetype="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
    )
```

**How Encoding Works:**
```python
def _encode_frame_jpeg(raw: bytes, w: int, h: int, channels: int) -> bytes:
    """Encode raw frame as JPEG.
    
    Input: Binary vein mask with pixel values {0, 1}
    Output: Visible JPEG (0→0, 1→255)
    """
    # Create PIL Image from binary data
    img = Image.frombytes("L", (w, h), raw[: w * h * channels])
    
    # Scale binary mask to 0/255 so it's visible
    if channels == 1:
        mx = img.getextrema()[1]
        if mx <= 1:
            img = img.point(lambda v: 255 if v else 0)
    
    # Encode to JPEG
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()
```

---

### Step 4: Frame Capture & Feature Extraction

**File:** `backend.py` → Frame capture logic

```python
def get_frame(self) -> Optional[bytes]:
    """Capture a single frame from device.
    
    SDK allocates 600x800=480000 bytes but only fills 480x640=307200.
    We return the valid portion (480x640).
    """
    if not self.is_connected():
        return None
    
    with self._lock:
        try:
            # Allocate buffer (600x800)
            buf = (ctypes.c_ubyte * self.BUFFER_BYTES)()
            got = ctypes.c_int(self.BUFFER_BYTES)
            
            # Capture frame
            rc = self._dll.XR_Vein_GetStdVeinImage(self._ctx, buf, ctypes.byref(got))
            
            if rc == 0 and got.value > 0:
                # Return only valid portion (480x640)
                valid = min(self.img_bytes, got.value)
                self._last_frame = bytes(buf[:valid])
                return self._last_frame
            
            return None
        except Exception as e:
            print(f"[DLL] get_frame error: {e}")
            return None

def capture_feature(self) -> Optional[bytes]:
    """Extract biometric feature (template) from current palm.
    
    Returns: ~560 bytes of feature data (binary template)
    """
    if not self.is_connected() or self._feat_size <= 0:
        return None
    
    with self._lock:
        try:
            feat = (ctypes.c_ubyte * self._feat_size)()
            got = ctypes.c_int(self._feat_size)
            
            rc = self._dll.XR_Vein_CapRecgFeat(self._ctx, feat, ctypes.byref(got))
            
            if rc == 0 and got.value > 0:
                return bytes(feat[:got.value])
            
            return None
        except Exception as e:
            print(f"[DLL] capture_feature error: {e}")
            return None
```

**REST Endpoint for Capture:**
```python
@app.route("/api/capture", methods=["POST"])
def api_capture():
    """Save current frame + extract feature."""
    data = request.get_json(silent=True) or {}
    label = data.get("label") or "scan"
    
    if not DEVICE.is_connected():
        return jsonify({
            "success": False,
            "message": "Device not connected",
            "image_saved": None,
        })
    
    # Save frame to disk
    saved = _save_capture_image(label)
    
    # Extract feature
    feat = None
    try:
        feat = DEVICE.capture_feature()
    except Exception as e:
        print(f"[Capture] feature extraction error: {e}")
    
    return jsonify({
        "success": bool(saved),
        "image_saved": saved,              # "20260522_143021_scan.png"
        "feature_b64": base64.b64encode(feat).decode() if feat else None,  # ~800 chars base64
        "message": None if saved else "No frame available",
    })
```

---

### Step 5: Biometric Authentication (Login)

**File:** `backend.py` → `/api/login` endpoint

```python
@app.route("/api/login", methods=["POST"])
def api_login():
    """Authenticate user with optional palm vein biometric.
    
    Flow:
    1. If palm feature provided → calculate distance to enrolled templates
    2. If distance < 0.95 threshold → BIOMETRIC MATCH (success)
    3. Else → fall back to password verification
    """
    data = request.get_json(force=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password") or ""
    feature_b64 = data.get("feature")  # Optional palm vein feature from frontend
    
    # 1. Find user
    users = read_users()
    user = next((u for u in users if u["username"] == username), None)
    
    if not user:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    
    # 2. Try biometric match (if feature provided)
    matched = False
    confidence = 0.0
    
    if feature_b64 and user.get("features_b64"):
        try:
            # Decode probe feature from login
            probe = base64.b64decode(feature_b64)
            
            # Compare against all enrolled templates (stored as "|" separated)
            stored_list = user["features_b64"].split("|")
            best_score = float("inf")
            
            for stored_b64 in stored_list:
                if not stored_b64:
                    continue
                
                templ = base64.b64decode(stored_b64)
                
                # Calculate distance (lower = more similar)
                dist = DEVICE.calc_dist(probe, templ)
                
                if dist is not None and dist < best_score:
                    best_score = dist
            
            # Convert distance to confidence percentage
            # SDK docs: distance < 0.95 = match success
            # Mapping: 0..0.95 → 100..50%
            if best_score != float("inf"):
                confidence = max(0.0, min(100.0, (1.0 - best_score / 0.95) * 100))
                matched = best_score < 0.95
        
        except Exception as e:
            print(f"[Match error] {e}")
    
    # 3. Fallback to password if no biometric match
    if not matched:
        if not check_pw(password, user.get("password_hash", "")):
            # Log failed attempt
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
    
    # 4. Success — log and return user
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
```

---

### Step 6: Feature Distance Calculation

**File:** `backend.py` → Biometric matching

```python
def calc_dist(self, feat_a: bytes, feat_b: bytes) -> Optional[float]:
    """Calculate Euclidean distance between two templates.
    
    Lower distance = more similar palms
    Distance < 0.95 = successful match
    """
    if not self._dll or not feat_a or not feat_b:
        return None
    
    try:
        # Convert to ctypes arrays
        a = (ctypes.c_ubyte * len(feat_a)).from_buffer_copy(feat_a)
        b = (ctypes.c_ubyte * len(feat_b)).from_buffer_copy(feat_b)
        dist = ctypes.c_float()
        
        # Call SDK function
        rc = self._dll.XR_Vein_CalcFeatureDist(a, b, ctypes.byref(dist))
        
        if rc == 0:
            return float(dist.value)
        
        return None
    except Exception as e:
        print(f"[DLL] calc_dist error: {e}")
        return None
```

---

## How to Use XRTECH Sensor in Another Project

### Step 1: Copy SDK Files
```
Your-Project/
├── XRCommonVeinPlus/
│   └── XRCommonVeinPlus_V3.1.3_t113s/
│       └── Library file/
│           └── win_x64/
│               ├── XRCommonVeinPlusAPI.dll
│               ├── libusb-1.0.dll
│               └── (other supporting DLLs)
```

### Step 2: Create Device Wrapper (Python)

```python
import ctypes
from ctypes import wintypes
import os
import sys
from pathlib import Path

class XRTechDevice:
    """Minimal wrapper for XRTECH sensor."""
    
    IMG_W = 480
    IMG_H = 640
    IMG_BYTES = IMG_W * IMG_H
    BUFFER_BYTES = 600 * 800
    
    def __init__(self, sdk_dir: str):
        self.sdk_dir = Path(sdk_dir)
        self._dll = None
        self._ctx = None
        self._feat_size = 0
        self._connected = False
        
        # Add SDK dir to DLL search path
        os.environ["PATH"] = str(self.sdk_dir) + os.pathsep + os.environ.get("PATH", "")
        if sys.platform == "win32":
            kernel32 = ctypes.windll.kernel32
            kernel32.SetDllDirectoryW(str(self.sdk_dir))
    
    def load(self) -> bool:
        """Load the DLL."""
        try:
            dll_path = str(self.sdk_dir / "XRCommonVeinPlusAPI.dll")
            self._dll = ctypes.CDLL(dll_path)
            self._bind_signatures()
            return True
        except Exception as e:
            print(f"DLL load failed: {e}")
            return False
    
    def _bind_signatures(self):
        """Bind C function signatures."""
        d = self._dll
        VOIDP = ctypes.c_void_p
        INTP = ctypes.POINTER(ctypes.c_int)
        UBP = ctypes.POINTER(ctypes.c_ubyte)
        
        d.XR_Vein_Init.argtypes = [ctypes.POINTER(VOIDP)]
        d.XR_Vein_Init.restype = ctypes.c_int
        
        d.XR_Vein_DeInit.argtypes = [VOIDP]
        d.XR_Vein_DeInit.restype = ctypes.c_int
        
        d.XR_Vein_GetDevCnt.argtypes = [VOIDP, INTP]
        d.XR_Vein_GetDevCnt.restype = ctypes.c_int
        
        d.XR_Vein_OpenDev.argtypes = [VOIDP, ctypes.c_int]
        d.XR_Vein_OpenDev.restype = ctypes.c_int
        
        d.XR_Vein_GetFeatSize.argtypes = [VOIDP, INTP]
        d.XR_Vein_GetFeatSize.restype = ctypes.c_int
        
        d.XR_Vein_GetStdVeinImage.argtypes = [VOIDP, UBP, INTP]
        d.XR_Vein_GetStdVeinImage.restype = ctypes.c_int
        
        d.XR_Vein_CapRecgFeat.argtypes = [VOIDP, UBP, INTP]
        d.XR_Vein_CapRecgFeat.restype = ctypes.c_int
        
        d.XR_Vein_CalcFeatureDist.argtypes = [UBP, UBP, ctypes.POINTER(ctypes.c_float)]
        d.XR_Vein_CalcFeatureDist.restype = ctypes.c_int
    
    def init(self) -> bool:
        """Initialize device."""
        if not self._dll:
            return False
        
        try:
            ctx = ctypes.c_void_p(0)
            rc = self._dll.XR_Vein_Init(ctypes.byref(ctx))
            if rc != 0 or not ctx.value:
                return False
            self._ctx = ctx
            
            # Check device count
            cnt = ctypes.c_int(0)
            rc = self._dll.XR_Vein_GetDevCnt(self._ctx, ctypes.byref(cnt))
            if rc != 0 or cnt.value <= 0:
                self._dll.XR_Vein_DeInit(self._ctx)
                return False
            
            # Open device
            rc = self._dll.XR_Vein_OpenDev(self._ctx, 0)
            if rc != 0:
                self._dll.XR_Vein_DeInit(self._ctx)
                return False
            
            # Get feature size
            fs = ctypes.c_int(0)
            self._dll.XR_Vein_GetFeatSize(self._ctx, ctypes.byref(fs))
            self._feat_size = fs.value if fs.value > 0 else 560
            
            self._connected = True
            return True
        except Exception as e:
            print(f"Init error: {e}")
            return False
    
    def deinit(self):
        """Release device."""
        if self._dll and self._ctx:
            try:
                self._dll.XR_Vein_CloseDev(self._ctx)
                self._dll.XR_Vein_DeInit(self._ctx)
            except:
                pass
        self._ctx = None
        self._connected = False
    
    def get_frame(self) -> bytes:
        """Get current frame."""
        if not self._connected:
            return None
        
        try:
            buf = (ctypes.c_ubyte * self.BUFFER_BYTES)()
            got = ctypes.c_int(self.BUFFER_BYTES)
            rc = self._dll.XR_Vein_GetStdVeinImage(self._ctx, buf, ctypes.byref(got))
            
            if rc == 0:
                valid = min(self.IMG_BYTES, got.value)
                return bytes(buf[:valid])
            return None
        except Exception as e:
            print(f"get_frame error: {e}")
            return None
    
    def capture_feature(self) -> bytes:
        """Extract palm vein feature."""
        if not self._connected:
            return None
        
        try:
            feat = (ctypes.c_ubyte * self._feat_size)()
            got = ctypes.c_int(self._feat_size)
            rc = self._dll.XR_Vein_CapRecgFeat(self._ctx, feat, ctypes.byref(got))
            
            if rc == 0 and got.value > 0:
                return bytes(feat[:got.value])
            return None
        except Exception as e:
            print(f"capture_feature error: {e}")
            return None
    
    def calc_dist(self, feat_a: bytes, feat_b: bytes) -> float:
        """Calculate distance between templates."""
        try:
            a = (ctypes.c_ubyte * len(feat_a)).from_buffer_copy(feat_a)
            b = (ctypes.c_ubyte * len(feat_b)).from_buffer_copy(feat_b)
            dist = ctypes.c_float()
            rc = self._dll.XR_Vein_CalcFeatureDist(a, b, ctypes.byref(dist))
            return float(dist.value) if rc == 0 else None
        except:
            return None


# Usage Example
if __name__ == "__main__":
    device = XRTechDevice("./XRCommonVeinPlus/XRCommonVeinPlus_V3.1.3_t113s/Library file/win_x64")
    
    if not device.load():
        print("Failed to load DLL")
        exit(1)
    
    if not device.init():
        print("Failed to initialize device")
        exit(1)
    
    print("Device connected!")
    
    # Get frame
    frame = device.get_frame()
    if frame:
        print(f"Got frame: {len(frame)} bytes")
    
    # Get feature
    feature = device.capture_feature()
    if feature:
        print(f"Got feature: {len(feature)} bytes")
    
    device.deinit()
```

### Step 3: Create Flask Backend

```python
from flask import Flask, Response, jsonify
from xrtech_device import XRTechDevice
import io
import time
from PIL import Image

app = Flask(__name__)
device = XRTechDevice("./XRCommonVeinPlus/.../win_x64")

# Initialize on startup
if not device.load():
    print("Failed to load device DLL")
    exit(1)

if not device.init():
    print("Failed to initialize device")
    exit(1)

@app.route("/api/stream")
def stream():
    """MJPEG stream."""
    def generate():
        while True:
            raw = device.get_frame()
            if not raw:
                time.sleep(0.05)
                continue
            
            try:
                # Convert raw frame to JPEG
                img = Image.frombytes("L", (480, 640), raw)
                img = img.point(lambda v: 255 if v else 0)  # Scale binary
                
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=90)
                jpeg = buf.getvalue()
                
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n\r\n"
                    + jpeg + b"\r\n"
                )
                time.sleep(0.03)
            except:
                time.sleep(0.1)
    
    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/api/capture", methods=["POST"])
def capture():
    """Capture frame + feature."""
    feature = device.capture_feature()
    return jsonify({
        "success": bool(feature),
        "feature_b64": base64.b64encode(feature).decode() if feature else None
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

### Step 4: Create React Frontend

```jsx
function SensorViewer() {
  const [connected, setConnected] = React.useState(false);
  const imgRef = React.useRef(null);

  React.useEffect(() => {
    connectDevice();
  }, []);

  async function connectDevice() {
    try {
      const res = await fetch("http://localhost:5000/api/stream");
      if (res.ok && imgRef.current) {
        imgRef.current.src = "http://localhost:5000/api/stream";
        setConnected(true);
      }
    } catch (e) {
      console.error("Connection failed:", e);
    }
  }

  return (
    <div>
      <div style={{ position: "relative", width: 420, height: 315 }}>
        <img ref={imgRef} style={{ width: "100%", height: "100%" }} />
        <div style={{
          position: "absolute", top: 10, left: 10,
          color: connected ? "#00ff00" : "#ff0000"
        }}>
          {connected ? "● LIVE" : "✕ Disconnected"}
        </div>
      </div>
    </div>
  );
}
```

---

## Key Technical Details

| Aspect | Value |
|--------|-------|
| **Image Size** | 480 × 640 pixels |
| **Image Format** | Grayscale (8-bit) |
| **Image Bytes** | 307,200 bytes |
| **Feature Size** | ~560 bytes (template) |
| **Match Threshold** | distance < 0.95 |
| **Stream Frame Rate** | ~30 fps (MJPEG) |
| **Feature Encoding** | Binary template (base64 in JSON) |
| **USB VID:PID** | a7a9:0620 (XRTECH) |
| **Driver Required** | WinUSB or libusbK (via Zadig) |

---

## Troubleshooting

### "XR Scanner not found" on Windows
1. Plug in the XRTECH device
2. Download **Zadig** from `zadig.akeo.ie`
3. Select device (VID: a7a9, PID: 0620)
4. Choose **WinUSB** driver
5. Click **Install Driver**
6. Restart backend

### "No frame available" or Empty Stream
- Check device is powered on
- Verify USB 3.0+ cable (higher bandwidth)
- Restart backend: `DEVICE.deinit()` then `DEVICE.init()`

### Features Not Matching
- Ensure palm is centered on scanner
- Feature extraction requires good image quality
- Threshold is 0.95 — adjust if too strict

---

## Summary

**XRTECH Integration = 3 Layers:**
1. **C DLL (XRCommonVeinPlusAPI.dll)** → Raw hardware control via ctypes
2. **Python Backend** → REST API wrapping DLL calls
3. **React Frontend** → Live MJPEG display + UI feedback

To use in another project: copy SDK files + adapt the Python wrapper + create HTTP endpoints + connect React component.

