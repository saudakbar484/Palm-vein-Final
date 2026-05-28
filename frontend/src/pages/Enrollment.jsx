import { useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import useAppStore from '../store/useAppStore';

export default function Enrollment() {
  useWebSocket();
  const [userName, setUserName] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const { connected } = useAppStore(state => ({ connected: state.connected }));

  const handleStartEnrollment = () => {
    if (!userName.trim()) {
      alert('Please enter a name');
      return;
    }
    
    setEnrolling(true);
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'startEnroll', userId: Date.now(), name: userName, notes: 'Auto enrolled' }));
    };
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease', maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>New Enrollment</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 30 }}>Register a new user by capturing their palm vein patterns</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Enrollment Form */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>User Information</h3>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text2)' }}>Full Name</label>
            <input 
              type="text" 
              value={userName} 
              onChange={e => setUserName(e.target.value)} 
              placeholder="John Doe" 
              disabled={enrolling}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.95rem', opacity: enrolling ? 0.5 : 1 }} 
            />
          </div>
          <button 
            onClick={handleStartEnrollment} 
            disabled={enrolling || !connected}
            style={{ width: '100%', padding: '12px', background: enrolling ? 'var(--amber)' : connected ? 'var(--blue)' : 'rgba(255,255,255,0.1)', color: enrolling ? '#000' : '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: enrolling || !connected ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.3s', opacity: connected ? 1 : 0.5 }}>
            {enrolling ? '⏳ Enrolling...' : '📝 Start Enrollment'}
          </button>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)' }}>
              <div style={{ width: 8, height: 8, background: connected ? 'var(--green)' : 'var(--red)', borderRadius: '50%' }} />
              Device {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Enrollment Steps</h3>
          <ol style={{ marginLeft: 20, color: 'var(--text2)', lineHeight: 1.8 }}>
            <li>Enter the user's full name above</li>
            <li>Click "Start Enrollment" to begin</li>
            <li>Place the palm on the scanner</li>
            <li>Keep steady for scanning (2-3 seconds)</li>
            <li>Enrollment will complete automatically</li>
            <li>User can now authenticate</li>
          </ol>
        </div>

        {/* Status */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 20 }}>Enrollment Status</h3>
          <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>Current Status</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: enrolling ? 'var(--blue)' : 'var(--text3)' }}>
              {enrolling ? '🔄 Scanning...' : '⏸️ Idle'}
            </div>
          </div>
          <div style={{ paddingTop: 16 }}>
            <div style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '0.9rem' }}>User Name</div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{userName || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
