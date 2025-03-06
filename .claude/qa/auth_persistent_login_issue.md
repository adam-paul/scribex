# Persistent Login Issue After App Restart

## Question

Why does my authentication state get lost when the app restarts? Users have to log in again every time they close and reopen the app, even though we're using Supabase's persistent sessions.

## Problem Diagnosis

1. **Check if the session is correctly persisted**:
   - Examine the Supabase client initialization in `supabase-service.ts`
   - Check the storage adapter implementation for the platform
   - Test the session retrieval on app startup

2. **Verify authentication flow**:
   - Trace the authentication initialization in `AuthContext.tsx`
   - Check if the session is correctly loaded from storage
   - Examine the auth state listener behavior

3. **Inspect app lifecycle handling**:
   - Look at the root component initialization in `app/_layout.tsx`
   - Check for state resets that might affect authentication

## Root Cause Analysis

After examining the code, I've identified several potential issues:

1. **Initialization Order Issue**: The `initializeAuth` function in `AuthContext.tsx` gets the session but doesn't properly load user data afterward. The issue happens because we rely on the auth state listener to load data, but existing sessions don't trigger a 'SIGNED_IN' event on app restart.

2. **Missing Data Load for Existing Sessions**: When the app restarts with an existing session, the `onAuthStateChange` listener doesn't fire a 'SIGNED_IN' event, so `loadUserData()` is never called.

3. **Incomplete Session Restoration**: The `refreshUser()` function is called to get user details, but the important `loadUserData()` function to load profile data, progress, and writing projects isn't called for existing sessions.

4. **Storage Implementation Issues**: The storage adapter might not be correctly accessing AsyncStorage on mobile devices or localStorage on web.

## Complete Solution

The main fix is to properly load user data when an existing session is detected during initialization:

```typescript
// In AuthContext.tsx, modify the initializeAuth function:
const initializeAuth = async () => {
  // Skip if already initialized
  if (isInitialized) return;
  isInitialized = true;
  
  try {
    const { data, error } = await supabaseService.getClient().auth.getSession();
    
    if (error) {
      setUser(null);
    } else if (data.session) {
      const refreshedUser = await supabaseService.refreshUser();
      setUser(refreshedUser);
      
      // Add this critical line to load user data for existing sessions
      await loadUserData();
    } else {
      setUser(null);
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};
```

For more robust session handling, consider these additional fixes:

1. **Improve Storage Error Handling**:

```typescript
// In supabase-service.ts, enhance the AsyncStorage adapter:
storage: Platform.OS === 'web' 
  ? createWebStorage()
  : {
      getItem: async (key: string) => {
        try {
          const value = await AsyncStorage.getItem(key);
          console.log('Retrieved auth session:', key, value ? 'exists' : 'null');
          return value;
        } catch (e) {
          console.error('AsyncStorage getItem error:', e);
          return null;
        }
      },
      // Similar improvements for setItem and removeItem...
    }
```

2. **Add App State Listener for Session Verification**:

```typescript
// In AuthContext.tsx, add a session verification on app resume
useEffect(() => {
  if (!user) return;
  
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Verify session is still valid when app returns to foreground
      const { data } = await supabaseService.getClient().auth.getSession();
      if (!data.session) {
        // Session expired or was invalidated
        await signOut();
      }
    }
  };
  
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
}, [user, signOut]);
```

3. **Implement Retry Logic for Important Data Loading**:

```typescript
// Add retry logic to loadUserData function:
const MAX_RETRIES = 3;

const loadUserDataWithRetry = async (retryCount = 0): Promise<void> => {
  if (!user) return;
  
  try {
    // Existing loadUserData implementation...
  } catch (error) {
    console.error(`Error loading user data (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
    
    if (retryCount < MAX_RETRIES - 1) {
      // Wait with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return loadUserDataWithRetry(retryCount + 1);
    }
  }
};

// Replace loadUserData calls with loadUserDataWithRetry
```

## Prevention Tips

1. **Session Lifecycle Management**:
   - Always call `loadUserData()` whenever setting the user state
   - Don't rely solely on auth state change events for data loading
   - Implement session validation checks on app resume

2. **Storage Robustness**:
   - Add debug logging to storage adapters during development
   - Implement fallback mechanisms for storage failures
   - Consider using secure storage for auth tokens on mobile

3. **Testing Authentication Flows**:
   - Test the full app lifecycle: login, close app, reopen app
   - Test edge cases like expired tokens and network failures
   - Add session debugging tools in development builds

4. **Code Structure Improvements**:
   - Keep auth state and data loading logic tightly coupled
   - Use consistent error handling patterns
   - Add explicit comments about authentication flow assumptions

By implementing these changes, the app will maintain authentication state correctly across app restarts, providing a seamless user experience without requiring repeated logins.