import React from 'react';

function DeviceStatusBadge({ connected, count, sleeping }) {
  return (
    <div className="status-badge">
      <div className="status-row">
        <span>Status</span>
        <strong>{connected ? 'Connected' : 'Disconnected'}</strong>
      </div>
      <div className="status-row">
        <span>Devices</span>
        <strong>{count || 0}</strong>
      </div>
      <div className="status-row">
        <span>Power</span>
        <strong>{sleeping ? 'Sleeping' : 'Active'}</strong>
      </div>
    </div>
  );
}

export default DeviceStatusBadge;
