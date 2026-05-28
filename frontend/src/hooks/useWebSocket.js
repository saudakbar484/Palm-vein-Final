import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

// Module-level singleton so all pages share one connection
let _socket = null;

export function sendWsMessage(message) {
  if (_socket && _socket.readyState === WebSocket.OPEN) {
    _socket.send(JSON.stringify(message));
    return true;
  }
  return false;
}

function getWsUrl() {
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
}

export default function useWebSocket() {
  const setDeviceStatus = useAppStore((state) => state.setDeviceStatus);
  const setFrame = useAppStore((state) => state.setFrame);
  const setPalmDist = useAppStore((state) => state.setPalmDist);
  const setEnrollState = useAppStore((state) => state.setEnrollState);
  const setMatchResult = useAppStore((state) => state.setMatchResult);
  const setError = useAppStore((state) => state.setError);

  useEffect(() => {
    let reconnectTimer = null;
    let retry = 1000;
    let closed = false;

    const connect = () => {
      _socket = new WebSocket(getWsUrl());

      _socket.onopen = () => {
        retry = 1000;
      };

      _socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'deviceStatus': setDeviceStatus(msg); break;
            case 'frame': setFrame(msg); break;
            case 'palmDist': setPalmDist({ distance: msg.distance, quality: msg.quality }); break;
            case 'enrollState': setEnrollState(msg); break;
            case 'matchResult': setMatchResult(msg); break;
            case 'error': setError(msg.message); break;
            default: break;
          }
        } catch (err) {
          console.error('WS parse error', err);
        }
      };

      _socket.onclose = () => {
        try { setDeviceStatus({ connected: false }); } catch (_) {}
        if (!closed) {
          reconnectTimer = setTimeout(() => {
            retry = Math.min(30000, retry * 2);
            connect();
          }, retry);
        }
      };

      _socket.onerror = () => {
        try { _socket.close(); } catch (_) {}
      };
    };

    if (!_socket || _socket.readyState === WebSocket.CLOSED) {
      connect();
    }

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [setDeviceStatus, setFrame, setPalmDist, setEnrollState, setMatchResult, setError]);
}
