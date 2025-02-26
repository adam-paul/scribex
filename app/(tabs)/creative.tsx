import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, ActivityIndicator, FlatList, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain, Lightbulb, Wand, AlertCircle, RefreshCw, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getWritersBlockPrompts } from '@/services/ai-service';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function CreativeScreen() {
  const { currentTheme } = useTheme();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Prompt generation
  const [prompts, setPrompts] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('');
  const [writingText, setWritingText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  // List of genre options for dropdown
  const genreOptions = [
    'Story', 'Essay', 'Poetry', 'Journalism', 'Letter', 'Speech'
  ];
  
  // Main tools
  const tools = [
    {
      id: 'brainstorm',
      title: 'Brainstorm',
      description: 'Generate ideas for your next writing project based on your interests',
      icon: Brain,
    },
    {
      id: 'prompts',
      title: 'Writing Prompts',
      description: 'Get inspired with creative writing prompts customized for you',
      icon: Lightbulb,
    },
    {
      id: 'enhancer',
      title: 'Style Enhancer',
      description: 'Improve your writing with AI-powered style suggestions',
      icon: Wand,
    },
  ];

  // Generate prompts
  const generatePrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Provide context for more tailored prompts
      const context = {
        topic: topic.trim() || undefined,
        genre: genre.trim() || undefined,
        currentText: writingText.trim() || undefined,
      };
      
      const newPrompts = await getWritersBlockPrompts(context);
      setPrompts(newPrompts);
      
      // Provide haptic feedback for success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error generating prompts:', err);
      setError('Failed to generate prompts. Please try again.');
      
      // Provide haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Copy prompt to clipboard
  const selectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Reset form
  const resetForm = () => {
    setTopic('');
    setGenre('');
    setWritingText('');
    setPrompts([]);
    setSelectedPrompt(null);
  };

  // Close active tool
  const closeActiveTool = () => {
    setActiveToolId(null);
    resetForm();
  };

  // Render the Prompt Generator UI
  const renderPromptGenerator = () => {
    return (
      <View style={styles.toolContainer}>
        <View style={styles.toolHeader}>
          <Lightbulb size={24} color={currentTheme.primaryColor} />
          <Text style={[styles.toolTitle, { color: currentTheme.textColor }]}>Writing Prompts</Text>
          <TouchableOpacity onPress={closeActiveTool} style={styles.closeButton}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.inputLabel}>Topic (optional)</Text>
        <TextInput
          style={styles.input}
          value={topic}
          onChangeText={setTopic}
          placeholder="E.g. adventure, friendship, space"
          placeholderTextColor={colors.textSecondary}
        />
        
        <Text style={styles.inputLabel}>Genre (optional)</Text>
        <View style={styles.genreContainer}>
          {genreOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.genreOption,
                genre === option && { backgroundColor: currentTheme.primaryColor + '30' }
              ]}
              onPress={() => setGenre(option)}
            >
              <Text style={genre === option ? styles.selectedGenreText : styles.genreText}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.inputLabel}>Current Writing (optional)</Text>
        <Text style={styles.inputHint}>Paste some of your current writing to get contextual suggestions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={writingText}
          onChangeText={setWritingText}
          placeholder="Paste your writing here to get context-aware prompts..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        
        <Button
          title={loading ? "Generating..." : "Generate Prompts"}
          onPress={generatePrompts}
          disabled={loading}
          style={styles.generateButton}
        />
        
        {loading && (
          <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {prompts.length > 0 && (
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsTitle}>Generated Prompts:</Text>
            {prompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.promptItem,
                  selectedPrompt === prompt && { backgroundColor: currentTheme.primaryColor + '20' }
                ]}
                onPress={() => selectPrompt(prompt)}
              >
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
            
            <Button
              title="Regenerate"
              onPress={generatePrompts}
              variant="outline"
              icon={<RefreshCw size={20} color={colors.primary} />}
              style={styles.regenerateButton}
            />
          </View>
        )}
        
        {selectedPrompt && (
          <View style={styles.selectedPromptContainer}>
            <Text style={styles.selectedPromptTitle}>Selected Prompt:</Text>
            <Text style={styles.selectedPromptText}>{selectedPrompt}</Text>
            <Button
              title="Start Writing"
              onPress={closeActiveTool}
              style={styles.startWritingButton}
            />
          </View>
        )}
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {!activeToolId ? (
          <>
            <Text style={[styles.title, { color: currentTheme.textColor }]}>Creative Tools</Text>
            <Text style={styles.subtitle}>Unlock your creative potential</Text>

            {tools.map((tool) => (
              <Card key={tool.id} style={styles.toolCard}>
                <View style={styles.toolHeader}>
                  <tool.icon size={24} color={currentTheme.primaryColor} />
                  <Text style={[styles.toolTitle, { color: currentTheme.textColor }]}>{tool.title}</Text>
                </View>
                <Text style={styles.toolDescription}>{tool.description}</Text>
                <Button
                  title="Open Tool"
                  onPress={() => {
                    setActiveToolId(tool.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  variant="outline"
                  style={styles.toolButton}
                />
              </Card>
            ))}
          </>
        ) : activeToolId === 'prompts' ? (
          renderPromptGenerator()
        ) : (
          <View style={styles.toolContainer}>
            <View style={styles.toolHeader}>
              {(() => {
                const tool = tools.find(t => t.id === activeToolId);
                const IconComponent = tool?.icon;
                return IconComponent ? <IconComponent size={24} color={currentTheme.primaryColor} /> : null;
              })()}
              <Text style={[styles.toolTitle, { color: currentTheme.textColor }]}>
                {tools.find(t => t.id === activeToolId)?.title}
              </Text>
              <TouchableOpacity onPress={closeActiveTool} style={styles.closeButton}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.comingSoonText}>This feature is coming soon!</Text>
            <Button
              title="Go Back"
              onPress={closeActiveTool}
              variant="outline"
              style={styles.goBackButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Extra padding at the bottom for scrolling
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  toolCard: {
    marginBottom: 16,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  toolDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  toolButton: {
    alignSelf: 'flex-start',
  },
  
  // Tool container styles
  toolContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    marginTop: 8,
  },
  genreOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreText: {
    color: colors.text,
    fontSize: 14,
  },
  selectedGenreText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  generateButton: {
    marginTop: 24,
    alignSelf: 'center',
  },
  loader: {
    marginTop: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: colors.error,
    marginLeft: 8,
    flex: 1,
  },
  
  // Prompts styles
  promptsContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  promptsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  promptItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  regenerateButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  
  // Selected prompt styles
  selectedPromptContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  selectedPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  selectedPromptText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startWritingButton: {
    alignSelf: 'center',
  },
  
  // Coming soon styles
  comingSoonText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 36,
  },
  goBackButton: {
    alignSelf: 'center',
  },
});