import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { BookOpen, FileText, Feather, Radio, Mail, Mic, Clock, Calendar, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WritingProject, WritingGenre } from '@/types/writing';

// Map of genre to icon
const GENRE_ICONS: Record<WritingGenre, React.ElementType> = {
  story: BookOpen,
  essay: FileText,
  poetry: Feather,
  journalism: Radio,
  letter: Mail,
  speech: Mic,
};

// Map of genre to color
const GENRE_COLORS: Record<WritingGenre, string> = {
  story: '#7C4DFF',
  essay: '#00BCD4',
  poetry: '#FF4081',
  journalism: '#FFC107',
  letter: '#4CAF50',
  speech: '#FF5722',
};

// Function to format date in a readable way
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface ProjectListProps {
  projects: WritingProject[];
  onSelectProject: (project: WritingProject) => void;
  onDeleteProject?: (project: WritingProject) => void;
}

export function ProjectList({ projects, onSelectProject, onDeleteProject }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No projects yet</Text>
        <Text style={styles.emptySubtext}>Create a new project to get started</Text>
      </View>
    );
  }

  const renderProject = ({ item }: { item: WritingProject }) => {
    const Icon = GENRE_ICONS[item.genre];
    const color = GENRE_COLORS[item.genre];

    return (
      <TouchableOpacity 
        style={styles.projectCard}
        onPress={() => onSelectProject(item)}
      >
        <View style={styles.projectHeader}>
          <View style={[styles.genreIcon, { backgroundColor: color }]}>
            <Icon size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.projectTitle}>{item.title}</Text>
        </View>

        <View style={styles.projectDetails}>
          <View style={styles.detailItem}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{formatDate(item.dateModified)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{item.wordCount} words</Text>
          </View>
        </View>

        <Text 
          style={styles.projectPreview}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.content || 'No content yet...'}
        </Text>

        {onDeleteProject && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDeleteProject(item)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={projects}
      renderItem={renderProject}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  projectCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  genreIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  projectDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  projectPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});