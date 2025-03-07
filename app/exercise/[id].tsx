import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, Move } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ExerciseSet, Exercise, ExerciseSetResult } from '@/types';
import { useProgressStore } from '@/stores/progress-store';
import { useLessonStore } from '@/stores/lesson-store';
import { LEVELS } from '@/constants/levels';
import { MAX_EXERCISES_PER_LEVEL } from '@/constants/exercises';

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
  const [results, setResults] = useState<ExerciseSetResult>({
    setId: '',
    levelId: typeof id === 'string' ? id : '',
    totalExercises: MAX_EXERCISES_PER_LEVEL,
    correctAnswers: 0,
    isCompleted: false,
    exercises: Array(MAX_EXERCISES_PER_LEVEL).fill(null).map((_, i) => ({
      id: `pending-${i}`,
      isCorrect: false,
      attempts: 0
    })),
    startedAt: Date.now(),
    completedAt: 0,
    score: 0,
    isPassed: false,
    requiredScore: 90
  });

  // Progress store methods
  const progressStore = useProgressStore();
  const { 
    completeLevel, 
    unlockLevel, 
    addXp, 
    getNextLevel,
    updateCategoryProgress 
  } = progressStore;

  // Function to reset exercise state
  const resetExerciseState = (nextExercise?: Exercise) => {
    setSelectedChoice(null);
    setTextAnswer('');
    setMatchingAnswers(new Map());
    setShowExplanation(false);
    
    // Initialize reorder items if needed
    if (nextExercise?.type === 'reorder' && nextExercise?.reorderItems) {
      const shuffled = [...nextExercise.reorderItems].sort(() => Math.random() - 0.5);
      setReorderItems(shuffled);
    } else {
      setReorderItems([]);
    }
  };

  // Load exercise set on mount
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        
        // Ensure id is a string
        if (typeof id !== 'string') {
          Alert.alert('Error', 'Invalid level ID');
          router.back();
          return;
        }
        
        // Get level information
        const level = LEVELS.find(l => l.id === id);
        if (!level) {
          Alert.alert('Error', 'Level not found');
          router.back();
          return;
        }
        
        // Get exercises from lesson store
        const lessonStore = useLessonStore.getState();
        let exerciseData = lessonStore.createExerciseSetFromCachedExercises(id);
        
        // If we don't have any exercises at all or not enough exercises
        if (!exerciseData || exerciseData.exercises.length < MAX_EXERCISES_PER_LEVEL) {
          const exercisesNeeded = !exerciseData ? MAX_EXERCISES_PER_LEVEL : MAX_EXERCISES_PER_LEVEL - exerciseData.exercises.length;
          console.log(`Need to generate ${exercisesNeeded} exercises for level ${id}`);
          
          // Check if there's already an active generation task for this level
          const currentTasks = Object.keys(lessonStore.activeGenerationTasks);
          const isAlreadyGenerating = currentTasks.includes(id);
          
          // Only start a new generation if one isn't already running for this level
          if (!isAlreadyGenerating) {
            // Cancel other tasks by starting a new one for this level
            if (currentTasks.length > 0) {
              console.log(`Cancelling background generation for other levels to focus on ${id}`);
              // The preloadRemainingExercises function will automatically clear other tasks
              // when starting a new one for this level
            }
            
            // Start background generation for remaining exercises
            lessonStore.preloadRemainingExercises(id, exercisesNeeded);
          } else {
            console.log(`Exercise generation for ${id} already in progress, not starting another task`);
          }
          
          // Keep checking for exercises until we have at least one
          let retryCount = 0;
          const maxRetries = 30; // 30 seconds max wait time
          
          while ((!exerciseData || exerciseData.exercises.length === 0) && retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a second
            exerciseData = lessonStore.createExerciseSetFromCachedExercises(id);
            retryCount++;
            
            // Update loading message every 5 seconds
            if (retryCount % 5 === 0) {
              console.log(`Still waiting for first exercise... (${retryCount}s)`);
            }
          }
          
          if (!exerciseData || exerciseData.exercises.length === 0) {
            Alert.alert(
              'Exercise Generation Issue',
              'We had trouble generating exercises for this level. Please try again.',
              [
                {
                  text: 'Try Again',
                  onPress: () => fetchExercises()
                },
                {
                  text: 'Go Back',
                  onPress: () => router.back(),
                  style: 'cancel'
                }
              ]
            );
            return;
          }
        }
        
        // Set up the exercise state
        setExerciseSet(exerciseData);
        
        // Initialize the first exercise's state if it's a reorder type
        if (exerciseData.exercises[0]?.type === 'reorder' && exerciseData.exercises[0]?.reorderItems) {
          const shuffled = [...exerciseData.exercises[0].reorderItems].sort(() => Math.random() - 0.5);
          setReorderItems(shuffled);
        }
        
        // Update results state
        setResults(prev => ({
          ...prev,
          setId: exerciseData.id,
          levelId: id,
          totalExercises: MAX_EXERCISES_PER_LEVEL,
          exercises: Array(MAX_EXERCISES_PER_LEVEL).fill(null).map((_, i) => ({
            id: i < exerciseData.exercises.length ? exerciseData.exercises[i].id : `pending-${i}`,
            isCorrect: false,
            attempts: 0,
          })),
        }));
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching exercises:', error);
        Alert.alert(
          'Exercise Generation Issue',
          'We had trouble generating exercises for this level. This could be due to network issues or server load.',
          [
            {
              text: 'Try Again',
              onPress: () => fetchExercises()
            },
            {
              text: 'Go Back',
              onPress: () => router.back(),
              style: 'cancel'
            }
          ]
        );
      }
    };

    fetchExercises();
  }, [id]);
  
  // When changing exercises, initialize state based on exercise type
  useEffect(() => {
    if (!exerciseSet) return;
    
    const exercise = exerciseSet.exercises[currentExerciseIndex];
    if (!exercise) return;
    
    resetExerciseState(exercise);
  }, [currentExerciseIndex, exerciseSet]);

  // Add a new effect to continuously check for newly generated exercises when needed
  useEffect(() => {
    // Only run this effect when we're waiting for the next exercise
    if (!isLoading || typeof id !== 'string' || !exerciseSet) return;
    
    // Create an interval to check for new exercises
    const checkIntervalId = setInterval(() => {
      const lessonStore = useLessonStore.getState();
      const updatedSet = lessonStore.createExerciseSetFromCachedExercises(id);
      
      // If we have a new exercise, update the UI
      if (updatedSet && updatedSet.exercises.length > currentExerciseIndex + 1) {
        console.log(`Found newly generated exercise ${currentExerciseIndex + 1} for level ${id}, resuming...`);
        setExerciseSet(updatedSet);
        setCurrentExerciseIndex(prev => prev + 1);
        setIsLoading(false);
        
        // Reset state for next exercise
        const nextExercise = updatedSet.exercises[currentExerciseIndex + 1];
        resetExerciseState(nextExercise);
      }
    }, 1000); // Check every second
    
    // Cleanup interval on unmount or when loading state changes
    return () => clearInterval(checkIntervalId);
  }, [isLoading, id, exerciseSet, currentExerciseIndex]);

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

  const handleNext = () => {
    // Ensure id is a string
    if (typeof id !== 'string') {
      console.error('Invalid level ID');
      return;
    }

    // Update consecutive correct answers count
    const isCorrect = results.exercises[currentExerciseIndex].isCorrect;
    if (isCorrect) {
      setConsecutiveCorrectAnswers(prev => prev + 1);
    } else {
      setConsecutiveCorrectAnswers(0);
    }
    
    // Check if we've completed all questions or need to move to next one
    const allQuestionsAttempted = results.exercises.every(ex => ex.attempts > 0);
    
    if (currentExerciseIndex < MAX_EXERCISES_PER_LEVEL - 1) {
      // Check if next exercise is available
      const nextExercise = exerciseSet?.exercises[currentExerciseIndex + 1];
      
      if (!nextExercise) {
        // If we've caught up to generation, show loading and wait for next exercise
        setIsLoading(true);
        
        // Try to get updated exercise set
        const lessonStore = useLessonStore.getState();
        const updatedSet = lessonStore.createExerciseSetFromCachedExercises(id);
        
        if (updatedSet && updatedSet.exercises.length > currentExerciseIndex + 1) {
          // We have the next exercise now
          setExerciseSet(updatedSet);
          setCurrentExerciseIndex(prev => prev + 1);
          setIsLoading(false);
        } else {
          // Still waiting for next exercise, keep loading state
          // The useEffect will update when new exercises are available
          console.log('Waiting for next exercise to be generated...');
        }
      } else {
        // Next exercise is ready, proceed normally
        setCurrentExerciseIndex(prev => prev + 1);
      }
      
      // Reset state for all exercise types
      setSelectedChoice(null);
      setTextAnswer('');
      setMatchingAnswers(new Map());
      setReorderItems(nextExercise?.reorderItems ? 
        [...nextExercise.reorderItems].sort(() => Math.random() - 0.5) : 
        []);
      setShowExplanation(false);
      
    } else if (allQuestionsAttempted) {
      // All questions have been attempted, complete the exercise set
      finishExerciseSet();
    } else {
      // This shouldn't happen, but just in case
      console.error('Unexpected state: at last question but not all attempted');
    }
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
      isCorrect: isCorrect,
      attempts: updatedExercises[currentExerciseIndex].attempts + 1,
    };
    
    // Update overall results
    const correctAnswers = updatedExercises.filter(e => e.isCorrect).length;
    const attemptedQuestions = updatedExercises.filter(e => e.attempts > 0).length;
    const score = (correctAnswers / MAX_EXERCISES_PER_LEVEL) * 100;
    
    setResults({
      ...results,
      exercises: updatedExercises,
      correctAnswers,
      score,
    });
    
    setShowExplanation(true);
  };

  const finishExerciseSet = () => {
    // Check if score meets required threshold (90% according to PRD)
    const isPassed = results.score >= (results.requiredScore || 90);
    
    // Update results
    const finalResults = {
      ...results,
      isCompleted: true,
      isPassed,
      completedAt: Date.now()
    };
    setResults(finalResults);
    
    // Get level details
    const level = LEVELS.find(l => l.id === id);
    if (!level) {
      router.back();
      return;
    }
    
    if (isPassed) {
      // Calculate bonus XP based on difficulty and consecutive correct answers
      const difficultyBonus = level.difficulty * 10;
      const streakBonus = Math.min(consecutiveCorrectAnswers, 5) * 10; // Cap at 50 bonus XP for streak
      const totalXp = (results.correctAnswers * 20) + difficultyBonus + streakBonus;
      
      // Show success message with XP breakdown immediately
      Alert.alert(
        'Level Completed!',
        `You scored ${Math.round(results.score)}%!\n` +
        `Base XP: ${results.correctAnswers * 20}\n` +
        `Difficulty bonus: ${difficultyBonus}\n` +
        `Streak bonus: ${streakBonus}\n` +
        `Total XP: ${totalXp}\n\n` +
        `You've unlocked the next level!`,
        [{ 
          text: 'Continue', 
          onPress: () => {
            // Navigate away immediately
            router.replace('/(tabs)');
          }
        }]
      );
      
      // Handle all storage operations asynchronously
      (async () => {
        try {
          // Add XP and wait for it to be stored
          await addXp(totalXp);
          
          // Mark level as completed
          await completeLevel(level.id);
          
          // Update category progress - implement adaptive difficulty
          // If the user got 100%, boost their progress more
          const progressMultiplier = results.score === 100 ? 1.2 : 1.0;
          await updateCategoryProgress(
            level.type, 
            Math.round((level.difficulty / 3) * 100 * progressMultiplier)
          );
          
          // Get next level and unlock it
          const nextLevelId = getNextLevel(level.id);
          if (nextLevelId) {
            await unlockLevel(nextLevelId);
            
            // Immediately preload just the first exercise for the next level
            console.log(`Level ${level.id} completed. Preloading first exercise for next level ${nextLevelId}`);
            const lessonStore = useLessonStore.getState();
            lessonStore.preloadFirstExerciseIfNeeded(nextLevelId).catch(err => {
              console.warn(`Could not preload first exercise for next level: ${err.message}`);
            });
          }

          // Now that all updates are complete, sync with server
          const progressStore = useProgressStore.getState();
          await progressStore.updateUserProfileFromProgress();
          await progressStore.syncWithServer();
          
          console.log('Successfully saved all progress in background');
        } catch (error) {
          console.error('Error saving progress in background:', error);
          // Since we've already navigated away, we'll just log the error
          // The next time the user loads their profile or starts a new level,
          // the sync process will attempt to reconcile any missed updates
        }
      })();
      
    } else {
      // Show failure message emphasizing the 90% requirement
      Alert.alert(
        'Try Again',
        `You scored ${Math.round(results.score)}%, but need ${results.requiredScore}% to advance. The ScribeX system requires 90% accuracy to ensure mastery before moving on.\n\nLet's try again!`,
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
            Exercise {currentExerciseIndex + 1} of {results.totalExercises}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentExerciseIndex + 1) / results.totalExercises) * 100}%`,
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
                color={results.exercises[currentExerciseIndex].isCorrect ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.explanationTitle,
                  { color: results.exercises[currentExerciseIndex].isCorrect ? colors.success : colors.error },
                ]}
              >
                {results.exercises[currentExerciseIndex].isCorrect ? 'Correct!' : 'Not quite right'}
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
                  {results.exercises[currentExerciseIndex].isCorrect
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
                  {results.exercises[currentExerciseIndex].isCorrect
                    ? 'You matched all items correctly!'
                    : 'Here are the correct matches:'}
                </Text>
                {!results.exercises[currentExerciseIndex].isCorrect && currentExercise.matchingPairs?.map((pair, index) => (
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
                  {results.exercises[currentExerciseIndex].isCorrect
                    ? 'Perfect ordering!'
                    : 'The correct order is:'}
                </Text>
                {!results.exercises[currentExerciseIndex].isCorrect && currentExercise.correctOrder?.map((itemId, index) => {
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