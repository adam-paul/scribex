import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { BookOpen, FileText, Feather, Radio, Mail, Mic, Edit } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WritingGenre } from '@/types';

type GenreOption = {
  value: WritingGenre;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
};

const GENRES: GenreOption[] = [
  {
    value: 'just-write',
    label: 'Just Write',
    description: 'Free-form writing without constraints',
    icon: Edit,
    color: '#2196F3', // Blue
  },
  {
    value: 'story',
    label: 'Story',
    description: 'Creative fiction with characters and plot',
    icon: BookOpen,
    color: '#7C4DFF', // Purple
  },
  {
    value: 'essay',
    label: 'Essay',
    description: 'Structured argument or explanation',
    icon: FileText,
    color: '#00BCD4', // Cyan
  },
  {
    value: 'poetry',
    label: 'Poetry',
    description: 'Expressive verse with imagery',
    icon: Feather,
    color: '#FF4081', // Pink
  },
  {
    value: 'journalism',
    label: 'Journalism',
    description: 'Fact-based reporting of events',
    icon: Radio,
    color: '#FFC107', // Amber
  },
  {
    value: 'letter',
    label: 'Letter',
    description: 'Personal or formal correspondence',
    icon: Mail,
    color: '#4CAF50', // Green
  },
  {
    value: 'speech',
    label: 'Speech',
    description: 'Persuasive oratory for an audience',
    icon: Mic,
    color: '#FF5722', // Deep Orange
  },
];

interface GenreSelectorProps {
  selectedGenre: WritingGenre | null;
  onSelectGenre: (genre: WritingGenre) => void;
}

export function GenreSelector({ selectedGenre, onSelectGenre }: GenreSelectorProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {GENRES.map((genre) => (
        <TouchableOpacity
          key={genre.value}
          style={[
            styles.genreCard,
            selectedGenre === genre.value && styles.selectedGenre,
            { borderColor: genre.color },
          ]}
          onPress={() => onSelectGenre(genre.value)}
        >
          <View style={[styles.iconContainer, { backgroundColor: genre.color }]}>
            <genre.icon size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.genreLabel}>{genre.label}</Text>
          <Text style={styles.genreDescription}>{genre.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 12,
  },
  genreCard: {
    width: 140,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGenre: {
    backgroundColor: colors.surfaceHighlight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  genreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  genreDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});