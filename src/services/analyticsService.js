// src/services/analyticsService.js

import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Analytics service for storing post metrics and algorithm performance data
 */

/**
 * Store post scoring metrics in Firebase
 */
export const storePostMetrics = async (post, scores, finalScore, userId = null) => {
  try {
    const postId = post.id || 'unknown';
    const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 3600);
    const engagement = (post.likes?.length || 0) + (post.comments?.length || 0) + (post.shares?.length || 0);
    
    const metricsData = {
      postId,
      userId: userId || post.userId,
      authorName: post.name || 'Anonymous',
      contentPreview: (post.text || '').substring(0, 100),
      scores: {
        engagement: Number(scores.engagement.toFixed(2)),
        quality: Number(scores.quality.toFixed(2)),
        personalization: Number(scores.personalization.toFixed(2)),
        recency: Number(scores.recency.toFixed(2)),
        viral: Number(scores.viral.toFixed(2)),
        penalties: Number(scores.penalties.toFixed(2))
      },
      finalScore: Number(finalScore.toFixed(2)),
      postMetrics: {
        age: Number(hoursSincePost.toFixed(1)),
        totalEngagement: engagement,
        likes: post.likes?.length || post.likeCount || 0,
        comments: post.comments?.length || post.commentCount || 0,
        shares: post.shares?.length || post.shareCount || 0,
        views: post.views || 0
      },
      timestamp: serverTimestamp(),
      calculatedAt: Date.now()
    };

    // Store in analytics collection
    const docRef = await addDoc(collection(db, 'analytics', 'posts', 'metrics'), metricsData);
    
    // Optional: Store aggregated data for the post document
    await updatePostAnalytics(postId, finalScore, scores);
    
    return docRef.id;
  } catch (error) {
    console.error('[AnalyticsService] Error storing post metrics:', error);
    // Don't throw error to avoid breaking the feed algorithm
    return null;
  }
};

/**
 * Update post document with latest analytics
 */
const updatePostAnalytics = async (postId, finalScore, scores) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      await updateDoc(postRef, {
        'analytics.lastScore': Number(finalScore.toFixed(2)),
        'analytics.lastCalculated': serverTimestamp(),
        'analytics.scores': {
          engagement: Number(scores.engagement.toFixed(2)),
          quality: Number(scores.quality.toFixed(2)),
          personalization: Number(scores.personalization.toFixed(2)),
          recency: Number(scores.recency.toFixed(2)),
          viral: Number(scores.viral.toFixed(2)),
          penalties: Number(scores.penalties.toFixed(2))
        }
      });
    }
  } catch (error) {
    console.error('[AnalyticsService] Error updating post analytics:', error);
  }
};

/**
 * Store algorithm performance metrics
 */
export const storeAlgorithmMetrics = async (posts, metrics, userId = null) => {
  try {
    const algorithmData = {
      userId,
      totalPosts: posts.length,
      metrics: {
        averageScore: Number(metrics.averageScore.toFixed(2)),
        maxScore: Number(metrics.maxScore.toFixed(2)),
        minScore: Number(metrics.minScore.toFixed(2)),
        scoreDistribution: metrics.scoreDistribution
      },
      timestamp: serverTimestamp(),
      calculatedAt: Date.now()
    };

    const docRef = await addDoc(collection(db, 'analytics', 'algorithm', 'performance'), algorithmData);
    return docRef.id;
  } catch (error) {
    console.error('[AnalyticsService] Error storing algorithm metrics:', error);
    return null;
  }
};

/**
 * Store user feed interaction metrics
 */
export const storeFeedInteraction = async (userId, action, postId, metadata = {}) => {
  try {
    const interactionData = {
      userId,
      action, // 'view', 'scroll', 'like', 'comment', 'share', 'click'
      postId,
      metadata,
      timestamp: serverTimestamp(),
      sessionId: Date.now() // Simple session tracking
    };

    const docRef = await addDoc(collection(db, 'analytics', 'interactions', 'feed'), interactionData);
    return docRef.id;
  } catch (error) {
    console.error('[AnalyticsService] Error storing feed interaction:', error);
    return null;
  }
};

/**
 * Get analytics summary for a specific post
 */
export const getPostAnalytics = async (postId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const data = postDoc.data();
      return data.analytics || null;
    }
    
    return null;
  } catch (error) {
    console.error('[AnalyticsService] Error fetching post analytics:', error);
    return null;
  }
};

/**
 * Store user-specific algorithm preferences
 */
export const storeUserAlgorithmPreferences = async (userId, preferences) => {
  try {
    const userPrefData = {
      userId,
      preferences,
      timestamp: serverTimestamp(),
      updatedAt: Date.now()
    };

    const docRef = await addDoc(collection(db, 'analytics', 'users', 'preferences'), userPrefData);
    return docRef.id;
  } catch (error) {
    console.error('[AnalyticsService] Error storing user preferences:', error);
    return null;
  }
};
