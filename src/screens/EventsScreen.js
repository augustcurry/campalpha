import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

function EventsScreen({ setTabBarVisible }) {
  // Ensure tab bar is visible on this screen
  React.useEffect(() => {
    if (setTabBarVisible) {
      setTabBarVisible(true);
    }
  }, [setTabBarVisible]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.text}>Events Screen</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#FFFFFF', fontSize: 20 },
});

export default EventsScreen;
