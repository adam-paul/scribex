import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WritingProject, WritingGenre } from '@/types/writing';
import { createWritingStorage } from '@/services/supabase-storage';
import supabaseService from '@/services/supabase-service';

// Data interface - the core state shape
interface WritingData {
  projects: WritingProject[];
  currentProject: WritingProject | null;
  activeProjectId: string | null;
  focusMode: boolean;
  selectedGenre: WritingGenre | null;
}

// Action interfaces - organized by feature
interface ProjectActions {
  createProject: (title: string, genre: WritingGenre) => WritingProject;
  updateProject: (project: Partial<WritingProject> & { id: string }) => void;
  deleteProject: (id: string) => void;
}

interface EditorActions {
  setCurrentProject: (id: string) => WritingProject | null;
  clearCurrentProject: () => void;
  updateContent: (content: string) => void;
  toggleFocusMode: () => void;
}

interface GenreActions {
  setSelectedGenre: (genre: WritingGenre | null) => void;
}

// Combined state interface
interface WritingState extends WritingData, ProjectActions, EditorActions, GenreActions {}

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

// Helper function for project updates with timestamps
const withTimestamp = <T extends object>(obj: T): T & { dateModified: string } => ({
  ...obj,
  dateModified: new Date().toISOString(),
});

// Create store with better organization
export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => {
      // Create project actions object
      const projectActions: ProjectActions = {
        createProject: (title, genre) => {
          const id = `project_${Date.now()}`;
          const newProject = createEmptyProject(id, title, genre);
          
          set((state) => ({
            projects: [...state.projects, newProject],
            currentProject: newProject,
            activeProjectId: id, // Set as active project
          }));
          
          return newProject;
        },
        
        updateProject: (projectUpdate) => {
          const { id, ...updates } = projectUpdate;
          
          set((state) => ({
            projects: state.projects.map((project) => 
              project.id === id 
                ? withTimestamp({ ...project, ...updates }) 
                : project
            ),
            // Also update current project if it's the one being updated
            currentProject: state.currentProject?.id === id
              ? withTimestamp({ ...state.currentProject, ...updates })
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
      };
      
      // Create editor actions object
      const editorActions: EditorActions = {
        setCurrentProject: (id) => {
          const project = get().projects.find((p) => p.id === id) || null;
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
              ? withTimestamp({
                  ...state.currentProject,
                  content,
                  wordCount,
                })
              : null,
          }));
          
          // Also update the project in the projects array
          const { currentProject } = get();
          if (currentProject) {
            // Call updateProject directly without a redundant try/catch (handled by callers)
            projectActions.updateProject({
              id: currentProject.id,
              content,
              wordCount,
            });
          }
        },
        
        toggleFocusMode: () => {
          set((state) => ({ focusMode: !state.focusMode }));
        },
      };
      
      // Create genre actions object
      const genreActions: GenreActions = {
        setSelectedGenre: (genre) => {
          set({ selectedGenre: genre });
        },
      };
    
      // Return combined state and actions
      return {
        // Initial data state
        projects: [] as WritingProject[],
        currentProject: null,
        activeProjectId: null,
        focusMode: false,
        selectedGenre: null,
        
        // Include all action groups
        ...projectActions,
        ...editorActions,
        ...genreActions,
      };
    },
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