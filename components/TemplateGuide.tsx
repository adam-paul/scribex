import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WritingTemplate } from '@/types/writing';

interface TemplateGuideProps {
  template: WritingTemplate;
  topic?: string;
}

export function TemplateGuide({ template, topic }: TemplateGuideProps) {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{template.title}</Text>
        <Text style={styles.description}>{template.description}</Text>
        
        {topic && (
          <View style={styles.topicContainer}>
            <Text style={styles.topicLabel}>Selected Topic:</Text>
            <Text style={styles.topicText}>{topic}</Text>
          </View>
        )}
        
        <View style={styles.wordCountContainer}>
          <Text style={styles.wordCountLabel}>Recommended Length:</Text>
          <Text style={styles.wordCount}>~{template.recommendedWordCount} words</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Structure Guide</Text>
      
      {template.structure.sections.map((section, index) => {
        const isExpanded = !!expandedSections[section.title];
        
        return (
          <View key={index} style={styles.sectionItem}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.title)}
            >
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionNumber}>{index + 1}</Text>
                <Text style={styles.sectionName}>{section.title}</Text>
              </View>
              {isExpanded ? (
                <ChevronUp size={20} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            
            {isExpanded && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionDescription}>{section.description}</Text>
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderTitle}>Guidance:</Text>
                  <Text style={styles.placeholderText}>{section.placeholder}</Text>
                </View>
              </View>
            )}
          </View>
        );
      })}
      
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Writing Tips</Text>
        
        <View style={styles.tipItem}>
          <CheckCircle2 size={16} color={colors.primary} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Start with a clear outline using the sections above
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <CheckCircle2 size={16} color={colors.primary} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Draft the body sections before writing your introduction
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <CheckCircle2 size={16} color={colors.primary} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Read your work out loud to catch errors and awkward phrasing
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <CheckCircle2 size={16} color={colors.primary} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Use specific details and examples to support your points
          </Text>
        </View>
      </View>
      
      {template.exampleTopics && template.exampleTopics.length > 0 && (
        <View style={styles.exampleTopicsSection}>
          <Text style={styles.exampleTopicsTitle}>Example Topics</Text>
          {template.exampleTopics.map((exampleTopic, index) => (
            <Text key={index} style={styles.exampleTopic}>• {exampleTopic}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  topicContainer: {
    marginBottom: 8,
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  topicText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  wordCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  wordCountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  wordCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sectionItem: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surface,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: colors.surfaceHighlight,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  placeholderContainer: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  placeholderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  helpSection: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: colors.surfaceHighlight,
    padding: 16,
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  exampleTopicsSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  exampleTopicsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  exampleTopic: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
});