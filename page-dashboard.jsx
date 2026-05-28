// ── Dashboard, Palm Mgmt, Auth Kiosk — Obsidian Glass 3D ─────────────────────
const { useState: useSD, useEffect: useED, useRef: useRD } = React;

const mockLogs = [
  { id:1, ts:'2026-04-26 14:32:11', method:'Palm Vein', result:'Success', confidence:96.4, ip:'192.168.1.12' },
  { id:2, ts:'2026-04-26 13:18:05', method:'Password',  result:'Success', confidence:null,  ip:'192.168.1.12' },
  { id:3, ts:'2026-04-26 11:47:33', method:'Palm Vein', result:'Failed',  confidence:31.2, ip:'10.0.0.5' },
  { id:4, ts:'2026-04-25 17:22:50', method:'Palm Vein', result:'Success', confidence:92.1, ip:'192.168.1.12' },
  { id:5, ts:'2026-04-25 09:15:44', method:'Password',  result:'Failed',  confidence:null,  ip:'10.0.0.8' },
  { id:6, ts:'2026-04-24 20:01:07', method:'Palm Vein', result:'Success', confidence:98.7, ip:'192.168.1.12' },
];

const mockPalmSamples = [
  { id:1, hand:'Right', quality:96, captured:'2026-04-20', samples:3 },
  { id:2, hand:'Left',  quality:88, captured:'2026-04-21', samples:3 },
];

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardPage({ user, setPage }) {
  const toast = useToast();
  const ok  = mockLogs.filter(l=>l.result==='Success').length;
  const bad = mockLogs.filter(l=>l.result==='Failed').length;
  const avgConf = (mockLogs.filter(l=>l.confidence).reduce((a,l)=>a+l.confidence,0)/mockLogs.filter(l=>l.confidence).length).toFixed(1);

  return (
    <PageShell>
      {/* Welcome row */}
      <div style={{ marginBottom:32, display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', flexWrap:'wrap', gap:16, animation:'fadeInUp 0.4s ease' }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)',
            letterSpacing:2, marginBottom:8, textTransform:'uppercase' }}>Welcome back</div>
          <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:-1, marginBottom:8 }}>
            {user?.name || 'User'}
          </h1>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <Badge color={user?.role==='admin'?'amber':'violet'}>{(user?.role||'user').toUpperCase()}</Badge>
            <span style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)' }}>{user?.id}</span>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Last login: Today 14:32</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="ghost" onClick={() => setPage('kiosk')}>Auth Kiosk</Btn>
          <Btn onClick={() => setPage('palm-mgmt')}>Manage Palm Vein</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
        gap:14, marginBottom:28 }}>
        <StatCard label="Total Attempts" value={mockLogs.length} sub="last 30 days" color="var(--violet)"/>
        <StatCard label="Successful"     value={ok}  sub={`${((ok/mockLogs.length)*100).toFixed(0)}% success rate`} color="var(--green)"/>
        <StatCard label="Failed"         value={bad} sub="rate-limited after 5/min"  color="var(--red)"/>
        <StatCard label="Avg Confidence" value={`${avgConf}%`} sub="palm vein sessions"  color="var(--teal)"/>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom:28 }}>
        <SectionHeader title="Quick Actions"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          {[
            { label:'Re-register Palm',  c:'var(--violet)', action:()=>setPage('palm-mgmt') },
            { label:'Device Controls',   c:'var(--teal)',   action:()=>setPage('device-controls') },
            { label:'Auth History',      c:'#a78bfa',       action:()=>document.getElementById('logs-section')?.scrollIntoView({block:'nearest'}) },
            { label:'Security Settings', c:'var(--blue)',   action:()=>toast('Security settings coming soon','info') },
          ].map((a,i) => (
            <div key={i} data-tilt="4" onClick={a.action}
              style={{ background:'var(--glass)', backdropFilter:'blur(16px)',
                border:'1px solid var(--glass-border)', borderRadius:14,
                padding:'18px 20px', cursor:'pointer', transition:'all 0.2s',
                boxShadow:'0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation:`fadeInUp 0.5s ease ${i*0.07}s both` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=`${a.c}40`; e.currentTarget.style.boxShadow=`0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${a.c}25`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--glass-border)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'; }}>
              <div style={{ width:32, height:32, borderRadius:9, marginBottom:12,
                background:`${a.c}18`, border:`1px solid ${a.c}30`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:a.c,
                  boxShadow:`0 0 8px ${a.c}` }}/>
              </div>
              <div style={{ fontSize:14, fontWeight:600, letterSpacing:-0.1 }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs + Status */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:18, alignItems:'start' }}>
        {/* Logs */}
        <div id="logs-section" style={{ background:'var(--glass)', backdropFilter:'blur(20px)',
          border:'1px solid var(--glass-border)', borderRadius:16,
          boxShadow:'0 8px 32px rgba(0,0,0,0.35)' }}>
          <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15, letterSpacing:-0.2 }}>Authentication History</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{mockLogs.length} recent entries</div>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => toast('CSV exported','success')}>Export</Btn>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,0.025)' }}>
                  {['Timestamp','Method','Result','Confidence','IP'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10.5,
                      color:'var(--text3)', fontFamily:'var(--mono)', fontWeight:600,
                      letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.05)',
                      textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockLogs.map((l,i) => (
                  <tr key={l.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(167,139,250,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'10px 16px', fontFamily:'var(--mono)', fontSize:11, color:'var(--text2)' }}>{l.ts}</td>
                    <td style={{ padding:'10px 16px' }}><Badge color={l.method==='Palm Vein'?'violet':'blue'}>{l.method}</Badge></td>
                    <td style={{ padding:'10px 16px' }}><Badge color={l.result==='Success'?'green':'red'}>{l.result}</Badge></td>
                    <td style={{ padding:'10px 16px', fontFamily:'var(--mono)', fontSize:12 }}>
                      {l.confidence
                        ? <span style={{ color:l.confidence>=90?'var(--green)':l.confidence>=70?'var(--violet)':'var(--amber)' }}>{l.confidence.toFixed(1)}%</span>
                        : <span style={{ color:'var(--text3)' }}>—</span>}
                    </td>
                    <td style={{ padding:'10px 16px', fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card glow>
            <div style={{ fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)',
              letterSpacing:2, marginBottom:16, textTransform:'uppercase' }}>System Status</div>
            {[['Scanner','Connected'],['ML Model','Active'],['Database','SQLite'],['JWT Auth','Running'],['Rate Limit','5/min']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)',
                    boxShadow:'0 0 6px var(--green)' }}/>
                  <span style={{ fontSize:13 }}>{k}</span>
                </div>
                <span style={{ fontSize:11.5, color:'var(--text3)', fontFamily:'var(--mono)' }}>{v}</span>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)',
              letterSpacing:2, marginBottom:14, textTransform:'uppercase' }}>Enrolled Biometrics</div>
            {mockPalmSamples.map(p => (
              <div key={p.id} style={{ background:'rgba(255,255,255,0.03)',
                borderRadius:10, padding:12, marginBottom:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>{p.hand} Hand</span>
                  <Badge color="violet">{p.samples} samples</Badge>
                </div>
                <ProgressBar value={p.quality} color="var(--green)" height={4}/>
                <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:5, fontFamily:'var(--mono)' }}>
                  Quality: {p.quality}% · {p.captured}
                </div>
              </div>
            ))}
            <Btn fullWidth variant="secondary" size="sm" onClick={() => setPage('palm-mgmt')}>
              Manage Palm Data →
            </Btn>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ── Palm Management (legacy mock — replaced by page-auth.jsx live version) ──
function _LegacyPalmManagementPage({ user, setPage }) {
  const toast = useToast();
  const [scanStatus, setScanStatus] = useSD('idle');
  const [testing, setTesting] = useSD(false);
  const [samples, setSamples] = useSD(mockPalmSamples);

  const testScanner = () => {
    setTesting(true); setScanStatus('connecting');
    setTimeout(() => setScanStatus('scanning'), 800);
    setTimeout(() => { setScanStatus('captured'); setTesting(false); toast('Test scan: quality 94%', 'success'); }, 2600);
  };

  const diag = [['Firmware','v3.2.1'],['Resolution','640×480 px'],['IR Wavelength','850nm NIR'],['Scan Rate','30 fps'],['Sensitivity','Level 3/5'],['Queue','0 pending']];

  return (
    <PageShell>
      <div style={{ marginBottom:28, animation:'fadeInUp 0.4s ease' }}>
        <button onClick={() => setPage('dashboard')}
          style={{ background:'none', border:'none', color:'var(--text2)',
            cursor:'pointer', fontSize:13, fontFamily:'var(--ff)',
            display:'flex', alignItems:'center', gap:6, marginBottom:14,
            transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--violet)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text2)'}>
          ← Dashboard
        </button>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:4 }}>Palm Vein Management</h1>
        <p style={{ color:'var(--text2)', fontSize:14 }}>Manage enrolled palm samples and scanner hardware</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Enrolled */}
        <Card>
          <SectionHeader title="Enrolled Samples"
            action={<Btn variant="secondary" size="sm" onClick={()=>toast('Re-enrollment started','info')}>+ Re-enroll</Btn>}/>
          {samples.map(s => (
            <div key={s.id} style={{ background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ width:40, height:40, borderRadius:10,
                    background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                    {s.hand==='Right' ? '🤚' : '✋'}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{s.hand} Hand</div>
                    <div style={{ fontSize:11, color:'var(--text2)', fontFamily:'var(--mono)' }}>
                      {s.samples} samples · {s.captured}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Btn variant="secondary" size="sm" onClick={()=>toast('Re-enrolling…','info')}>Re-enroll</Btn>
                  <Btn variant="danger" size="sm" onClick={()=>{setSamples(p=>p.filter(x=>x.id!==s.id));toast('Deleted','success');}}>Delete</Btn>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, color:'var(--text2)' }}>Quality Score</span>
                <span style={{ fontSize:12, fontFamily:'var(--mono)',
                  color:s.quality>=90?'var(--green)':'var(--violet)', fontWeight:700 }}>{s.quality}%</span>
              </div>
              <ProgressBar value={s.quality} color={s.quality>=90?'var(--green)':'var(--violet)'} height={5}/>
            </div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {['Right','Left'].map(h => (
              <Btn key={h} variant="ghost" size="sm" onClick={()=>toast(`Adding ${h} hand…`,'info')}>
                + Add {h} Hand
              </Btn>
            ))}
          </div>
        </Card>

        {/* Scanner Control */}
        <Card>
          <SectionHeader title="Scanner Control Panel"/>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <PalmScanner status={scanStatus} size={190}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            <Btn variant="primary" size="sm" onClick={()=>toast('Scanner connected','success')}>Connect</Btn>
            <Btn variant="secondary" size="sm" onClick={testScanner} disabled={testing}>
              {testing ? <><Spinner size={13}/>&nbsp;Testing…</> : 'Test Scan'}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={()=>{setScanStatus('scanning');setTimeout(()=>setScanStatus('captured'),2400);}}>Test Image</Btn>
            <Btn variant="ghost" size="sm" onClick={()=>toast('Diagnostics running…','info')}>Diagnostics</Btn>
          </div>
          <Divider label="HARDWARE INFO"/>
          <div style={{ marginTop:14 }}>
            {diag.map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between',
                padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:12.5, color:'var(--text2)' }}>{k}</span>
                <span style={{ fontSize:12.5, fontFamily:'var(--mono)', color:'var(--violet)' }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// ── Auth Kiosk (legacy mock — replaced by page-auth.jsx live version) ──────
function _LegacyAuthKioskPage() {
  const toast = useToast();
  const [scanStatus, setScanStatus] = useSD('idle');
  const [result, setResult]         = useSD(null);
  const [progress, setProgress]     = useSD(0);
  const progRef = useRD(null);

  const startScan = () => {
    if (!['idle','verified','rejected'].includes(scanStatus)) return;
    setResult(null); setScanStatus('connecting'); setProgress(0);
    setTimeout(() => { setScanStatus('scanning'); animateProg(); }, 900);
    setTimeout(() => setScanStatus('verifying'), 3300);
    setTimeout(() => {
      const ok = Math.random() > 0.2;
      setScanStatus(ok ? 'verified' : 'rejected');
      setProgress(100);
      if (ok) {
        const conf = 87 + Math.random()*12;
        setResult({ name:'Huzaifa Chishty', id:'USR-001', role:'Student', confidence:conf, ts:new Date().toLocaleString() });
      } else {
        toast('Authentication failed', 'error');
      }
    }, 5400);
  };

  const animateProg = () => {
    let p = 0;
    clearInterval(progRef.current);
    progRef.current = setInterval(() => {
      p = Math.min(p + Math.random()*4, 85);
      setProgress(p);
      if (p >= 85) clearInterval(progRef.current);
    }, 90);
  };

  const reset = () => { setScanStatus('idle'); setResult(null); setProgress(0); };
  const isActive = ['connecting','scanning','verifying'].includes(scanStatus);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'80px 24px 48px', position:'relative' }}>
      <div className="mesh-bg"/>

      {/* Ambient rings when active */}
      {isActive && [1,2,3].map(i => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none',
          width:160+i*130, height:160+i*130,
          border:`1px solid rgba(167,139,250,${0.12-i*0.03})`,
          animation:`pulse ${1.6+i*0.4}s ease-in-out infinite` }}/>
      ))}

      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column',
        alignItems:'center', gap:28, maxWidth:640, width:'100%' }}>

        {/* Header */}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:10.5, fontFamily:'var(--mono)', color:'var(--violet)',
            letterSpacing:4, marginBottom:12, textTransform:'uppercase' }}>
            Secure Authentication Terminal
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:800, letterSpacing:-1.5,
            background:'linear-gradient(135deg, var(--violet), var(--teal))',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Place Palm on Scanner
          </h1>
        </div>

        {/* 3D glass scanner panel */}
        <div data-tilt="4"
          style={{ padding:36, background:'var(--glass)', backdropFilter:'blur(24px)',
            border:'1px solid var(--glass-border)', borderRadius:28,
            boxShadow:'0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
            cursor: isActive ? 'default' : 'pointer',
            transition:'all 0.25s ease' }}
          onClick={!isActive ? startScan : undefined}>
          <PalmScanner status={scanStatus} size={280} progress={progress}/>
        </div>

        {/* Status */}
        <div style={{ textAlign:'center', minHeight:60 }}>
          {scanStatus === 'idle' && (
            <div style={{ animation:'fadeIn 0.3s ease' }}>
              <p style={{ color:'var(--text2)', fontSize:15.5, marginBottom:14 }}>
                Tap scanner or click below to begin
              </p>
              <Btn size="lg" onClick={startScan}>Start Palm Scan</Btn>
            </div>
          )}
          {scanStatus === 'connecting' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text2)', fontSize:14 }}>
              <Spinner/> Connecting to scanner…
            </div>
          )}
          {scanStatus === 'scanning' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center',
                color:'var(--violet)', fontSize:14, marginBottom:12,
                animation:'pulseFast 0.9s ease infinite' }}>
                <Spinner/> Acquiring palm vein image…
              </div>
              <div style={{ maxWidth:260, margin:'0 auto' }}>
                <ProgressBar value={progress} color="var(--violet)" height={5}/>
              </div>
            </div>
          )}
          {scanStatus === 'verifying' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--teal)', fontSize:14 }}>
              <Spinner color="var(--teal)"/> Running recognition engine…
            </div>
          )}
        </div>

        {/* Verified result */}
        {scanStatus === 'verified' && result && (
          <div style={{ width:'100%', background:'rgba(52,211,153,0.06)',
            border:'1.5px solid rgba(52,211,153,0.3)', borderRadius:20, padding:28,
            animation:'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow:'0 0 60px rgba(52,211,153,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ fontSize:46, filter:'drop-shadow(0 0 16px var(--green))' }}>✓</div>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--green)', letterSpacing:-0.3 }}>Identity Confirmed</div>
                <div style={{ fontSize:12.5, color:'var(--text2)', marginTop:2 }}>{result.ts}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
              {[['Name',result.name],['User ID',result.id],['Role',result.role],['Method','Palm Vein']].map(([k,v]) => (
                <div key={k} style={{ background:'rgba(52,211,153,0.05)', borderRadius:10, padding:12 }}>
                  <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)',
                    letterSpacing:1, marginBottom:5, textTransform:'uppercase' }}>{k}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--green)' }}>{v}</div>
                </div>
              ))}
            </div>
            <ConfidenceMeter value={result.confidence}/>
            <div style={{ marginTop:16 }}>
              <Btn variant="ghost" size="sm" fullWidth onClick={reset}>Scan Another User</Btn>
            </div>
          </div>
        )}

        {/* Rejected */}
        {scanStatus === 'rejected' && (
          <div style={{ width:'100%', background:'rgba(248,113,113,0.06)',
            border:'1.5px solid rgba(248,113,113,0.3)', borderRadius:20, padding:28,
            textAlign:'center', animation:'scaleIn 0.4s ease',
            boxShadow:'0 0 60px rgba(248,113,113,0.07)' }}>
            <div style={{ fontSize:46, marginBottom:12, filter:'drop-shadow(0 0 16px var(--red))' }}>✕</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--red)', marginBottom:8 }}>Not Recognized</div>
            <p style={{ color:'var(--text2)', fontSize:14, marginBottom:22 }}>
              Palm vein pattern not found in database.<br/>Attempt has been logged.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <Btn variant="danger" onClick={reset}>Retry</Btn>
              <Btn variant="ghost" onClick={reset}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Footer status */}
        {['idle','verified','rejected'].includes(scanStatus) && (
          <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center' }}>
            <StatusDot connected label="Scanner Online"/>
            <StatusDot connected label="Recognition Ready"/>
            <StatusDot connected label="Encrypted Channel"/>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage, mockLogs });
