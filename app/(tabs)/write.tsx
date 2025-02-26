import { StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { PenSquare, FolderPlus, Sparkles, ArrowLeftCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { ProjectList } from '@/components/ProjectList';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { WritingEditor } from '@/components/WritingEditor';
import { useWritingStore } from '@/stores/writing-store';
import { WritingProject, WritingGenre } from '@/types/writing';
import { useAuth } from '@/contexts/AuthContext';
import supabaseService from '@/services/supabase-service';

export default function WriteScreen() {
  // Authentication context
  const { isAuthenticated, loadUserData } = useAuth();
  
  // Writing store state
  const { 
    projects = [], // Provide a default empty array if somehow undefined
    currentProject, 
    focusMode,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    clearCurrentProject,
    updateContent,
    toggleFocusMode,
  } = useWritingStore();
  
  // Local UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjects, setShowProjects] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Load user data when the component mounts
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        setLoading(true);
        await loadUserData();
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAuthenticated]);
  
  // Show project list when there's no current project
  useEffect(() => {
    if (!currentProject) {
      setShowProjects(true);
    }
  }, [currentProject]);
  
  // Handle project creation
  const handleCreateProject = (title: string, genre: WritingGenre) => {
    createProject(title, genre);
    setShowProjects(false);
  };
  
  // Handle project selection
  const handleSelectProject = (project: WritingProject) => {
    setCurrentProject(project.id);
    setShowProjects(false);
  };
  
  // Handle project deletion with confirmation
  const handleDeleteProject = (project: WritingProject) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteProject(project.id);
          }
        }
      ]
    );
  };
  
  // Handle saving the current project
  const handleSave = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      
      // Get the projects array from the store (not the whole state)
      const currentProjects = useWritingStore.getState().projects;
      
      // Make sure we have an array to prevent nesting issues
      const projectsArray = Array.isArray(currentProjects) ? currentProjects : [];
      
      console.log('Saving explicit projects array to Supabase:', projectsArray.length);
      
      // Force a sync with backend using Supabase service directly
      const success = await supabaseService.saveWritingProjects(projectsArray);
      
      setLoading(false);
      
      if (success) {
        Alert.alert('Saved', 'Your project has been saved successfully to the cloud.');
      } else {
        Alert.alert('Warning', 'Project saved locally, but there was an issue saving to the cloud.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error during save:', error);
      Alert.alert('Error', 'There was a problem saving your project. Please try again.');
    }
  };
  
  // Handle going back to project list
  const handleBackToProjects = async () => {
    // Save current changes before navigating back
    if (currentProject) {
      try {
        // Sync with backend to ensure all latest changes are saved
        const currentProjects = useWritingStore.getState().projects;
        
        // Make sure we have an array to prevent nesting issues
        const projectsArray = Array.isArray(currentProjects) ? currentProjects : [];
        
        console.log('Saving explicit projects array to Supabase before navigation:', projectsArray.length);
        await supabaseService.saveWritingProjects(projectsArray);
      } catch (error) {
        console.error("Error saving before navigation:", error);
        // Continue with navigation even if save fails
      }
    }
    
    clearCurrentProject();
    setShowProjects(true);
  };
  
  // No longer needed - refresh functionality removed

  // Render project list screen
  if (showProjects) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Writing</Text>
          <View style={styles.headerButtons}>
            {loading && (
              <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
            )}
            <Button
              title="New Project"
              icon={<FolderPlus size={16} color={colors.surface} />}
              onPress={() => setShowCreateModal(true)}
              variant="primary"
              size="small"
            />
          </View>
        </View>
        
        {/* Ensure projects is an array before rendering */}
        {(!projects || projects.length === 0) && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No writing projects found. Create a new project to get started!
            </Text>
          </View>
        ) : (
          <ProjectList 
            projects={projects || []} 
            onSelectProject={handleSelectProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
        
        <CreateProjectModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateProject={handleCreateProject}
        />
      </SafeAreaView>
    );
  }
  
  // Render editor screen when a project is selected
  if (currentProject) {
    return (
      <SafeAreaView style={styles.container}>
        {!focusMode && (
          <View style={styles.editorHeader}>
            <Button
              icon={<ArrowLeftCircle size={16} color={colors.primary} />}
              title="Projects"
              onPress={handleBackToProjects}
              variant="outline"
              size="small"
            />
            <Text style={styles.projectTitle}>{currentProject.title}</Text>
            <Button
              icon={<Sparkles size={16} color={colors.primary} />}
              title="Ideas"
              onPress={() => router.push('/modal')}
              variant="outline"
              size="small"
            />
          </View>
        )}
        
        <WritingEditor
          project={currentProject}
          content={currentProject.content}
          onContentChange={updateContent}
          onSave={handleSave}
          focusMode={focusMode}
          onToggleFocusMode={toggleFocusMode}
        />
      </SafeAreaView>
    );
  }
  
  // Fallback if neither condition is met (should not happen)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  refreshButton: {
    marginRight: 8,
  },
  loadingIndicator: {
    marginRight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
});