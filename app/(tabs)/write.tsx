import { StyleSheet, View, Text, Alert } from 'react-native';
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

export default function WriteScreen() {
  // Writing store state
  const { 
    projects, 
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
  const handleSave = () => {
    if (!currentProject) return;
    
    // Project is saved automatically when content changes
    // This function is for explicit save button presses
    Alert.alert('Saved', 'Your project has been saved successfully.');
  };
  
  // Handle going back to project list
  const handleBackToProjects = () => {
    clearCurrentProject();
    setShowProjects(true);
  };
  
  // Render project list screen
  if (showProjects) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Writing</Text>
          <Button
            title="New Project"
            icon={FolderPlus}
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            size="small"
          />
        </View>
        
        <ProjectList 
          projects={projects} 
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
        />
        
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
              icon={ArrowLeftCircle}
              title="Projects"
              onPress={handleBackToProjects}
              variant="outline"
              size="small"
            />
            <Text style={styles.projectTitle}>{currentProject.title}</Text>
            <Button
              icon={Sparkles}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
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