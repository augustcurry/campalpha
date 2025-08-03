// src/components/AnalyticsDashboard.js

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Analytics Dashboard Component
 * Displays post metrics and algorithm performance data
 */
export default function AnalyticsDashboard({ userId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch recent post metrics for this user
        const metricsQuery = query(
          collection(db, 'analytics', 'posts', 'metrics'),
          where('userId', '==', userId),
          orderBy('calculatedAt', 'desc'),
          limit(10)
        );
        
        const metricsSnapshot = await getDocs(metricsQuery);
        const postMetrics = [];
        
        metricsSnapshot.forEach((doc) => {
          postMetrics.push({ id: doc.id, ...doc.data() });
        });
        
        // Fetch algorithm performance data
        const algorithmQuery = query(
          collection(db, 'analytics', 'algorithm', 'performance'),
          where('userId', '==', userId),
          orderBy('calculatedAt', 'desc'),
          limit(5)
        );
        
        const algorithmSnapshot = await getDocs(algorithmQuery);
        const algorithmMetrics = [];
        
        algorithmSnapshot.forEach((doc) => {
          algorithmMetrics.push({ id: doc.id, ...doc.data() });
        });
        
        setMetrics({
          postMetrics,
          algorithmMetrics,
          summary: calculateSummary(postMetrics)
        });
        
      } catch (err) {
        setError(err.message);
        console.error('[AnalyticsDashboard] Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [userId]);
  
  const calculateSummary = (postMetrics) => {
    if (postMetrics.length === 0) return null;
    
    const totalScore = postMetrics.reduce((sum, metric) => sum + metric.finalScore, 0);
    const avgScore = totalScore / postMetrics.length;
    
    const avgEngagement = postMetrics.reduce((sum, metric) => 
      sum + metric.postMetrics.totalEngagement, 0) / postMetrics.length;
    
    return {
      averageScore: avgScore.toFixed(2),
      averageEngagement: avgEngagement.toFixed(1),
      totalPosts: postMetrics.length,
      highestScore: Math.max(...postMetrics.map(m => m.finalScore)).toFixed(2)
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1DA1F2" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading analytics: {error}</Text>
      </View>
    );
  }

  if (!metrics || metrics.postMetrics.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No analytics data available yet.</Text>
        <Text style={styles.emptySubtext}>Post some content to see your metrics!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analytics Dashboard</Text>
      
      {/* Summary Section */}
      {metrics.summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.summary.averageScore}</Text>
              <Text style={styles.summaryLabel}>Avg Score</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.summary.averageEngagement}</Text>
              <Text style={styles.summaryLabel}>Avg Engagement</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.summary.totalPosts}</Text>
              <Text style={styles.summaryLabel}>Posts Analyzed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.summary.highestScore}</Text>
              <Text style={styles.summaryLabel}>Best Score</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Recent Posts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Post Scores</Text>
        {metrics.postMetrics.slice(0, 5).map((metric, index) => (
          <View key={metric.id} style={styles.postItem}>
            <View style={styles.postHeader}>
              <Text style={styles.postTitle} numberOfLines={1}>
                {metric.contentPreview || 'No content'}
              </Text>
              <Text style={styles.postScore}>{metric.finalScore}</Text>
            </View>
            <View style={styles.scoreBreakdown}>
              <Text style={styles.scoreDetail}>
                Engagement: {metric.scores.engagement} | 
                Quality: {metric.scores.quality} | 
                Viral: {metric.scores.viral}
              </Text>
            </View>
            <Text style={styles.postEngagement}>
              {metric.postMetrics.likes} likes • {metric.postMetrics.comments} comments
            </Text>
          </View>
        ))}
      </View>
      
      {/* Algorithm Performance Section */}
      {metrics.algorithmMetrics.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Algorithm Performance</Text>
          {metrics.algorithmMetrics.slice(0, 3).map((algo, index) => (
            <View key={algo.id} style={styles.algoItem}>
              <Text style={styles.algoTitle}>
                Session {index + 1} • {algo.totalPosts} posts
              </Text>
              <Text style={styles.algoDetail}>
                Avg: {algo.metrics.averageScore} | 
                Max: {algo.metrics.maxScore} | 
                Min: {algo.metrics.minScore}
              </Text>
              <Text style={styles.algoDistribution}>
                High: {algo.metrics.scoreDistribution.high} | 
                Medium: {algo.metrics.scoreDistribution.medium} | 
                Low: {algo.metrics.scoreDistribution.low}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  summaryValue: {
    color: '#1DA1F2',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  postItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  postScore: {
    color: '#1DA1F2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreBreakdown: {
    marginBottom: 8,
  },
  scoreDetail: {
    color: '#8E8E93',
    fontSize: 12,
  },
  postEngagement: {
    color: '#8E8E93',
    fontSize: 12,
  },
  algoItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  algoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  algoDetail: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  algoDistribution: {
    color: '#8E8E93',
    fontSize: 12,
  },
});
