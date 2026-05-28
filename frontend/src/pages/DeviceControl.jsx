import { useEffect, useState } from 'react';

function DeviceControl() {
  const [rgbState, setRgbState] = useState(0);
  const [volume, setVolume] = useState(50);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [connected, setConnected] = useState(false);

  const API_BASE = 'http://localhost:5000';

  // Load device status on mount
  useEffect(() => {
    loadDeviceStatus();
    const interval = setInterval(loadDeviceStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadDeviceStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/device/status`);
      const data = await res.json();
      setDeviceInfo(data);
      setConnected(data.connected);
      if (data.volume) setVolume(data.volume);
      if (data.rgb_state) setRgbState(data.rgb_state);
    } catch (e) {
      console.error('Failed to load device status:', e);
    }
  };

  // RGB Preset colors
  const rgbPresets = [
    { label: 'Off', state: 0, color: '#333' },
    { label: 'Red', state: 1, color: '#ff4444' },
    { label: 'Green', state: 2, color: '#44ff44' },
    { label: 'Blue', state: 3, color: '#4444ff' },
    { label: 'Cyan', state: 4, color: '#44ffff' },
    { label: 'Magenta', state: 5, color: '#ff44ff' },
    { label: 'Yellow', state: 6, color: '#ffff44' },
    { label: 'White', state: 7, color: '#ffffff' },
  ];

  const setRgbPreset = async (preset) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/device/rgb/preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: preset.toLowerCase() })
      });
      const data = await res.json();
      if (data.success) {
        setRgbState(data.state);
        setMessage(`✓ LED set to ${preset}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      setMessage(`✗ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setVolumeLevel = async (level) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/device/volume/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      const data = await res.json();
      if (data.success) {
        setVolume(data.level);
        setMessage(`✓ Volume set to ${data.level}%`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      setMessage(`✗ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease', maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>🎛️ Device Control Panel</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 30 }}>Configure LED, volume, and device settings</p>

      {/* Connection Status */}
      <div style={{
        background: connected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `2px solid ${connected ? 'var(--green)' : 'var(--red)'}`,
        borderRadius: 'var(--radius)',
        padding: 20,
        marginBottom: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: connected ? 'var(--green)' : 'var(--red)',
          animation: connected ? 'pulse 2s infinite' : 'none'
        }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {connected ? '✓ Device Connected' : '✗ Device Disconnected'}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            {deviceInfo && `Image: ${deviceInfo.img_size}, Features: ${deviceInfo.feat_size} bytes`}
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid var(--blue)',
          borderRadius: 'var(--radius-sm)',
          padding: 12,
          marginBottom: 20,
          color: 'var(--blue)',
          fontSize: '0.95rem'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
        {/* RGB LED Control */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1.3rem' }}>💡 RGB LED Control</h3>
          
          {/* Current State */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            <div style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: 8 }}>Current State</div>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: rgbPresets[rgbState]?.color || '#333',
              margin: '0 auto',
              boxShadow: `0 0 20px ${rgbPresets[rgbState]?.color || '#333'}`,
              border: '2px solid rgba(255,255,255,0.1)'
            }} />
            <div style={{ marginTop: 12, fontWeight: 600 }}>{rgbPresets[rgbState]?.label || 'Unknown'}</div>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {rgbPresets.map((preset) => (
              <button
                key={preset.state}
                onClick={() => setRgbPreset(preset.label.toLowerCase())}
                disabled={loading || !connected}
                style={{
                  padding: 12,
                  background: rgbState === preset.state ? preset.color : 'rgba(255,255,255,0.05)',
                  color: rgbState === preset.state ? (preset.state === 7 ? '#000' : '#fff') : 'var(--text)',
                  border: rgbState === preset.state ? `2px solid ${preset.color}` : '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: loading || !connected ? 'not-allowed' : 'pointer',
                  opacity: loading || !connected ? 0.5 : 1,
                  transition: 'all 0.3s',
                  fontSize: '0.9rem'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1.3rem' }}>🔊 Volume Control</h3>
          
          {/* Volume Display */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            <div style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: 8 }}>Current Level</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--blue)' }}>{volume}%</div>
            <div style={{
              width: '100%',
              height: 8,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              marginTop: 12,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${volume}%`,
                background: 'linear-gradient(90deg, var(--blue), var(--teal))',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* Volume Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            disabled={loading || !connected}
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.1)',
              outline: 'none',
              cursor: loading || !connected ? 'not-allowed' : 'pointer',
              opacity: loading || !connected ? 0.5 : 1,
              marginBottom: 16
            }}
          />

          {/* Preset Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Mute', level: 0 },
              { label: 'Low', level: 30 },
              { label: 'Medium', level: 50 },
              { label: 'High', level: 75 },
              { label: 'Max', level: 100 },
            ].map((preset) => (
              <button
                key={preset.level}
                onClick={() => setVolumeLevel(preset.level)}
                disabled={loading || !connected}
                style={{
                  padding: 10,
                  background: volume === preset.level ? 'var(--blue)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: volume === preset.level ? '2px solid var(--blue)' : '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: loading || !connected ? 'not-allowed' : 'pointer',
                  opacity: loading || !connected ? 0.5 : 1,
                  fontSize: '0.85rem'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Apply Button */}
          <button
            onClick={() => setVolumeLevel(volume)}
            disabled={loading || !connected}
            style={{
              width: '100%',
              marginTop: 16,
              padding: 12,
              background: 'var(--blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              cursor: loading || !connected ? 'not-allowed' : 'pointer',
              opacity: loading || !connected ? 0.5 : 1
            }}
          >
            {loading ? '⏳ Applying...' : '✓ Apply Volume'}
          </button>
        </div>

        {/* Device Info */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1.3rem' }}>ℹ️ Device Information</h3>
          
          <div style={{ display: 'grid', gap: 12 }}>
            {deviceInfo && [
              { label: 'Status', value: connected ? '✓ Connected' : '✗ Disconnected' },
              { label: 'Image Size', value: deviceInfo.img_size || 'N/A' },
              { label: 'Channels', value: deviceInfo.channels || 'N/A' },
              { label: 'Feature Size', value: deviceInfo.feat_size ? `${deviceInfo.feat_size} bytes` : 'N/A' },
              { label: 'DLL Loaded', value: deviceInfo.loaded ? '✓ Yes' : '✗ No' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{ color: 'var(--text2)' }}>{item.label}</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default DeviceControl;
