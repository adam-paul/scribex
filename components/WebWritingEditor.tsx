import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Platform,
  ScrollView,
} from 'react-native';
import { Save, Type, Plus, Minus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WritingProject } from '@/types/writing';

interface WebWritingEditorProps {
  project: WritingProject;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
}

export function WebWritingEditor({ 
  project, 
  content, 
  onContentChange, 
  onSave,
}: WebWritingEditorProps) {
  const [fontSize, setFontSize] = useState(16);
  
  // Get appropriate placeholder text based on genre
  const getPlaceholderText = () => {
    if (project.genre === 'just-write') {
      return 'Start writing anything that comes to mind...';
    }
    return `Start writing your ${project.genre} here...`;
  };
  
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };
  
  // Calculate word count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length || 0;
  
  return (
    <View style={styles.container}>
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
          style={styles.saveButton}
          onPress={onSave}
        >
          <Save size={16} color={colors.text} />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.editorContainer}>
        {Platform.OS === 'web' ? (
          <TextInput
            style={[styles.editor, { fontSize }]}
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
        ) : (
          <TextInput
            style={[styles.editor, { fontSize }]}
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
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
  wordCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    backgroundColor: colors.background,
  },
  editor: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: Platform.OS === 'web' ? 500 : 'auto',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
    }),
  },
}); 