import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Save, EyeOff, Eye, Type, Plus, Minus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WritingProject } from '@/types';

interface WritingEditorProps {
  project: WritingProject;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

/**
 * Combined writing editor that works on both web and mobile
 */
export function WritingEditor({ 
  project, 
  content, 
  onContentChange, 
  onSave,
  focusMode = false,
  onToggleFocusMode = () => {},
}: WritingEditorProps) {
  const [fontSize, setFontSize] = useState(16);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const isWeb = Platform.OS === 'web';
  
  // Mobile-only animation
  const toolbarOpacity = !isWeb ? new Animated.Value(1) : null;
  
  // Mobile-only keyboard handling
  useEffect(() => {
    if (isWeb) return; // Skip on web
    
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        if (focusMode) {
          fadeOutToolbar();
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        fadeInToolbar();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [focusMode, isWeb]);
  
  // Mobile-only toolbar animations
  const fadeOutToolbar = () => {
    if (!toolbarOpacity) return;
    
    setShowToolbar(false);
    Animated.timing(toolbarOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const fadeInToolbar = () => {
    if (!toolbarOpacity) return;
    
    setShowToolbar(true);
    Animated.timing(toolbarOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Shared font size controls
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };
  
  // Calculate word count 
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length || 0;
  
  // Get appropriate placeholder text based on genre
  const getPlaceholderText = () => {
    if (project.genre === 'just-write') {
      return 'Start writing anything that comes to mind...';
    }
    return `Start writing your ${project.genre} here...`;
  };

  // Web version
  if (isWeb) {
    return (
      <View style={[styles.container, styles.webContainer]}>
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
          
          <TouchableOpacity 
            style={[styles.saveButton, styles.webSaveButton]}
            onPress={onSave}
          >
            <Save size={16} color={colors.text} />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.webEditorContainer}>
          <TextInput
            style={[styles.editor, styles.webEditor, { fontSize }]}
            multiline
            value={content}
            onChangeText={onContentChange}
            placeholder={getPlaceholderText()}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="sentences"
            autoCorrect
            autoFocus={project.genre === 'just-write' && !content}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  }
  
  // Mobile version
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View 
        style={[
          styles.toolbar, 
          { opacity: toolbarOpacity ?? 1 },
          !showToolbar && styles.hidden
        ]}
      >
        <View style={styles.toolbarLeft}>
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={onToggleFocusMode}
          >
            {focusMode ? (
              <Eye size={20} color={colors.primary} />
            ) : (
              <EyeOff size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
          
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
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={onSave}
        >
          <Save size={16} color={colors.text} />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <View style={styles.editorContainer}>
        <TextInput
          style={[
            styles.editor, 
            { fontSize },
            focusMode && styles.focusModeEditor
          ]}
          multiline
          value={content}
          onChangeText={onContentChange}
          placeholder={getPlaceholderText()}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="sentences"
          autoCorrect
          keyboardType="default"
          returnKeyType="default"
          blurOnSubmit={false}
          autoFocus={project.genre === 'just-write' && !content}
        />
      </View>
      
      {!keyboardVisible && !focusMode && (
        <View style={styles.footer}>
          <Text style={styles.wordCount}>
            Words: {wordCount}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// Combined styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  hidden: {
    display: 'none',
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
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
    textAlignVertical: 'top',
  },
  focusModeEditor: {
    backgroundColor: colors.background,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  wordCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Web-specific styles
  webContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  webSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  webEditorContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  webEditor: {
    minHeight: Platform.OS === 'web' ? 500 : 'auto',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
    }),
  },
});