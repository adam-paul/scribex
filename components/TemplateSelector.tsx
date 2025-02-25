import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { BookOpen, FileText, Feather, Radio, Mail, Mic } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WritingTemplate, WritingGenre } from '@/types/writing';
import { Card } from '@/components/Card';

// Map of genre to icon
const GENRE_ICONS: Record<WritingGenre, React.ElementType> = {
  story: BookOpen,
  essay: FileText,
  poetry: Feather,
  journalism: Radio,
  letter: Mail,
  speech: Mic,
};

interface TemplateSelectorProps {
  templates: WritingTemplate[];
  onSelectTemplate: (template: WritingTemplate) => void;
}

export function TemplateSelector({ templates, onSelectTemplate }: TemplateSelectorProps) {
  // Group templates by genre
  const templatesByGenre: Record<string, WritingTemplate[]> = {};
  
  templates.forEach(template => {
    if (!templatesByGenre[template.genre]) {
      templatesByGenre[template.genre] = [];
    }
    templatesByGenre[template.genre].push(template);
  });
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Object.entries(templatesByGenre).map(([genre, genreTemplates]) => (
        <View key={genre} style={styles.genreSection}>
          <Text style={styles.genreTitle}>
            {genre.charAt(0).toUpperCase() + genre.slice(1)}
          </Text>
          
          <View style={styles.templateGrid}>
            {genreTemplates.map(template => {
              const Icon = GENRE_ICONS[template.genre as WritingGenre];
              
              return (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => onSelectTemplate(template)}
                >
                  <Icon size={24} color={colors.primary} style={styles.templateIcon} />
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateDescription}>
                    {template.description}
                  </Text>
                  <Text style={styles.wordCount}>
                    ~{template.recommendedWordCount} words
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

interface TopicSelectorProps {
  topics: string[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
}

export function TopicSelector({ topics, selectedTopic, onSelectTopic }: TopicSelectorProps) {
  return (
    <View style={styles.topicContainer}>
      <Text style={styles.topicTitle}>Select a Topic</Text>
      
      <ScrollView contentContainerStyle={styles.topicList}>
        {topics.map((topic, index) => (
          <TouchableOpacity 
            key={index}
            style={[
              styles.topicItem,
              selectedTopic === topic && styles.selectedTopic
            ]}
            onPress={() => onSelectTopic(topic)}
          >
            <Text 
              style={[
                styles.topicText,
                selectedTopic === topic && styles.selectedTopicText
              ]}
            >
              {topic}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

interface InterestSelectorProps {
  interests: { id: string; name: string }[];
  selectedInterest: string | null;
  onSelectInterest: (interestId: string) => void;
}

export function InterestSelector({ interests, selectedInterest, onSelectInterest }: InterestSelectorProps) {
  return (
    <View style={styles.interestsContainer}>
      <Text style={styles.sectionTitle}>I'm interested in...</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.interestsList}
      >
        {interests.map(interest => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestButton, 
              selectedInterest === interest.id && styles.selectedInterest
            ]}
            onPress={() => onSelectInterest(interest.id)}
          >
            <Text 
              style={[
                styles.interestText,
                selectedInterest === interest.id && styles.selectedInterestText
              ]}
            >
              {interest.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  genreSection: {
    marginBottom: 24,
  },
  genreTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '48%', // approx half width with gap
    maxWidth: 210,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  templateIcon: {
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  wordCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  // Topic selector styles
  topicContainer: {
    marginTop: 20,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  topicList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  topicItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTopic: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topicText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedTopicText: {
    color: colors.surface,
    fontWeight: '500',
  },
  // Interest selector styles
  interestsContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  interestsList: {
    paddingVertical: 4,
    gap: 8,
  },
  interestButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  selectedInterest: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  interestText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedInterestText: {
    color: '#FFF',
    fontWeight: '500',
  },
});