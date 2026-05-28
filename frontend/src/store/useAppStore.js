import { create } from 'zustand';

const useAppStore = create((set) => ({
  // Device state
  connected: false,
  count: 0,
  sleeping: false,
  sdkVersion: null,
  deviceInfo: null,
  frame: null,
  palmDist: { distance: 0, quality: 0 },
  enrollState: null,
  matchResult: null,
  templates: [],
  logs: [],
  error: null,
  // Auth state
  user: null,

  setDeviceStatus: (payload) => set((state) => ({
    connected: typeof payload.connected === 'boolean' ? payload.connected : state.connected,
    count: typeof payload.count === 'number' ? payload.count : state.count,
    sleeping: typeof payload.sleeping === 'boolean' ? payload.sleeping : state.sleeping,
    deviceInfo: payload.info || state.deviceInfo,
    sdkVersion: payload.sdkVersion || state.sdkVersion,
  })),
  setFrame: (frame) => set({ frame }),
  setPalmDist: (palmDist) => set({ palmDist }),
  setEnrollState: (enrollState) => set({ enrollState }),
  setMatchResult: (matchResult) => set({ matchResult }),
  setTemplates: (templates) => set({ templates }),
  setLogs: (logs) => set({ logs }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

export default useAppStore;
