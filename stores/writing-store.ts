import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WritingProject, WritingGenre } from '@/types/writing';
import { createWritingStorage } from '@/services/supabase-storage';
import supabaseService from '@/services/supabase-service';

interface WritingState {
  // Project State
  projects: WritingProject[];
  currentProject: WritingProject | null;
  
  // Focus Mode State
  focusMode: boolean;
  
  // Genre State
  selectedGenre: WritingGenre | null;
  
  // Project Management
  createProject: (title: string, genre: WritingGenre) => WritingProject;
  updateProject: (project: Partial<WritingProject> & { id: string }) => void;
  deleteProject: (id: string) => void;
  
  // Editor Management
  setCurrentProject: (id: string) => WritingProject | null;
  clearCurrentProject: () => void;
  updateContent: (content: string) => void;
  toggleFocusMode: () => void;
  
  // Genre Management
  setSelectedGenre: (genre: WritingGenre | null) => void;
}

// Initial empty writing project template
const createEmptyProject = (id: string, title: string, genre: WritingGenre): WritingProject => ({
  id,
  title,
  content: '',
  genre,
  wordCount: 0,
  dateCreated: new Date().toISOString(),
  dateModified: new Date().toISOString(),
  completed: false,
});

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProject: null,
      focusMode: false,
      selectedGenre: null,
      
      // Project management functions
      createProject: (title, genre) => {
        const id = `project_${Date.now()}`;
        const newProject = createEmptyProject(id, title, genre);
        
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject,
        }));
        
        return newProject;
      },
      
      updateProject: (projectUpdate) => {
        const { id, ...updates } = projectUpdate;
        
        set((state) => ({
          projects: state.projects.map((project) => 
            project.id === id 
              ? { 
                  ...project, 
                  ...updates,
                  dateModified: new Date().toISOString(),
                } 
              : project
          ),
          // Also update current project if it's the one being updated
          currentProject: state.currentProject?.id === id
            ? { ...state.currentProject, ...updates, dateModified: new Date().toISOString() }
            : state.currentProject,
        }));
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          // Clear current project if it's the one being deleted
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
      },
      
      // Editor management
      setCurrentProject: (id) => {
        const project = get().projects.find((p) => p.id === id) || null;
        set({ currentProject: project });
        return project;
      },
      
      clearCurrentProject: () => {
        set({ currentProject: null });
      },
      
      updateContent: (content) => {
        if (!get().currentProject) return;
        
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        
        set((state) => ({
          currentProject: state.currentProject 
            ? {
                ...state.currentProject,
                content,
                wordCount,
                dateModified: new Date().toISOString(),
              }
            : null,
        }));
        
        // Also update the project in the projects array
        const { currentProject } = get();
        if (currentProject) {
          get().updateProject({
            id: currentProject.id,
            content,
            wordCount,
          });
        }
      },
      
      toggleFocusMode: () => {
        set((state) => ({ focusMode: !state.focusMode }));
      },
      
      // Genre management
      setSelectedGenre: (genre) => {
        set({ selectedGenre: genre });
      },
    }),
    {
      name: 'writing-storage',
      storage: createWritingStorage(),
      // Add listener to sync with Supabase when changes occur
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Sync with Supabase when the store is hydrated
          const user = supabaseService.getCurrentUser();
          if (user && state.projects) {
            supabaseService.saveWritingProjects(state.projects)
              .catch(err => console.error('Failed to sync writing projects:', err));
          }
        }
      }
    }
  )
);