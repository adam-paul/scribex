import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { X, ArrowRight, SendHorizonal } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { TemplateSelector, TopicSelector, InterestSelector } from '@/components/TemplateSelector';
import { TemplateGuide } from '@/components/TemplateGuide';
import { 
  getAllTemplates, getAllInterestCategories, getTopicsByInterest, 
  generateTemplate 
} from '@/services/template-service';
import { WritingTemplate } from '@/types/writing';
import { useWritingStore } from '@/stores/writing-store';

enum Step {
  ChooseTemplate = 0,
  ChooseTopic = 1,
  ViewGuide = 2,
}

export default function ModalScreen() {
  const router = useRouter();
  const { createProject } = useWritingStore();
  
  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(Step.ChooseTemplate);
  
  // Template selection state
  const [templates, setTemplates] = useState<WritingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WritingTemplate | null>(null);
  
  // Topic selection state
  const [interests, setInterests] = useState<{id: string, name: string}[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Generated project state
  const [generatedProject, setGeneratedProject] = useState<{
    template: WritingTemplate;
    topic: string;
    content: string;
  } | null>(null);

  // Load templates and interests on mount
  useEffect(() => {
    setTemplates(getAllTemplates());
    setInterests(getAllInterestCategories());
  }, []);
  
  // Update topics when interest changes
  useEffect(() => {
    if (selectedInterest) {
      setTopics(getTopicsByInterest(selectedInterest));
      setSelectedTopic(null);
    }
  }, [selectedInterest]);
  
  // Handle template selection
  const handleSelectTemplate = (template: WritingTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(Step.ChooseTopic);
  };
  
  // Handle topic selection
  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
  };
  
  // Handle continuing to guide view
  const handleContinueToGuide = () => {
    if (selectedTemplate && selectedTopic) {
      const generated = generateTemplate(selectedTemplate.id, selectedTopic);
      if (generated) {
        setGeneratedProject(generated);
        setCurrentStep(Step.ViewGuide);
      }
    }
  };
  
  // Handle creating project from template
  const handleCreateProject = () => {
    if (generatedProject) {
      // Create a new project using the template and topic
      createProject(
        `${selectedTopic} - ${selectedTemplate?.title}`,
        selectedTemplate?.genre || 'essay'
      );
      
      // Close modal and return to writing screen
      router.back();
    }
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case Step.ChooseTemplate:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose a Writing Template</Text>
            <Text style={styles.stepDescription}>
              Select a template that matches what you want to write about
            </Text>
            <TemplateSelector 
              templates={templates}
              onSelectTemplate={handleSelectTemplate}
            />
          </View>
        );
        
      case Step.ChooseTopic:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose a Topic</Text>
            <Text style={styles.stepDescription}>
              Select what you want to write about
            </Text>
            
            <InterestSelector
              interests={interests}
              selectedInterest={selectedInterest}
              onSelectInterest={setSelectedInterest}
            />
            
            {selectedInterest && (
              <TopicSelector 
                topics={topics}
                selectedTopic={selectedTopic}
                onSelectTopic={handleSelectTopic}
              />
            )}
            
            <View style={styles.footer}>
              <Button
                title="Back to Templates"
                onPress={() => setCurrentStep(Step.ChooseTemplate)}
                variant="secondary"
              />
              <Button
                title="Continue"
                icon={ArrowRight}
                iconPosition="right"
                onPress={handleContinueToGuide}
                disabled={!selectedTopic}
              />
            </View>
          </View>
        );
        
      case Step.ViewGuide:
        return (
          <View style={styles.stepContent}>
            {generatedProject && (
              <>
                <TemplateGuide 
                  template={generatedProject.template}
                  topic={generatedProject.topic}
                />
                
                <View style={styles.footer}>
                  <Button
                    title="Back to Topics"
                    onPress={() => setCurrentStep(Step.ChooseTopic)}
                    variant="secondary"
                  />
                  <Button
                    title="Create Project"
                    icon={SendHorizonal}
                    iconPosition="right"
                    onPress={handleCreateProject}
                  />
                </View>
              </>
            )}
          </View>
        );
    }
  };
  
  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <View style={styles.stepIndicators}>
        {[Step.ChooseTemplate, Step.ChooseTopic, Step.ViewGuide].map((step) => (
          <View 
            key={step} 
            style={[
              styles.stepIndicator,
              currentStep === step && styles.activeStepIndicator,
              currentStep > step && styles.completedStepIndicator,
            ]}
          />
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {renderStepIndicators()}
      {renderStepContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    padding: 8,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeStepIndicator: {
    backgroundColor: colors.primary,
    width: 24,
  },
  completedStepIndicator: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
