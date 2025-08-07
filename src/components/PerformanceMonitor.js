import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import dataFetcher from '../services/dataSyncService';

export default function PerformanceMonitor({ visible = false }) {
  const [metrics, setMetrics] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const updateMetrics = () => {
      const currentMetrics = dataFetcher.getPerformanceMetrics();
      setMetrics(currentMetrics);
    };

    // Update metrics immediately
    updateMetrics();

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible || !metrics) return null;

  const getPerformanceColor = (value, threshold) => {
    if (value >= threshold * 0.8) return '#4CAF50'; // Good
    if (value >= threshold * 0.6) return '#FF9800'; // Warning
    return '#F44336'; // Poor
  };

  const getCacheHitRateColor = (rate) => {
    if (rate >= 0.8) return '#4CAF50';
    if (rate >= 0.6) return '#FF9800';
    return '#F44336';
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="chart-line" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Performance Metrics</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.metricsContainer}>
              {/* Cache Performance */}
              <View style={styles.metricSection}>
                <Text style={styles.sectionTitle}>Cache Performance</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Hit Rate:</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: getCacheHitRateColor(metrics.cacheHitRate) }
                  ]}>
                    {(metrics.cacheHitRate * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Cache Size:</Text>
                  <Text style={styles.metricValue}>{metrics.cacheSize} items</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Cache Hits:</Text>
                  <Text style={styles.metricValue}>{metrics.cacheHits}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Cache Misses:</Text>
                  <Text style={styles.metricValue}>{metrics.cacheMisses}</Text>
                </View>
              </View>

              {/* Network Performance */}
              <View style={styles.metricSection}>
                <Text style={styles.sectionTitle}>Network Performance</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Avg Fetch Time:</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: getPerformanceColor(metrics.averageFetchTime, 1000) }
                  ]}>
                    {metrics.averageFetchTime.toFixed(0)}ms
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Active Listeners:</Text>
                  <Text style={styles.metricValue}>{metrics.activeListeners}</Text>
                </View>
              </View>

              {/* Memory Usage */}
              <View style={styles.metricSection}>
                <Text style={styles.sectionTitle}>Memory Usage</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Memory Usage:</Text>
                  <Text style={styles.metricValue}>{metrics.memoryUsage} items</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Last Cleanup:</Text>
                  <Text style={styles.metricValue}>
                    {new Date(metrics.lastCleanup).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              {/* Performance Status */}
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Overall Status</Text>
                <View style={styles.statusIndicator}>
                  <View style={[
                    styles.statusDot,
                    { 
                      backgroundColor: metrics.cacheHitRate >= 0.7 && 
                      metrics.averageFetchTime < 1000 ? '#4CAF50' : '#FF9800' 
                    }
                  ]} />
                  <Text style={styles.statusText}>
                    {metrics.cacheHitRate >= 0.7 && metrics.averageFetchTime < 1000 
                      ? 'Optimal' 
                      : 'Needs Attention'
                    }
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                dataFetcher.cleanup();
                setMetrics(dataFetcher.getPerformanceMetrics());
              }}
            >
              <Text style={styles.refreshButtonText}>Refresh & Cleanup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(29, 161, 242, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  metricsContainer: {
    flex: 1,
  },
  metricSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statusSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  refreshButton: {
    backgroundColor: '#1DA1F2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});