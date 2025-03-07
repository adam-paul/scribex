# Progress Store Module Documentation

## Purpose

The progress-store module is a core state management component that tracks, persists, and synchronizes user learning progress across the ScribeX application. It manages user progression through educational content, including level completion, achievement unlocking, point accumulation, and content availability. The store handles both online and offline states, ensuring progress is synchronized with the server when connectivity is available while maintaining a seamless user experience during offline usage.

## Schema

### Core Data Structures

#### UserProgress
```typescript
interface UserProgress {
  currentLevel: string;              // ID of the current active level
  levelProgress: { [key: string]: number }; // Progress percentage per level
  completedLevels: string[];         // IDs of all completed levels
  unlockedLevels: string[];          // IDs of all accessible levels
  totalXp: number;                   // Unified XP system for all rewards
  dailyStreak: number;               // Consecutive days of app usage
  lastUpdated: number;               // Timestamp of last update
}
```

#### ProgressState
```typescript
interface ProgressState {
  progress: UserProgress;            // Core progress data
  offlineChanges: boolean;           // Flag for pending syncs
  lastSyncTime: number | null;       // Timestamp of last server sync
  // Plus various methods documented in Interfaces section
}
```

#### Achievement
```typescript
interface Achievement {
  id: string;                        // Unique identifier
  title: string;                     // Display name
  description: string;               // Explanatory text
  icon: string;                      // Icon reference
  unlockedAt: string;                // ISO timestamp when unlocked
}
```

### Relationships

1. **Category Hierarchy**: Content is organized into three main categories:
   - Mechanics (always unlocked)
   - Sequencing (unlocks at 70% mechanics progress)
   - Voice (unlocks at 60% sequencing progress)

2. **Level Progression**: Levels follow a prerequisite chain:
   - `mechanics-1` → `mechanics-2` → `sequencing-1` → `voice-1` → etc.

3. **Unified XP System**: Experience points are earned directly from exercise completion:
   - Base XP: 20 XP per correct answer
   - Difficulty bonus: Level difficulty * 10
   - Streak bonus: Up to 50 XP for consecutive correct answers
   - Total XP = (correct answers * 20) + (difficulty * 10) + min(streak * 10, 50)

4. **User Level**: Determined by XP thresholds (1-15 levels defined)

## Patterns

### Progress Update Pattern
```typescript
// The standard pattern for modifying progress state
await progressStore._updateProgressAndSync((state) => {
  // Return null to abort if no change needed
  if (noChangeNeeded) return null;
  
  // Return partial state update
  return {
    progress: {
      ...state.progress,
      someField: newValue,
      lastUpdated: Date.now()
    }
  };
});
```

### Content Unlocking Pattern
```typescript
// Check if category is unlocked before showing content
if (progressStore.isCategoryUnlocked('sequencing')) {
  // Show sequencing content
}

// After progress updates, check for new unlocks
await progressStore.updateCategoryProgress('mechanics', newValue);
// This automatically calls checkAndUnlockNextContent()
```

### Sync Management Pattern
```typescript
// Explicit sync trigger (used when network reconnects)
const syncSuccessful = await progressStore.syncWithServer();

// Typical component mount pattern
useEffect(() => {
  progressStore.syncWithServer();
}, []);

// After important operations
await progressStore.addXp(100);
await progressStore.syncWithServer();
```

### State Persistence Pattern
The store uses Zustand's persist middleware with custom storage adapter:
```typescript
export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'progress-storage',
      storage: createProgressStorage<ProgressState>()
    }
  )
);
```

## Interfaces

### Progress Management
- `setProgress(progress: Partial<UserProgress>): void`
  - Directly updates progress with partial values
  - Marks changes for synchronization

- `completeLevel(levelId: string): Promise<void>`
  - Marks a level as completed
  - Updates completedLevels array

- `unlockLevel(levelId: string): Promise<void>`
  - Makes a level accessible to the user
  - Updates unlockedLevels array

- `incrementStreak(): Promise<void>`
  - Increases daily streak counter by one
  - Called on daily app usage

- `addXp(xp: number): Promise<void>`
  - Adds to totalXp
  - Affects level calculation

- `getNextLevel(currentLevelId: string): string | null`
  - Returns ID of the next logical level based on prerequisites
  - Returns null if no next level exists

- `updateCategoryProgress(category: ProgressCategory, value: number): Promise<void>`
  - Updates progress for current level in specified category
  - Triggers content unlocking checks
  - Only updates if value is higher than current

### Achievement System
- `unlockAchievement(achievementId: string): Promise<Achievement | null>`
  - Unlocks an achievement if not already unlocked
  - Returns the unlocked achievement or null

### Content Structure & Navigation
- `isCategoryUnlocked(category: ProgressCategory): boolean`
  - Checks if a content category is available to the user

- `checkAndUnlockNextContent(): Promise<void>`
  - Evaluates progress and unlocks appropriate content
  - Advances currentLevel when appropriate

### Sync Management
- `syncWithServer(): Promise<boolean>`
  - Synchronizes local changes with server
  - Returns success status

- `markSynced(): void`
  - Clears offline changes flag
  - Updates lastSyncTime

- `updateUserProfileFromProgress(): Promise<void>`
  - Calculates XP and level from progress
  - Updates user profile in database

### Development Tools
- `resetProgress(): void`
  - Resets all progress to initial state
  - Used for testing and development

## Invariants

1. **Progress Monotonicity**
   - Progress values can only increase, never decrease
   - Enforced by comparing new values with existing values before updates

2. **Level Completion Chain**
   - A level can only be completed if all prerequisite levels are completed first
   - Enforced by the level progression logic

3. **Content Category Sequencing**
   - Categories unlock in fixed order: mechanics → sequencing → voice
   - Enforced by category threshold checks

4. **Achievement Uniqueness**
   - Each achievement can only be unlocked once
   - Enforced by checking existing achievements before unlocking

5. **Timestamp Consistency**
   - Every progress update includes lastUpdated timestamp
   - Ensures proper ordering of operations across devices

6. **XP and Level Calculation**
   - XP derived from progress via deterministic function
   - User level derived from XP via fixed thresholds

7. **Level ID Format**
   - Level IDs follow pattern: `{category}-{number}`
   - Used for categorization and ordering

## Error States

1. **Network Connectivity Loss**
   - Detection: NetInfo.fetch() returns isConnected: false
   - Handling: Sets offlineChanges flag, continues with local updates
   - Recovery: Automatic sync attempt when connectivity returns

2. **Partial Sync Failure**
   - Detection: Exception during savePartialProgress call
   - Handling: Logs error, preserves offlineChanges flag
   - Recovery: Next sync operation will retry with full progress

3. **Achievement Not Found**
   - Detection: Achievement ID lookup returns undefined
   - Handling: Logs error and returns null
   - Recovery: No automatic recovery, client must request valid achievement

4. **Debounced Sync Rejection**
   - Detection: Sync attempt within 10 seconds of previous sync
   - Handling: Returns success without performing actual sync
   - Purpose: Prevents API rate limiting and excessive writes

5. **Missing Level Definition**
   - Detection: LEVELS.find() returns undefined in getNextLevel
   - Handling: Returns null to indicate no next level
   - Recovery: Client must handle null return appropriately

6. **Storage Rehydration Failure**
   - Detection: null state in onRehydrateStorage callback
   - Handling: Logs failure, falls back to initialProgress
   - Recovery: No automatic recovery, user starts with new progress

7. **User Authentication Required**
   - Detection: supabaseService.getCurrentUser() returns null
   - Handling: Early return from profile update operations
   - Recovery: Operations deferred until authentication completes