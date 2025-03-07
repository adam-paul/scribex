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

  // Get the token from the URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
        validateToken(urlToken);
        
        // Set up periodic saving
        const saveInterval = setInterval(() => {
          saveContent(urlToken);
        }, 30000); // Save every 30 seconds
        
        return () => clearInterval(saveInterval);
      }
    }
  }, []);
  
  // Save content back to the session token
  const saveContent = async (tokenValue: string) => {
    if (!content || !tokenValue) return;
    
    try {
      const { data, error } = await supabaseService.getClient().rpc('update_session_project', { 
        token: tokenValue, 
        project_update: { 
          content, 
          wordCount: content.trim().split(/\s+/).filter(Boolean).length || 0,
          dateModified: new Date().toISOString() 
        } 
      });
      
      if (error) {
        console.error('Error saving content:', error);
      }
    } catch (error) {
      console.error('Exception saving content:', error);
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
      const { data, error } = await supabaseService.getClient().rpc('validate_session_token', { token: tokenValue });
      
      if (error) {
        console.error('Token validation error:', error);
        return;
      }
      
      if (data && data.valid) {
        // Set the project from the token data
        if (data.project) {
          setProject(data.project);
          setContent(data.project.content || '');
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Error validating token:', error);
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
      {/* Subtle connected indicator */}
      {isConnected && (
        <View style={styles.connectedIndicator}>
          <Text style={styles.connectedText}>
            {project?.title || 'Connected'}
          </Text>
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5ee', // Off-white / beige paper-like texture
  },
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
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});