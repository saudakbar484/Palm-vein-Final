// ── Device Controls — RGB · Volume · Diagnostics · Multi-Device ─────────────────
const { useState: useDC, useEffect: useDCE, useRef: useDCR, useCallback } = React;

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

// ── RGB LED Presets ─────────────────────────────────────────────────────────
function RGBLedController() {
  const [currentState, setCurrentState] = useDC(0);
  const [loading, setLoading] = useDC(false);
  const toast = useToast();

  const presets = [
    { name: "Off", state: 0, color: "#6b7280", rgb: [0, 0, 0] },
    { name: "Red", state: 1, color: "#ef4444", rgb: [255, 0, 0] },
    { name: "Green", state: 2, color: "#22c55e", rgb: [0, 255, 0] },
    { name: "Blue", state: 3, color: "#3b82f6", rgb: [0, 0, 255] },
    { name: "Cyan", state: 4, color: "#06b6d4", rgb: [0, 255, 255] },
    { name: "Magenta", state: 5, color: "#ec4899", rgb: [255, 0, 255] },
    { name: "Yellow", state: 6, color: "#eab308", rgb: [255, 255, 0] },
    { name: "White", state: 7, color: "#ffffff", rgb: [255, 255, 255] },
  ];

  const setRGB = async (preset) => {
    setLoading(true);
    const res = await api("/api/device/rgb/preset", {
      method: "POST",
      body: { preset: preset.name.toLowerCase() },
    });
    if (res.data?.success) {
      setCurrentState(preset.state);
      toast(`LED set to ${preset.name}`, "success");
    } else {
      toast("Failed to set LED", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: "var(--glass)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--glass-border)",
      borderRadius: 16,
      padding: "20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>RGB LED Control</h3>
        <p style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          Choose a color preset for the scanner's LED ring
        </p>
      </div>

      {/* Current state preview */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        marginBottom: 16,
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: presets[currentState].color,
          boxShadow: `0 0 16px ${presets[currentState].color}80`,
          border: "2px solid rgba(255,255,255,0.2)",
        }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Current: {presets[currentState].name}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
            State {currentState}
          </div>
        </div>
      </div>

      {/* Preset grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {presets.map((p) => (
          <button
            key={p.state}
            onClick={() => setRGB(p)}
            disabled={loading}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "12px",
              background: currentState === p.state ? `${p.color}20` : "rgba(255,255,255,0.04)",
              border: currentState === p.state ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = `${p.color}20`;
                e.target.style.boxShadow = `0 0 12px ${p.color}40`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = currentState === p.state ? `${p.color}20` : "rgba(255,255,255,0.04)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: p.color,
              boxShadow: `0 0 12px ${p.color}80`,
              border: "2px solid rgba(255,255,255,0.1)",
            }} />
            <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center" }}>{p.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Volume Control ──────────────────────────────────────────────────────────
function VolumeController() {
  const [volume, setVolume] = useDC(50);
  const [loading, setLoading] = useDC(false);
  const toast = useToast();

  const updateVolume = async (v) => {
    setVolume(v);
    setLoading(true);
    const res = await api("/api/device/volume/set", {
      method: "POST",
      body: { level: v },
    });
    if (!res.data?.success) {
      toast("Failed to set volume", "error");
    }
    setLoading(false);
  };

  const getVolumeBar = () => {
    if (volume === 0) return "🔇";
    if (volume < 30) return "🔈";
    if (volume < 70) return "🔉";
    return "🔊";
  };

  return (
    <div style={{
      background: "var(--glass)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--glass-border)",
      borderRadius: 16,
      padding: "20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Speaker Volume</h3>
        <p style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          Adjust scanner feedback audio level
        </p>
      </div>

      {/* Volume display */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 32 }}>{getVolumeBar()}</div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--violet)" }}>
            {volume}%
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
            Current volume level
          </div>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={volume}
        onChange={(e) => updateVolume(parseInt(e.target.value))}
        disabled={loading}
        style={{
          width: "100%",
          height: 8,
          borderRadius: 4,
          outline: "none",
          border: "none",
          accentColor: "var(--violet)",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      />

      {/* Quick presets */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        marginTop: 14,
      }}>
        {[
          { label: "Mute", value: 0 },
          { label: "Low", value: 25 },
          { label: "Med", value: 50 },
          { label: "High", value: 100 },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => updateVolume(p.value)}
            disabled={loading}
            style={{
              padding: "8px 12px",
              background: volume === p.value ? "var(--violet)" : "rgba(255,255,255,0.08)",
              border: "1px solid" + (volume === p.value ? " var(--violet)" : " rgba(255,255,255,0.1)"),
              color: volume === p.value ? "#fff" : "var(--text)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Device Diagnostics ──────────────────────────────────────────────────────
function DeviceDiagnostics() {
  const [deviceInfo, setDeviceInfo] = useDC(null);
  const [loading, setLoading] = useDC(true);
  const [usbDevices, setUsbDevices] = useDC([]);

  useDCE(() => {
    refreshDiagnostics();
  }, []);

  const refreshDiagnostics = async () => {
    setLoading(true);
    const res = await api("/api/device/status");
    if (res.data) {
      setDeviceInfo(res.data);
    }
    const usb = await api("/api/device/usb");
    if (usb.data?.usb_devices) {
      setUsbDevices(usb.data.usb_devices);
    }
    setLoading(false);
  };

  const statusColor = deviceInfo?.connected ? "var(--green)" : "var(--red)";
  const statusLabel = deviceInfo?.connected ? "Connected" : "Disconnected";

  return (
    <div style={{
      background: "var(--glass)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--glass-border)",
      borderRadius: 16,
      padding: "20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Device Diagnostics</h3>
          <p style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
            Real-time hardware status
          </p>
        </div>
        <button
          onClick={refreshDiagnostics}
          disabled={loading}
          style={{
            padding: "8px 14px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "var(--text)",
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Status grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
            STATUS
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: statusColor,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }} />
            {statusLabel}
          </div>
        </div>

        <div style={{
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
            DLL STATUS
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: deviceInfo?.loaded ? "var(--green)" : "var(--red)",
          }}>
            {deviceInfo?.loaded ? "✓ Loaded" : "✕ Not loaded"}
          </div>
        </div>

        <div style={{
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
            IMAGE SIZE
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)" }}>
            {deviceInfo?.img_size || "—"}
          </div>
        </div>

        <div style={{
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
            FEATURE SIZE
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)" }}>
            {deviceInfo?.feat_size ? `${deviceInfo.feat_size} bytes` : "—"}
          </div>
        </div>
      </div>

      {/* USB Devices */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--text2)" }}>
          USB Devices ({usbDevices.length})
        </div>
        {usbDevices.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
          }}>
            {usbDevices.map((dev, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "var(--mono)",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ color: "var(--teal)", fontWeight: 600 }}>{dev.vid}:{dev.pid}</div>
                <div style={{ color: "var(--text3)", fontSize: 10 }}>Class {dev.class}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>
            No USB devices detected
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feature Quality Validator ─────────────────────────────────────────────────
function FeatureValidator() {
  const [featureB64, setFeatureB64] = useDC("");
  const [validationResult, setValidationResult] = useDC(null);
  const [loading, setLoading] = useDC(false);
  const toast = useToast();

  const validateFeature = async () => {
    if (!featureB64.trim()) {
      toast("Please paste a feature (base64)", "warning");
      return;
    }

    setLoading(true);
    const res = await api("/api/feature/check", {
      method: "POST",
      body: { feature: featureB64.trim() },
    });

    if (res.data?.success) {
      setValidationResult(res.data);
      const status = res.data.valid ? "✓ Valid" : "✕ Invalid";
      toast(`${status} · Quality: ${res.data.quality.toFixed(1)}%`, res.data.valid ? "success" : "warning");
    } else {
      toast(res.data?.message || "Validation failed", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: "var(--glass)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--glass-border)",
      borderRadius: 16,
      padding: "20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Feature Quality Validator</h3>
        <p style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          Check biometric feature template validity and quality
        </p>
      </div>

      <textarea
        value={featureB64}
        onChange={(e) => setFeatureB64(e.target.value)}
        placeholder="Paste base64-encoded feature here..."
        style={{
          width: "100%",
          height: 100,
          padding: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          color: "var(--text)",
          fontFamily: "var(--mono)",
          fontSize: 11,
          lineHeight: 1.5,
          resize: "vertical",
          marginBottom: 12,
        }}
      />

      <button
        onClick={validateFeature}
        disabled={loading || !featureB64.trim()}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "var(--violet)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          cursor: loading || !featureB64.trim() ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: loading || !featureB64.trim() ? 0.5 : 1,
        }}
      >
        {loading ? "Validating..." : "Validate Feature"}
      </button>

      {validationResult && (
        <div style={{
          marginTop: 14,
          padding: "12px",
          background: validationResult.valid ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
          border: `1px solid ${validationResult.valid ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`,
          borderRadius: 10,
        }}>
          <div style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 24,
              color: validationResult.valid ? "var(--green)" : "var(--red)",
            }}>
              {validationResult.valid ? "✓" : "✕"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {validationResult.valid ? "Feature is valid" : "Feature is invalid"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                Quality: {validationResult.quality.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Device Controls Page ───────────────────────────────────────────────
function DeviceControlsPage({ user, setPage }) {
  return (
    <PageShell>
      {/* Header */}
      <div style={{
        marginBottom: 32,
        animation: "fadeInUp 0.4s ease",
      }}>
        <div style={{
          fontSize: 11,
          color: "var(--text3)",
          fontFamily: "var(--mono)",
          letterSpacing: 2,
          marginBottom: 8,
          textTransform: "uppercase",
        }}>
          Device Controls
        </div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: -1,
          marginBottom: 8,
        }}>
          Hardware Configuration
        </h1>
        <p style={{
          fontSize: 14,
          color: "var(--text2)",
          maxWidth: 600,
        }}>
          Configure LED, volume, and monitor real-time device diagnostics. All SDK features integrated and controlled.
        </p>
      </div>

      {/* Controls Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: 20,
        marginBottom: 28,
      }}>
        <RGBLedController />
        <VolumeController />
        <DeviceDiagnostics />
        <FeatureValidator />
      </div>

      {/* Quick Links */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
        marginTop: 28,
      }}>
        {[
          { label: "Back to Dashboard", action: () => setPage("dashboard") },
          { label: "Enrollment Wizard", action: () => setPage("palm-mgmt") },
          { label: "Auth Kiosk", action: () => setPage("kiosk") },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            style={{
              padding: "12px 16px",
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 10,
              color: "var(--violet)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(167,139,250,0.2)";
              e.target.style.boxShadow = "0 0 12px rgba(167,139,250,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(167,139,250,0.1)";
              e.target.style.boxShadow = "none";
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </PageShell>
  );
}
