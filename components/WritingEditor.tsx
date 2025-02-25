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
import { WritingProject } from '@/types/writing';

interface WritingEditorProps {
  project: WritingProject;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

export function WritingEditor({ 
  project, 
  content, 
  onContentChange, 
  onSave,
  focusMode,
  onToggleFocusMode,
}: WritingEditorProps) {
  const [fontSize, setFontSize] = useState(16);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  
  const toolbarOpacity = new Animated.Value(1);
  
  useEffect(() => {
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
  }, [focusMode]);
  
  const fadeOutToolbar = () => {
    setShowToolbar(false);
    Animated.timing(toolbarOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const fadeInToolbar = () => {
    setShowToolbar(true);
    Animated.timing(toolbarOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View 
        style={[
          styles.toolbar, 
          { opacity: toolbarOpacity },
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
          placeholder={`Start writing your ${project.genre} here...`}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="sentences"
          autoCorrect
          keyboardType="default"
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>
      
      {!keyboardVisible && !focusMode && (
        <View style={styles.footer}>
          <Text style={styles.wordCount}>
            Words: {content.trim().split(/\s+/).filter(Boolean).length || 0}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

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
});