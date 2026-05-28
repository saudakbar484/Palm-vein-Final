import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useWebSocket from './hooks/useWebSocket';
import useAppStore from './store/useAppStore';
import Dashboard from './pages/Dashboard';
import LivePreview from './pages/LivePreview';
import Enrollment from './pages/Enrollment';
import Recognition from './pages/Recognition';
import Identities from './pages/Identities';
import DeviceControl from './pages/DeviceControl';
import RecognitionLog from './pages/RecognitionLog';
import Settings from './pages/Settings';

// ─── Landing Page ───────────────────────────────────────────────────────────
function LandingPage({ navigate }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
      <div style={{ maxWidth: 900, textAlign: 'center', animation: 'fadeInUp 0.8s ease' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: 20, background: 'linear-gradient(135deg, #a78bfa, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Palm Vein Authentication
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text2)', marginBottom: 40, lineHeight: 1.6 }}>
          Secure biometric authentication using advanced palm vein recognition technology. Fast, reliable, and contact-free verification for modern security needs.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('login')} style={{ padding: '14px 32px', fontSize: '1rem', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(167, 139, 250, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
            Sign In
          </button>
          <button onClick={() => navigate('register')} style={{ padding: '14px 32px', fontSize: '1rem', background: 'transparent', color: 'var(--teal)', border: `2px solid var(--teal)`, borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(45, 212, 191, 0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>
            Create Account
          </button>
          <button onClick={() => navigate('kiosk')} style={{ padding: '14px 32px', fontSize: '1rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.08)'} onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.04)'}>
            Authentication Kiosk
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ─────────────────────────────────────────────────────────────
function LoginPage({ navigate, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email && password) {
      setUser({ email, role: 'user', name: email.split('@')[0] });
      navigate('dashboard');
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeInScale 0.5s ease' }}>
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 40, backdropFilter: 'blur(10px)' }}>
          <h2 style={{ marginBottom: 30, textAlign: 'center', fontSize: '1.8rem' }}>Welcome Back</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text2)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.95rem' }} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text2)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.95rem' }} />
          </div>
          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'var(--violet-dark)'} onMouseOut={e => e.target.style.background = 'var(--violet)'}>
            Sign In
          </button>
          <button onClick={() => navigate('register')} style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(45, 212, 191, 0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Register Page ──────────────────────────────────────────────────────────
function RegisterPage({ navigate, setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (name && email && password) {
      setUser({ email, name, role: 'user' });
      navigate('dashboard');
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeInScale 0.5s ease' }}>
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 40, backdropFilter: 'blur(10px)' }}>
          <h2 style={{ marginBottom: 30, textAlign: 'center', fontSize: '1.8rem' }}>Create Account</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text2)' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.95rem' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text2)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.95rem' }} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text2)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.95rem' }} />
          </div>
          <button onClick={handleRegister} style={{ width: '100%', padding: '12px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'var(--violet-dark)'} onMouseOut={e => e.target.style.background = 'var(--violet)'}>
            Sign Up
          </button>
          <button onClick={() => navigate('login')} style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.target.style.background = 'transparent'}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Kiosk Page ────────────────────────────────────────────────────────
function AuthKioskPage() {
  useWebSocket();
  const { connected } = useAppStore(state => ({ connected: state.connected }));
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = React.useRef(null);

  useEffect(() => {
    let activeStream;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setCameraError(err.message || 'Unable to access camera');
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 700, animation: 'fadeInScale 0.5s ease' }}>
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 40, backdropFilter: 'blur(10px)', textAlign: 'center', overflow: 'hidden' }}>
          <h2 style={{ marginBottom: 20, fontSize: '2rem' }}>Authentication Kiosk</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 30, fontSize: '1.05rem' }}>
            Place your palm on the scanner to authenticate.
          </p>

          <div style={{ position: 'relative', width: '100%', paddingBottom: '66%', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 30 }}>
            {cameraError ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text3)', padding: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🚫</div>
                <div>Camera access failed</div>
                <div style={{ fontSize: '0.9rem', marginTop: 8 }}>{cameraError}</div>
              </div>
            ) : !connected ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text3)', padding: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔌</div>
                <div>Device not connected</div>
                <div style={{ fontSize: '0.9rem', marginTop: 8 }}>Please connect the XRTECH device and try again.</div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '2px solid rgba(167,139,250,0.5)', boxShadow: '0 0 40px rgba(167,139,250,0.25)', pointerEvents: 'none' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18, color: connected ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)', boxShadow: connected ? '0 0 10px rgba(52,211,153,0.3)' : '0 0 10px rgba(248,113,113,0.3)' }} />
            {connected ? 'Device detected' : 'Device not connected'}
          </div>

          <p style={{ color: 'var(--text3)', fontSize: '0.95rem' }}>
            {stream ? 'Live camera feed active. Hold your palm in front of the sensor.' : 'Waiting for camera permission...'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page Enhanced ────────────────────────────────────────────────
function DashboardPageEnhanced({ user, navigate }) {
  useWebSocket();
  const { connected, deviceCount, sleeping, palmDist, sdkVersion } = useAppStore(state => ({ 
    connected: state.connected, 
    deviceCount: state.count, 
    sleeping: state.sleeping,
    palmDist: state.palmDist,
    sdkVersion: state.sdkVersion
  }));

  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 40 }}>Biometric vein sensor control center</p>
        
        {/* Device Status & Live Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 24 }}>
          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
            <h3 style={{ marginBottom: 20, color: 'var(--blue)' }}>Device Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 14, height: 14, background: connected ? 'var(--green)' : 'var(--red)', borderRadius: '50%', boxShadow: connected ? '0 0 12px var(--green)' : '0 0 12px var(--red)' }} />
              <span style={{ fontSize: '1rem' }}>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text2)' }}>Devices Found</span>
              <strong>{deviceCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text2)' }}>Power</span>
              <strong>Active</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
              <span style={{ color: 'var(--text2)' }}>Sleep Mode</span>
              <strong style={{ color: sleeping ? 'var(--amber)' : 'var(--green)' }}>{sleeping ? 'Sleeping' : 'Awake'}</strong>
            </div>
          </div>

          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
            <h3 style={{ marginBottom: 20, color: 'var(--teal)' }}>Live Vein Preview</h3>
            <div style={{ width: '100%', height: 280, background: 'radial-gradient(circle at 30% 30%, rgba(45,212,191,0.15), transparent)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📱</div>
                <div>Live vein preview will appear here</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <div>Distance: <strong>{palmDist?.distance?.toFixed(1) || '0.0'} cm</strong></div>
              <div>Quality: <strong>{palmDist?.quality || '0'}</strong></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
            <h3 style={{ marginBottom: 20 }}>Quick Actions</h3>
            <button onClick={() => navigate('enroll')} style={{ display: 'block', width: '100%', padding: '12px', marginBottom: 12, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
              📝 New Enrollment
            </button>
            <button onClick={() => navigate('recognition')} style={{ display: 'block', width: '100%', padding: '12px', background: 'var(--teal)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
              ✓ Recognize User
            </button>
          </div>

          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
            <h3 style={{ marginBottom: 20 }}>Metrics</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text2)' }}>Frame Rate</span>
              <strong>10 fps</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text2)' }}>Uptime</span>
              <strong>Live</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text2)' }}>Error Rate</span>
              <strong>0%</strong>
            </div>
          </div>

          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
            <h3 style={{ marginBottom: 20 }}>Manage</h3>
            <button onClick={() => navigate('identities')} style={{ display: 'block', width: '100%', padding: '12px', marginBottom: 12, background: 'var(--amber)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
              👥 View Identities
            </button>
            <button onClick={() => navigate('log')} style={{ display: 'block', width: '100%', padding: '12px', background: 'var(--text2)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
              📋 View Log
            </button>
          </div>
        </div>

        {/* Device Control */}
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Device Control</h3>
          <button onClick={() => navigate('device')} style={{ padding: '12px 24px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'var(--violet-dark)'} onMouseOut={e => e.target.style.background = 'var(--violet)'}>
            🎛️ Advanced Controls
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation Bar ────────────────────────────────────────────────────────
function NavBar({ page, setPage, user, setUser }) {
  const handleLogout = () => {
    setUser(null);
    setPage('landing');
  };

  const navTabs = [
    { label: 'Dashboard', path: 'dashboard', protected: true },
    { label: 'Live Preview', path: 'preview', protected: true },
    { label: 'Enrollment', path: 'enroll', protected: true },
    { label: 'Recognition', path: 'recognition', protected: true },
    { label: 'Identities', path: 'identities', protected: true },
    { label: 'Device', path: 'device', protected: true },
    { label: 'Logs', path: 'log', protected: true },
    { label: 'Settings', path: 'settings', protected: true },
  ];

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, height: 62, background: 'rgba(7,7,12,0.7)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 28px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div onClick={() => setPage('landing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: '1.2rem' }}>🌴</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, letterSpacing: 1, background: 'linear-gradient(135deg,#c4b5fd,var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PALMVEIN</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {navTabs.map(tab => (
            <button key={tab.path} onClick={() => setPage(tab.path)} style={{ padding: '6px 14px', fontSize: '0.9rem', background: page === tab.path ? 'rgba(167,139,250,0.2)' : 'transparent', color: page === tab.path ? 'var(--violet)' : 'var(--text2)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s', borderBottom: page === tab.path ? '2px solid var(--violet)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {user && <span style={{ fontSize: '0.9rem', color: 'var(--text2)' }}>{user.name}</span>}
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'rgba(248, 113, 113, 0.2)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(248, 113, 113, 0.3)'} onMouseOut={e => e.target.style.background = 'rgba(248, 113, 113, 0.2)'}>
          Logout
        </button>
      </div>
    </div>
  );
}

// ─── Main App Component ───────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);

  const hasNav = page !== 'landing' && page !== 'login' && page !== 'register' && page !== 'kiosk' && page !== '';

  const renderPage = () => {
    switch (page) {
      case 'landing':
      case '':
        return <LandingPage navigate={setPage} />;
      case 'login':
        return <LoginPage navigate={setPage} setUser={setUser} />;
      case 'register':
        return <RegisterPage navigate={setPage} setUser={setUser} />;
      case 'kiosk':
        return <AuthKioskPage />;
      case 'dashboard':
        return user ? <DashboardPageEnhanced user={user} navigate={setPage} /> : <LoginPage navigate={setPage} setUser={setUser} />;
      case 'preview':
        return user ? <LivePreview /> : <LoginPage navigate={setPage} setUser={setUser} />;
      case 'enroll':
        return user ? <Enrollment /> : <LoginPage navigate={setPage} setUser={setUser} />;
      case 'recognition':
        return user ? <Recognition /> : <LoginPage navigate={setPage} setUser={setUser} />;
      case 'identities':
        return user ? <Identities /> : <LoginPage navigate={setPage} setUser={setUser} />;
      case 'device':
        return user ? <DeviceControl /> : <LoginPage navigate={setPage} setUser={setUser} />;
      case 'log':
        return user ? <RecognitionLog /> : <LoginPage navigate={setPage} setUser={setUser} />;
      case 'settings':
        return user ? <Settings /> : <LoginPage navigate={setPage} setUser={setUser} />;
      default:
        return <LandingPage navigate={setPage} />;
    }
  };

  return (
    <>
      <div className="mesh-bg" />
      
      {hasNav && <NavBar page={page} setPage={setPage} user={user} setUser={setUser} />}
      
      <div key={page} style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        {renderPage()}
      </div>
    </>
  );
}
