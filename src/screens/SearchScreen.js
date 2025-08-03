import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

function SearchScreen({ setTabBarVisible }) {
  // Ensure tab bar is visible on this screen
  React.useEffect(() => {
    if (setTabBarVisible) {
      setTabBarVisible(true);
    }
  }, [setTabBarVisible]);

  const searchData = [ { id: 's1', text: 'Tuition Increase' }, { id: 's2', text: 'Milwaukee blows up' }, { id: 's3', text: 'Congress: "We give up"' }, { id: 's4', text: 'Cuomo announces bid for Minister of Israel' }, { id: 's5', text: 'TRUMP signs "Jim Crow Bill"' }, { id: 's6', text: 'Chicago to elect nobody as mayor' }, ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#8E8E93" />
          <TextInput placeholder="Search" placeholderTextColor="#8E8E93" style={styles.searchInput}/>
        </View>
        <MaterialCommunityIcons name="information-outline" size={26} color="#8E8E93" />
      </View>
      {/* A FlatList would go here for actual search results */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  searchHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 10, paddingHorizontal: 10, marginRight: 10 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 8 },
});

export default SearchScreen;
