// ── Landing Page — Obsidian Glass 3D ─────────────────────────────────────────
const { useState: useSL, useEffect: useEL, useRef: useRL } = React;

function LandingPage({ setPage }) {
  const [scanStatus, setScanStatus] = useSL('idle');
  const [mousePos, setMousePos] = useSL({ x: 0.5, y: 0.5 });
  const heroRef = useRL(null);

  // Scanner demo loop
  useEL(() => {
    const seq = [
      { s:'idle',       ms:1200 },
      { s:'connecting', ms:1000 },
      { s:'scanning',   ms:3000 },
      { s:'verifying',  ms:1500 },
      { s:'verified',   ms:2000 },
      { s:'idle',       ms:800  },
    ];
    let i = 0, timer;
    const next = () => {
      setScanStatus(seq[i].s);
      timer = setTimeout(() => { i = (i+1) % seq.length; next(); }, seq[i].ms);
    };
    next();
    return () => clearTimeout(timer);
  }, []);

  // Parallax hero
  useEL(() => {
    const fn = e => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setMousePos({ x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height });
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  const px = (mousePos.x - 0.5) * 30;
  const py = (mousePos.y - 0.5) * 20;

  const features = [
    { icon:'⬡', c:'var(--violet)', title:'Contactless Biometrics',
      desc:'Near-infrared palm vein imaging — hygienic, spoof-proof, works in any lighting condition.' },
    { icon:'⬢', c:'var(--teal)',   title:'AI Recognition Engine',
      desc:'Deep learning palm vein recognition for fast, accurate identity verification.' },
    { icon:'⬡', c:'var(--blue)',   title:'AES-256 Encryption',
      desc:'Biometric feature vectors encrypted at rest. JWT tokens with role-based access control.' },
    { icon:'⬢', c:'var(--violet)', title:'Sub-second Verification',
      desc:'Hardware-accelerated inference delivers identity confirmation in under a second.' },
    { icon:'⬡', c:'var(--teal)',   title:'Multi-sample Enrollment',
      desc:'Capture 3 palm samples per hand for robust, high-confidence feature representation.' },
    { icon:'⬢', c:'var(--blue)',   title:'Full Audit Logging',
      desc:'Every authentication attempt logged with confidence scores, timestamps, and IP data.' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', overflowX:'hidden' }}>
      <div className="mesh-bg"/>

      {/* ── HERO ── */}
      <div ref={heroRef} style={{ position:'relative', zIndex:1, minHeight:'100vh',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'80px 32px 60px', perspective:1200 }}>

        {/* Floating depth orbs */}
        <div style={{ position:'absolute', top:'15%', left:'8%', width:320, height:320,
          borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)',
          animation:'orbMove 14s ease-in-out infinite',
          transform:`translate(${px*0.4}px,${py*0.3}px)` }}/>
        <div style={{ position:'absolute', bottom:'20%', right:'6%', width:260, height:260,
          borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(45,212,191,0.14) 0%, transparent 65%)',
          animation:'orbMove 18s ease-in-out infinite reverse',
          transform:`translate(${-px*0.3}px,${-py*0.2}px)` }}/>
        <div style={{ position:'absolute', top:'40%', right:'20%', width:180, height:180,
          borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 65%)',
          animation:'orbMove 10s ease-in-out infinite 2s' }}/>

        <div style={{ maxWidth:1100, width:'100%', display:'flex', alignItems:'center',
          gap:72, flexWrap:'wrap', justifyContent:'center' }}>

          {/* Left: Copy */}
          <div style={{ flex:'1 1 420px', animation:'fadeInUp 0.7s ease' }}>
            {/* Pill badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.25)',
              borderRadius:20, padding:'5px 14px', marginBottom:28,
              fontSize:11.5, color:'var(--violet)', fontFamily:'var(--mono)', letterSpacing:1 }}>
              <span style={{ width:6, height:6, borderRadius:'50%',
                background:'var(--violet)', display:'inline-block',
                animation:'pulseFast 1.6s ease infinite' }}/>
              SECURE BIOMETRIC AUTHENTICATION
            </div>

            <h1 style={{ fontSize:'clamp(38px,5.5vw,62px)', fontWeight:800,
              lineHeight:1.05, letterSpacing:-2, marginBottom:24 }}>
              Identity
              <span style={{ display:'block',
                background:'linear-gradient(135deg, var(--violet), var(--teal))',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                paddingRight:4 }}>
                confirmed by vein.
              </span>
            </h1>

            <p style={{ fontSize:17, color:'var(--text2)', lineHeight:1.75,
              marginBottom:38, maxWidth:460, fontWeight:400 }}>
              Palm vein biometrics that cannot be stolen, cloned, or fooled.
              Scan once — authenticate everywhere.
            </p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:48 }}>
              <Btn size="lg" onClick={() => setPage('register')}
                style={{ fontWeight:700, letterSpacing:0.3 }}>
                Get Started →
              </Btn>
              <Btn size="lg" variant="ghost" onClick={() => setPage('kiosk')}>
                Try Auth Kiosk
              </Btn>
            </div>

            {/* Trust indicators */}
            <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
              {[['Contactless','Zero physical contact'],['Encrypted','AES-256 at rest'],['Fast','Sub-second scan']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--violet)',
                    marginTop:6, boxShadow:'0 0 8px var(--violet)', flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{k}</div>
                    <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:1 }}>{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D scanner */}
          <div style={{ flex:'0 0 auto', display:'flex', flexDirection:'column',
            alignItems:'center', gap:22, animation:'fadeInUp 0.9s ease',
            transform:`perspective(1200px) rotateY(${px*0.015}deg) rotateX(${py*-0.01}deg)`,
            transition:'transform 0.12s linear' }}>

            {/* Glass panel behind scanner */}
            <div style={{ position:'relative', padding:36,
              background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:28,
              boxShadow:'0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <PalmScanner status={scanStatus} size={300}/>

              {/* Status bar inside panel */}
              <div style={{ marginTop:20, display:'flex', justifyContent:'center', gap:20 }}>
                <StatusDot connected label="Scanner Ready"/>
                <div style={{ width:1, height:18, background:'rgba(255,255,255,0.08)' }}/>
                <StatusDot connected label="Model Loaded"/>
              </div>
            </div>

            {/* State label */}
            <div style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:2,
              color:'var(--text3)', textTransform:'uppercase',
              animation:'pulseFast 2s ease infinite' }}>
              {scanStatus === 'idle'       && 'Awaiting palm placement'}
              {scanStatus === 'connecting' && 'Connecting to scanner...'}
              {scanStatus === 'scanning'   && 'Acquiring vein pattern...'}
              {scanStatus === 'verifying'  && 'Running recognition...'}
              {scanStatus === 'verified'   && '● Identity confirmed'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ position:'relative', zIndex:1, padding:'80px 32px',
        borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--violet)',
              letterSpacing:3, marginBottom:14, textTransform:'uppercase' }}>
              System Capabilities
            </div>
            <h2 style={{ fontSize:36, fontWeight:800, letterSpacing:-1 }}>
              Built for real security.
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:18 }}>
            {features.map((f, i) => (
              <div key={i} data-tilt="5"
                style={{ background:'var(--glass)', backdropFilter:'blur(20px)',
                  border:'1px solid var(--glass-border)', borderRadius:18, padding:28,
                  transition:'all 0.3s ease',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                  animation:`fadeInUp 0.6s ease ${i*0.09}s both` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=`${f.c}40`; e.currentTarget.style.boxShadow=`0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${f.c}25, inset 0 1px 0 rgba(255,255,255,0.07)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--glass-border)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'; }}>
                <div style={{ width:40, height:40, borderRadius:12, marginBottom:18,
                  background:`${f.c}18`, border:`1px solid ${f.c}30`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f.c} strokeWidth="1.8">
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
                  </svg>
                </div>
                <h3 style={{ fontSize:15.5, fontWeight:700, marginBottom:9, letterSpacing:-0.2 }}>{f.title}</h3>
                <p style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ position:'relative', zIndex:1, padding:'52px 32px 36px',
        borderTop:'1px solid rgba(255,255,255,0.05)',
        background:'rgba(0,0,0,0.3)', backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap',
            gap:36, marginBottom:36 }}>
            <div style={{ maxWidth:300 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
                <ScanLogo size={22}/>
                <span style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:14, letterSpacing:1,
                  background:'linear-gradient(135deg,#c4b5fd,var(--violet))',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PALMVEIN</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text3)', lineHeight:1.7 }}>
                Palm Vein Recognition System for Secure Identification and Authentication.
                Final Year Project — Department of Computer Science.
              </p>
            </div>
            <div>
              <div style={{ fontSize:10.5, fontFamily:'var(--mono)', color:'var(--violet)',
                letterSpacing:2, marginBottom:16, textTransform:'uppercase' }}>Team</div>
              {['Syed Muhammad Huzaifa Chishty','Shanza Rahim','Saud Akbar'].map(name => (
                <div key={name} style={{ display:'flex', alignItems:'center', gap:8,
                  marginBottom:8, fontSize:13, color:'var(--text2)' }}>
                  <Avatar name={name} size={24}/>
                  {name}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10.5, fontFamily:'var(--mono)', color:'var(--violet)',
                letterSpacing:2, marginBottom:16, textTransform:'uppercase' }}>Supervisor</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text2)' }}>
                <Avatar name="Benish Fida" size={24}/>
                Dr. Benish Fida
              </div>
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:22,
            display:'flex', justifyContent:'space-between', alignItems:'center',
            flexWrap:'wrap', gap:12 }}>
            <span style={{ fontSize:11.5, color:'var(--text3)', fontFamily:'var(--mono)' }}>
              © 2026 PalmVein Recognition System. All rights reserved.
            </span>
            <div style={{ display:'flex', gap:8 }}>
              <Badge color="violet">Biometrics</Badge>
              <Badge color="teal">Flask API</Badge>
              <Badge color="blue">JWT Auth</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

Object.assign(window, { LandingPage });
