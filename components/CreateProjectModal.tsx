import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { GenreSelector } from '@/components/GenreSelector';
import { WritingGenre } from '@/types/writing';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: (title: string, genre: WritingGenre) => void;
}

export function CreateProjectModal({ visible, onClose, onCreateProject }: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<WritingGenre | null>(null);
  
  const handleCreate = () => {
    if (title.trim() && selectedGenre) {
      onCreateProject(title.trim(), selectedGenre);
      // Reset form
      setTitle('');
      setSelectedGenre(null);
      onClose();
    }
  };
  
  const isFormValid = title.trim().length > 0 && selectedGenre !== null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Project</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Project Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title for your project"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Genre</Text>
            <GenreSelector
              selectedGenre={selectedGenre}
              onSelectGenre={setSelectedGenre}
            />
          </View>
          
          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.footerButton}
            />
            <Button
              title="Create Project"
              onPress={handleCreate}
              disabled={!isFormValid}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  footerButton: {
    minWidth: 100,
  },
});