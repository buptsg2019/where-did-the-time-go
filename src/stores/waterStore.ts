import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface WaterState {
  waterLevel: number;
  evaporationRate: number;
  environmentState: string;
  
  // Actions
  fetchWaterState: () => Promise<void>;
  drinkWater: (amount: number) => Promise<void>;
}

export const useWaterStore = create<WaterState>((set) => ({
  waterLevel: 1.0,
  evaporationRate: 0.0001,
  environmentState: "normal",
  
  fetchWaterState: async () => {
    try {
      const state = await invoke<{ water_level: number; evaporation_rate: number; environment_state: string }>("get_water_state");
      set({
        waterLevel: state.water_level,
        evaporationRate: state.evaporation_rate,
        environmentState: state.environment_state,
      });
    } catch (error) {
      console.error("获取水位状态失败:", error);
    }
  },
  
  drinkWater: async (amount: number) => {
    try {
      const newLevel = await invoke<number>("drink_water", { amount });
      set({ waterLevel: newLevel });
    } catch (error) {
      console.error("喝水失败:", error);
    }
  },
}));
