import { useEffect, useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import useAppStore from '../store/useAppStore';

export default function LivePreview() {
  useWebSocket();
  const [wsReady, setWsReady] = useState(false);
  const { frame, palmDist, connected } = useAppStore(state => ({
    frame: state.frame,
    palmDist: state.palmDist,
    connected: state.connected
  }));

  useEffect(() => {
    // Send startPreview command
    const timer = setTimeout(() => {
      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'startPreview' }));
        setWsReady(true);
      };
    }, 500);

    return () => {
      clearTimeout(timer);
      // Send stopPreview on unmount
      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
      ws.onopen = () => ws.send(JSON.stringify({ type: 'stopPreview' }));
    };
  }, []);

  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease', maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>Live Preview</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 30 }}>Real-time vein pattern capture and analysis</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* Camera Feed */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 20 }}>Camera Feed</h3>
          <div style={{ width: '100%', minHeight: 400, background: frame?.image ? `url(data:image/jpeg;base64,${frame.image})` : 'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.15), transparent)', backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {!frame?.image && (
              <div style={{ textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📹</div>
                <div>Place your palm on the scanner</div>
                <div style={{ fontSize: '0.9rem', marginTop: 8, color: 'var(--text3)' }}>
                  {connected ? 'Device connected - Ready' : 'Waiting for device connection...'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Metrics */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Distance Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>Distance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--blue)' }}>{palmDist?.distance?.toFixed(1) || '0.0'} cm</div>
            </div>
            <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>Signal Quality</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--teal)' }}>{palmDist?.quality || '0'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>Quality Bar</div>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--violet), var(--teal))', width: `${Math.min(100, (palmDist?.quality || 0) * 2)}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text2)', marginBottom: 8 }}>Connection</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, background: connected ? 'var(--green)' : 'var(--red)', borderRadius: '50%', boxShadow: connected ? '0 0 8px var(--green)' : '0 0 8px var(--red)' }} />
                <span style={{ fontWeight: 600 }}>{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text2)', marginBottom: 8 }}>Preview Status</div>
              <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{wsReady ? 'Active' : 'Initializing...'}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text2)', marginBottom: 8 }}>Frame Rate</div>
              <span style={{ fontWeight: 600, color: 'var(--green)' }}>10 FPS</span>
            </div>
          </div>
        </div>

        {/* Frame Info */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Frame Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text2)' }}>Width</span>
              <strong>{frame?.width || '320'} px</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text2)' }}>Height</span>
              <strong>{frame?.height || '240'} px</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text2)' }}>Format</span>
              <strong>JPEG</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
