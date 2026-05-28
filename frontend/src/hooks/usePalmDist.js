import useAppStore from '../store/useAppStore';

function usePalmDist() {
  const palmDist = useAppStore((state) => state.palmDist);
  return palmDist;
}

export default usePalmDist;
