import { useState } from 'react';
import useAppStore from '../store/useAppStore';
import VeinCanvas from '../components/VeinCanvas';

function LivePreview() {
  const { frame, palmDist, connected, sleeping } = useAppStore((state) => state);
  const [previewRunning, setPreviewRunning] = useState(true);

  const togglePreview = () => {
    fetch(`/api/device/${previewRunning ? 'close' : 'open'}`, { method: 'POST' })
      .then(() => setPreviewRunning(!previewRunning))
      .catch(() => null);
  };

  return (
    <div className="page live-preview-page">
      <div className="header-row">
        <h1>Live Preview</h1>
        <button className="button" onClick={togglePreview}>
          {previewRunning ? 'Stop Preview' : 'Start Preview'}
        </button>
      </div>
      <div className="card full-card">
        <VeinCanvas image={frame?.image} />
        <div className="preview-details">
          <div><strong>Connected:</strong> {connected ? 'Yes' : 'No'}</div>
          <div><strong>Sleeping:</strong> {sleeping ? 'Yes' : 'No'}</div>
          <div><strong>Distance:</strong> {palmDist.distance?.toFixed(1)} cm</div>
          <div><strong>Quality:</strong> {palmDist.quality}</div>
        </div>
      </div>
    </div>
  );
}

export default LivePreview;
