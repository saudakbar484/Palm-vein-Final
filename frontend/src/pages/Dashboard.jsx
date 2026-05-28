import { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';
import DeviceStatusBadge from '../components/DeviceStatusBadge';
import VeinCanvas from '../components/VeinCanvas';

function Dashboard() {
  const { connected, count, sleeping, frame, palmDist, sdkVersion } = useAppStore((state) => state);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    fetch('/api/device/info').then((res) => res.json()).then((data) => setDeviceInfo(data.info)).catch(() => null);
  }, []);

  return (
    <div className="page dashboard-page">
      <div className="header-row">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Biometric vein sensor control center</p>
        </div>
        <div className="meta-card">
          <span>SDK</span>
          <strong>{sdkVersion || 'Loading...'}</strong>
        </div>
      </div>
      <div className="grid-2">
        <section className="card">
          <h2>Device Status</h2>
          <DeviceStatusBadge connected={connected} count={count} sleeping={sleeping} />
          {deviceInfo && (
            <div className="device-info">
              <p><strong>Serial:</strong> {deviceInfo.serialNumber}</p>
              <p><strong>Firmware:</strong> {deviceInfo.firmwareVersion}</p>
              <p><strong>Type:</strong> {deviceInfo.deviceType}</p>
              <p><strong>Image:</strong> {deviceInfo.imageSize?.width}×{deviceInfo.imageSize?.height}</p>
            </div>
          )}
        </section>
        <section className="card">
          <h2>Live Vein Preview</h2>
          <VeinCanvas image={frame?.image} />
          <div className="overlay-panel">
            <div>Distance: {palmDist.distance?.toFixed(1)} cm</div>
            <div>Quality: {palmDist.quality}</div>
          </div>
        </section>
      </div>
      <div className="grid-3">
        <section className="card">
          <h2>Quick Actions</h2>
          <div className="button-grid">
            <a href="/enroll" className="button">Enroll New User</a>
            <a href="/recognition" className="button">Recognize</a>
            <a href="/device" className="button">Device Control</a>
            <a href="/settings" className="button">Settings</a>
          </div>
        </section>
        <section className="card">
          <h2>Metrics</h2>
          <div className="metric-row">
            <span>Frame Rate</span><strong>10 fps</strong>
          </div>
          <div className="metric-row">
            <span>Uptime</span><strong>Live</strong>
          </div>
          <div className="metric-row">
            <span>Error Rate</span><strong>0%</strong></div>
        </section>
        <section className="card">
          <h2>Current Scan</h2>
          <div className="status-row"><span>Palm Distance</span><strong>{palmDist.distance?.toFixed(1)} cm</strong></div>
          <div className="status-row"><span>Signal Quality</span><strong>{palmDist.quality}</strong></div>
          <div className="bar-meter">
            <div className="bar-fill" style={{ width: `${Math.min(100, palmDist.quality)}%` }} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
