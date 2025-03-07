import { StyleSheet, View, Text, Alert, ActivityIndicator, Linking, Platform, Modal, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { FolderPlus, Sparkles, ArrowLeftCircle, Edit, ExternalLink, X, ArrowUp, Copy, Check } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { ProjectList } from '@/components/ProjectList';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { WritingEditor } from '@/components/WritingEditor';
import { useWritingStore } from '@/stores/writing-store';
import { WritingGenre, WritingProject } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import supabaseService from '@/services/supabase-service';

// Web app URL - root URL of your Vercel deployment
const WEB_APP_URL = 'https://scribex.vercel.app';

// Import the web writer service
import webWriterService from '@/services/web-writer-service';

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
  
  // State for pairing overlay and web indicator
  const [showPairingOverlay, setShowPairingOverlay] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [isPaired, setIsPaired] = useState(false);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [showWebIndicator, setShowWebIndicator] = useState(false);
  
  // Animation value for web indicator
  const webIndicatorOpacity = useRef(new Animated.Value(0)).current;
  
  // Web indicator animations
  const animateWebIndicator = (show: boolean) => {
    Animated.timing(webIndicatorOpacity, {
      toValue: show ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  
  // Set up swipe gesture for projects page
  const swipeGesture = Gesture.Pan()
    .onStart(() => {
      if (isPaired) {
        setShowWebIndicator(true);
        animateWebIndicator(true);
      }
    })
    .onUpdate((event) => {
      // If swipe is upward and strong enough
      if (isPaired && event.translationY < -120) {
        setShowWebIndicator(true);
        animateWebIndicator(true);
      } else {
        animateWebIndicator(false);
      }
    })
    .onEnd((event) => {
      // If gesture was a strong upward swipe
      if (isPaired && event.translationY < -150 && event.velocityY < -200) {
        // Trigger send to web
        handleSendToWeb();
      }
      
      // Hide the indicator
      animateWebIndicator(false);
      setTimeout(() => setShowWebIndicator(false), 300);
    });
  
  // Ensure we have the latest projects from the backend
  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (isAuthenticated) {
          console.log('Write tab: Loading writing projects from backend');
          const writingData = await supabaseService.getWritingProjects('write.onMount');
          if (writingData && writingData.length > 0) {
            console.log(`Loaded ${writingData.length} writing projects from backend`);
            useWritingStore.setState({ projects: writingData });
          }
        }
      } catch (error) {
        console.error('Error loading writing projects:', error);
      }
    };
    
    loadProjects();
  }, [isAuthenticated]);
  
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
  
  // This duplicate state declaration has been removed
  
  // Handle opening the web app with pairing
  const handleOpenWebApp = async () => {
    try {
      setLoading(true);
      
      // First save any current projects
      const currentProjects = useWritingStore.getState().projects;
      const projectsArray = Array.isArray(currentProjects) ? currentProjects : [];
      await supabaseService.saveWritingProjects(projectsArray);
      
      // Generate a session token for a project
      let projectId;
      
      // If we're on the project list page, select the first project or create one if needed
      if (showProjects) {
        // Select the first project if available
        if (projectsArray.length > 0) {
          projectId = projectsArray[0].id;
        } else {
          // Create a new empty "Just Write" project
          const newProject = createProject("Just Write", "just-write");
          projectId = newProject.id;
        }
      } else {
        // We're in the editor, use the current project
        projectId = currentProject?.id;
        
        // If there's no current project but we have temp content, create a "Just Write" project
        if (!projectId) {
          // Use activeProjectId if available
          if (activeProjectId) {
            projectId = activeProjectId;
          } else {
            // Create a new project if needed
            const newProject = createProject("Just Write", "just-write");
            projectId = newProject.id;
          }
        }
      }
      
      // Generate the session token
      const token = await webWriterService.generateSessionToken(projectId);
      
      if (!token) {
        Alert.alert('Error', 'Failed to generate session token. Please try again.');
        setLoading(false);
        return;
      }

      // Generate a simple 6-character code for pairing
      const code = Array(6).fill(0).map(() => 
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32))
      ).join('');
      
      // Store the code-to-token mapping in Supabase
      const { error } = await supabaseService.getClient()
        .from('pairing_codes')
        .insert({
          code,
          token,
          user_id: supabaseService.getCurrentUser()?.id,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
          paired: false
        });
      
      if (error) {
        console.error('Error storing pairing code:', error);
        Alert.alert('Error', 'Failed to create pairing code. Please try again.');
        setLoading(false);
        return;
      }
      
      // Set the pairing code and token in state
      setPairingCode(code);
      setPairingToken(token);
      
      // Show the pairing overlay
      setShowPairingOverlay(true);
      
      // Start polling for pairing status
      startPairingStatusCheck(code);
      
    } catch (error) {
      console.error('Error starting web pairing:', error);
      Alert.alert('Error', 'There was a problem setting up web pairing. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Polling function to check if the web app has been paired
  const startPairingStatusCheck = (code: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const { data, error } = await supabaseService.getClient()
          .from('pairing_codes')
          .select('paired')
          .eq('code', code)
          .single();
          
        if (error) {
          console.error('Error checking pairing status:', error);
          clearInterval(checkInterval);
          return;
        }
        
        if (data && data.paired) {
          console.log('Device paired successfully!');
          clearInterval(checkInterval);
          setIsPaired(true);
        }
      } catch (e) {
        console.error('Exception checking pairing status:', e);
      }
    }, 2000); // Check every 2 seconds
    
    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 5 * 60 * 1000);
  };
  
  // Handle sending the project to web
  const handleSendToWeb = async () => {
    try {
      setShowPairingOverlay(false);
      setIsPaired(false);
      
      Alert.alert('Success', 'Your project has been sent to the web writer!');
      
      // The web app will automatically load the project using the token
    } catch (error) {
      console.error('Error sending to web:', error);
      Alert.alert('Error', 'Failed to send project to web writer. Please try again.');
    }
  };
  
  // Handle closing the pairing overlay
  const handleClosePairingOverlay = () => {
    setShowPairingOverlay(false);
    setIsPaired(false);
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
        
        {/* Web Pairing Modal Overlay */}
        <Modal
          visible={showPairingOverlay}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClosePairingOverlay}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              
              {isPaired ? (
                /* Paired View - Show swipe up indicator */
                <View style={styles.pairedContainer}>
                  <Text style={styles.pairedTitle}>Connected to Web</Text>
                  <Text style={styles.pairedDescription}>
                    Your project is ready to be sent to the web writer.
                  </Text>
                  
                  <View style={styles.swipeContainer}>
                    <Text style={styles.swipeText}>Swipe up to send</Text>
                    <ArrowUp size={36} color={colors.primary} />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={handleSendToWeb}
                  >
                    <Text style={styles.sendButtonText}>Send to Web</Text>
                    <ExternalLink size={20} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Pairing View - Show code and instructions */
                <View style={styles.pairContainer}>
                  <Text style={styles.pairTitle}>Connect to Web Writer</Text>
                  <Text style={styles.pairDescription}>
                    Navigate to the following website on your computer:
                  </Text>
                  
                  <View style={styles.urlContainer}>
                    <Text style={styles.urlText}>{WEB_APP_URL}</Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => {
                        Linking.openURL(WEB_APP_URL);
                        Alert.alert('URL opened in browser', 'You can copy it from there.');
                      }}
                    >
                      <Copy size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.pairInstructions}>
                    Enter this pairing code:
                  </Text>
                  
                  <View style={styles.codeContainer}>
                    {pairingCode.split('').map((char, idx) => (
                      <View key={idx} style={styles.codeChar}>
                        <Text style={styles.codeText}>{char}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={styles.waitingText}>
                    Waiting for connection...
                  </Text>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>
          </View>
        </Modal>
        
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
          <GestureDetector gesture={swipeGesture}>
            <View style={{flex: 1}}>
              <ProjectList 
                projects={projects || []} 
                onSelectProject={handleSelectProject}
                onDeleteProject={handleDeleteProject}
              />
              
              {/* Web indicator that appears when swiping up */}
              {showWebIndicator && (
                <Animated.View 
                  style={[
                    styles.webIndicator,
                    { opacity: webIndicatorOpacity }
                  ]}
                >
                  <ExternalLink size={24} color={colors.primary} />
                  <Text style={styles.webIndicatorText}>
                    Swipe up to send to web
                  </Text>
                </Animated.View>
              )}
            </View>
          </GestureDetector>
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
  webIndicator: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    gap: 12,
  },
  webIndicatorText: {
    fontSize: 16,
    fontWeight: '500',
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
  // Web pairing modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minHeight: 250,
    paddingTop: 40,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  pairContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pairTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.text,
  },
  pairDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  urlText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  copyButton: {
    padding: 8,
  },
  pairInstructions: {
    fontSize: 16,
    marginBottom: 12,
    color: colors.textSecondary,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  codeChar: {
    width: 40,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    margin: 4,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.surface,
  },
  waitingText: {
    fontSize: 16,
    marginBottom: 12,
    color: colors.textSecondary,
  },
  pairedContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pairedTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pairedDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  swipeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  swipeText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});