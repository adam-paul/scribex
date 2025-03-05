import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  FlatList,
} from 'react-native';
import { Trash2, Edit } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WritingProject } from '@/types/writing';

interface WebProjectListProps {
  projects: WritingProject[];
  onSelectProject: (project: WritingProject) => void;
  onDeleteProject: (project: WritingProject) => void;
}

export function WebProjectList({ 
  projects, 
  onSelectProject, 
  onDeleteProject 
}: WebProjectListProps) {
  // Sort projects by date modified (newest first)
  const sortedProjects = [...projects].sort((a, b) => {
    return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get genre display name
  const getGenreDisplay = (genre: string) => {
    switch (genre) {
      case 'just-write':
        return 'Free Writing';
      case 'essay':
        return 'Essay';
      case 'story':
        return 'Story';
      case 'poetry':
        return 'Poetry';
      case 'journalism':
        return 'Journalism';
      case 'letter':
        return 'Letter';
      case 'speech':
        return 'Speech';
      default:
        return genre.charAt(0).toUpperCase() + genre.slice(1);
    }
  };
  
  // Render each project item
  const renderProject = ({ item }: { item: WritingProject }) => {
    // Calculate excerpt (first 100 characters)
    const excerpt = item.content.length > 100 
      ? `${item.content.substring(0, 100).trim()}...` 
      : item.content;
    
    return (
      <View style={styles.projectCard}>
        <TouchableOpacity 
          style={styles.projectContent}
          onPress={() => onSelectProject(item)}
        >
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>{item.title}</Text>
            <Text style={styles.projectGenre}>{getGenreDisplay(item.genre)}</Text>
          </View>
          
          <Text style={styles.projectExcerpt} numberOfLines={2}>
            {excerpt || 'No content yet. Click to start writing.'}
          </Text>
          
          <View style={styles.projectFooter}>
            <Text style={styles.projectDate}>
              Last edited: {formatDate(item.dateModified)}
            </Text>
            <Text style={styles.projectWordCount}>
              {item.wordCount} {item.wordCount === 1 ? 'word' : 'words'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.projectActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => onSelectProject(item)}
          >
            <Edit size={16} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDeleteProject(item)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <FlatList
      data={sortedProjects}
      renderItem={renderProject}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 24,
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectContent: {
    flex: 1,
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  projectGenre: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
  },
  projectExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  projectWordCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  projectActions: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    padding: 8,
    justifyContent: 'center',
    gap: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceHighlight,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
  },
}); 