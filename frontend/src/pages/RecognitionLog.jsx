import { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';

export default function RecognitionLog() {
  useWebSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recognition/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
    setLoading(false);
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.matched === (filter === 'matched'));

  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease', maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>Recognition Log</h1>
          <p style={{ color: 'var(--text2)' }}>View authentication history and scan results</p>
        </div>
        <button 
          onClick={fetchLogs}
          style={{ padding: '10px 20px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'All Events', value: 'all' },
          { label: 'Matched', value: 'matched' },
          { label: 'Failed', value: 'failed' }
        ].map(f => (
          <button 
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{ padding: '8px 16px', background: filter === f.value ? 'var(--violet)' : 'transparent', color: filter === f.value ? '#fff' : 'var(--text2)', border: `1px solid ${filter === f.value ? 'var(--violet)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
          Loading logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📋</div>
          <div>No recognition events found</div>
        </div>
      ) : (
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: '0.9rem' }}>Timestamp</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: '0.9rem' }}>User</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: '0.9rem' }}>Result</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: '0.9rem' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>
                    {log.userName || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: log.matched ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)', color: log.matched ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {log.matched ? '✓ Matched' : '✗ Failed'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: 'var(--text2)' }}>
                    {(log.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: 'var(--text2)' }}>
        <div style={{ marginBottom: 8 }}>📊 Total Events: <strong>{logs.length}</strong></div>
        <div style={{ marginBottom: 8 }}>✓ Successful: <strong>{logs.filter(l => l.matched).length}</strong></div>
        <div>✗ Failed: <strong>{logs.filter(l => !l.matched).length}</strong></div>
      </div>
    </div>
  );
}
