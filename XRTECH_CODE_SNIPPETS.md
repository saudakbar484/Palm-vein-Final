# XRTECH Sensor — Quick Code Reference

## 1. Python Backend — Device Wrapper

```python
import ctypes
from ctypes import wintypes
import os
import sys
from pathlib import Path
from threading import Lock

class XRTechDevice:
    IMG_W, IMG_H = 480, 640
    IMG_BYTES = IMG_W * IMG_H
    BUFFER_BYTES = 600 * 800

    def __init__(self, sdk_path: str):
        self.sdk_path = Path(sdk_path)
        self._dll = None
        self._ctx = None
        self._feat_size = 0
        self._connected = False
        self._lock = Lock()
        
        # Setup DLL search path
        os.environ["PATH"] = str(self.sdk_path) + os.pathsep + os.environ.get("PATH", "")
        if sys.platform == "win32":
            kernel32 = ctypes.windll.kernel32
            kernel32.SetDllDirectoryW(str(self.sdk_path))

    def load(self) -> bool:
        try:
            dll_path = str(self.sdk_path / "XRCommonVeinPlusAPI.dll")
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
        
        d.XR_Vein_CalcFeatureDist.argtypes = [UBP, UBP, FP]
        d.XR_Vein_CalcFeatureDist.restype = ctypes.c_int

    def init(self) -> bool:
        if not self._dll:
            return False
        
        try:
            ctx = ctypes.c_void_p(0)
            rc = self._dll.XR_Vein_Init(ctypes.byref(ctx))
            if rc != 0 or not ctx.value:
                return False
            self._ctx = ctx

            cnt = ctypes.c_int(0)
            rc = self._dll.XR_Vein_GetDevCnt(self._ctx, ctypes.byref(cnt))
            if rc != 0 or cnt.value <= 0:
                self._dll.XR_Vein_DeInit(self._ctx)
                self._ctx = None
                return False

            rc = self._dll.XR_Vein_OpenDev(self._ctx, 0)
            if rc != 0:
                self._dll.XR_Vein_DeInit(self._ctx)
                self._ctx = None
                return False

            fs = ctypes.c_int(0)
            self._dll.XR_Vein_GetFeatSize(self._ctx, ctypes.byref(fs))
            self._feat_size = fs.value if fs.value > 0 else 560

            self._connected = True
            print(f"[Device] Initialized: {self.IMG_W}x{self.IMG_H}, feat_size={self._feat_size}")
            return True
        except Exception as e:
            print(f"[Device] Init error: {e}")
            return False

    def deinit(self):
        if self._dll and self._ctx:
            try:
                self._dll.XR_Vein_CloseDev(self._ctx)
                self._dll.XR_Vein_DeInit(self._ctx)
            except:
                pass
        self._ctx = None
        self._connected = False

    def is_connected(self) -> bool:
        return self._connected and self._ctx is not None

    def get_frame(self) -> bytes:
        if not self.is_connected():
            return None
        with self._lock:
            try:
                buf = (ctypes.c_ubyte * self.BUFFER_BYTES)()
                got = ctypes.c_int(self.BUFFER_BYTES)
                rc = self._dll.XR_Vein_GetStdVeinImage(self._ctx, buf, ctypes.byref(got))
                if rc == 0 and got.value > 0:
                    valid = min(self.IMG_BYTES, got.value)
                    return bytes(buf[:valid])
                return None
            except Exception as e:
                print(f"[get_frame] {e}")
                return None

    def capture_feature(self) -> bytes:
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
                print(f"[capture_feature] {e}")
                return None

    def calc_dist(self, feat_a: bytes, feat_b: bytes) -> float:
        if not self._dll or not feat_a or not feat_b:
            return None
        try:
            a = (ctypes.c_ubyte * len(feat_a)).from_buffer_copy(feat_a)
            b = (ctypes.c_ubyte * len(feat_b)).from_buffer_copy(feat_b)
            dist = ctypes.c_float()
            rc = self._dll.XR_Vein_CalcFeatureDist(a, b, ctypes.byref(dist))
            return float(dist.value) if rc == 0 else None
        except Exception as e:
            print(f"[calc_dist] {e}")
            return None
```

---

## 2. Flask Backend — MJPEG Stream

```python
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import time
import io
from PIL import Image
import base64

app = Flask(__name__)
CORS(app)

# Global device instance
DEVICE = XRTechDevice("./path/to/XRCommonVeinPlus/.../win_x64")

@app.before_request
def init_device():
    if not hasattr(app, 'device_initialized'):
        if DEVICE.load() and DEVICE.init():
            app.device_initialized = True
        else:
            app.device_initialized = False

@app.route("/api/stream")
def video_stream():
    """Live MJPEG stream (480x640 grayscale)."""
    def generate():
        while True:
            if not DEVICE.is_connected():
                time.sleep(0.5)
                continue
            
            raw = DEVICE.get_frame()
            if not raw:
                time.sleep(0.05)
                continue
            
            try:
                # Convert binary mask to JPEG (0→0, 1→255)
                img = Image.frombytes("L", (DEVICE.IMG_W, DEVICE.IMG_H), raw)
                mx = img.getextrema()[1]
                if mx <= 1:
                    img = img.point(lambda v: 255 if v else 0)
                
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=90)
                jpeg = buf.getvalue()
                
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n\r\n"
                    + jpeg + b"\r\n"
                )
                time.sleep(0.033)  # ~30 fps
            except Exception as e:
                print(f"[Stream] {e}")
                time.sleep(0.1)
    
    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )

@app.route("/api/frame", methods=["GET"])
def get_frame():
    """Single still frame as JPEG."""
    raw = DEVICE.get_frame()
    if not raw:
        return jsonify({"error": "No frame"}), 503
    
    try:
        img = Image.frombytes("L", (DEVICE.IMG_W, DEVICE.IMG_H), raw)
        mx = img.getextrema()[1]
        if mx <= 1:
            img = img.point(lambda v: 255 if v else 0)
        
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return Response(buf.getvalue(), mimetype="image/jpeg")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/capture", methods=["POST"])
def capture():
    """Capture frame + extract feature."""
    if not DEVICE.is_connected():
        return jsonify({"success": False, "message": "Device not connected"}), 503
    
    try:
        feature = DEVICE.capture_feature()
        return jsonify({
            "success": bool(feature),
            "feature_b64": base64.b64encode(feature).decode() if feature else None
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/match", methods=["POST"])
def match():
    """Calculate distance between two features (lower = more similar)."""
    data = request.get_json() or {}
    feat_a_b64 = data.get("feature_a")
    feat_b_b64 = data.get("feature_b")
    
    if not feat_a_b64 or not feat_b_b64:
        return jsonify({"error": "Missing features"}), 400
    
    try:
        feat_a = base64.b64decode(feat_a_b64)
        feat_b = base64.b64decode(feat_b_b64)
        dist = DEVICE.calc_dist(feat_a, feat_b)
        
        if dist is None:
            return jsonify({"error": "Match failed"}), 500
        
        # Distance < 0.95 = match
        confidence = max(0.0, min(100.0, (1.0 - dist / 0.95) * 100))
        
        return jsonify({
            "distance": round(float(dist), 4),
            "confidence": round(confidence, 1),
            "matched": dist < 0.95
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/status", methods=["GET"])
def status():
    """Device status."""
    return jsonify({
        "connected": DEVICE.is_connected(),
        "img_size": f"{DEVICE.IMG_W}x{DEVICE.IMG_H}",
        "feat_size": DEVICE._feat_size,
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
```

---

## 3. React Frontend — Live Viewer

```jsx
function XRSensorViewer({ onCapture }) {
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const imgRef = React.useRef(null);

  const API_BASE = "http://localhost:5000";

  React.useEffect(() => {
    connectDevice();
    return () => {
      if (imgRef.current) imgRef.current.src = "";
    };
  }, []);

  async function connectDevice() {
    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      const data = await res.json();
      
      if (data.connected) {
        setConnected(true);
        setConnecting(false);
        setError(null);
        setTimeout(() => {
          if (imgRef.current) {
            imgRef.current.src = `${API_BASE}/api/stream?_t=${Date.now()}`;
          }
        }, 100);
      } else {
        throw new Error("Device not ready");
      }
    } catch (e) {
      setConnected(false);
      setConnecting(false);
      setError(e.message);
    }
  }

  async function handleCapture() {
    try {
      const res = await fetch(`${API_BASE}/api/capture`, { method: "POST" });
      const data = await res.json();
      
      if (data.success && data.feature_b64 && onCapture) {
        onCapture(data.feature_b64);
        alert("Captured!");
      } else {
        alert("Capture failed");
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        position: "relative",
        width: 420,
        height: 315,
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
        border: "1px solid rgba(255,255,255,0.1)",
        margin: "0 auto 16px"
      }}>
        {connected ? (
          <img ref={imgRef}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            alt="XR Scanner feed" />
        ) : (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: 12,
            fontFamily: "monospace"
          }}>
            {connecting ? "CONNECTING..." : error ? `ERROR: ${error}` : "DISCONNECTED"}
          </div>
        )}

        {/* Status badge */}
        <div style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 6,
          padding: "4px 8px",
          fontSize: 11,
          fontFamily: "monospace",
          color: connected ? "#0f0" : "#f00"
        }}>
          {connected ? "● XR LIVE" : "✕ OFFLINE"}
        </div>
      </div>

      <button
        onClick={handleCapture}
        disabled={!connected}
        style={{
          padding: "8px 16px",
          fontSize: 14,
          cursor: connected ? "pointer" : "not-allowed",
          opacity: connected ? 1 : 0.5,
          background: connected ? "#7c3aed" : "#666",
          color: "#fff",
          border: "none",
          borderRadius: 6
        }}
      >
        Capture Palm
      </button>
    </div>
  );
}
```

---

## 4. Complete Login Flow

```jsx
function LoginWithBiometric() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [feature, setFeature] = React.useState(null);
  const [logging, setLogging] = React.useState(false);

  const API_BASE = "http://localhost:5000";

  async function handleLogin() {
    setLogging(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          feature: feature  // Optional: palm vein feature
        })
      });

      const data = await res.json();
      
      if (data.success) {
        console.log("✓ Login successful!");
        if (data.matched_biometric) {
          console.log(`✓ Biometric match: ${data.confidence}% confidence`);
        } else {
          console.log("✓ Authenticated via password");
        }
        // Redirect or store auth token
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setLogging(false);
    }
  }

  return (
    <div>
      {!feature ? (
        <>
          <h2>Scan Palm First</h2>
          <XRSensorViewer onCapture={setFeature} />
        </>
      ) : (
        <>
          <h2>Login with Password</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} disabled={logging}>
            {logging ? "Logging in..." : "Login"}
          </button>
          <button onClick={() => setFeature(null)}>Rescan Palm</button>
        </>
      )}
    </div>
  );
}
```

---

## 5. Feature Storage & Verification

```python
import base64
import json

class BiometricDB:
    def enroll_user(self, username: str, password: str, features: list[bytes]):
        """Store user with multiple palm features."""
        # Convert features to base64 and store
        features_b64 = [base64.b64encode(f).decode() for f in features]
        
        user = {
            "username": username,
            "password_hash": hash_password(password),
            "features": features_b64,  # Store multiple templates
            "enrolled_at": datetime.now().isoformat()
        }
        
        # Save to database (CSV, JSON, or SQL)
        self.save_user(user)
        return True

    def verify_login(self, username: str, password: str, probe_feature: bytes):
        """Verify user with palm vein feature."""
        user = self.get_user(username)
        if not user:
            return False, "User not found"
        
        # Check password
        if not verify_password(password, user["password_hash"]):
            return False, "Invalid password"
        
        # If palm feature provided, try biometric match
        if probe_feature and user.get("features"):
            best_dist = float("inf")
            
            for stored_b64 in user["features"]:
                stored = base64.b64decode(stored_b64)
                dist = DEVICE.calc_dist(probe_feature, stored)
                if dist and dist < best_dist:
                    best_dist = dist
            
            # Match threshold: 0.95
            if best_dist < 0.95:
                confidence = (1.0 - best_dist / 0.95) * 100
                return True, f"Biometric match ({confidence:.1f}%)"
            else:
                return False, f"Biometric mismatch (dist={best_dist:.3f})"
        
        return True, "Authenticated (password only)"
```

---

## 6. Installation & Setup

### Windows Driver Setup
```powershell
# 1. Download Zadig from zadig.akeo.ie
# 2. Run Zadig
# 3. Select device: VID=a7a9, PID=0620
# 4. Choose "WinUSB" driver
# 5. Click "Install Driver"
# 6. Restart backend service
```

### Python Requirements
```
flask==2.3.0
flask-cors==4.0.0
pillow==10.0.0
ctypes  # (built-in)
```

### Copy SDK Files
```
project/
├── XRCommonVeinPlus/
│   └── XRCommonVeinPlus_V3.1.3_t113s/
│       └── Library file/
│           └── win_x64/
│               ├── XRCommonVeinPlusAPI.dll
│               ├── libusb-1.0.dll
│               └── (other DLLs)
```

---

## 7. Debugging

```python
def debug_device():
    device = XRTechDevice("./path/to/sdk")
    
    # Check DLL load
    if not device.load():
        print("❌ DLL load failed")
        return
    print("✓ DLL loaded")
    
    # Check device connection
    if not device.init():
        print("❌ Device init failed")
        print("  - Check USB device is plugged in")
        print("  - Check WinUSB driver is installed (Zadig)")
        print("  - Try different USB port")
        return
    print("✓ Device connected")
    
    # Check frame capture
    frame = device.get_frame()
    if not frame:
        print("❌ No frame available")
        return
    print(f"✓ Frame captured: {len(frame)} bytes")
    
    # Check feature extraction
    feature = device.capture_feature()
    if not feature:
        print("❌ Feature extraction failed")
        return
    print(f"✓ Feature extracted: {len(feature)} bytes")
    
    # Check distance calculation
    dist = device.calc_dist(feature, feature)
    if dist is None:
        print("❌ Distance calc failed")
        return
    print(f"✓ Distance (same feature): {dist:.6f} (should be ~0)")
    
    device.deinit()
    print("\n✓ All checks passed!")
```

---

## Summary

| Component | File | Role |
|-----------|------|------|
| SDK DLL | XRCommonVeinPlusAPI.dll | Hardware driver |
| Python Wrapper | xrtech_device.py | ctypes binding + frame/feature APIs |
| Flask Backend | app.py | HTTP endpoints (stream, capture, match) |
| React Component | XRSensorViewer.jsx | Live feed display + capture UI |
| Auth Flow | login.jsx | Username/password + biometric verification |

**To integrate into new project:**
1. Copy `XRCommonVeinPlus` folder to project
2. Copy `xrtech_device.py` wrapper
3. Create Flask app with endpoints (see section 2)
4. Create React component (see section 3)
5. Run Zadig to install WinUSB driver
6. Start backend + frontend

