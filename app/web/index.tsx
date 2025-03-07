import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { Save, Type, Plus, Minus } from 'lucide-react-native';
import supabaseService from '@/services/supabase-service';
import { WritingProject } from '@/types';

export default function WebWriterPage() {
  // State for the writing content and project
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [project, setProject] = useState<WritingProject | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Pairing state
  const [showPairingInput, setShowPairingInput] = useState(true);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Get the token from the URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
        console.log('[WEB] Token from URL:', urlToken);
        validateToken(urlToken);
        setShowPairingInput(false);
        
        // Set up periodic saving
        const saveInterval = setInterval(() => {
          saveContent(urlToken);
        }, 30000); // Save every 30 seconds
        
        return () => clearInterval(saveInterval);
      }
    }
  }, []);
  
  // Handle pairing code submission
  const handleSubmitPairingCode = async () => {
    if (!pairingCode || pairingCode.length < 6) {
      setPairingError('Please enter a valid 6-character code');
      return;
    }
    
    try {
      setPairingError(null);
      console.log('[WEB] Validating pairing code:', pairingCode);
      
      // Add logging for API key
      console.log('[WEB] Supabase URL:', supabaseService.getClient().supabaseUrl ? 'Defined' : 'Undefined');
      console.log('[WEB] API Key first 5 chars:', 
        supabaseService.getClient().supabaseKey ? 
        supabaseService.getClient().supabaseKey.substring(0, 5) + '...' : 
        'Undefined');
      
      // Call the RPC function to validate the pairing code
      console.log('[WEB] Calling validate_pairing_code RPC function');
      const { data, error } = await supabaseService.getClient()
        .rpc('validate_pairing_code', { code_to_validate: pairingCode });
      
      console.log('[WEB] RPC response:', data || 'No data', error || 'No error');
        
      if (error) {
        console.error('[WEB] Error validating pairing code:', error);
        setPairingError('Failed to validate code. Please try again.');
        return;
      }
      
      if (data && data.valid && data.token) {
        console.log('[WEB] Pairing successful, token:', data.token);
        setToken(data.token);
        
        // Check if token exists directly in the database
        console.log('[WEB] Verifying token directly in database');
        const { data: tokenData, error: tokenError } = await supabaseService.getClient()
          .from('web_session_tokens')
          .select('id, project_id, created_at')
          .eq('token', data.token)
          .single();
        
        console.log('[WEB] Direct token verification:', tokenData || 'Not found', tokenError || 'No error');
        
        validateToken(data.token);
        setShowPairingInput(false);
        
        // Set up periodic saving
        const saveInterval = setInterval(() => {
          saveContent(data.token);
        }, 30000);
        
        // Update browser URL with token for refreshing
        if (typeof window !== 'undefined' && window.history) {
          const newUrl = window.location.pathname + '?token=' + data.token;
          window.history.replaceState({}, '', newUrl);
        }
        
        return () => clearInterval(saveInterval);
      } else {
        setPairingError('Invalid or expired pairing code. Please try again.');
      }
    } catch (error) {
      console.error('Exception in pairing code validation:', error);
      setPairingError('An error occurred. Please try again.');
    }
  };
  
  // Save content back to the session token
  const saveContent = async (tokenValue: string) => {
    if (!content || !tokenValue) return;
    
    try {
      console.log('[WEB] Saving content for token:', tokenValue);
      
      const updateData = { 
        content, 
        wordCount: content.trim().split(/\s+/).filter(Boolean).length || 0,
        dateModified: new Date().toISOString() 
      };
      
      console.log('[WEB] Update data:', updateData);
      
      // Try direct update first
      console.log('[WEB] Querying web_session_tokens table directly');
      const { data: directData, error: directError } = await supabaseService.getClient()
        .from('web_session_tokens')
        .select('id, project_id')
        .eq('token', tokenValue)
        .single();
        
      console.log('[WEB] Direct query result:', directData || 'Not found', directError || 'No error');
      
      // Now call the RPC function
      console.log('[WEB] Calling update_session_project RPC function');
      const { data, error } = await supabaseService.getClient().rpc('update_session_project', { 
        p_token: tokenValue, 
        project_update: updateData
      });
      
      console.log('[WEB] RPC result:', data || 'No data', error || 'No error');
      
      if (error) {
        console.error('[WEB] Error saving content:', error);
        
        // Try debugging by checking if the token still exists
        const { data: verifyData, error: verifyError } = await supabaseService.getClient()
          .from('web_session_tokens')
          .select('id')
          .eq('token', tokenValue)
          .single();
          
        console.log('[WEB] Token verification after save error:', 
          verifyData ? 'Token still exists' : 'Token not found', 
          verifyError || 'No query error');
      }
    } catch (error) {
      console.error('[WEB] Exception saving content:', error);
    }
  };

  // Handle manual save
  const handleSave = async () => {
    if (token) {
      await saveContent(token);
    }
  };

  // Validate the token and load project if valid
  const validateToken = async (tokenValue: string) => {
    try {
      console.log('[WEB] Validating session token:', tokenValue);
      
      // Try a direct query to check if token exists
      console.log('[WEB] Directly querying web_session_tokens table');
      const { data: directData, error: directError } = await supabaseService.getClient()
        .from('web_session_tokens')
        .select('id, project_id, created_at')
        .eq('token', tokenValue)
        .single();
        
      console.log('[WEB] Direct token query result:', directData || 'Not found', directError || 'No error');
      
      // Now call the RPC function
      console.log('[WEB] Calling validate_session_token RPC function');
      const { data, error } = await supabaseService.getClient().rpc('validate_session_token', { p_token: tokenValue });
      
      console.log('[WEB] RPC result:', data || 'No data', error || 'No error');
      
      if (error) {
        console.error('[WEB] Token validation error:', error);
        
        // Try debugging the function by getting role info
        const { data: roleData } = await supabaseService.getClient().auth.getUser();
        console.log('[WEB] Current auth state:', roleData ? 'Authenticated' : 'Not authenticated', 
          roleData?.user ? `User: ${roleData.user.id}` : '');
        
        return;
      }
      
      if (data && data.valid) {
        console.log('[WEB] Token is valid, loading project data');
        // Set the project from the token data
        if (data.project) {
          setProject(data.project);
          setContent(data.project.content || '');
          setIsConnected(true);
          console.log('[WEB] Project loaded successfully:', data.project.id, data.project.title);
        } else {
          console.error('[WEB] No project data in valid token response');
        }
      } else {
        console.error('[WEB] Token is invalid');
      }
    } catch (error) {
      console.error('[WEB] Error validating token:', error);
    }
  };

  // Calculate word count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length || 0;

  // Font size controls
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  return (
    <View style={styles.container}>
      {showPairingInput ? (
        // Pairing Input Screen
        <View style={styles.pairingContainer}>
          <Text style={styles.pairingTitle}>Connect to ScribeX</Text>
          <Text style={styles.pairingDescription}>
            Enter the 6-character pairing code from your mobile app
          </Text>

          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              value={pairingCode}
              onChangeText={(text) => setPairingCode(text.toUpperCase())}
              placeholder="Enter code"
              placeholderTextColor={colors.textMuted}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
            
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmitPairingCode}
            >
              <Text style={styles.submitButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
          
          {pairingError && (
            <Text style={styles.errorText}>{pairingError}</Text>
          )}
          
          <Text style={styles.helpText}>
            Open ScribeX mobile app and tap "Open in Web Browser" to get your pairing code.
          </Text>
        </View>
      ) : (
        // Editor Screen
        <>
          {/* Editor toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.toolbarLeft}>
              <View style={styles.fontSizeControls}>
                <TouchableOpacity 
                  style={styles.toolbarButton}
                  onPress={decreaseFontSize}
                >
                  <Minus size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <View style={styles.fontSizeDisplay}>
                  <Type size={14} color={colors.textSecondary} />
                  <Text style={styles.fontSizeText}>{fontSize}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.toolbarButton}
                  onPress={increaseFontSize}
                >
                  <Plus size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.wordCount}>
                Words: {wordCount}
              </Text>
            </View>

            {/* Project title in the center */}
            {isConnected && project && (
              <View style={styles.projectTitleContainer}>
                <Text style={styles.projectTitle} numberOfLines={1} ellipsizeMode="tail">
                  {project?.title || 'Untitled Project'}
                </Text>
              </View>
            )}

            {/* Save button on the right */}
            {token && (
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Save size={16} color={colors.text} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Editor area */}
          <View style={styles.editorContainer}>
            <TextInput
              style={[styles.editor, { fontSize }]}
              multiline
              value={content}
              onChangeText={setContent}
              placeholder="Start writing..."
              placeholderTextColor={colors.textMuted}
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect
              autoFocus
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5ee', // Off-white / beige paper-like texture
  },
  // Pairing screen styles
  pairingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  pairingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
    textAlign: 'center',
  },
  pairingDescription: {
    fontSize: 18,
    marginBottom: 48,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  codeInput: {
    flex: 1,
    fontSize: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginRight: 16,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 24,
    fontSize: 16,
  },
  helpText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
    maxWidth: 400,
  },
  // Editor screen styles
  connectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    zIndex: 10,
  },
  connectedText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  projectTitleContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  toolbarButton: {
    padding: 8,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fontSizeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  fontSizeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  editor: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      fontFamily: 'Georgia, serif',
      minHeight: 500,
    }),
  },
  wordCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});
