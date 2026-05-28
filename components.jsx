// ── Shared Components — Obsidian Glass 3D ─────────────────────────────────────
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// ── Toast ─────────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const clr = { success:'var(--green)', error:'var(--red)', warning:'var(--amber)', info:'var(--violet)' };
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{ position:'fixed', bottom:28, right:28, zIndex:9999,
        display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background:'rgba(12,12,21,0.92)',
            border:`1px solid ${clr[t.type] || clr.info}28`,
            borderLeft:`3px solid ${clr[t.type] || clr.info}`,
            borderRadius:12, padding:'13px 18px',
            backdropFilter:'blur(24px)',
            boxShadow:`0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
            display:'flex', alignItems:'center', gap:12,
            animation:'slideRight 0.3s ease', color:'var(--text)',
            fontSize:13.5, fontFamily:'var(--ff)', pointerEvents:'all', maxWidth:320 }}>
            <span style={{ color:clr[t.type], fontSize:15 }}>
              {{ success:'✓', error:'✕', warning:'!', info:'·' }[t.type]}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// ── 3D Palm Scanner ───────────────────────────────────────────────────────────
function PalmScanner({ status = 'idle', progress = 0, size = 280 }) {
  const isActive  = ['connecting','scanning','verifying'].includes(status);
  const isSuccess = ['captured','verified'].includes(status);
  const isError   = status === 'error' || status === 'rejected';
  const accent    = isSuccess ? 'var(--green)' : isError ? 'var(--red)' : 'var(--violet)';
  const accentRaw = isSuccess ? '#34d399'       : isError ? '#f87171'   : '#a78bfa';

  const s = size, cx = s/2, cy = s/2;
  const r = s * 0.37;

  const veins = [
    `M${cx},${cy+18} L${cx},${cy-8} L${cx-10},${cy-32}`,
    `M${cx},${cy-8} L${cx+11},${cy-35}`,
    `M${cx},${cy+18} L${cx+8},${cy-4} L${cx+7},${cy-42}`,
    `M${cx},${cy+18} L${cx-8},${cy-1} L${cx-9},${cy-40}`,
    `M${cx},${cy+18} L${cx-16},${cy+6} L${cx-18},${cy-16}`,
    `M${cx},${cy+36} L${cx-4},${cy+18}`,
    `M${cx},${cy+36} L${cx+4},${cy+18}`,
  ];

  return (
    <div style={{ position:'relative', width:s, height:s, flexShrink:0 }}>
      {/* 3D perspective wrapper */}
      <div style={{ position:'absolute', inset:0, transformStyle:'preserve-3d' }}>

        {/* Outer 3D orbit ring */}
        <div style={{
          position:'absolute',
          left: cx - (r+28), top: cy - (r+28),
          width: (r+28)*2, height: (r+28)*2,
          borderRadius:'50%',
          border:`1px solid ${accentRaw}35`,
          transformOrigin:'50% 50%',
          animation: isActive ? 'orbit3d 6s linear infinite' : 'none',
          boxShadow: isActive ? `0 0 20px ${accentRaw}20, inset 0 0 20px ${accentRaw}10` : 'none',
          transition:'box-shadow 0.5s',
        }} />

        {/* Middle 3D orbit ring */}
        <div style={{
          position:'absolute',
          left: cx - (r+14), top: cy - (r+14),
          width: (r+14)*2, height: (r+14)*2,
          borderRadius:'50%',
          border:`1px solid ${accentRaw}50`,
          borderTopColor: `${accentRaw}cc`,
          borderRightColor: `${accentRaw}20`,
          animation: isActive ? 'orbit3dR 4s linear infinite' : 'none',
        }} />

        {/* Inner 3D ring */}
        <div style={{
          position:'absolute',
          left: cx - (r+4), top: cy - (r+4),
          width: (r+4)*2, height: (r+4)*2,
          borderRadius:'50%',
          border:`1.5px solid ${accentRaw}60`,
          borderTopColor: `${accentRaw}`,
          animation: isActive ? 'orbit3d2 3s linear infinite' : 'none',
        }} />
      </div>

      {/* SVG layer */}
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ position:'absolute', inset:0 }}>
        <defs>
          <radialGradient id="palmFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentRaw} stopOpacity="0.08"/>
            <stop offset="100%" stopColor={accentRaw} stopOpacity="0.01"/>
          </radialGradient>
          <filter id="glow2">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="palmClip2">
            <circle cx={cx} cy={cy} r={r-2}/>
          </clipPath>
        </defs>

        {/* Main circle */}
        <circle cx={cx} cy={cy} r={r} fill="url(#palmFill)"
          stroke={`${accentRaw}40`} strokeWidth="1"/>

        {/* Corner markers */}
        {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy],i) => {
          const bx = cx + sx*(r-10), by = cy + sy*(r-10), len = 13;
          return (
            <g key={i} stroke={accent} strokeWidth="2.5" fill="none" filter="url(#glow2)">
              <line x1={bx} y1={by - sy*len} x2={bx} y2={by}/>
              <line x1={bx - sx*len} y1={by} x2={bx} y2={by}/>
            </g>
          );
        })}

        {/* Palm silhouette */}
        <g clipPath="url(#palmClip2)">
          <ellipse cx={cx} cy={cy+14} rx={38} ry={36}
            fill={`${accentRaw}06`} stroke={`${accentRaw}20`} strokeWidth="1"/>
          {[[-21,-50,8,44],[-9,-60,9,50],[4,-64,9,54],[18,-57,8,48],[29,-42,8,36]].map(([fx,fy,fw,fh],i) => (
            <rect key={i} x={cx+fx-fw/2} y={cy+fy} width={fw} height={fh} rx={fw/2}
              fill={`${accentRaw}06`} stroke={`${accentRaw}18`} strokeWidth="1"/>
          ))}
          <ellipse cx={cx-44} cy={cy+6} rx={8} ry={19}
            transform={`rotate(-28,${cx-44},${cy+6})`}
            fill={`${accentRaw}06`} stroke={`${accentRaw}18`} strokeWidth="1"/>

          {/* Vein lines */}
          {(status==='scanning'||status==='captured'||status==='verified') && veins.map((d,i) => (
            <path key={i} d={d} stroke={accentRaw} strokeWidth="1.2" fill="none"
              filter="url(#glow2)"
              style={{ strokeDasharray:300,
                animation:`veinDraw ${0.7+i*0.12}s ease ${i*0.1}s both`,
                opacity: status==='scanning' ? 0.55 : 0.9 }}/>
          ))}
        </g>

        {/* Scan sweep line */}
        {status==='scanning' && (
          <line x1={cx-r+10} y1={cy} x2={cx+r-10} y2={cy}
            stroke={accentRaw} strokeWidth="1.5"
            style={{ animation:'scanPlane 2s ease-in-out infinite' }}
            filter="url(#softGlow)" opacity="0.8"/>
        )}

        {/* Success/Fail icon */}
        {status==='verified' && (
          <text x={cx} y={cy+10} textAnchor="middle" fill={accentRaw} fontSize="30"
            filter="url(#softGlow)"
            style={{ animation:'successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>✓</text>
        )}
        {status==='rejected' && (
          <text x={cx} y={cy+10} textAnchor="middle" fill={accentRaw} fontSize="26"
            filter="url(#softGlow)"
            style={{ animation:'successPop 0.4s ease both' }}>✕</text>
        )}

        {/* Progress arc */}
        {progress > 0 && progress < 100 && (
          <circle cx={cx} cy={cy} r={r+8} fill="none"
            stroke={accentRaw} strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${(progress/100)*(2*Math.PI*(r+8))} 9999`}
            transform={`rotate(-90 ${cx} ${cy})`} filter="url(#glow2)"/>
        )}
      </svg>

      {/* Text overlay */}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
        justifyContent:'center', flexDirection:'column', gap:5, pointerEvents:'none' }}>
        {status==='idle' && (
          <div style={{ textAlign:'center', color:'var(--text3)', fontFamily:'var(--mono)',
            fontSize:9.5, letterSpacing:2, lineHeight:2 }}>
            <div>PLACE PALM</div><div>ON SCANNER</div>
          </div>
        )}
        {status==='connecting' && <StatusLabel label="CONNECTING" animate/>}
        {status==='scanning'   && <StatusLabel label="SCANNING"   animate/>}
        {status==='captured'   && <StatusLabel label="CAPTURED"   color="var(--green)"/>}
        {status==='verifying'  && <StatusLabel label="VERIFYING"  animate/>}
      </div>
    </div>
  );
}

function StatusLabel({ label, animate, color='var(--violet)' }) {
  return (
    <span style={{ color, fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:2,
      animation: animate ? 'pulseFast 0.9s ease infinite' : 'none' }}>
      {label}
    </span>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function NavBar({ page, setPage, user, setUser }) {
  const items = user?.role==='admin'
    ? [['dashboard','Dashboard'],['palm-mgmt','Palm Vein'],['device-controls','Device'],['kiosk','Auth Kiosk'],['admin','Admin']]
    : user
    ? [['dashboard','Dashboard'],['palm-mgmt','Palm Vein'],['device-controls','Device'],['kiosk','Auth Kiosk']]
    : [];

  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200,
      height:62,
      background:'rgba(7,7,12,0.75)',
      backdropFilter:'blur(24px) saturate(180%)',
      borderBottom:'1px solid rgba(255,255,255,0.06)',
      display:'flex', alignItems:'center', padding:'0 28px', gap:6 }}>

      {/* Logo */}
      <div onClick={() => setPage(user ? 'dashboard' : 'landing')}
        style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', marginRight:28 }}>
        <ScanLogo size={26}/>
        <span style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:15, letterSpacing:1,
          background:'linear-gradient(135deg, var(--violet-light,#c4b5fd), var(--violet))',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          PALMVEIN
        </span>
      </div>

      {/* Links */}
      <div style={{ display:'flex', gap:2, flex:1 }}>
        {items.map(([id,label]) => (
          <button key={id} onClick={() => setPage(id)}
            style={{ background: page===id ? 'rgba(167,139,250,0.12)' : 'transparent',
              border: page===id ? '1px solid rgba(167,139,250,0.25)' : '1px solid transparent',
              color: page===id ? 'var(--violet)' : 'var(--text2)',
              borderRadius:10, padding:'6px 16px', fontSize:13.5, cursor:'pointer',
              fontFamily:'var(--ff)', fontWeight:500, transition:'all 0.2s',
              letterSpacing:0.2 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <StatusDot connected label="Online"/>
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{user.name}</div>
              <div style={{ fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)' }}>{user.role?.toUpperCase()}</div>
            </div>
            <Avatar name={user.name} size={34}/>
            <button onClick={() => { setUser(null); setPage('landing'); }}
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                color:'var(--text2)', borderRadius:9, padding:'6px 13px',
                fontSize:12, cursor:'pointer', fontFamily:'var(--ff)',
                transition:'all 0.2s' }}>
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" size="sm" onClick={() => setPage('login')}>Login</Btn>
            <Btn size="sm" onClick={() => setPage('register')}>Register</Btn>
          </div>
        )}
      </div>
    </nav>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant='primary', size='md', disabled=false, fullWidth=false, style:xs={} }) {
  const [hov, setHov] = useState(false);
  const base = {
    fontFamily:'var(--ff)', fontWeight:600, cursor:disabled?'not-allowed':'pointer',
    border:'none', borderRadius:10, display:'inline-flex', alignItems:'center',
    justifyContent:'center', gap:7, transition:'all 0.22s cubic-bezier(0.4,0,0.2,1)',
    width:fullWidth?'100%':'auto', opacity:disabled?0.45:1, letterSpacing:0.2,
  };
  const sz = { sm:{padding:'7px 15px',fontSize:13}, md:{padding:'10px 22px',fontSize:14.5}, lg:{padding:'13px 30px',fontSize:15.5} };
  const v = {
    primary:{
      background: hov ? 'linear-gradient(135deg,#b9a4fc,#8b5cf6)' : 'linear-gradient(135deg,#a78bfa,#7c3aed)',
      color:'#fff', boxShadow: hov ? '0 8px 30px rgba(124,58,237,0.45), 0 0 0 1px rgba(167,139,250,0.3)' : '0 4px 16px rgba(124,58,237,0.25)',
    },
    secondary:{
      background: hov ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.1)',
      color:'var(--violet)', border:'1px solid rgba(167,139,250,0.3)',
    },
    ghost:{
      background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
      color:'var(--text2)', border:'1px solid rgba(255,255,255,0.09)',
    },
    danger:{
      background: hov ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.1)',
      color:'var(--red)', border:'1px solid rgba(248,113,113,0.3)',
    },
    success:{
      background: hov ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.1)',
      color:'var(--green)', border:'1px solid rgba(52,211,153,0.3)',
    },
    teal:{
      background: hov ? 'rgba(45,212,191,0.2)' : 'rgba(45,212,191,0.1)',
      color:'var(--teal)', border:'1px solid rgba(45,212,191,0.3)',
    },
  };
  return (
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...base, ...sz[size], ...(v[variant]||v.primary), ...xs}}>
      {children}
    </button>
  );
}

// ── Glass Card ────────────────────────────────────────────────────────────────
function Card({ children, style:s={}, tilt=false, onClick, glow=false }) {
  const [hov, setHov] = useState(false);
  return (
    <div data-tilt={tilt ? '6' : undefined}
      onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov && onClick ? 'var(--glass-hover)' : 'var(--glass)',
        backdropFilter:'blur(20px)',
        border:`1px solid ${(glow||hov&&onClick) ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
        borderRadius: 'var(--radius)', padding:22,
        boxShadow: glow
          ? '0 0 0 1px rgba(167,139,250,0.15), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)'
          : '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition:'all 0.25s ease',
        ...s,
      }}>
      {children}
    </div>
  );
}

// ── StatusDot ─────────────────────────────────────────────────────────────────
function StatusDot({ connected, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0,
        background: connected ? 'var(--green)' : 'var(--red)',
        boxShadow: connected ? '0 0 8px var(--green)' : '0 0 8px var(--red)',
        animation: connected ? 'pulseFast 2.5s ease infinite' : 'none' }}/>
      {label && <span style={{ fontSize:11.5, color:'var(--text3)', fontFamily:'var(--mono)' }}>{label}</span>}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name='?', size=36 }) {
  const init = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const hue  = name.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % 360;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`oklch(0.38 0.13 ${hue})`,
      border:'1.5px solid rgba(255,255,255,0.12)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.35, fontWeight:700, color:'#fff', letterSpacing:0.5 }}>
      {init}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ children, color='violet' }) {
  const map = {
    violet: ['rgba(167,139,250,0.15)','rgba(167,139,250,0.35)','var(--violet)'],
    green:  ['rgba(52,211,153,0.12)', 'rgba(52,211,153,0.3)', 'var(--green)'],
    red:    ['rgba(248,113,113,0.12)','rgba(248,113,113,0.3)','var(--red)'],
    amber:  ['rgba(251,191,36,0.12)', 'rgba(251,191,36,0.3)', 'var(--amber)'],
    blue:   ['rgba(96,165,250,0.12)', 'rgba(96,165,250,0.3)', 'var(--blue)'],
    teal:   ['rgba(45,212,191,0.12)', 'rgba(45,212,191,0.3)', 'var(--teal)'],
  };
  const [bg,bd,txt] = map[color] || map.violet;
  return (
    <span style={{ background:bg, border:`1px solid ${bd}`,
      color:txt, borderRadius:6, padding:'2.5px 9px',
      fontSize:11, fontFamily:'var(--mono)', fontWeight:600,
      letterSpacing:0.5, whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color='var(--violet)' }) {
  return (
    <Card tilt style={{ flex:1, minWidth:150 }}>
      <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)',
        letterSpacing:1.5, marginBottom:14, textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:30, fontWeight:700, color, fontFamily:'var(--mono)',
        letterSpacing:-0.5, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:7 }}>{sub}</div>}
    </Card>
  );
}

// ── ScanLogo ──────────────────────────────────────────────────────────────────
function ScanLogo({ size=24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V4a1 1 0 011-1h3M21 7V4a1 1 0 00-1-1h-3M3 17v3a1 1 0 001 1h3M21 17v3a1 1 0 01-1 1h-3"
        stroke="var(--violet)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="var(--violet)" strokeWidth="1.5"/>
      <path d="M7 12h2M15 12h2" stroke="var(--violet)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size=18, color='var(--violet)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation:'spin 0.85s linear infinite', flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeOpacity="0.15"/>
      <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, max=100, color='var(--violet)', height=5 }) {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div style={{ height, background:'rgba(255,255,255,0.06)', borderRadius:height, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, borderRadius:height,
        background:`linear-gradient(90deg, ${color}bb, ${color})`,
        boxShadow:`0 0 10px ${color}50`,
        transition:'width 0.45s ease' }}/>
    </div>
  );
}

// ── ConfidenceMeter ───────────────────────────────────────────────────────────
function ConfidenceMeter({ value }) {
  const color = value >= 90 ? 'var(--green)' : value >= 70 ? 'var(--violet)' : 'var(--amber)';
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
        <span style={{ fontSize:12, color:'var(--text2)' }}>Confidence Score</span>
        <span style={{ fontFamily:'var(--mono)', fontWeight:700, color, fontSize:14 }}>{value.toFixed(1)}%</span>
      </div>
      <ProgressBar value={value} color={color} height={7}/>
    </div>
  );
}

// ── PageShell ─────────────────────────────────────────────────────────────────
function PageShell({ children, maxWidth=1200, padTop=80 }) {
  return (
    <div style={{ minHeight:'100vh', paddingTop:padTop+16, paddingBottom:60, position:'relative' }}>
      <div className="mesh-bg"/>
      <div style={{ maxWidth, margin:'0 auto', padding:'0 28px', position:'relative', zIndex:1 }}>
        {children}
      </div>
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18 }}>
      <div>
        <h2 style={{ fontSize:17, fontWeight:700, letterSpacing:-0.2 }}>{title}</h2>
        {sub && <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label: lbl, children, error }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      {lbl && <label>{lbl}</label>}
      {children}
      {error && <span style={{ fontSize:11.5, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'6px 0' }}>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
      {label && <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{label}</span>}
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
    </div>
  );
}

// ── GlassTable ────────────────────────────────────────────────────────────────
function GlassTable({ headers, rows }) {
  return (
    <div style={{ background:'var(--glass)', backdropFilter:'blur(20px)',
      border:'1px solid var(--glass-border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'rgba(255,255,255,0.03)' }}>
            {headers.map(h => (
              <th key={h} style={{ padding:'12px 16px', textAlign:'left',
                fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)',
                fontWeight:600, letterSpacing:1, textTransform:'uppercase',
                borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom:'1px solid rgba(255,255,255,0.04)',
                transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(167,139,250,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding:'11px 16px' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, {
  ToastCtx, ToastProvider, useToast,
  NavBar, PalmScanner, Btn, Card, StatusDot, Avatar, Badge,
  StatCard, ScanLogo, Spinner, ProgressBar, ConfidenceMeter,
  PageShell, SectionHeader, Field, Divider, GlassTable,
});
