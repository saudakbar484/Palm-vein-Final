// ── Admin Panel — Obsidian Glass 3D ──────────────────────────────────────────
const { useState: useAD, useEffect: useAE } = React;

const mockUsers = [
  { id:'USR-001', name:'Huzaifa Chishty', email:'huzaifa@palmvein.com', role:'user',  status:'active', enrolled:true,  logins:42, created:'2026-01-15' },
  { id:'USR-002', name:'Shanza Rahim',    email:'shanza@palmvein.com',   role:'user',  status:'active', enrolled:true,  logins:18, created:'2026-01-20' },
  { id:'USR-003', name:'Saud Akbar',      email:'saud@palmvein.com',     role:'user',  status:'active', enrolled:false, logins:9,  created:'2026-02-01' },
  { id:'USR-004', name:'Test User',       email:'test@example.com',      role:'user',  status:'banned', enrolled:false, logins:2,  created:'2026-03-10' },
  { id:'ADM-001', name:'Admin User',      email:'admin@palmvein.com',    role:'admin', status:'active', enrolled:true,  logins:87, created:'2026-01-01' },
];

const allLogs = [
  { id:1, user:'Huzaifa Chishty', uid:'USR-001', ts:'2026-04-26 14:32', method:'Palm Vein', result:'Success', confidence:96.4, ip:'192.168.1.12' },
  { id:2, user:'Shanza Rahim',    uid:'USR-002', ts:'2026-04-26 13:18', method:'Password',  result:'Success', confidence:null, ip:'10.0.0.3' },
  { id:3, user:'Huzaifa Chishty', uid:'USR-001', ts:'2026-04-26 11:47', method:'Palm Vein', result:'Failed',  confidence:31.2, ip:'192.168.1.12' },
  { id:4, user:'Saud Akbar',      uid:'USR-003', ts:'2026-04-25 17:22', method:'Palm Vein', result:'Success', confidence:92.1, ip:'192.168.1.8' },
  { id:5, user:'Test User',       uid:'USR-004', ts:'2026-04-25 09:15', method:'Password',  result:'Failed',  confidence:null, ip:'10.0.0.8' },
  { id:6, user:'Huzaifa Chishty', uid:'USR-001', ts:'2026-04-24 20:01', method:'Palm Vein', result:'Success', confidence:98.7, ip:'192.168.1.12' },
  { id:7, user:'Admin User',      uid:'ADM-001', ts:'2026-04-24 18:30', method:'Password',  result:'Success', confidence:null, ip:'127.0.0.1' },
  { id:8, user:'Shanza Rahim',    uid:'USR-002', ts:'2026-04-23 15:12', method:'Palm Vein', result:'Success', confidence:91.3, ip:'10.0.0.3' },
];

function AdminPanel({ user, setPage }) {
  const toast = useToast();
  const [tab, setTab] = useAD('overview');
  const [users, setUsers] = useAD(mockUsers);
  const [fResult, setFResult] = useAD('all');
  const [fMethod, setFMethod] = useAD('all');
  const [fUser, setFUser]     = useAD('');

  if (user?.role !== 'admin') {
    return (
      <PageShell>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', minHeight:'60vh', gap:16, textAlign:'center' }}>
          <div style={{ fontSize:52, filter:'drop-shadow(0 0 16px var(--red))' }}>⊘</div>
          <h2 style={{ fontSize:24, fontWeight:800, color:'var(--red)' }}>Access Denied</h2>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Admin privileges required.</p>
          <Btn onClick={() => setPage('dashboard')}>← Dashboard</Btn>
        </div>
      </PageShell>
    );
  }

  const successRate = ((allLogs.filter(l=>l.result==='Success').length/allLogs.length)*100).toFixed(1);
  const avgConf = (allLogs.filter(l=>l.confidence).reduce((a,l)=>a+l.confidence,0)/allLogs.filter(l=>l.confidence).length).toFixed(1);

  const filteredLogs = allLogs.filter(l => {
    if (fResult!=='all' && l.result!==fResult) return false;
    if (fMethod!=='all' && l.method!==fMethod) return false;
    if (fUser && !l.user.toLowerCase().includes(fUser.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    const rows = [['#','User','Timestamp','Method','Result','Confidence','IP'],
      ...filteredLogs.map(l=>[l.id,l.user,l.ts,l.method,l.result,l.confidence||'N/A',l.ip])];
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='auth_logs.csv'; a.click();
    toast('CSV exported', 'success');
  };

  const tabs = [['overview','Overview'],['users','Users'],['logs','Auth Logs'],['monitoring','Monitoring']];

  // Shared table row style
  const tr = (i) => ({
    borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s'
  });

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom:28, animation:'fadeInUp 0.4s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:-0.8 }}>Admin Panel</h1>
          <Badge color="amber">ADMIN</Badge>
        </div>
        <p style={{ color:'var(--text2)', fontSize:14 }}>System management, user control, and monitoring</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.07)', borderRadius:13,
        padding:4, marginBottom:28, width:'fit-content' }}>
        {tabs.map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background: tab===id ? 'rgba(167,139,250,0.15)' : 'transparent',
              border: tab===id ? '1px solid rgba(167,139,250,0.25)' : '1px solid transparent',
              color: tab===id ? 'var(--violet)' : 'var(--text2)', borderRadius:10,
              padding:'8px 20px', fontSize:13.5, cursor:'pointer', fontFamily:'var(--ff)',
              fontWeight:600, transition:'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div style={{ animation:'fadeIn 0.3s ease' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
            gap:14, marginBottom:28 }}>
            <StatCard label="Total Users"     value={users.length}  sub={`${users.filter(u=>u.status==='active').length} active`} color="var(--violet)"/>
            <StatCard label="Auth Attempts"   value={allLogs.length} sub="all time"          color="var(--blue)"/>
            <StatCard label="Success Rate"    value={`${successRate}%`} sub="authentication" color="var(--green)"/>
            <StatCard label="Avg Confidence"  value={`${avgConf}%`} sub="palm vein"          color="var(--teal)"/>
            <StatCard label="Enrolled Users"  value={users.filter(u=>u.enrolled).length} sub="with palm data" color="var(--violet)"/>
            <StatCard label="Banned Accounts" value={users.filter(u=>u.status==='banned').length} sub="security actions" color="var(--red)"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <Card>
              <SectionHeader title="Recent Activity" sub="Latest authentication events"/>
              {allLogs.slice(0,5).map(l => (
                <div key={l.id} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'10px 0',
                  borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{l.user}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{l.ts.split(' ')[1]}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <Badge color={l.method==='Palm Vein'?'violet':'blue'}>{l.method.split(' ')[0]}</Badge>
                    <Badge color={l.result==='Success'?'green':'red'}>{l.result}</Badge>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <SectionHeader title="Recognition Performance" sub="Biometric engine metrics"/>
              {[['Model Accuracy','99.2%','var(--green)',99.2],['Palm Match Rate','94.1%','var(--violet)',94.1],
                ['False Accept Rate','0.03%','var(--amber)',0.03],['False Reject Rate','1.2%','var(--blue)',1.2],
                ['Avg Inference','0.42s','#a78bfa',42]].map(([k,v,c,p]) => (
                <div key={k} style={{ marginBottom:13 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12.5, color:'var(--text2)' }}>{k}</span>
                    <span style={{ fontSize:12.5, fontFamily:'var(--mono)', color:c, fontWeight:700 }}>{v}</span>
                  </div>
                  <ProgressBar value={Math.min(p,100)} color={c} height={4}/>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'users' && (
        <div style={{ animation:'fadeIn 0.3s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, alignItems:'center' }}>
            <span style={{ fontSize:13.5, color:'var(--text2)' }}>{users.length} registered users</span>
            <Btn variant="secondary" size="sm" onClick={()=>toast('Export coming soon','info')}>Export Users</Btn>
          </div>
          <div style={{ background:'var(--glass)', backdropFilter:'blur(20px)',
            border:'1px solid var(--glass-border)', borderRadius:16, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                  {['User','Email','Role','Status','Enrolled','Logins','Created','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10.5,
                      color:'var(--text3)', fontFamily:'var(--mono)', fontWeight:600,
                      letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.06)',
                      textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u,i) => (
                  <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', opacity:u.status==='banned'?0.55:1 }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(167,139,250,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar name={u.name} size={28}/>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', color:'var(--text2)', fontSize:12 }}>{u.email}</td>
                    <td style={{ padding:'12px 16px' }}><Badge color={u.role==='admin'?'amber':'blue'}>{u.role.toUpperCase()}</Badge></td>
                    <td style={{ padding:'12px 16px' }}><Badge color={u.status==='active'?'green':'red'}>{u.status.toUpperCase()}</Badge></td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:u.enrolled?'var(--green)':'var(--text3)' }}>
                      {u.enrolled ? '✓ Yes' : '— No'}
                    </td>
                    <td style={{ padding:'12px 16px', fontFamily:'var(--mono)', fontSize:12, color:'var(--text2)' }}>{u.logins}</td>
                    <td style={{ padding:'12px 16px', fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>{u.created}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <Btn variant="ghost" size="sm" onClick={()=>toast(`Editing ${u.name}`,'info')}>Edit</Btn>
                        <Btn variant={u.status==='banned'?'success':'secondary'} size="sm"
                          onClick={()=>{setUsers(p=>p.map(x=>x.id===u.id?{...x,status:x.status==='banned'?'active':'banned'}:x));toast('Status updated','success');}}>
                          {u.status==='banned'?'Unban':'Ban'}
                        </Btn>
                        {u.role!=='admin'&&<Btn variant="danger" size="sm" onClick={()=>{setUsers(p=>p.filter(x=>x.id!==u.id));toast('Deleted','success');}}>Del</Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Logs ── */}
      {tab === 'logs' && (
        <div style={{ animation:'fadeIn 0.3s ease' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
            <input placeholder="Filter by user…" value={fUser} onChange={e=>setFUser(e.target.value)}
              style={{ width:200 }}/>
            <select value={fResult} onChange={e=>setFResult(e.target.value)} style={{ width:140 }}>
              <option value="all">All Results</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
            <select value={fMethod} onChange={e=>setFMethod(e.target.value)} style={{ width:150 }}>
              <option value="all">All Methods</option>
              <option value="Palm Vein">Palm Vein</option>
              <option value="Password">Password</option>
            </select>
            <span style={{ fontSize:12.5, color:'var(--text3)', marginLeft:'auto' }}>{filteredLogs.length} results</span>
            <Btn variant="secondary" size="sm" onClick={exportCSV}>Export CSV</Btn>
          </div>
          <div style={{ background:'var(--glass)', backdropFilter:'blur(20px)',
            border:'1px solid var(--glass-border)', borderRadius:16, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                  {['#','User','Timestamp','Method','Result','Confidence','IP'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10.5,
                      color:'var(--text3)', fontFamily:'var(--mono)', fontWeight:600,
                      letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.06)',
                      textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l,i) => (
                  <tr key={l.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(167,139,250,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'11px 16px', fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>{l.id}</td>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <Avatar name={l.user} size={24}/>
                        <div>
                          <div style={{ fontSize:12.5, fontWeight:500 }}>{l.user}</div>
                          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>{l.uid}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px', fontFamily:'var(--mono)', fontSize:11, color:'var(--text2)' }}>{l.ts}</td>
                    <td style={{ padding:'11px 16px' }}><Badge color={l.method==='Palm Vein'?'violet':'blue'}>{l.method}</Badge></td>
                    <td style={{ padding:'11px 16px' }}><Badge color={l.result==='Success'?'green':'red'}>{l.result}</Badge></td>
                    <td style={{ padding:'11px 16px', fontFamily:'var(--mono)', fontSize:12 }}>
                      {l.confidence
                        ? <span style={{ color:l.confidence>=90?'var(--green)':l.confidence>=70?'var(--violet)':'var(--amber)' }}>{l.confidence.toFixed(1)}%</span>
                        : <span style={{ color:'var(--text3)' }}>—</span>}
                    </td>
                    <td style={{ padding:'11px 16px', fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>{l.ip}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:36, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                    No logs match the current filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Monitoring ── */}
      {tab === 'monitoring' && (
        <div style={{ animation:'fadeIn 0.3s ease' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <Card>
              <SectionHeader title="Scanner Health" sub="Hardware status"/>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                <PalmScanner status="idle" size={150}/>
              </div>
              {[['Status','Online'],['Firmware','v3.2.1'],['Uptime','99.8%'],['Scans Today','24'],['Avg Scan','1.4s'],['Queue','0']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between',
                  padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize:13, color:'var(--text2)' }}>{k}</span>
                  <span style={{ fontSize:13, fontFamily:'var(--mono)', color:'var(--violet)' }}>{v}</span>
                </div>
              ))}
            </Card>

            <Card>
              <SectionHeader title="Recognition Engine" sub="Deep learning model metrics"/>
              <div style={{ background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.1)',
                borderRadius:10, padding:14, marginBottom:16 }}>
                <div style={{ fontSize:10.5, color:'var(--text3)', fontFamily:'var(--mono)',
                  letterSpacing:1, marginBottom:10, textTransform:'uppercase' }}>Model Info</div>
                {[['Architecture','Deep Learning CNN'],['Input Size','224×224 px'],['Precision','FP32']].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11.5, color:'var(--text3)' }}>{k}</span>
                    <span style={{ fontSize:11.5, fontFamily:'var(--mono)', color:'var(--text2)' }}>{v}</span>
                  </div>
                ))}
              </div>
              {[['Top-1 Accuracy',99.2,'var(--green)'],['Top-5 Accuracy',99.9,'var(--green)'],
                ['Precision',97.8,'var(--violet)'],['Recall',96.4,'var(--violet)'],
                ['F1-Score',97.1,'var(--teal)']].map(([k,v,c]) => (
                <div key={k} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12.5, color:'var(--text2)' }}>{k}</span>
                    <span style={{ fontSize:12.5, fontFamily:'var(--mono)', color:c, fontWeight:700 }}>{v}%</span>
                  </div>
                  <ProgressBar value={v} color={c} height={4}/>
                </div>
              ))}
            </Card>

            <Card>
              <SectionHeader title="System Resources" sub="Server load"/>
              {[['CPU','34%',34,'var(--violet)'],['Memory','2.1 / 8 GB',26,'var(--blue)'],
                ['GPU VRAM','1.2 / 4 GB',30,'#a78bfa'],['Disk','12 / 100 GB',12,'var(--green)']].map(([k,v,p,c]) => (
                <div key={k} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12.5, color:'var(--text2)' }}>{k}</span>
                    <span style={{ fontSize:12.5, fontFamily:'var(--mono)', color:c, fontWeight:700 }}>{v}</span>
                  </div>
                  <ProgressBar value={p} color={c} height={4}/>
                </div>
              ))}
            </Card>

            <Card>
              <SectionHeader title="Security Status" sub="Active protections"/>
              {[['bcrypt Hashing',true,'Passwords'],['JWT Tokens',true,'24h expiry'],
                ['Rate Limiting',true,'5 req/min'],['AES-256',true,'Palm vectors'],
                ['CSRF Protection',true,'All endpoints'],['RBAC',true,'User + Admin'],
                ['HTTPS',false,'Dev mode only']].map(([k,ok,v]) => (
                <div key={k} style={{ display:'flex', alignItems:'center', gap:10,
                  padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0,
                    background:ok?'var(--green)':'var(--amber)',
                    boxShadow:ok?'0 0 6px var(--green)':'0 0 6px var(--amber)' }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{k}</div>
                    <div style={{ fontSize:11.5, color:'var(--text3)' }}>{v}</div>
                  </div>
                  <Badge color={ok?'green':'amber'}>{ok?'ACTIVE':'PARTIAL'}</Badge>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}

Object.assign(window, { AdminPanel });
