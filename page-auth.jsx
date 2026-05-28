// ── Auth Pages — Login · Register · Kiosk · Palm Mgmt ──────────────────────────
const { useState: useA, useEffect: useAE, useRef: useAR, useCallback } = React;

const API_BASE = "http://localhost:5000";

async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── PalmVeinCamera — XR Scanner live feed with rapid frame polling ────────────
function PalmVeinCamera({ onCapture, captureLabel = "Capture", requiredCaptures = 1, compact = false, saveLabel = "scan" }) {
  const [connected, setConnected] = useA(false);
  const [connecting, setConnecting] = useA(false);
  const [scanning, setScanning] = useA(false);
  const [capturedCount, setCapturedCount] = useA(0);
  const [logs, setLogs] = useA([]);
  const [errorInfo, setErrorInfo] = useA(null);
  const canvasRef = useAR(null);
  const frameLoopRef = useAR(null);
  const toast = useToast();

  const addLog = (msg) => setLogs((p) => [...p.slice(-19), `> ${msg}`]);

  useAE(() => {
    connectDevice();
    return () => {
      if (frameLoopRef.current) clearInterval(frameLoopRef.current);
    };
  }, []);

  function startFrameStream() {
    // Start frame polling - continuously fetch frames from scanner
    if (frameLoopRef.current) clearInterval(frameLoopRef.current);
    
    let lastBlobUrl = null;
    let frameCount = 0;
    let isProcessing = false;
    
    const pollFrame = async () => {
      // Prevent request queuing - skip if already processing previous frame
      if (isProcessing) return;
      isProcessing = true;
      
      if (!canvasRef.current) {
        isProcessing = false;
        return;
      }
      
      try {
        // Fetch frame with cache-busting timestamp
        const response = await fetch(`${API_BASE}/api/frame?t=${Date.now()}`);
        
        // 503 = Device not ready (normal when no palm is on scanner)
        if (response.status === 503) {
          isProcessing = false;
          return;
        }
        
        if (!response.ok) {
          console.error("Frame fetch failed:", response.status);
          isProcessing = false;
          return;
        }
        
        const blob = await response.blob();
        frameCount++;
        
        // Log successful frame capture every 20 frames
        if (frameCount % 20 === 0) {
          console.log(`[XR] Frame ${frameCount}: ${blob.size} bytes received`);
        }
        
        // Create and render image on canvas
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            URL.revokeObjectURL(blobUrl);
            isProcessing = false;
            return;
          }
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            isProcessing = false;
            return;
          }
          
          // Clear to black background
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Scale image to fill canvas while maintaining aspect ratio (cover mode)
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const x = (canvas.width - drawWidth) / 2;
          const y = (canvas.height - drawHeight) / 2;
          
          // Draw the frame
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          
          // Revoke previous blob URL to free memory
          if (lastBlobUrl) {
            URL.revokeObjectURL(lastBlobUrl);
          }
          lastBlobUrl = blobUrl;
          isProcessing = false;
        };
        
        img.onerror = () => {
          console.error("Failed to load frame image");
          URL.revokeObjectURL(blobUrl);
          isProcessing = false;
        };
        
        img.src = blobUrl;
      } catch (e) {
        console.error("Frame polling error:", e.message);
        isProcessing = false;
      }
    };
    
    // Start immediate frame fetch, then poll at 250ms interval (4 fps)
    pollFrame();
    frameLoopRef.current = setInterval(pollFrame, 250);
  }

  async function connectDevice() {
    if (connecting) return;
    setConnecting(true);
    setErrorInfo(null);
    addLog("Probing XR Scanner...");
    addLog("Initializing XRCommonVeinPlus SDK...");

    // Always try init first to ensure device is ready
    const res = await api("/api/device/init", { method: "POST" });
    setConnecting(false);

    if (res.data?.success) {
      setConnected(true);
      addLog(`Connected: ${res.data.info?.img_size || ""} feat=${res.data.info?.feat_size || "?"}`);
      toast("XR Scanner connected", "success");
      setTimeout(startFrameStream, 100);
    } else {
      setConnected(false);
      const msg = res.data?.message || "Device init failed";
      const stage = res.data?.stage || "";
      const code = res.data?.code;
      addLog(`FAIL ${stage}${code !== undefined && code !== null ? ` (code ${code})` : ""}: ${msg}`);
      setErrorInfo({
        message: msg,
        stage,
        code,
        usb_devices: res.data?.usb_devices || [],
      });
      toast("XR Scanner not found", "error");
    }
  }

  async function handleCapture() {
    if (scanning) return;
    setScanning(true);
    addLog("Saving current frame...");
    const res = await api("/api/capture", {
      method: "POST",
      body: { label: saveLabel },
    });

    const savedFile = res.data?.image_saved;
    const feat = res.data?.feature_b64;

    if (savedFile) {
      setCapturedCount((c) => c + 1);
      addLog(`Image saved: img/${savedFile}`);
      toast(`Saved img/${savedFile}`, "success");
      if (feat && onCapture) onCapture(feat);
    } else {
      addLog(`Save failed: ${res.data?.message || "no frame available"}`);
      toast(res.data?.message || "No frame available from scanner.", "warning");
    }
    setScanning(false);
  }

  const progressPct = Math.min(100, (capturedCount / requiredCaptures) * 100);
  const viewerSize = compact ? 260 : 420;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {/* Feed viewer */}
      <div style={{
        position: "relative",
        width: viewerSize,
        height: viewerSize * 0.75,
        borderRadius: 14,
        overflow: "hidden",
        background: "#000",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(167,139,250,0.12)"
      }}>
        {connected ? (
          <canvas ref={canvasRef}
            width={480}
            height={360}
            style={{ width: "100%", height: "100%", display: "block", background: "#000" }} />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
            color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 12,
            padding: 20, textAlign: "center"
          }}>
            {connecting ? (
              <>
                <Spinner size={24} />
                <div style={{ color: "var(--amber)" }}>CONNECTING TO XR SCANNER</div>
              </>
            ) : errorInfo ? (
              <>
                <div style={{ fontSize: 32 }}>⚠</div>
                <div style={{ color: "var(--red)", fontSize: 13, fontWeight: 700 }}>
                  XR SCANNER NOT FOUND
                </div>
                <div style={{ color: "var(--text2)", fontSize: 11, lineHeight: 1.5, maxWidth: "85%" }}>
                  {errorInfo.message}
                </div>
                {errorInfo.usb_devices && errorInfo.usb_devices.length > 0 && (
                  <details style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                    <summary style={{ cursor: "pointer" }}>USB devices visible ({errorInfo.usb_devices.length})</summary>
                    <div style={{ marginTop: 6, lineHeight: 1.5 }}>
                      {errorInfo.usb_devices.map((d, i) => (
                        <div key={i}>VID:PID = {d.vid}:{d.pid} (class {d.class})</div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <div>INITIALIZING...</div>
            )}
          </div>
        )}

        {/* Scan line overlay */}
        {connected && (
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(45,212,191,0.06) 2px, rgba(45,212,191,0.06) 4px)",
            pointerEvents: "none",
            animation: scanning ? "pulseFast 1.2s ease infinite" : "none"
          }} />
        )}
        {scanning && (
          <div style={{
            position: "absolute", left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, var(--teal), transparent)",
            boxShadow: "0 0 12px var(--teal)",
            animation: "scanPlane 2s ease-in-out infinite",
            pointerEvents: "none"
          }} />
        )}

        {/* Corner brackets */}
        <div style={{ position: "absolute", inset: 10, pointerEvents: "none" }}>
          {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i) => {
            const stroke = `2px solid ${scanning ? 'var(--teal)' : connected ? 'var(--violet)' : 'rgba(255,255,255,0.15)'}`;
            const isTop = v === "top";
            const isLeft = h === "left";
            return (
              <div key={i} style={{
                position: "absolute", [v]: 0, [h]: 0,
                width: 24, height: 24,
                borderTop:    isTop ? stroke : "none",
                borderBottom: isTop ? "none" : stroke,
                borderLeft:   isLeft ? stroke : "none",
                borderRight:  isLeft ? "none" : stroke,
                borderRadius: 4,
                opacity: 0.7,
              }} />
            );
          })}
        </div>

        {/* Status badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(7,7,12,0.75)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, fontFamily: "var(--mono)",
          color: connected ? "var(--green)" : connecting ? "var(--amber)" : "var(--red)"
        }}>
          {connected ? "● XR LIVE" : connecting ? "○ Connecting..." : "✕ Disconnected"}
        </div>

        {/* Capture counter */}
        {requiredCaptures > 1 && connected && (
          <div style={{
            position: "absolute", bottom: 10, left: 10, right: 10,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progressPct}%`,
                background: "linear-gradient(90deg, var(--violet), var(--teal))",
                transition: "width 0.4s ease"
              }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text2)" }}>
              {capturedCount}/{requiredCaptures}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <Btn onClick={handleCapture} disabled={scanning || !connected}>
          {scanning ? <><Spinner size={16} /> Saving...</> : <>{captureLabel} ({capturedCount}/{requiredCaptures})</>}
        </Btn>
        <Btn variant="ghost" size="sm" onClick={connectDevice} disabled={connecting}>
          {connecting ? <><Spinner size={14}/> Connecting...</> : connected ? "Reconnect Device" : "Retry Device"}
        </Btn>
      </div>

      {/* Mini log */}
      {logs.length > 0 && (
        <div style={{
          width: viewerSize,
          maxHeight: 110, overflow: "auto",
          background: "rgba(0,0,0,0.3)", borderRadius: 8,
          padding: "8px 12px", fontSize: 11, fontFamily: "var(--mono)",
          color: "var(--text3)", lineHeight: 1.6, textAlign: "left"
        }}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}

// ── LoginPage ────────────────────────────────────────────────────────────────
function LoginPage({ setPage, setUser }) {
  const [username, setUsername] = useA("");
  const [password, setPassword] = useA("");
  const [loading, setLoading] = useA(false);
  const [justLoggedIn, setJustLoggedIn] = useA(false);
  const toast = useToast();

  // Auto-navigate to dashboard when login is successful
  useAE(() => {
    if (justLoggedIn) {
      setPage("dashboard");
      setJustLoggedIn(false);
    }
  }, [justLoggedIn]);

  async function submit() {
    if (!username) {
      toast("Please enter your username", "warning");
      return;
    }
    if (!password) {
      toast("Please enter your password", "warning");
      return;
    }

    setLoading(true);
    const body = { username, password };
    const res = await api("/api/login", { method: "POST", body });
    setLoading(false);
    if (res.data?.success) {
      toast("Login successful", "success");
      setUser(res.data.user);
      setJustLoggedIn(true);
    } else {
      toast(res.data?.message || "Login failed", "error");
    }
  }

  return (
    <PageShell padTop={100} maxWidth={520}>
      <div style={{ animation: "fadeInScale 0.4s ease" }}>
        <Card glow style={{ padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--violet)", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
              Secure Access
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Welcome Back</h1>
            <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>
              Sign in with your username and password.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Username">
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. admin" />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <Btn fullWidth onClick={submit} disabled={loading || !username || !password}>
              {loading ? <Spinner size={16} /> : "Sign In"}
            </Btn>
          </div>

          <Divider label="or" />
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text2)" }}>
            Don&apos;t have an account?{" "}
            <a href="#" onClick={e => { e.preventDefault(); setPage("register"); }}>Register</a>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// ── RegisterPage ───────────────────────────────────────────────────────────────
function RegisterPage({ setPage, setUser }) {
  const [name, setName] = useA("");
  const [username, setUsername] = useA("");
  const [password, setPassword] = useA("");
  const [role, setRole] = useA("user");
  const [loading, setLoading] = useA(false);
  const toast = useToast();

  async function submit() {
    if (!name || !username || password.length < 6) {
      toast("Please fill all fields (password min 6 chars)", "warning");
      return;
    }
    setLoading(true);
    const res = await api("/api/register", {
      method: "POST",
      body: { name, username, password, role, features: [] },
    });
    setLoading(false);
    if (res.data?.success) {
      toast("Registration successful! Logging you in...", "success");
      setUser(res.data.user);
      setPage("dashboard");
    } else {
      toast(res.data?.message || "Registration failed", "error");
    }
  }

  return (
    <PageShell padTop={100} maxWidth={520}>
      <div style={{ animation: "fadeInScale 0.4s ease" }}>
        <Card glow style={{ padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--violet)", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
              New Account
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Register</h1>
            <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>
              Create your account with a password.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Full Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
            </Field>
            <Field label="Username">
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. johndoe" />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
            </Field>
            <Field label="Role">
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Btn fullWidth onClick={submit} disabled={loading}>
              {loading ? <Spinner size={16} /> : "Create Account"}
            </Btn>
          </div>

          <Divider label="or" />
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text2)" }}>
            Already have an account?{" "}
            <a href="#" onClick={e => { e.preventDefault(); setPage("login"); }}>Sign in</a>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// ── AuthKioskPage ────────────────────────────────────────────────────────────
function AuthKioskPage() {
  const [status, setStatus] = useA("idle"); // idle | scanning | success | rejected
  const [feature, setFeature] = useA(null);
  const [lastUser, setLastUser] = useA(null);
  const [xrConnected, setXrConnected] = useA(false);
  const [xrLoading, setXrLoading] = useA(true);
  const toast = useToast();

  // Check XR device connection on mount
  const checkXRConnection = async () => {
    setXrLoading(true);
    const stat = await api("/api/device/status");
    if (stat.data?.connected) {
      setXrConnected(true);
      toast("XR Device Connected via SDK", "success");
    } else {
      setXrConnected(false);
    }
    setXrLoading(false);
  };

  React.useEffect(() => {
    checkXRConnection();
    // Check every 5 seconds
    const interval = setInterval(checkXRConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  async function tryAuth() {
    if (status === "scanning") return;
    setStatus("scanning");
    setFeature(null);
    setLastUser(null);

    // Capture from device
    const cap = await api("/api/capture", { method: "POST" });
    if (!cap.data?.success) {
      toast("Capture failed. Reposition palm.", "error");
      setStatus("idle");
      return;
    }
    const feat = cap.data.feature_b64;
    setFeature(feat);

    // Try matching against all users
    const usersRes = await api("/api/users");
    const users = usersRes.data?.users || [];
    let bestMatch = null;
    let bestScore = Infinity;

    for (const u of users) {
      if (!u.has_palm) continue;
      // We need full user data with features — fetch not exposed for security,
      // so instead we call a dedicated match endpoint. For now, iterate login.
      const loginRes = await api("/api/login", {
        method: "POST",
        body: { username: u.username, password: "", feature: feat },
      });
      if (loginRes.data?.success && loginRes.data.matched_biometric) {
        const score = loginRes.data.confidence;
        if (score < bestScore) {
          bestScore = score;
          bestMatch = loginRes.data.user;
        }
      }
    }

    if (bestMatch) {
      setLastUser(bestMatch);
      setStatus("success");
      toast(`Welcome, ${bestMatch.name}!`, "success");
    } else {
      setStatus("rejected");
      toast("Palm not recognized", "error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <PageShell padTop={80} maxWidth={700}>
      <div style={{ textAlign: "center", animation: "fadeInScale 0.5s ease" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Authentication Kiosk</h1>
        
        {/* XR Device Status */}
        <div style={{
          padding: "12px 16px",
          marginBottom: 20,
          borderRadius: 10,
          background: xrConnected ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
          border: `1px solid ${xrConnected ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
          fontSize: 13,
          color: xrConnected ? "var(--green)" : "var(--red)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        }}>
          <span style={{ fontSize: 16 }}>{xrConnected ? "✓" : "✕"}</span>
          {xrConnected ? "XR Device Connected via SDK" : "XR Device Not Connected"}
          {xrLoading && <Spinner size={14} />}
        </div>

        <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28 }}>
          Place your palm on the scanner to verify your identity.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <PalmVeinCamera
            requiredCaptures={1}
            captureLabel={status === "scanning" ? "Scanning..." : "Verify Palm"}
            onCapture={() => tryAuth()}
            saveLabel="kiosk_auth"
          />
        </div>

        {status === "success" && lastUser && (
          <Card style={{ maxWidth: 360, margin: "0 auto", textAlign: "center", borderColor: "rgba(52,211,153,0.3)" }}>
            <div style={{ fontSize: 36, color: "var(--green)", marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{lastUser.name}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)", textTransform: "uppercase", marginTop: 4 }}>
              {lastUser.role}
            </div>
            <div style={{ fontSize: 13, color: "var(--green)", marginTop: 10 }}>Access Granted</div>
          </Card>
        )}

        {status === "rejected" && (
          <Card style={{ maxWidth: 360, margin: "0 auto", textAlign: "center", borderColor: "rgba(248,113,113,0.3)" }}>
            <div style={{ fontSize: 36, color: "var(--red)", marginBottom: 8 }}>✕</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Access Denied</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>Palm vein pattern not recognized</div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

// ── PalmManagementPage ───────────────────────────────────────────────────────
function PalmManagementPage({ user, setPage }) {
  const [samples, setSamples] = useA([]);
  const [sessionActive, setSessionActive] = useA(false);
  const [enrollmentStatus, setEnrollmentStatus] = useA(null);
  const [loading, setLoading] = useA(false);
  const toast = useToast();
  
  if (!user) { setPage("login"); return null; }

  const startEnrollment = async () => {
    setLoading(true);
    const res = await api("/api/enroll/session/start", {
      method: "POST",
      body: { username: user.username, target_count: 10 },
    });
    setLoading(false);
    
    if (res.data?.success) {
      setSessionActive(true);
      setSamples([]);
      toast("Enrollment session started", "success");
    } else {
      toast(res.data?.message || "Failed to start enrollment", "error");
    }
  };

  const captureForEnrollment = async (feat) => {
    if (!sessionActive) return;
    
    setLoading(true);
    const res = await api("/api/enroll/session/capture", { method: "POST" });
    
    if (res.data?.success) {
      // Check feature quality
      const qualityRes = await api("/api/feature/check", {
        method: "POST",
        body: { feature: feat },
      });
      
      const quality = qualityRes.data?.quality || 75;
      const sample = {
        index: res.data.sample_index,
        quality: quality,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setSamples(prev => [...prev, sample]);
      setEnrollmentStatus(res.data);
      
      const qualityLabel = quality >= 85 ? "Excellent" : quality >= 70 ? "Good" : "Fair";
      toast(`Sample ${res.data.samples_collected}/10 · Quality: ${qualityLabel}`, "success");
    } else {
      toast(res.data?.message || "Capture failed", "error");
    }
    setLoading(false);
  };

  const finishEnrollment = async () => {
    setLoading(true);
    const res = await api("/api/enroll/session/finish", { method: "POST" });
    
    if (res.data?.success) {
      setSessionActive(false);
      setSamples([]);
      toast(`Enrollment complete: ${res.data.samples_collected} samples captured`, "success");
      setTimeout(() => setPage("dashboard"), 1500);
    } else {
      toast(res.data?.message || "Failed to finish enrollment", "error");
    }
    setLoading(false);
  };

  const cancelEnrollment = async () => {
    setLoading(true);
    await api("/api/enroll/session/cancel", { method: "POST" });
    setSessionActive(false);
    setSamples([]);
    setEnrollmentStatus(null);
    setLoading(false);
    toast("Enrollment cancelled", "info");
  };

  const progress = enrollmentStatus?.progress || 0;
  const samplesCollected = enrollmentStatus?.samples_collected || 0;
  const targetCount = enrollmentStatus?.target_count || 10;

  return (
    <PageShell>
      <div style={{ animation: "fadeInUp 0.4s ease" }}>
        <SectionHeader 
          title="Palm Vein Management" 
          sub={sessionActive ? "Capture 10 samples for enrollment" : "Re-enroll or update your biometric samples."} 
        />
        
        {!sessionActive ? (
          <Card style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>
              Start a new enrollment session to capture fresh palm vein samples. You'll need 10 quality samples for best recognition accuracy.
            </div>
            
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setPage("dashboard")}>Back</Btn>
              <Btn onClick={startEnrollment} disabled={loading}>
                {loading ? <Spinner size={16} /> : "Start Enrollment"}
              </Btn>
            </div>
          </Card>
        ) : (
          <Card style={{ maxWidth: 640, margin: "0 auto", padding: 28 }}>
            {/* Progress header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Enrollment Progress</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                    {samplesCollected} / {targetCount} samples
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--violet)" }}>
                  {Math.round(progress)}%
                </div>
              </div>

              {/* Progress bar */}
              <div style={{
                width: "100%",
                height: 8,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 4,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: progress >= 100 ? "var(--green)" : "linear-gradient(90deg, var(--violet), var(--teal))",
                  transition: "width 0.4s ease, background 0.3s ease",
                }} />
              </div>
            </div>

            {/* Camera section */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <PalmVeinCamera
                requiredCaptures={targetCount - samplesCollected}
                captureLabel="Capture Sample"
                onCapture={captureForEnrollment}
                saveLabel={`enroll_${user.username}`}
              />
            </div>

            {/* Samples list */}
            {samples.length > 0 && (
              <div style={{ marginBottom: 20, padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: "var(--text2)" }}>
                  Captured Samples
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {samples.map((s, i) => (
                    <div key={i} style={{
                      padding: "12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--violet)", marginBottom: 4 }}>
                        #{s.index + 1}
                      </div>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: s.quality >= 85 ? "var(--green)" : s.quality >= 70 ? "var(--amber)" : "var(--red)",
                        marginBottom: 4,
                      }}>
                        {s.quality.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                        {s.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality guidance */}
            {samplesCollected > 0 && (
              <div style={{
                padding: "12px 14px",
                background: "rgba(45,212,191,0.08)",
                border: "1px solid rgba(45,212,191,0.25)",
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 12,
                color: "var(--teal)",
              }}>
                💡 Tip: Aim for samples with 85%+ quality for best recognition. Rotate your palm slightly between captures for variety.
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn 
                variant="ghost" 
                onClick={cancelEnrollment} 
                disabled={loading}
              >
                Cancel
              </Btn>
              <Btn 
                onClick={finishEnrollment} 
                disabled={loading || samplesCollected < targetCount}
                style={{
                  opacity: samplesCollected < targetCount ? 0.5 : 1,
                }}
              >
                {loading ? <Spinner size={16} /> : "Complete Enrollment"}
              </Btn>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

Object.assign(window, {
  LoginPage,
  RegisterPage,
  AuthKioskPage,
  PalmManagementPage,
});
