// src/utils/feedAlgorithm.js

import { storePostMetrics } from '../services/analyticsService';

// Advanced scoring configuration
const WEIGHTS = {
  // Base engagement weights
  LIKES: 1.0,
  COMMENTS: 4.0,
  SHARES: 8.0,
  VIEWS: 0.1,
  
  // Quality indicators
  COMMENT_QUALITY: 3.0,
  ENGAGEMENT_VELOCITY: 5.0,
  AUTHOR_REPUTATION: 2.0,
  
  // Content type modifiers
  CONTENT_TYPE: {
    TEXT: 1.0,
    IMAGE: 1.2,
    VIDEO: 1.5,
    LINK: 0.8
  },
  
  // Personalization factors
  FOLLOWING_BONUS: 3.0,
  INTERACTION_HISTORY: 2.5,
  INTEREST_MATCH: 2.0,
  
  // Recency and viral detection
  FRESHNESS_BOOST: 1.5,
  VIRAL_MULTIPLIER: 2.0,
  
  // Negative signals
  SPAM_PENALTY: -10.0,
  LOW_QUALITY_PENALTY: -2.0
};

const TIME_DECAY = {
  STANDARD: 1.8,
  VIRAL_THRESHOLD: 0.5, // Less decay for viral content
  FRESH_HOURS: 2, // Hours to consider "fresh"
  PEAK_HOURS: 6 // Hours where engagement peaks
};

const THRESHOLDS = {
  VIRAL_ENGAGEMENT_RATE: 0.1, // 10% engagement rate
  HIGH_QUALITY_COMMENT_LENGTH: 50,
  SPAM_DETECTION_SCORE: -5.0
};

/**
 * Advanced feed algorithm with personalization, quality detection, and viral recognition
 */
export const calculatePostScore = (post, user) => {
  try {
    // Guard against invalid inputs
    if (!post || !post.timestamp) return 0;
    
    const scores = {
      engagement: 0,
      quality: 0,
      personalization: 0,
      recency: 0,
      viral: 0,
      penalties: 0
    };
    
    // 1. BASE ENGAGEMENT SCORING
    scores.engagement = calculateEngagementScore(post);
    
    // 2. QUALITY ASSESSMENT
    scores.quality = calculateQualityScore(post);
    
    // 3. PERSONALIZATION (if user provided)
    if (user) {
      scores.personalization = calculatePersonalizationScore(post, user);
    }
    
    // 4. RECENCY AND TIME DECAY
    scores.recency = calculateRecencyScore(post);
    
    // 5. VIRAL DETECTION
    scores.viral = calculateViralScore(post);
    
    // 6. PENALTY ASSESSMENT
    scores.penalties = calculatePenalties(post);
    
    // 7. FINAL SCORE CALCULATION
    const rawScore = scores.engagement + scores.quality + scores.personalization + 
                     scores.recency + scores.viral + scores.penalties;
    
    const finalScore = Math.max(0, rawScore); // Ensure non-negative
    
    // 8. STORE METRICS IN FIREBASE
    if (user?.uid) {
      // Store metrics in Firebase (async, non-blocking)
      storePostMetrics(post, scores, finalScore, user.uid).catch(error => {
        console.error('[FeedAlgorithm] Failed to store metrics:', error);
      });
    }
    
    return finalScore;
    
  } catch (error) {
    console.error('[FeedAlgorithm] Error calculating score:', error);
    return 0;
  }
};

/**
 * Calculate engagement-based score
 */
const calculateEngagementScore = (post) => {
  const likes = post.likes?.length || post.likeCount || 0;
  const comments = post.comments?.length || post.commentCount || 0;
  const shares = post.shares?.length || post.shareCount || 0;
  const views = post.views || 0;
  
  // Calculate engagement velocity (engagement per hour)
  const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 3600);
  const engagementVelocity = hoursSincePost > 0 ? (likes + comments + shares) / hoursSincePost : 0;
  
  return (WEIGHTS.LIKES * likes) +
         (WEIGHTS.COMMENTS * comments) +
         (WEIGHTS.SHARES * shares) +
         (WEIGHTS.VIEWS * views) +
         (WEIGHTS.ENGAGEMENT_VELOCITY * engagementVelocity);
};

/**
 * Assess content quality
 */
const calculateQualityScore = (post) => {
  let qualityScore = 0;
  
  // Content length quality
  if (post.text) {
    const textLength = post.text.length;
    if (textLength > 10 && textLength < 500) qualityScore += 2;
    if (textLength > 500) qualityScore += 1; // Slightly penalize very long posts
  }
  
  // Media presence
  if (post.image || post.video) qualityScore += 3;
  
  // Comment quality assessment
  const comments = post.comments || [];
  const qualityComments = comments.filter(comment => 
    comment.text && comment.text.length > THRESHOLDS.HIGH_QUALITY_COMMENT_LENGTH
  ).length;
  qualityScore += WEIGHTS.COMMENT_QUALITY * qualityComments;
  
  // Content type modifier
  const contentType = post.image ? 'IMAGE' : post.video ? 'VIDEO' : 
                     post.link ? 'LINK' : 'TEXT';
  qualityScore *= WEIGHTS.CONTENT_TYPE[contentType];
  
  return qualityScore;
};

/**
 * Calculate personalization score based on user relationship
 */
const calculatePersonalizationScore = (post, user) => {
  let personalScore = 0;
  
  // Following relationship
  if (user.following?.includes(post.userId)) {
    personalScore += WEIGHTS.FOLLOWING_BONUS;
  }
  
  // Previous interaction history
  if (user.interactionHistory?.[post.userId]) {
    const interactionCount = user.interactionHistory[post.userId];
    personalScore += WEIGHTS.INTERACTION_HISTORY * Math.log(interactionCount + 1);
  }
  
  // Interest matching (hashtags, topics)
  if (post.hashtags && user.interests) {
    const matchingInterests = post.hashtags.filter(tag => 
      user.interests.includes(tag.toLowerCase())
    ).length;
    personalScore += WEIGHTS.INTEREST_MATCH * matchingInterests;
  }
  
  return personalScore;
};

/**
 * Calculate recency and time-based scoring
 */
const calculateRecencyScore = (post) => {
  const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 3600);
  
  // Fresh content boost
  if (hoursSincePost < TIME_DECAY.FRESH_HOURS) {
    return WEIGHTS.FRESHNESS_BOOST * (TIME_DECAY.FRESH_HOURS - hoursSincePost);
  }
  
  // Standard time decay
  const timeDecay = Math.pow(hoursSincePost + 1, TIME_DECAY.STANDARD);
  return 10 / timeDecay; // Base recency score
};

/**
 * Detect and score viral content
 */
const calculateViralScore = (post) => {
  const totalEngagement = (post.likes?.length || 0) + (post.comments?.length || 0) + 
                         (post.shares?.length || 0);
  const views = Math.max(post.views || totalEngagement * 10, 1); // Estimate views if not available
  
  const engagementRate = totalEngagement / views;
  
  // Viral detection
  if (engagementRate > THRESHOLDS.VIRAL_ENGAGEMENT_RATE) {
    const viralMultiplier = Math.min(engagementRate * 10, 5); // Cap at 5x
    return WEIGHTS.VIRAL_MULTIPLIER * viralMultiplier;
  }
  
  return 0;
};

/**
 * Calculate penalties for low-quality or spam content
 */
const calculatePenalties = (post) => {
  let penalties = 0;
  
  // Spam detection (basic)
  if (post.text) {
    const spamIndicators = ['buy now', 'click here', 'free money', '!!!', 'URGENT'];
    const spamCount = spamIndicators.filter(indicator => 
      post.text.toLowerCase().includes(indicator)
    ).length;
    penalties += WEIGHTS.SPAM_PENALTY * spamCount;
  }
  
  // Low engagement penalty for older posts
  const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 3600);
  const totalEngagement = (post.likes?.length || 0) + (post.comments?.length || 0);
  
  if (hoursSincePost > 24 && totalEngagement === 0) {
    penalties += WEIGHTS.LOW_QUALITY_PENALTY;
  }
  
  return penalties;
};

/**
 * Get algorithm performance metrics
 */
export const getAlgorithmMetrics = (posts) => {
  const scores = posts.map(post => calculatePostScore(post, null));
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  return {
    averageScore: avgScore,
    maxScore,
    minScore,
    scoreDistribution: {
      high: scores.filter(s => s > avgScore * 1.5).length,
      medium: scores.filter(s => s >= avgScore * 0.5 && s <= avgScore * 1.5).length,
      low: scores.filter(s => s < avgScore * 0.5).length
    }
  };
};