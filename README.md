# Magic Vein Plus Web Application

This project scaffolds a full-stack web application for the Magic Vein Plus SDK using Node.js + Express + WebSocket and a React + Vite frontend.

## Structure
- `server/` - Node backend with the native `koffi` bridge, device management, preview loop, enrollment, recognition, hardware control, and REST APIs.
- `frontend/` - React application with dashboard, preview, enrollment, recognition, identity management, and settings screens.
- `assets/audio/` - WAV files used by `XR_Vein_PlayWav`.
- `data/` - SQLite database created at runtime.

## Setup
1. Place `XRCommonVeinPlusAPI.dll` and `libusb-1_0.dll` in the project root or on the Windows `PATH`.
2. Add WAV files in `assets/audio/`.
3. Install backend dependencies: `npm install`
4. Install frontend dependencies: `cd frontend && npm install`
5. Run server: `npm start`
6. Run frontend in development: `cd frontend && npm run dev`

## Notes
- All 25 exported SDK functions are bound in `server/vein-bridge.js`.
- The backend uses a single serialized SDK context and a preview loop that streams base64 PNG frames via WebSocket.
- Templates and recognition logs are stored in SQLite at `data/magic-vein.db`.

## XRTECH Palm Vein Integration
This project supports the XRTEcH scanner through the local backend and `XRCommonVeinPlusAPI.dll`.

- Backend file: `backend.py`
- SDK path: `XRCommonVeinPlus/XRCommonVeinPlus_V3.1.3_t113s/Library file/win_x64/XRCommonVeinPlusAPI.dll`
- Frontend communicates with the backend at `http://localhost:5000`
- Live stream endpoint: `/api/stream`
- Capture feature endpoint: `/api/capture`
- Device init endpoint: `/api/device/init`
- Register endpoint: `/api/register`
- Login endpoint: `/api/login`

### XRTECH Setup
1. Plug in the XRTEcH USB scanner on Windows.
2. Install/bind the correct USB driver: WinUSB or libusbK via Zadig.
3. Ensure `XRCommonVeinPlusAPI.dll` and `libusb-1_0.dll` are available in the SDK folder or on `PATH`.
4. Run the backend from `Palm Vein CPU Cus Data/Palm Vein CPU Cus Data`:
   - `python backend.py`
5. Open the web app and use the palm scanner from the Auth page.

### Behavior
- The backend handles SDK init and device open.
- The frontend requests a live MJPEG stream from `/api/stream`.
- Captured palm features are returned as Base64 from `/api/capture`.
- Registration stores palm features in `users.csv` and login uses biometric matching via `/api/login`.
