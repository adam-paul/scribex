# Debug History: API Rate Limiting Bug

## Error Description
Users reported frequent "Rate limit exceeded" errors when using the app, especially during intensive exercise sessions. These errors would appear even when users were well under the documented rate limits of 30 requests per minute for the OpenAI API.

## Context
- **Version**: 1.3.0
- **Affected Components**: ai-service.ts
- **Symptoms**:
  - False "Rate limit exceeded" errors
  - Inconsistent behavior with API calls
  - Exercise generation failing after a few successful generations
  - Writing feedback API calls blocking other API calls

## Root Cause Analysis

The issue was identified in the `checkRateLimit` function within ai-service.ts:

```typescript
// Original problematic code
const MAX_REQUESTS_PER_MINUTE = 30;
const apiRequestLog: number[] = [];

async function checkRateLimit(endpoint: string): Promise<void> {
  const currentTime = Date.now();
  const oneMinuteAgo = currentTime - 60 * 1000;
  
  // Remove old requests (older than 1 minute)
  while (apiRequestLog.length > 0 && apiRequestLog[0] < oneMinuteAgo) {
    apiRequestLog.shift();
  }
  
  if (apiRequestLog.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Add current request timestamp
  apiRequestLog.push(currentTime);
}
```

Two critical issues were identified:
1. **Logical Error**: The code was removing entries one-by-one using `shift()` which is inefficient and can lead to incorrect results if there are many old entries
2. **Race Condition**: In parallel API calls, the function could allow more requests than intended because it wasn't checking the array length after modification
3. **No Endpoint Differentiation**: The rate limiting was applied globally, not per endpoint

This created problems where:
1. Preloaded exercises would consume the entire rate limit
2. Background API calls would conflict with user-initiated calls
3. The app would falsely report rate limit errors when under actual limits

## Solution

The fix involved:
1. Reimplementing the rate limiting with a more efficient filtering approach 
2. Adding differentiated limits per endpoint type
3. Adding proper asynchronous handling

```typescript
// Fixed implementation
const MAX_REQUESTS_PER_MINUTE = 30;
const MAX_EXERCISE_REQUESTS_PER_MINUTE = 20;
const MAX_FEEDBACK_REQUESTS_PER_MINUTE = 10;

// Track requests per endpoint
const apiRequestLog: {[endpoint: string]: number[]} = {
  'exercise': [],
  'feedback': [],
  'prompt': []
};

async function checkRateLimit(endpoint: string): Promise<void> {
  const currentTime = Date.now();
  const oneMinuteAgo = currentTime - 60 * 1000;
  
  // Get the appropriate log and limit
  const endpointType = endpoint.includes('exercise') ? 'exercise' : 
                       endpoint.includes('feedback') ? 'feedback' : 'prompt';
  const requestLog = apiRequestLog[endpointType];
  const limit = endpointType === 'exercise' ? MAX_EXERCISE_REQUESTS_PER_MINUTE :
               endpointType === 'feedback' ? MAX_FEEDBACK_REQUESTS_PER_MINUTE : 
               MAX_REQUESTS_PER_MINUTE;
               
  // Filter in place to keep only recent requests
  const recentRequests = requestLog.filter(timestamp => timestamp >= oneMinuteAgo);
  apiRequestLog[endpointType] = recentRequests;
  
  if (recentRequests.length >= limit) {
    // Calculate how long until a slot opens up
    const oldestRequest = Math.min(...recentRequests);
    const msToWait = oldestRequest + 60000 - currentTime;
    throw new Error(`Rate limit exceeded for ${endpointType}. Please wait ${Math.ceil(msToWait/1000)} seconds.`);
  }
  
  // Add current request timestamp
  apiRequestLog[endpointType].push(currentTime);
}
```

Additionally, retry logic was added to the API request functions:

```typescript
// Retry logic for API calls
async function callWithRetry<T>(
  apiCall: () => Promise<T>, 
  endpoint: string, 
  retries = 3
): Promise<T> {
  try {
    await checkRateLimit(endpoint);
    return await apiCall();
  } catch (error) {
    if (
      retries > 0 && 
      error instanceof Error && 
      error.message.includes('Rate limit exceeded')
    ) {
      // Parse the wait time from the error message
      const waitTimeMatch = error.message.match(/wait (\d+) seconds/);
      const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) * 1000 : 2000;
      
      console.log(`Rate limited, waiting ${waitTime/1000}s before retry...`);
      
      // Wait and retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return callWithRetry(apiCall, endpoint, retries - 1);
    }
    throw error;
  }
}
```

## Verification

The fix was verified by:
1. Stress testing with multiple concurrent API calls
2. Monitoring API usage during intensive user sessions
3. Verifying the rate limits respected the OpenAI API limitations
4. Testing failure and recovery scenarios

## Prevention Measures

To prevent similar issues in the future:
1. Added detailed logging for API rate limiting in development builds
2. Implemented a rate limit monitor in the UI for developers
3. Added unit tests for the rate limiting logic
4. Documented the rate limiting approach in the codebase
5. Added metrics to track and analyze API usage patterns