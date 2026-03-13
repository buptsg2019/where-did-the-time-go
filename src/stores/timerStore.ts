import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface TimerState {
  currentTimer: {
    id: number;
    project_id: number;
    start_time: string;
  } | null;
  elapsed: number; // 秒
  loading: boolean;
  
  // Actions
  startTimer: (projectId: number) => Promise<void>;
  stopTimer: () => Promise<void>;
  fetchCurrentTimer: () => Promise<void>;
  updateElapsed: (seconds: number) => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  currentTimer: null,
  elapsed: 0,
  loading: false,
  
  startTimer: async (projectId: number) => {
    set({ loading: true });
    try {
      await invoke("start_timer", { project_id: projectId });
      const state = get();
      await state.fetchCurrentTimer();
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },
  
  stopTimer: async () => {
    set({ loading: true });
    try {
      await invoke("stop_timer");
      set({ currentTimer: null, elapsed: 0, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },
  
  fetchCurrentTimer: async () => {
    try {
      const timer = await invoke<{ id: number; project_id: number; start_time: string } | null>(
        "get_current_timer"
      );
      if (timer) {
        const elapsed = Math.floor((Date.now() - new Date(timer.start_time).getTime()) / 1000);
        set({ currentTimer: timer, elapsed });
      } else {
        set({ currentTimer: null, elapsed: 0 });
      }
    } catch (error) {
      // Ignore errors
    }
  },
  
  updateElapsed: (seconds: number) => {
    set({ elapsed: seconds });
  },
  
  reset: () => {
    set({ currentTimer: null, elapsed: 0, loading: false });
  },
}));

