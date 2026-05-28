import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

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
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '14px 32px', fontSize: '1rem', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(167, 139, 250, 0.3)' }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{ padding: '14px 32px', fontSize: '1rem', background: 'transparent', color: 'var(--teal)', border: '2px solid var(--teal)', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(45, 212, 191, 0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            Create Account
          </button>
          <button
            onClick={() => navigate('/kiosk')}
            style={{ padding: '14px 32px', fontSize: '1rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            Authentication Kiosk
          </button>
        </div>
      </div>
    </div>
  );
}
