import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deadline?: string | null;
  is_daily?: boolean;
  reminder_enabled?: boolean;
}

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string, color?: string) => Promise<Project | null>;
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>;
  archiveProject: (id: number) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loading: false,
  error: null,
  
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await invoke<Project[]>("get_projects");
      set({ projects, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },
  
  createProject: async (name: string, description?: string, color?: string) => {
    try {
      const project = await invoke<Project>("create_project", {
        request: { name, description, color },
      });
      set((state) => ({ projects: [...state.projects, project] }));
      return project;
    } catch (error) {
      set({ error: String(error) });
      return null;
    }
  },
  
  updateProject: async (id: number, updates: Partial<Project>) => {
    try {
      await invoke("update_project", { request: { id, ...updates } });
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  
  archiveProject: async (id: number) => {
    try {
      await invoke("archive_project", { id });
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  
  deleteProject: async (id: number) => {
    try {
      await invoke("delete_project", { id });
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));

