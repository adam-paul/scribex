import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { useWritingStore } from '@/stores/writing-store';
import supabaseService from '@/services/supabase-service';
import { WebHeader } from '../../components/WebHeader';
import { WritingEditor } from '../../components/WritingEditor';
import { WebProjectList } from '../../components/WebProjectList';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { WritingProject, WritingGenre } from '@/types';
import { FolderPlus, PenSquare } from 'lucide-react-native';

export default function WebWritingPage() {
  // Authentication context
  const { isAuthenticated } = useAuth();
  
  // Writing store state
  const { 
    projects = [], 
    currentProject, 
    activeProjectId,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    clearCurrentProject,
    updateContent,
  } = useWritingStore();
  
  // Local UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjects, setShowProjects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tempContent, setTempContent] = useState('');
  const [authTimeout, setAuthTimeout] = useState(false);
  
  // Add a timeout for authentication to prevent infinite loading
  useEffect(() => {
    // Only set a timeout if we're on the web platform
    if (Platform.OS === 'web') {
      const timeoutId = setTimeout(() => {
        console.log('Authentication timeout reached, showing auth screen');
        setAuthTimeout(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, []);
  
  // Remove redundant user data loading - now handled by AuthContext
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      // Just set loading state for UI purposes
      setTimeout(() => setLoading(false), 100);
    }
  }, [isAuthenticated]);
  
  // Handle initial state based on the three scenarios
  useEffect(() => {
    // If we already have a current project, keep it
    if (currentProject) {
      setShowProjects(false);
      return;
    }
    
    // If we have an active project ID, try to load it
    if (activeProjectId && showProjects) {
      const project = projects.find(p => p.id === activeProjectId);
      if (project) {
        setCurrentProject(activeProjectId);
        setShowProjects(false);
        return;
      }
    }
    
    // Otherwise, show the project list
    setShowProjects(true);
  }, [currentProject, activeProjectId, projects, setCurrentProject]);
  
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
    setShowCreateModal(false);
  };
  
  // Handle project selection
  const handleSelectProject = (project: WritingProject) => {
    setCurrentProject(project.id);
    setShowProjects(false);
  };
  
  // Handle project deletion
  const handleDeleteProject = (project: WritingProject) => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
      deleteProject(project.id);
    }
  };
  
  // Handle saving the current project
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
      
      // Get the projects array from the store
      const currentProjects = useWritingStore.getState().projects;
      
      // Make sure we have an array to prevent nesting issues
      const projectsArray = Array.isArray(currentProjects) ? currentProjects : [];
      
      // Force a sync with backend using Supabase service directly
      const success = await supabaseService.saveWritingProjects(projectsArray);
      
      setLoading(false);
      
      if (success) {
        alert('Your writing has been saved successfully to the cloud.');
      } else {
        alert('Writing saved locally, but there was an issue saving to the cloud.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error during save:', error);
      alert('There was a problem saving your writing. Please try again.');
    }
  };
  
  // Handle going back to project list
  const handleBackToProjects = async () => {
    // If we have unsaved content in the temp editor, ask if the user wants to save it
    if (!currentProject && tempContent.trim()) {
      if (window.confirm('Do you want to save your writing before viewing projects?')) {
        await handleSave();
      } else {
        setTempContent('');
      }
      setShowProjects(true);
      return;
    }
    
    // Save current changes before navigating back
    if (currentProject) {
      try {
        // Sync with backend to ensure all latest changes are saved
        const currentProjects = useWritingStore.getState().projects;
        
        // Make sure we have an array to prevent nesting issues
        const projectsArray = Array.isArray(currentProjects) ? currentProjects : [];
        
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
  
  // If not authenticated or auth timed out, show login screen
  if (!isAuthenticated || authTimeout) {
    return (
      <SafeAreaView style={styles.container}>
        <WebHeader />
        <View style={styles.authContainer}>
          <Text style={styles.title}>ScribeX Web Writer</Text>
          <Text style={styles.subtitle}>Please sign in to access your writing projects</Text>
          <Button 
            title="Sign In" 
            onPress={() => router.push('/')}
            variant="primary"
            size="large"
            style={styles.authButton}
          />
          {authTimeout && (
            <Text style={styles.errorText}>
              Authentication timed out. Please try signing in again.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }
  
  // Render project list screen
  if (showProjects) {
    return (
      <SafeAreaView style={styles.container}>
        <WebHeader />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>My Writing Projects</Text>
            <Text style={styles.subtitle}>Continue working on existing projects or start something new</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <Button
              title="Just Write"
              icon={<PenSquare size={16} color={colors.surface} />}
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
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          )}
          
          {(!projects || projects.length === 0) && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No writing projects found. Create a new project or just start writing!
              </Text>
            </View>
          ) : (
            <WebProjectList 
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
        </View>
      </SafeAreaView>
    );
  }
  
  // Render editor screen when a project is selected or in "Just Write" mode
  return (
    <SafeAreaView style={styles.container}>
      <WebHeader showBackButton onBackPress={handleBackToProjects} />
      <View style={styles.content}>
        <View style={styles.editorHeader}>
          <Text style={styles.projectTitle}>
            {currentProject ? currentProject.title : "Just Write"}
          </Text>
        </View>
        
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
          focusMode={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  actionButton: {
    minWidth: 150,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  editorHeader: {
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authButton: {
    minWidth: 200,
    marginTop: 24,
  },
  errorText: {
    color: colors.error,
    marginTop: 16,
  },
}); 