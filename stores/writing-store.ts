import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WritingProject, WritingGenre } from '@/types/writing';
import { createWritingStorage } from '@/services/supabase-storage';
import supabaseService from '@/services/supabase-service';

interface WritingState {
  // Project State
  projects: WritingProject[];
  currentProject: WritingProject | null;
  activeProjectId: string | null; // Track the last active project
  
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
      projects: [] as WritingProject[], // Explicitly type as array to ensure it's never undefined
      currentProject: null,
      activeProjectId: null, // Initialize as null
      focusMode: false,
      selectedGenre: null,
      
      // Project management functions
      createProject: (title, genre) => {
        const id = `project_${Date.now()}`;
        const newProject = createEmptyProject(id, title, genre);
        
        set((state) => {
          // Ensure state.projects is always an array before spreading
          const currentProjects = Array.isArray(state.projects) ? state.projects : [];
          return {
            projects: [...currentProjects, newProject],
            currentProject: newProject,
            activeProjectId: id, // Set as active project
          };
        });
        
        return newProject;
      },
      
      updateProject: (projectUpdate) => {
        const { id, ...updates } = projectUpdate;
        
        set((state) => {
          // Ensure state.projects is always an array before operating on it
          const currentProjects = Array.isArray(state.projects) ? state.projects : [];
          
          return {
            projects: currentProjects.map((project) => 
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
          };
        });
      },
      
      deleteProject: (id) => {
        set((state) => {
          // Ensure state.projects is always an array before operating on it
          const currentProjects = Array.isArray(state.projects) ? state.projects : [];
          
          return {
            projects: currentProjects.filter((project) => project.id !== id),
            // Clear current project if it's the one being deleted
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
          };
        });
      },
      
      // Editor management
      setCurrentProject: (id) => {
        // Ensure projects is always an array before find operation
        const projects = get().projects || [];
        const currentProjects = Array.isArray(projects) ? projects : [];
        
        const project = currentProjects.find((p) => p.id === id) || null;
        set({ 
          currentProject: project,
          activeProjectId: project ? id : null, // Update active project ID
        });
        return project;
      },
      
      clearCurrentProject: () => {
        // We don't clear activeProjectId here, as we want to remember the last project
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
          // Call updateProject using a try-catch to handle any potential errors
          try {
            get().updateProject({
              id: currentProject.id,
              content,
              wordCount,
            });
          } catch (error) {
            console.error('Error updating content:', error);
          }
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
          console.log('Writing store rehydrated successfully');
          // Do not automatically sync on rehydration
          // Data syncing should only happen after explicit load/save operations
          // This prevents race conditions with authentication
        }
      }
    }
  )
);