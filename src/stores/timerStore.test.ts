import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTimerStore } from "./timerStore";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core");

describe("timerStore", () => {
  beforeEach(() => {
    useTimerStore.setState({
      currentTimer: null,
      elapsed: 0,
      loading: false,
    });
    vi.clearAllMocks();
  });

  it("初始状态应该正确", () => {
    const state = useTimerStore.getState();
    expect(state.currentTimer).toBeNull();
    expect(state.elapsed).toBe(0);
    expect(state.loading).toBe(false);
  });

  it("updateElapsed 应该更新经过时间", () => {
    useTimerStore.getState().updateElapsed(60);
    expect(useTimerStore.getState().elapsed).toBe(60);
  });

  it("reset 应该重置状态", () => {
    useTimerStore.setState({
      currentTimer: { id: 1, project_id: 1, start_time: "2024-01-01T00:00:00Z" },
      elapsed: 120,
    });
    useTimerStore.getState().reset();
    expect(useTimerStore.getState().currentTimer).toBeNull();
    expect(useTimerStore.getState().elapsed).toBe(0);
    expect(useTimerStore.getState().loading).toBe(false);
  });

  it("startTimer 应该设置加载状态并调用 invoke", async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      id: 1,
      project_id: 1,
      start_time: new Date().toISOString(),
    });

    const promise = useTimerStore.getState().startTimer(1);
    expect(useTimerStore.getState().loading).toBe(true);

    await promise;
    expect(useTimerStore.getState().loading).toBe(false);
    expect(invoke).toHaveBeenCalledWith("start_timer", { project_id: 1 });
  });

  it("startTimer 失败时应该重置加载状态", async () => {
    vi.mocked(invoke).mockRejectedValue(new Error("启动失败"));

    await useTimerStore.getState().startTimer(1);

    expect(useTimerStore.getState().loading).toBe(false);
    expect(useTimerStore.getState().currentTimer).toBeNull();
  });

  it("stopTimer 应该重置计时器状态", async () => {
    useTimerStore.setState({
      currentTimer: { id: 1, project_id: 1, start_time: "2024-01-01T00:00:00Z" },
      elapsed: 60,
    });
    vi.mocked(invoke).mockResolvedValue(undefined);

    await useTimerStore.getState().stopTimer();

    expect(useTimerStore.getState().currentTimer).toBeNull();
    expect(useTimerStore.getState().elapsed).toBe(0);
    expect(invoke).toHaveBeenCalledWith("stop_timer");
  });

  it("fetchCurrentTimer 应该获取当前计时器并计算经过时间", async () => {
    const startTime = new Date(Date.now() - 60000).toISOString(); // 1分钟前
    vi.mocked(invoke).mockResolvedValue({
      id: 1,
      project_id: 1,
      start_time: startTime,
    });

    await useTimerStore.getState().fetchCurrentTimer();

    const state = useTimerStore.getState();
    expect(state.currentTimer).not.toBeNull();
    expect(state.currentTimer?.project_id).toBe(1);
    expect(state.elapsed).toBeGreaterThanOrEqual(60);
  });

  it("fetchCurrentTimer 返回 null 时应该重置状态", async () => {
    useTimerStore.setState({
      currentTimer: { id: 1, project_id: 1, start_time: "2024-01-01T00:00:00Z" },
      elapsed: 60,
    });
    vi.mocked(invoke).mockResolvedValue(null);

    await useTimerStore.getState().fetchCurrentTimer();

    expect(useTimerStore.getState().currentTimer).toBeNull();
    expect(useTimerStore.getState().elapsed).toBe(0);
  });
});
