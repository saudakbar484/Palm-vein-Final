import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

function useVeinStream() {
  const setFrame = useAppStore((state) => state.setFrame);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/device/info').then((res) => res.json()).then((data) => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [setFrame]);
}

export default useVeinStream;
