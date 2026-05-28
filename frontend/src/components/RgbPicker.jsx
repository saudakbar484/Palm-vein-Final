import React from 'react';

function RgbPicker({ value, onChange }) {
  return (
    <div className="rgb-picker">
      <label>
        R
        <input type="number" min="0" max="255" value={value.r} onChange={(e) => onChange({ ...value, r: Number(e.target.value) })} />
      </label>
      <label>
        G
        <input type="number" min="0" max="255" value={value.g} onChange={(e) => onChange({ ...value, g: Number(e.target.value) })} />
      </label>
      <label>
        B
        <input type="number" min="0" max="255" value={value.b} onChange={(e) => onChange({ ...value, b: Number(e.target.value) })} />
      </label>
    </div>
  );
}

export default RgbPicker;
