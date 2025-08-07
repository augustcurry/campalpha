import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

function EventsScreen({ navigation, setTabBarVisible }) {
  console.log('NEW EVENTS SCREEN CREATED!');
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>NEW EVENTS SCREEN WORKING!</Text>
        <Text style={styles.subtitle}>This is the updated Events screen</Text>
        <Text style={styles.description}>If you can see this, the file is loading correctly!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FF0000' 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default EventsScreen;