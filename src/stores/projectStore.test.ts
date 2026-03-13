import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProjectStore } from "./projectStore";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core");

describe("projectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("初始状态应该正确", () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchProjects 应该调用 invoke 并更新状态", async () => {
    const mockProjects = [
      {
        id: 1,
        name: "测试项目",
        description: null,
        color: null,
        is_archived: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deadline: null,
        is_daily: false,
        reminder_enabled: false,
      },
    ];
    vi.mocked(invoke).mockResolvedValue(mockProjects);

    await useProjectStore.getState().fetchProjects();

    const state = useProjectStore.getState();
    expect(state.projects).toEqual(mockProjects);
    expect(state.loading).toBe(false);
    expect(invoke).toHaveBeenCalledWith("get_projects");
  });

  it("fetchProjects 错误时应该更新错误状态", async () => {
    const errorMessage = "网络错误";
    vi.mocked(invoke).mockRejectedValue(new Error(errorMessage));

    await useProjectStore.getState().fetchProjects();

    const state = useProjectStore.getState();
    expect(state.error).toBe("Error: " + errorMessage);
    expect(state.loading).toBe(false);
  });

  it("createProject 应该添加新项目到列表", async () => {
    const newProject = {
      id: 2,
      name: "新项目",
      description: null,
      color: null,
      is_archived: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    vi.mocked(invoke).mockResolvedValue(newProject);

    const result = await useProjectStore.getState().createProject("新项目");

    expect(result).toEqual(newProject);
    expect(useProjectStore.getState().projects).toContainEqual(newProject);
    expect(invoke).toHaveBeenCalledWith("create_project", {
      request: { name: "新项目", description: undefined, color: undefined },
    });
  });

  it("createProject 失败时应该返回 null", async () => {
    vi.mocked(invoke).mockRejectedValue(new Error("创建失败"));

    const result = await useProjectStore.getState().createProject("新项目");

    expect(result).toBeNull();
    expect(useProjectStore.getState().error).toBe("Error: 创建失败");
  });

  it("updateProject 应该更新项目信息", async () => {
    // 先添加一个项目
    useProjectStore.setState({
      projects: [
        {
          id: 1,
          name: "旧名称",
          description: null,
          color: null,
          is_archived: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
    });

    vi.mocked(invoke).mockResolvedValue(undefined);

    await useProjectStore.getState().updateProject(1, { name: "新名称" });

    const project = useProjectStore.getState().projects[0];
    expect(project.name).toBe("新名称");
    expect(invoke).toHaveBeenCalledWith("update_project", {
      request: { id: 1, name: "新名称" },
    });
  });

  it("deleteProject 应该从列表中移除项目", async () => {
    useProjectStore.setState({
      projects: [
        {
          id: 1,
          name: "项目1",
          description: null,
          color: null,
          is_archived: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
    });

    vi.mocked(invoke).mockResolvedValue(undefined);

    await useProjectStore.getState().deleteProject(1);

    expect(useProjectStore.getState().projects).toHaveLength(0);
    expect(invoke).toHaveBeenCalledWith("delete_project", { id: 1 });
  });

  it("archiveProject 应该从列表中移除项目", async () => {
    useProjectStore.setState({
      projects: [
        {
          id: 1,
          name: "项目1",
          description: null,
          color: null,
          is_archived: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
    });

    vi.mocked(invoke).mockResolvedValue(undefined);

    await useProjectStore.getState().archiveProject(1);

    expect(useProjectStore.getState().projects).toHaveLength(0);
    expect(invoke).toHaveBeenCalledWith("archive_project", { id: 1 });
  });
});
