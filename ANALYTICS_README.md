# Analytics System Documentation

## Overview
The analytics system stores post metrics and algorithm performance data in Firebase instead of logging to the terminal. This provides persistent storage of user engagement patterns, post scoring data, and feed algorithm performance.

## Firebase Collections Structure

### Analytics Data Structure
```
analytics/
├── posts/
│   └── metrics/
│       └── [document-id]/
│           ├── postId: string
│           ├── userId: string
│           ├── authorName: string
│           ├── contentPreview: string (first 100 characters)
│           ├── scores: object
│           │   ├── engagement: number
│           │   ├── quality: number
│           │   ├── personalization: number
│           │   ├── recency: number
│           │   ├── viral: number
│           │   └── penalties: number
│           ├── finalScore: number
│           ├── postMetrics: object
│           │   ├── age: number (hours)
│           │   ├── totalEngagement: number
│           │   ├── likes: number
│           │   ├── comments: number
│           │   ├── shares: number
│           │   └── views: number
│           ├── timestamp: serverTimestamp
│           └── calculatedAt: number (epoch)
│
├── algorithm/
│   └── performance/
│       └── [document-id]/
│           ├── userId: string
│           ├── totalPosts: number
│           ├── metrics: object
│           │   ├── averageScore: number
│           │   ├── maxScore: number
│           │   ├── minScore: number
│           │   └── scoreDistribution: object
│           │       ├── high: number
│           │       ├── medium: number
│           │       └── low: number
│           ├── timestamp: serverTimestamp
│           └── calculatedAt: number
│
├── interactions/
│   └── feed/
│       └── [document-id]/
│           ├── userId: string
│           ├── action: string ('view', 'click', 'scroll', etc.)
│           ├── postId: string
│           ├── metadata: object (action-specific data)
│           ├── timestamp: serverTimestamp
│           └── sessionId: number
│
└── users/
    └── preferences/
        └── [document-id]/
            ├── userId: string
            ├── preferences: object
            ├── timestamp: serverTimestamp
            └── updatedAt: number
```

### Post Analytics Update
```
posts/
└── [post-id]/
    └── analytics: object
        ├── lastScore: number
        ├── lastCalculated: serverTimestamp
        └── scores: object (same structure as above)
```

## Services

### analyticsService.js
Main service for storing analytics data:

- `storePostMetrics(post, scores, finalScore, userId)` - Stores detailed post scoring metrics
- `storeAlgorithmMetrics(posts, metrics, userId)` - Stores algorithm performance data
- `storeFeedInteraction(userId, action, postId, metadata)` - Tracks user interactions
- `getPostAnalytics(postId)` - Retrieves analytics for a specific post
- `storeUserAlgorithmPreferences(userId, preferences)` - Stores user preferences

### Feed Algorithm Updates
The feed algorithm (`feedAlgorithm.js`) now:
- Imports `storePostMetrics` from the analytics service
- Stores metrics in Firebase instead of console logging
- Only stores metrics when a user is provided (to associate with user sessions)
- Handles errors gracefully to avoid disrupting the feed

### Interaction Tracking
- **Post Views**: Automatically tracked when PostCard components mount
- **Post Clicks**: Tracked when users navigate to post details
- **Metadata**: Includes post type, media presence, school information, etc.

## Components

### AnalyticsDashboard.js
React component that displays:
- Summary metrics (average score, engagement, etc.)
- Recent post scores with breakdowns
- Algorithm performance data
- Clean, dark-themed UI matching the app design

### AnalyticsScreen.js
Simple screen wrapper for the analytics dashboard that can be added to navigation.

## Usage Examples

### Viewing Analytics Data
```javascript
import AnalyticsDashboard from '../components/AnalyticsDashboard';

// In your component
<AnalyticsDashboard userId={currentUser.uid} />
```

### Manual Interaction Tracking
```javascript
import { storeFeedInteraction } from '../services/analyticsService';

// Track custom interactions
await storeFeedInteraction(userId, 'share', postId, {
  platform: 'twitter',
  shareType: 'external'
});
```

### Retrieving Post Analytics
```javascript
import { getPostAnalytics } from '../services/analyticsService';

const analytics = await getPostAnalytics(postId);
if (analytics) {
  console.log('Last score:', analytics.lastScore);
  console.log('Score breakdown:', analytics.scores);
}
```

## Performance Considerations

### Optimizations
- **Sampling**: Algorithm metrics are stored for only 10% of feed loads to reduce Firebase writes
- **Async Operations**: All analytics operations are non-blocking and won't affect app performance
- **Error Handling**: Failed analytics operations are logged but don't disrupt user experience
- **Batching**: Consider implementing batch writes for high-volume applications

### Firebase Rules Considerations
Ensure your Firestore security rules allow:
- Users to write their own analytics data
- Users to read their own analytics data
- Consider admin access for aggregated analytics

Example rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Analytics data
    match /analytics/{collection}/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Post analytics (embedded in posts)
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         'analytics' in request.resource.data && request.auth.uid != null);
    }
  }
}
```

## Data Analysis Potential

The stored analytics enable:
- **User Engagement Analysis**: Track how users interact with different content types
- **Algorithm Performance**: Monitor scoring accuracy and distribution
- **Content Quality Insights**: Identify what makes posts successful
- **Personalization Effectiveness**: Measure how well personalization scores correlate with engagement
- **Campus Engagement**: Analyze school-specific interaction patterns
- **Viral Content Detection**: Study characteristics of high-performing posts

## Future Enhancements

Potential additions:
- Real-time analytics dashboard for content creators
- A/B testing framework for algorithm changes
- Recommendation system based on interaction patterns
- Content moderation insights
- Campus-specific trending analysis
- User retention correlation with feed quality
