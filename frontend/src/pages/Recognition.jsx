import { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import useAppStore from '../store/useAppStore';

export default function Recognition() {
  useWebSocket();
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState(null);
  const { connected, matchResult } = useAppStore(state => ({ 
    connected: state.connected,
    matchResult: state.matchResult
  }));

  useEffect(() => {
    if (matchResult) {
      setResult(matchResult);
      setRecognizing(false);
    }
  }, [matchResult]);

  const handleStartRecognition = () => {
    setRecognizing(true);
    setResult(null);
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'startRecognize' }));
    };
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease', maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>User Recognition</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 30 }}>Authenticate users by scanning their palm vein</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Recognition Scanner */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Scanner Control</h3>
          <div style={{ width: '100%', height: 200, background: recognizing ? 'radial-gradient(circle, rgba(96,165,250,0.2), transparent)' : 'radial-gradient(circle, rgba(167,139,250,0.15), transparent)', borderRadius: 'var(--radius-sm)', border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, animation: recognizing ? 'pulse 1.5s infinite' : 'none' }}>
            <div style={{ textAlign: 'center', color: 'var(--text2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🖐️</div>
              <div>{recognizing ? 'Scanning...' : 'Ready to scan'}</div>
            </div>
          </div>
          <button 
            onClick={handleStartRecognition} 
            disabled={recognizing || !connected}
            style={{ width: '100%', padding: '12px', background: recognizing ? 'var(--amber)' : connected ? 'var(--teal)' : 'rgba(255,255,255,0.1)', color: recognizing || !connected ? '#fff' : '#000', border: 'none', borderRadius: 'var(--radius-sm)', cursor: recognizing || !connected ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.3s', opacity: connected ? 1 : 0.5 }}>
            {recognizing ? '⏳ Recognizing...' : '✓ Start Recognition'}
          </button>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)' }}>
              <div style={{ width: 8, height: 8, background: connected ? 'var(--green)' : 'var(--red)', borderRadius: '50%' }} />
              Device {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Result */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Recognition Result</h3>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>Status</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 600, color: result.matched ? 'var(--green)' : 'var(--red)' }}>
                  {result.matched ? '✓ Match Found' : '✗ No Match'}
                </div>
              </div>
              <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>Confidence</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{(result.confidence * 100).toFixed(1)}%</div>
              </div>
              {result.userId && (
                <div>
                  <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>Matched User</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{result.userName || result.userId}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>—</div>
              <div>No recognition result yet</div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 20 }}>How It Works</h3>
          <ol style={{ marginLeft: 20, color: 'var(--text2)', lineHeight: 1.8 }}>
            <li>Click "Start Recognition" to begin scanning</li>
            <li>Place your palm on the device scanner</li>
            <li>Keep it steady while the system analyzes</li>
            <li>Result will appear in the Recognition Result panel</li>
            <li>The system will show if you match a known user</li>
          </ol>
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
