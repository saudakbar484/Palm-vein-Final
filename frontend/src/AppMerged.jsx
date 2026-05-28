import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
          <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', fontSize: '1rem', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(167, 139, 250, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')} style={{ padding: '14px 32px', fontSize: '1rem', background: 'transparent', color: 'var(--teal)', border: `2px solid var(--teal)`, borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(45, 212, 191, 0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>
            Create Account
          </button>
          <button onClick={() => navigate('/kiosk')} style={{ padding: '14px 32px', fontSize: '1rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.08)'} onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.04)'}>
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
      navigate('/dashboard');
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
          <button onClick={() => navigate('/register')} style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(45, 212, 191, 0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>
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
      navigate('/dashboard');
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
          <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.target.style.background = 'transparent'}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Kiosk Page ────────────────────────────────────────────────────────
function AuthKioskPage() {
  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 600, animation: 'fadeInScale 0.5s ease' }}>
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 40, backdropFilter: 'blur(10px)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 20, fontSize: '2rem' }}>Authentication Kiosk</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 30, fontSize: '1.05rem' }}>
            Place your palm on the scanner to authenticate.
          </p>
          <div style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(167,139,250,0.2), transparent)', borderRadius: '50%', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'rotate 4s linear infinite' }}>
            <div style={{ width: 160, height: 160, background: 'var(--glass)', borderRadius: '50%', border: '2px solid var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '3rem' }}>🖐️</span>
            </div>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>
            Scanning... Please wait
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────
function DashboardPageEnhanced({ user, navigate }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 40 }}>
        <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 40 }}>Welcome, {user?.name || 'User'}!</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>System Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 12, height: 12, background: 'var(--green)', borderRadius: '50%' }} />
              <span>System Online</span>
            </div>
            <button onClick={() => navigate('/device')} style={{ width: '100%', padding: '10px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
              Device Control
            </button>
          </div>

          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Quick Actions</h3>
            <button onClick={() => navigate('/enroll')} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: 10, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
              New Enrollment
            </button>
            <button onClick={() => navigate('/recognition')} style={{ display: 'block', width: '100%', padding: '10px', background: 'var(--teal)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
              Recognize User
            </button>
          </div>

          <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Manage</h3>
            <button onClick={() => navigate('/identities')} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: 10, background: 'var(--amber)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
              View Identities
            </button>
            <button onClick={() => navigate('/log')} style={{ display: 'block', width: '100%', padding: '10px', background: 'var(--text2)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
              View Log
            </button>
          </div>
        </div>

        <Dashboard />
      </div>
    </div>
  );
}

// ─── Navigation Bar ────────────────────────────────────────────────────────
function NavBar({ page, navigate, user, setUser }) {
  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const navTabs = [
    { label: 'Dashboard', path: '/dashboard', protected: true },
    { label: 'Live Preview', path: '/preview', protected: true },
    { label: 'Enrollment', path: '/enroll', protected: true },
    { label: 'Recognition', path: '/recognition', protected: true },
    { label: 'Identities', path: '/identities', protected: true },
    { label: 'Device', path: '/device', protected: true },
    { label: 'Logs', path: '/log', protected: true },
    { label: 'Settings', path: '/settings', protected: true },
  ];

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, height: 62, background: 'rgba(7,7,12,0.7)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 28px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: '1.2rem' }}>🌴</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, letterSpacing: 1, background: 'linear-gradient(135deg,#c4b5fd,var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PALMVEIN</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {navTabs.map(tab => (
            <button key={tab.path} onClick={() => navigate(tab.path)} style={{ padding: '6px 14px', fontSize: '0.9rem', background: page === tab.path ? 'rgba(167,139,250,0.2)' : 'transparent', color: page === tab.path ? 'var(--violet)' : 'var(--text2)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s', borderBottom: page === tab.path ? '2px solid var(--violet)' : 'none' }}>
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

// ─── Main App Component ────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Update page based on location
    const path = location.pathname === '/' ? 'landing' : location.pathname.slice(1) || 'landing';
    setPage(path);
  }, [location]);

  const handleNavigate = (p) => {
    setPage(p);
    navigate('/' + (p === 'landing' ? '' : p));
    window.scrollTo(0, 0);
  };

  const hasNav = page !== 'landing' && page !== 'login' && page !== 'register' && page !== 'kiosk' && page !== '';

  const renderPage = () => {
    switch (page) {
      case 'landing':
      case '':
        return <LandingPage navigate={handleNavigate} />;
      case 'login':
        return <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'register':
        return <RegisterPage navigate={handleNavigate} setUser={setUser} />;
      case 'kiosk':
        return <AuthKioskPage />;
      case 'dashboard':
        return user ? <DashboardPageEnhanced user={user} navigate={handleNavigate} /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'preview':
        return user ? <LivePreview /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'enroll':
        return user ? <Enrollment /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'recognition':
        return user ? <Recognition /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'identities':
        return user ? <Identities /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'device':
        return user ? <DeviceControl /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'log':
        return user ? <RecognitionLog /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      case 'settings':
        return user ? <Settings /> : <LoginPage navigate={handleNavigate} setUser={setUser} />;
      default:
        return <LandingPage navigate={handleNavigate} />;
    }
  };

  return (
    <>
      <div className="mesh-bg" />
      
      {hasNav && <NavBar page={page} setPage={handleNavigate} user={user} setUser={setUser} />}
      
      <div key={page} style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        {renderPage()}
      </div>
    </>
  );
}
