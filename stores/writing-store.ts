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
          
          // First update the local state
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
            // Update in the projects array
            projectActions.updateProject({
              id: currentProject.id,
              content,
              wordCount,
            });
            
            // Debounce database updates - create a local debounce timer
            if (typeof window !== 'undefined') {
              // Clear previous timer if it exists
              if (window['_syncTimer']) {
                clearTimeout(window['_syncTimer']);
              }
              
              // Set a new timer to sync after 2 seconds of inactivity
              window['_syncTimer'] = setTimeout(async () => {
                // Get the latest version of the project before syncing
                const latestProject = get().projects.find(p => p.id === currentProject.id);
                if (latestProject) {
                  // Only sync if we have at least 50 words (to avoid constant syncing of empty projects)
                  if (latestProject.wordCount >= 50) {
                    try {
                      const syncSuccess = await syncActions.syncProject(latestProject);
                      if (!syncSuccess) {
                        console.log('Background sync failed, will try later');
                      }
                    } catch (e) {
                      console.error('Error in debounced sync:', e);
                    }
                  }
                }
              }, 2000);
            }
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
    
      // Add sync functionality
      const syncActions = {
        syncProject: async (project: WritingProject): Promise<boolean> => {
          try {
            // Check if user is logged in via Supabase service
            const user = supabaseService.getCurrentUser();
            if (!user) return false; // Can't sync if not logged in
            
            // Use the more efficient single project update
            return await supabaseService.saveWritingProject(project, 'writing-store.syncProject');
          } catch (e) {
            console.error('Error syncing project:', e);
            return false;
          }
        },
        
        syncAllProjects: async (): Promise<boolean> => {
          try {
            const { projects } = get();
            
            // Check if user is logged in via Supabase service
            const user = supabaseService.getCurrentUser();
            if (!user) return false; // Can't sync if not logged in
            
            return await supabaseService.saveWritingProjects(projects, 'writing-store.syncAllProjects');
          } catch (e) {
            console.error('Error syncing all projects:', e);
            return false;
          }
        },
        
        deleteAndSync: async (id: string): Promise<boolean> => {
          try {
            // Check if user is logged in
            const user = supabaseService.getCurrentUser();
            if (!user) {
              // Just do the local deletion
              projectActions.deleteProject(id);
              return false;
            }
            
            // Do the local deletion first
            projectActions.deleteProject(id);
            
            // Then sync with the server
            return await supabaseService.deleteWritingProject(id, 'writing-store.deleteAndSync');
          } catch (e) {
            console.error('Error deleting and syncing project:', e);
            return false;
          }
        }
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
        ...syncActions,
      };
    },
    {
      name: 'writing-storage',
      storage: createWritingStorage(),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Writing store rehydrated successfully');
        }
      }
    }
  )
);