import { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import useAppStore from '../store/useAppStore';

export default function Identities() {
  useWebSocket();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useAppStore(state => ({ connected: state.connected }));

  useEffect(() => {
    fetchIdentities();
  }, []);

  const fetchIdentities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/identities');
      if (response.ok) {
        const data = await response.json();
        setIdentities(data.identities || []);
      }
    } catch (error) {
      console.error('Failed to fetch identities:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this identity?')) return;
    
    try {
      await fetch(`/api/identities/${id}`, { method: 'DELETE' });
      fetchIdentities();
    } catch (error) {
      console.error('Failed to delete identity:', error);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease', maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ marginBottom: 10, fontSize: '2rem' }}>Registered Identities</h1>
          <p style={{ color: 'var(--text2)' }}>Manage enrolled users in the system</p>
        </div>
        <button 
          onClick={fetchIdentities}
          style={{ padding: '10px 20px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
          Loading identities...
        </div>
      ) : identities.length === 0 ? (
        <div style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>👥</div>
          <div>No identities registered yet</div>
          <div style={{ fontSize: '0.9rem', marginTop: 8 }}>Go to New Enrollment to add users</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {identities.map(identity => (
            <div key={identity.id} style={{ background: 'var(--glass-md)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24 }}>
              <h3 style={{ marginBottom: 16, color: 'var(--teal)' }}>{identity.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: 'var(--text2)', marginBottom: 4 }}>User ID</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>{identity.id}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text2)', marginBottom: 4 }}>Enrolled</div>
                  <div>{new Date(identity.enrolledAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text2)', marginBottom: 4 }}>Authentications</div>
                  <div>{identity.authentications || 0}</div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(identity.id)}
                style={{ width: '100%', padding: '10px', background: 'rgba(248,113,113,0.2)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} 
                onMouseOver={e => e.target.style.background = 'rgba(248,113,113,0.3)'} 
                onMouseOut={e => e.target.style.background = 'rgba(248,113,113,0.2)'}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
