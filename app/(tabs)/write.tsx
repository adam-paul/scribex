import { StyleSheet, View, Text, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { FolderPlus, Sparkles, ArrowLeftCircle, Edit, ExternalLink } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { ProjectList } from '@/components/ProjectList';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { WritingEditor } from '@/components/WritingEditor';
import { useWritingStore } from '@/stores/writing-store';
import { WritingGenre, WritingProject } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import supabaseService from '@/services/supabase-service';

// Web app URL - replace with your actual Vercel deployment URL
const WEB_APP_URL = 'https://scribex.vercel.app/web';

export default function WriteScreen() {
  // Authentication context
  const { isAuthenticated, loadUserData } = useAuth();
  
  // Writing store state
  const { 
    projects = [], // Provide a default empty array if somehow undefined
    currentProject, 
    activeProjectId,
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
  const [showProjects, setShowProjects] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempContent, setTempContent] = useState(''); // Store unsaved content
  
  // Data is now loaded at app root level
  // No need to load again here
  
  // Handle initial state based on the three scenarios
  useEffect(() => {
    // If we already have a current project, keep it
    if (currentProject) {
      return;
    }
    
    // If we have an active project ID, try to load it
    if (activeProjectId && !showProjects) {
      const project = projects.find(p => p.id === activeProjectId);
      if (project) {
        setCurrentProject(activeProjectId);
        return;
      }
    }
    
    // Otherwise, we'll show the editor with a blank "Just Write" project
    // We don't immediately create a project, we'll wait until there's content to save
  }, [currentProject, activeProjectId, projects, showProjects, setCurrentProject]);
  
  // Handle creating a "Just Write" project
  const handleJustWrite = () => {
    // Clear any current project
    clearCurrentProject();
    // Reset temp content
    setTempContent('');
    // Show the editor
    setShowProjects(false);
  };
  
  // Handle project creation
  const handleCreateProject = (title: string, genre: WritingGenre) => {
    const newProject = createProject(title, genre);
    
    // If we have temporary content, add it to the new project
    if (tempContent && genre === 'just-write') {
      updateContent(tempContent);
      setTempContent('');
    }
    
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
  
  // Handle saving the current project or creating a new "Just Write" project
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // If there's no current project but we have content, create a "Just Write" project
      if (!currentProject && tempContent.trim()) {
        const timestamp = new Date();
        const formattedDate = timestamp.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const newProject = createProject(`Just Write - ${formattedDate}`, 'just-write');
        updateContent(tempContent);
        setTempContent('');
      }
      
      // Get the projects array from the store (not the whole state)
      const currentProjects = useWritingStore.getState().projects;
      
      // Make sure we have an array to prevent nesting issues
      const projectsArray = Array.isArray(currentProjects) ? currentProjects : [];
      
      console.log('Saving explicit projects array to Supabase:', projectsArray.length);
      
      // Force a sync with backend using Supabase service directly
      const success = await supabaseService.saveWritingProjects(projectsArray);
      
      setLoading(false);
      
      if (success) {
        Alert.alert('Saved', 'Your writing has been saved successfully to the cloud.');
      } else {
        Alert.alert('Warning', 'Writing saved locally, but there was an issue saving to the cloud.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error during save:', error);
      Alert.alert('Error', 'There was a problem saving your writing. Please try again.');
    }
  };
  
  // Handle going back to project list
  const handleBackToProjects = async () => {
    // If we have unsaved content in the temp editor, ask if the user wants to save it
    if (!currentProject && tempContent.trim()) {
      Alert.alert(
        'Save Writing',
        'Do you want to save your writing before viewing projects?',
        [
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setTempContent('');
              setShowProjects(true);
            }
          },
          { 
            text: 'Save', 
            onPress: async () => {
              await handleSave();
              setShowProjects(true);
            }
          }
        ]
      );
      return;
    }
    
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
  
  // Handle content changes in the editor
  const handleContentChange = (content: string) => {
    if (currentProject) {
      // If we have a current project, update its content
      updateContent(content);
    } else {
      // Otherwise, store the content temporarily
      setTempContent(content);
    }
  };
  
  // Handle opening the web app
  const handleOpenWebApp = async () => {
    try {
      // Save current projects to ensure they're available on web
      const currentProjects = useWritingStore.getState().projects;
      const projectsArray = Array.isArray(currentProjects) ? currentProjects : [];
      await supabaseService.saveWritingProjects(projectsArray);
      
      // Open the web app URL
      const canOpen = await Linking.canOpenURL(WEB_APP_URL);
      if (canOpen) {
        await Linking.openURL(WEB_APP_URL);
      } else {
        Alert.alert('Error', 'Cannot open the web app. Please try again later.');
      }
    } catch (error) {
      console.error('Error opening web app:', error);
      Alert.alert('Error', 'There was a problem opening the web app. Please try again.');
    }
  };
  
  // Render project list screen
  if (showProjects) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Writing</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <Button
            title="Just Write"
            icon={<Edit size={16} color={colors.surface} />}
            onPress={handleJustWrite}
            variant="primary"
            size="medium"
            style={styles.actionButton}
          />
          <Button
            title="New Project"
            icon={<FolderPlus size={16} color={colors.surface} />}
            onPress={() => setShowCreateModal(true)}
            variant="secondary"
            size="medium"
            style={styles.actionButton}
          />
        </View>
        
        {/* Web App Link */}
        <View style={styles.webAppLinkContainer}>
          <Button
            title="Open in Web Browser"
            icon={<ExternalLink size={16} color={colors.primary} />}
            onPress={handleOpenWebApp}
            variant="outline"
            size="small"
            style={styles.webAppLink}
          />
          <Text style={styles.webAppText}>
            For a better writing experience on larger screens
          </Text>
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        )}
        
        {/* Ensure projects is an array before rendering */}
        {(!projects || projects.length === 0) && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No writing projects found. Create a new project or just start writing!
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
  
  // Render editor screen when a project is selected or in "Just Write" mode
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
          <Text style={styles.projectTitle}>
            {currentProject ? currentProject.title : "Just Write"}
          </Text>
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
        project={currentProject || { 
          id: 'temp',
          title: 'Just Write',
          content: tempContent,
          genre: 'just-write',
          wordCount: tempContent.trim().split(/\s+/).filter(Boolean).length || 0,
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          isCompleted: false
        }}
        content={currentProject ? currentProject.content : tempContent}
        onContentChange={handleContentChange}
        onSave={handleSave}
        focusMode={focusMode}
        onToggleFocusMode={toggleFocusMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  webAppLinkContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  webAppLink: {
    marginBottom: 4,
  },
  webAppText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
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