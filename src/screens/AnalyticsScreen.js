// src/screens/AnalyticsScreen.js

import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { auth } from '../../firebase';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

/**
 * Analytics Screen
 * Displays user's post metrics and algorithm performance
 */
export default function AnalyticsScreen({ navigation }) {
  const currentUser = auth.currentUser;

  return (
    <SafeAreaView style={styles.container}>
      <AnalyticsDashboard userId={currentUser?.uid} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
