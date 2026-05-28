// ── App Router + Tweaks ───────────────────────────────────────────────────────
const { useState: useApp, useEffect: useAppE } = React;

function App() {
  const [page, setPage] = useApp('landing');
  const [user, setUser] = useApp(null);

  const navigate = (p) => {
    const prot = ['dashboard','palm-mgmt','admin'];
    if (prot.includes(p) && !user)             { setPage('login');     return; }
    if (p === 'admin' && user?.role !== 'admin'){ setPage('dashboard'); return; }
    setPage(p);
    window.scrollTo(0, 0);
  };

  const hasNav = page !== 'landing';

  const renderPage = () => {
    switch (page) {
      case 'landing':   return <LandingPage   setPage={navigate}/>;
      case 'login':     return <LoginPage     setPage={navigate} setUser={setUser}/>;
      case 'register':  return <RegisterPage  setPage={navigate} setUser={setUser}/>;
      case 'dashboard': return <DashboardPage user={user} setPage={navigate}/>;
      case 'palm-mgmt': return <PalmManagementPage user={user} setPage={navigate}/>;
      case 'device-controls': return <DeviceControlsPage user={user} setPage={navigate}/>;
      case 'kiosk':     return <AuthKioskPage/>;
      case 'admin':     return <AdminPanel    user={user} setPage={navigate}/>;
      default:          return <LandingPage   setPage={navigate}/>;
    }
  };

  return (
    <ToastProvider>  
      {/* Landing-specific top nav */}
      {page === 'landing' && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:200,
          height:62, background:'rgba(7,7,12,0.7)', backdropFilter:'blur(24px)',
          borderBottom:'1px solid rgba(255,255,255,0.06)',
          display:'flex', alignItems:'center', padding:'0 28px',
          justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <ScanLogo size={22}/>
            <span style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:14, letterSpacing:1,
              background:'linear-gradient(135deg,#c4b5fd,var(--violet))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PALMVEIN</span>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <StatusDot connected label="System Online"/>
            <div style={{ width:1, height:18, background:'rgba(255,255,255,0.08)' }}/>
            <Btn variant="ghost"     size="sm" onClick={() => navigate('login')}>Login</Btn>
            <Btn size="sm"           onClick={() => navigate('register')}>Register</Btn>
            <Btn variant="secondary" size="sm" onClick={() => navigate('kiosk')}>Auth Kiosk</Btn>
          </div>
        </div>
      )}

      {hasNav && (
        <NavBar page={page} setPage={navigate} user={user} setUser={setUser}/>
      )}

      <div key={page} style={{ animation:'fadeIn 0.3s ease' }}>
        {renderPage()}
      </div>

      <TweaksPanel/>
    </ToastProvider>
  );
}

// ── Tweaks Panel ──────────────────────────────────────────────────────────────
function TweaksPanel() {
  const [show, setShow]       = useApp(false);
  const [accent, setAccent]   = useApp('violet');
  const [noise, setNoise]     = useApp(true);
  const [tiltOn, setTiltOn]   = useApp(true);
  const [rounded, setRounded] = useApp('16');

  useAppE(() => {
    window.addEventListener('message', e => {
      if (e.data?.type === '__activate_edit_mode')   setShow(true);
      if (e.data?.type === '__deactivate_edit_mode') setShow(false);
    });
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
  }, []);

  const accents = {
    violet: { '--violet':'#a78bfa', '--violet-dark':'#7c3aed', '--teal':'#2dd4bf' },
    sky:    { '--violet':'#38bdf8', '--violet-dark':'#0284c7', '--teal':'#34d399' },
    rose:   { '--violet':'#fb7185', '--violet-dark':'#e11d48', '--teal':'#f97316' },
    gold:   { '--violet':'#fbbf24', '--violet-dark':'#d97706', '--teal':'#a78bfa' },
  };

  useAppE(() => {
    const v = accents[accent] || accents.violet;
    Object.entries(v).forEach(([k,val]) => document.documentElement.style.setProperty(k,val));
  }, [accent]);

  useAppE(() => {
    document.documentElement.style.setProperty('--radius', `${rounded}px`);
    document.documentElement.style.setProperty('--radius-sm', `${Math.round(+rounded*0.62)}px`);
    document.documentElement.style.setProperty('--radius-lg', `${Math.round(+rounded*1.5)}px`);
  }, [rounded]);

  useAppE(() => {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      if (!tiltOn) el.style.transform = 'none';
    });
  }, [tiltOn]);

  if (!show) return null;

  const close = () => {
    setShow(false);
    window.parent.postMessage({ type:'__edit_mode_dismissed' }, '*');
  };

  const ToggleRow = ({ label, value, onChange }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' }}>
      <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
      <button onClick={() => onChange(!value)}
        style={{ width:40, height:22, borderRadius:11, border:'none', cursor:'pointer',
          background: value ? 'var(--violet)' : 'rgba(255,255,255,0.1)',
          transition:'all 0.2s', position:'relative' }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, left: value ? 21 : 3, transition:'left 0.2s' }}/>
      </button>
    </div>
  );

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9990,
      width:272, background:'rgba(7,7,12,0.95)', backdropFilter:'blur(28px)',
      border:'1px solid rgba(255,255,255,0.09)', borderRadius:18, padding:20,
      boxShadow:'0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(167,139,250,0.12)',
      animation:'slideRight 0.3s ease', fontFamily:'var(--ff)' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <span style={{ fontWeight:700, fontSize:13.5, color:'var(--violet)',
          fontFamily:'var(--mono)', letterSpacing:1 }}>TWEAKS</span>
        <button onClick={close}
          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
            color:'var(--text2)', cursor:'pointer', width:26, height:26,
            borderRadius:8, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
          ×
        </button>
      </div>

      {/* Accent */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)',
          letterSpacing:1.5, marginBottom:10, textTransform:'uppercase' }}>Accent Color</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7 }}>
          {[['violet','#a78bfa'],['sky','#38bdf8'],['rose','#fb7185'],['gold','#fbbf24']].map(([k,c]) => (
            <button key={k} onClick={() => setAccent(k)}
              style={{ height:34, borderRadius:9,
                background:`${c}20`, border:`2px solid ${accent===k?c:'transparent'}`,
                cursor:'pointer', color:c, fontSize:10.5, fontFamily:'var(--mono)',
                fontWeight:700, transition:'all 0.18s',
                boxShadow: accent===k ? `0 0 12px ${c}50` : 'none' }}>
              {k[0].toUpperCase()+k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Border radius */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)',
          letterSpacing:1.5, marginBottom:10, display:'flex', justifyContent:'space-between',
          textTransform:'uppercase' }}>
          <span>Corner Radius</span>
          <span style={{ color:'var(--violet)' }}>{rounded}px</span>
        </div>
        <input type="range" min="6" max="28" step="2" value={rounded}
          onChange={e => setRounded(e.target.value)}
          style={{ width:'100%', accentColor:'var(--violet)',
            background:'rgba(255,255,255,0.06)', height:4, borderRadius:2,
            outline:'none', border:'none', padding:0 }}/>
      </div>

      {/* Toggles */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
        <ToggleRow label="3D Card Tilt"    value={tiltOn} onChange={setTiltOn}/>
        <ToggleRow label="Noise Texture"   value={noise}  onChange={v => { setNoise(v); document.querySelectorAll('.mesh-bg').forEach(el=>el.style.opacity=v?'1':'0.5'); }}/>
      </div>

      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:12, paddingTop:12,
        textAlign:'center', fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)', lineHeight:1.8 }}>
        PalmVein Recognition System<br/>
        Huzaifa · Shanza · Saud · Dr. Benish
      </div>
    </div>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
