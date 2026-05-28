import React from 'react';

function PalmDistGauge({ distance = 0, quality = 0 }) {
  return (
    <div className="gauge-card">
      <div className="gauge-row"><span>Distance</span><strong>{distance.toFixed(1)} cm</strong></div>
      <div className="gauge-row"><span>Quality</span><strong>{quality}</strong></div>
      <div className="bar-meter"><div className="bar-fill" style={{ width: `${Math.min(100, quality)}%` }} /></div>
    </div>
  );
}

export default PalmDistGauge;
