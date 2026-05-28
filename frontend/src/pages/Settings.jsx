import { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';

function Settings() {
  const sdkVersion = useAppStore((state) => state.sdkVersion);
  const [status, setStatus] = useState('Ready');

  const handleReinit = async () => {
    const res = await fetch('/api/settings/reinit', { method: 'POST' });
    const data = await res.json();
    setStatus(data.success ? 'SDK reinitialized' : 'Error');
  };

  return (
    <div className="page settings-page">
      <h1>Settings</h1>
      <section className="card">
        <h2>SDK</h2>
        <div className="status-row"><span>Version</span><strong>{sdkVersion || 'Unknown'}</strong></div>
        <button className="button" onClick={handleReinit}>Reinitialize SDK</button>
        <p className="note">{status}</p>
      </section>
      <section className="card">
        <h2>UI</h2>
        <p>Theme, frame rate, and match threshold settings will display here.</p>
      </section>
    </div>
  );
}

export default Settings;
