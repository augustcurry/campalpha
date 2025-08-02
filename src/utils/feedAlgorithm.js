// src/utils/feedAlgorithm.js

// Example scoring config
const W_BASE = 1.0;
const W_LIKES = 1.0;
const W_COMMENTS = 5.0;
const W_SHARES = 10.0;
const DECAY = 1.8;

/**
 * Calculates score based on likes/comments/shares and time decay
 */
export const calculatePostScore = (post, user) => {
  // Guard against undefined post
  if (!post) return 0;

  const engagementScore = (W_LIKES * (post.likes?.length || 0)) +
                          (W_COMMENTS * (post.comments?.length || 0)) +
                          (W_SHARES * (post.shares || 0));
  
  const hoursSincePost = (Date.now() - (post.timestamp || 0)) / (1000 * 3600);
  const timeDecay = Math.pow(hoursSincePost + 1, DECAY);

  return (engagementScore / timeDecay) * W_BASE;
};