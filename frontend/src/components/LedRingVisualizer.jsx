import React from 'react';

function LedRingVisualizer({ r = 0, g = 0, b = 255 }) {
  const color = `rgb(${r}, ${g}, ${b})`;
  return (
    <div className="led-ring">
      <div className="led-ring-inner" style={{ boxShadow: `0 0 24px 6px ${color}`, background: color }} />
    </div>
  );
}

export default LedRingVisualizer;
