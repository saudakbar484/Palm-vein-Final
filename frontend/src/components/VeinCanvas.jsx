import React from 'react';

function VeinCanvas({ image, width = 640, height = 480 }) {
  if (!image) {
    return <div className="canvas-placeholder">Live vein preview will appear here.</div>;
  }
  return (
    <div className="vein-canvas-wrapper">
      <img className="vein-image" src={`data:image/png;base64,${image}`} alt="Vein preview" width={width} height={height} />
    </div>
  );
}

export default VeinCanvas;
