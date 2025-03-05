import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, Move } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Choice, ExerciseSet, ExerciseSetResults } from '@/types/exercises';
import { useProgressStore } from '@/stores/progress-store';
import { generateExerciseSet } from '@/services/ai-service';
import { LEVELS } from '@/constants/levels';

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [matchingAnswers, setMatchingAnswers] = useState<Map<string, string>>(new Map());
  const [reorderItems, setReorderItems] = useState<{id: string, text: string}[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [exerciseSet, setExerciseSet] = useState<ExerciseSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [results, setResults] = useState<ExerciseSetResults>({
    setId: '',
    levelId: typeof id === 'string' ? id : '',
    totalQuestions: 0,
    correctAnswers: 0,
    scorePercentage: 0,
    completed: false,
    passedThreshold: false,
    exercises: [],
  });

  // Progress store methods
  const progressStore = useProgressStore();
  const { 
    completeLevel, 
    unlockLevel, 
    addPoints, 
    getNextLevel,
    updateCategoryProgress 
  } = progressStore;

  // Load exercise set on mount
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        if (typeof id !== 'string') return;
        
        setIsLoading(true);
        
        // Get the level details for the AI service
        const level = LEVELS.find(l => l.id === id);
        if (!level) throw new Error('Level not found');
        
        // Generate exercises using the AI service
        const exerciseData = await generateExerciseSet({
          levelId: id,
          type: level.type,
          difficulty: level.difficulty,
        });
        
        setExerciseSet(exerciseData);
        
        // Initialize the first exercise's state if it's a reorder type
        if (exerciseData.exercises[0]?.type === 'reorder' && exerciseData.exercises[0]?.reorderItems) {
          // Shuffle the items for the reorder exercise
          const shuffled = [...exerciseData.exercises[0].reorderItems].sort(() => Math.random() - 0.5);
          setReorderItems(shuffled);
        }
        
        setResults(prev => ({
          ...prev,
          setId: exerciseData.id,
          levelId: id,
          totalQuestions: exerciseData.exercises.length,
          exercises: exerciseData.exercises.map(ex => ({
            id: ex.id,
            correct: false,
            attempts: 0,
          })),
        }));
      } catch (error) {
        console.error('Error fetching exercises:', error);
        Alert.alert('Error', 'Failed to load exercises. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [id]);
  
  // When changing exercises, initialize state based on exercise type
  useEffect(() => {
    if (!exerciseSet) return;
    
    const exercise = exerciseSet.exercises[currentExerciseIndex];
    if (!exercise) return;
    
    // Reset previous input states
    setSelectedChoice(null);
    setTextAnswer('');
    setMatchingAnswers(new Map());
    
    // Initialize state based on current exercise type
    if (exercise.type === 'reorder' && exercise.reorderItems) {
      // Shuffle the items
      const shuffled = [...exercise.reorderItems].sort(() => Math.random() - 0.5);
      setReorderItems(shuffled);
    }
    
  }, [currentExerciseIndex, exerciseSet]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </SafeAreaView>
    );
  }

  if (!exerciseSet) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Exercise not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.replace('/(tabs)')} 
          style={{ marginTop: 16 }} 
        />
      </SafeAreaView>
    );
  }

  const currentExercise = exerciseSet.exercises[currentExerciseIndex];

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setShowExplanation(false);
  };

  const handleCheck = () => {
    let isCorrect = false;
    
    switch (currentExercise.type) {
      case 'multiple-choice':
        if (!selectedChoice) return;
        isCorrect = currentExercise.choices?.find(
          choice => choice.id === selectedChoice
        )?.isCorrect || false;
        break;
        
      case 'fill-in-blank':
        if (!textAnswer.trim()) return;
        isCorrect = textAnswer.trim().toLowerCase() === 
          (currentExercise.correctAnswer?.toLowerCase() || '');
        break;
        
      case 'matching':
        if (!currentExercise.matchingPairs || matchingAnswers.size !== currentExercise.matchingPairs.length) return;
        isCorrect = currentExercise.matchingPairs.every(pair => 
          matchingAnswers.get(pair.left) === pair.right
        );
        break;
        
      case 'reorder':
        if (!currentExercise.correctOrder || !reorderItems.length) return;
        isCorrect = reorderItems.map(item => item.id).join(',') === 
          currentExercise.correctOrder.join(',');
        break;
    }
    
    // Update results for this exercise
    const updatedExercises = [...results.exercises];
    updatedExercises[currentExerciseIndex] = {
      ...updatedExercises[currentExerciseIndex],
      correct: isCorrect,
      attempts: updatedExercises[currentExerciseIndex].attempts + 1,
    };
    
    // Update overall results
    const correctAnswers = updatedExercises.filter(e => e.correct).length;
    const scorePercentage = (correctAnswers / results.totalQuestions) * 100;
    
    setResults({
      ...results,
      exercises: updatedExercises,
      correctAnswers,
      scorePercentage,
    });
    
    setShowExplanation(true);
  };

  const handleNext = () => {
    // Update consecutive correct answers count
    const isCorrect = results.exercises[currentExerciseIndex].correct;
    if (isCorrect) {
      setConsecutiveCorrectAnswers(prev => prev + 1);
    } else {
      setConsecutiveCorrectAnswers(0);
    }
    
    if (currentExerciseIndex < exerciseSet.exercises.length - 1) {
      // Move to next exercise
      setCurrentExerciseIndex(prev => prev + 1);
      
      // Reset state for all exercise types
      setSelectedChoice(null);
      setTextAnswer('');
      setMatchingAnswers(new Map());
      setReorderItems([]);
      setShowExplanation(false);
    } else {
      // Complete the exercise set
      finishExerciseSet();
    }
  };

  const finishExerciseSet = () => {
    // Check if score meets required threshold (90% according to PRD)
    const passedThreshold = results.scorePercentage >= exerciseSet.requiredScore;
    
    // Update results
    const finalResults = {
      ...results,
      completed: true,
      passedThreshold,
    };
    setResults(finalResults);
    
    // Get level details
    const level = LEVELS.find(l => l.id === id);
    if (!level) {
      router.back();
      return;
    }
    
    if (passedThreshold) {
      // Calculate bonus points based on difficulty and consecutive correct answers
      const difficultyBonus = level.difficulty * 5;
      const streakBonus = Math.min(consecutiveCorrectAnswers, 5) * 5; // Cap at 25 bonus points for streak
      const totalPoints = (results.correctAnswers * 10) + difficultyBonus + streakBonus;
      
      // Add points to the user's score
      addPoints(totalPoints);
      
      // Mark level as completed
      completeLevel(level.id);
      
      // Update category progress - implement adaptive difficulty
      // If the user got 100%, boost their progress more
      const progressMultiplier = results.scorePercentage === 100 ? 1.2 : 1.0;
      updateCategoryProgress(
        level.type, 
        Math.round((level.difficulty / 3) * 100 * progressMultiplier)
      );
      
      // Get next level and unlock it
      const nextLevelId = getNextLevel(level.id);
      if (nextLevelId) {
        unlockLevel(nextLevelId);
      }
      
      // Show success message with bonus points breakdown
      Alert.alert(
        'Level Completed!',
        `You scored ${Math.round(results.scorePercentage)}%!\n` +
        `Base points: ${results.correctAnswers * 10}\n` +
        `Difficulty bonus: ${difficultyBonus}\n` +
        `Streak bonus: ${streakBonus}\n` +
        `Total points: ${totalPoints}\n\n` +
        `You've unlocked the next level!`,
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    } else {
      // Show failure message emphasizing the 90% requirement
      Alert.alert(
        'Try Again',
        `You scored ${Math.round(results.scorePercentage)}%, but need ${exerciseSet.requiredScore}% to advance. The ScribeX system requires 90% accuracy to ensure mastery before moving on.\n\nLet's try again!`,
        [{ text: 'Go Back', onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  const isCorrect = currentExercise.choices?.find(
    choice => choice.id === selectedChoice
  )?.isCorrect;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: exerciseSet.title,
          headerLeft: () => (
            <Button
              key="header-back-button"
              title="Exit"
              onPress={() => router.replace('/(tabs)')}
              variant="secondary"
              size="small"
            />
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            Exercise {currentExerciseIndex + 1} of {exerciseSet.exercises.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentExerciseIndex + 1) / exerciseSet.exercises.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Card style={styles.questionCard}>
          <Text style={styles.instruction}>{currentExercise.instruction}</Text>
          <Text style={styles.question}>{currentExercise.question}</Text>

          {/* Render different UI based on exercise type */}
          {currentExercise.type === 'multiple-choice' && (
            <View style={styles.choices}>
              {currentExercise.choices?.map((choice) => (
                <Button
                  key={choice.id}
                  title={choice.text}
                  onPress={() => handleChoiceSelect(choice.id)}
                  variant={selectedChoice === choice.id ? 'primary' : 'secondary'}
                  style={styles.choiceButton}
                />
              ))}
            </View>
          )}
          
          {currentExercise.type === 'fill-in-blank' && (
            <View style={styles.fillInBlank}>
              <TextInput
                style={styles.textInput}
                value={textAnswer}
                onChangeText={setTextAnswer}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.textSecondary}
              />
              {currentExercise.fillOptions && (
                <View style={styles.fillOptions}>
                  <Text style={styles.optionsLabel}>Suggested answers:</Text>
                  <View style={styles.optionsList}>
                    {currentExercise.fillOptions.map((option, index) => (
                      <Button
                        key={index}
                        title={option}
                        onPress={() => setTextAnswer(option)}
                        variant="secondary"
                        size="small"
                        style={styles.optionButton}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
          
          {currentExercise.type === 'matching' && (
            <View style={styles.matching}>
              {/* Add a state for currently selected term */}
              <Text style={styles.matchingInstructions}>
                First select a term, then tap a definition to match them.
              </Text>
              
              {/* Terms column */}
              <View style={styles.matchingTerms}>
                <Text style={styles.matchingColumnHeader}>Terms</Text>
                {currentExercise.matchingPairs?.map((pair, index) => {
                  const isMatched = matchingAnswers.has(pair.left);
                  return (
                    <Button
                      key={`term-${index}`}
                      title={pair.left}
                      onPress={() => {
                        // Toggle selection of this term
                        const newMatching = new Map(matchingAnswers);
                        
                        // If already matched, remove the match
                        if (isMatched) {
                          newMatching.delete(pair.left);
                          setMatchingAnswers(newMatching);
                        } else {
                          // Store the selected term in state for later matching
                          setSelectedChoice(pair.left);
                        }
                      }}
                      variant={isMatched ? 'primary' : selectedChoice === pair.left ? 'primary' : 'secondary'}
                      style={styles.matchingButton}
                    />
                  );
                })}
              </View>
              
              {/* Matches visualized */}
              <View style={styles.matchingConnections}>
                {currentExercise.matchingPairs?.map((pair, index) => {
                  const matchedDefinition = matchingAnswers.get(pair.left);
                  return (
                    <Text key={`connection-${index}`} style={styles.matchingConnection}>
                      {matchedDefinition ? '→' : ''}
                    </Text>
                  );
                })}
              </View>
              
              {/* Definitions column */}
              <View style={styles.matchingDefinitions}>
                <Text style={styles.matchingColumnHeader}>Definitions</Text>
                {currentExercise.matchingPairs?.map((pair, index) => {
                  const isUsed = Array.from(matchingAnswers.values()).includes(pair.right);
                  return (
                    <Button
                      key={`def-${index}`}
                      title={pair.right}
                      onPress={() => {
                        // If a term is selected, create a match
                        if (selectedChoice) {
                          // Check if this definition is already matched
                          const existingEntry = Array.from(matchingAnswers.entries())
                            .find(([_, value]) => value === pair.right);
                            
                          // If the definition is already used, remove that match
                          if (existingEntry) {
                            const newMatching = new Map(matchingAnswers);
                            newMatching.delete(existingEntry[0]);
                            newMatching.set(selectedChoice, pair.right);
                            setMatchingAnswers(newMatching);
                          } else {
                            // Create new match
                            const newMatching = new Map(matchingAnswers);
                            newMatching.set(selectedChoice, pair.right);
                            setMatchingAnswers(newMatching);
                          }
                          
                          // Clear selection
                          setSelectedChoice(null);
                        } else {
                          // Check if this definition is already matched
                          const termWithThisDefinition = Array.from(matchingAnswers.entries())
                            .find(([_, value]) => value === pair.right)?.[0];
                            
                          // If found, remove the match
                          if (termWithThisDefinition) {
                            const newMatching = new Map(matchingAnswers);
                            newMatching.delete(termWithThisDefinition);
                            setMatchingAnswers(newMatching);
                          }
                        }
                      }}
                      variant={isUsed ? 'primary' : 'secondary'}
                      style={styles.matchingButton}
                    />
                  );
                })}
              </View>
              
              {/* Current matches display */}
              {matchingAnswers.size > 0 && (
                <View style={styles.matchingResults}>
                  <Text style={styles.matchingResultsLabel}>Your matches:</Text>
                  {Array.from(matchingAnswers.entries()).map(([term, definition], index) => (
                    <View key={`match-${index}`} style={styles.matchingResult}>
                      <Text style={styles.matchingResultText}>
                        {term} → {definition}
                      </Text>
                      <TouchableOpacity 
                        style={styles.matchingRemove}
                        onPress={() => {
                          const newMatching = new Map(matchingAnswers);
                          newMatching.delete(term);
                          setMatchingAnswers(newMatching);
                        }}
                      >
                        <Text style={styles.matchingRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {currentExercise.type === 'reorder' && (
            <View style={styles.reorder}>
              {reorderItems.map((item, index) => (
                <View key={item.id} style={styles.reorderItem}>
                  <Text style={styles.reorderNumber}>{index + 1}.</Text>
                  <Text style={styles.reorderText}>{item.text}</Text>
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                      onPress={() => {
                        if (index > 0) {
                          const newItems = [...reorderItems];
                          const temp = newItems[index];
                          newItems[index] = newItems[index - 1];
                          newItems[index - 1] = temp;
                          setReorderItems(newItems);
                        }
                      }}
                      disabled={index === 0}
                    >
                      <Text style={styles.reorderButtonText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reorderButton, index === reorderItems.length - 1 && styles.reorderButtonDisabled]}
                      onPress={() => {
                        if (index < reorderItems.length - 1) {
                          const newItems = [...reorderItems];
                          const temp = newItems[index];
                          newItems[index] = newItems[index + 1];
                          newItems[index + 1] = temp;
                          setReorderItems(newItems);
                        }
                      }}
                      disabled={index === reorderItems.length - 1}
                    >
                      <Text style={styles.reorderButtonText}>↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {showExplanation && (
          <Card style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <AlertCircle
                size={24}
                color={results.exercises[currentExerciseIndex].correct ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.explanationTitle,
                  { color: results.exercises[currentExerciseIndex].correct ? colors.success : colors.error },
                ]}
              >
                {results.exercises[currentExerciseIndex].correct ? 'Correct!' : 'Not quite right'}
              </Text>
            </View>
            
            {/* Show different explanations based on exercise type */}
            {currentExercise.type === 'multiple-choice' && (
              <Text style={styles.explanationText}>
                {currentExercise.choices?.find(
                  choice => choice.id === selectedChoice
                )?.explanation || currentExercise.explanation}
              </Text>
            )}
            
            {currentExercise.type === 'fill-in-blank' && (
              <View>
                <Text style={styles.explanationText}>
                  {results.exercises[currentExerciseIndex].correct
                    ? 'Good job! Your answer matches the expected response.'
                    : `The correct answer is: ${currentExercise.correctAnswer}`}
                </Text>
                <Text style={[styles.explanationText, styles.explanationExtra]}>
                  {currentExercise.explanation}
                </Text>
              </View>
            )}
            
            {currentExercise.type === 'matching' && (
              <View>
                <Text style={styles.explanationText}>
                  {results.exercises[currentExerciseIndex].correct
                    ? 'You matched all items correctly!'
                    : 'Here are the correct matches:'}
                </Text>
                {!results.exercises[currentExerciseIndex].correct && currentExercise.matchingPairs?.map((pair, index) => (
                  <Text key={index} style={styles.explanationMatchingPair}>
                    • {pair.left} → {pair.right}
                  </Text>
                ))}
                <Text style={[styles.explanationText, styles.explanationExtra]}>
                  {currentExercise.explanation}
                </Text>
              </View>
            )}
            
            {currentExercise.type === 'reorder' && (
              <View>
                <Text style={styles.explanationText}>
                  {results.exercises[currentExerciseIndex].correct
                    ? 'Perfect ordering!'
                    : 'The correct order is:'}
                </Text>
                {!results.exercises[currentExerciseIndex].correct && currentExercise.correctOrder?.map((itemId, index) => {
                  const item = currentExercise.reorderItems?.find(i => i.id === itemId);
                  return item ? (
                    <Text key={index} style={styles.explanationOrderItem}>
                      {index + 1}. {item.text}
                    </Text>
                  ) : null;
                })}
                <Text style={[styles.explanationText, styles.explanationExtra]}>
                  {currentExercise.explanation}
                </Text>
              </View>
            )}
          </Card>
        )}

        <View style={styles.actions}>
          {!showExplanation ? (
            <Button
              key="check-button"
              title="Check Answer"
              onPress={handleCheck}
              disabled={
                (currentExercise.type === 'multiple-choice' && !selectedChoice) ||
                (currentExercise.type === 'fill-in-blank' && !textAnswer.trim()) ||
                (currentExercise.type === 'matching' && 
                  (!currentExercise.matchingPairs || 
                   matchingAnswers.size !== currentExercise.matchingPairs.length)) ||
                (currentExercise.type === 'reorder' && 
                  (!currentExercise.reorderItems || !reorderItems.length))
              }
            />
          ) : (
            <Button
              key="next-button"
              title={
                currentExerciseIndex === exerciseSet.exercises.length - 1
                  ? 'Complete'
                  : 'Next'
              }
              onPress={handleNext}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    padding: 16,
  },
  progress: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  questionCard: {
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
  },
  // Multiple choice styles
  choices: {
    gap: 12,
  },
  choiceButton: {
    alignItems: 'flex-start',
  },
  // Fill in blank styles
  fillInBlank: {
    gap: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  fillOptions: {
    marginTop: 8,
  },
  optionsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  // Matching styles
  matching: {
    gap: 20,
  },
  matchingInstructions: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  matchingTerms: {
    width: '100%',
    gap: 8,
  },
  matchingDefinitions: {
    width: '100%',
    gap: 8,
  },
  matchingColumnHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  matchingButton: {
    width: '100%',
    marginBottom: 4,
  },
  matchingConnections: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  matchingConnection: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 2,
  },
  matchingResults: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 8,
    width: '100%',
  },
  matchingResultsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  matchingResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matchingResultText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  matchingRemove: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceHighlight,
  },
  matchingRemoveText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: 'bold',
  },
  // Reorder styles
  reorder: {
    gap: 12,
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reorderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 24,
  },
  reorderText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  reorderControls: {
    flexDirection: 'row',
    gap: 4,
  },
  reorderButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  // Explanation styles
  explanationCard: {
    marginBottom: 16,
    backgroundColor: colors.surfaceHighlight,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  explanationExtra: {
    marginTop: 12,
  },
  explanationMatchingPair: {
    fontSize: 14,
    color: colors.text,
    marginVertical: 4,
    paddingLeft: 12,
  },
  explanationOrderItem: {
    fontSize: 14,
    color: colors.text,
    marginVertical: 4,
    paddingLeft: 12,
  },
  actions: {
    marginTop: 8,
  },
});