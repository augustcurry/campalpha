import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Image, KeyboardAvoidingView, Keyboard, Platform, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Autocomplete from 'react-native-autocomplete-input';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DiscoverScreen from './src/screens/DiscoverScreen';
import NewPostScreen from './src/screens/NewPostScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import EventsScreen from './src/screens/EventsScreen';
import MapScreen from './src/screens/MapScreen';
import SearchScreen from './src/screens/SearchScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';

// --- University Autocomplete Component ---
function UniversityAutocomplete({ value, onChange, inputStyle, placeholder }) {
  // ...existing code...
}


// --- TAB NAVIGATOR COMPONENT ---
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
function TabNavigator({ navigation }) {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          display: tabBarVisible ? 'flex' : 'none',
          backgroundColor: '#000000',
          borderTopWidth: 0.5,
          borderTopColor: '#2F2F2F',
          paddingTop: 10,
        },
      }}>
      <Tab.Screen name="Discover" options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="compass" color={color} size={30} />)}}>
        {(props) => <DiscoverScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
      <Tab.Screen name="Events" options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="calendar-star" color={color} size={30} />) }}>
        {(props) => <EventsScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="map-marker" color={color} size={30} />) }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="magnify" color={color} size={30} />) }} />
      {/* Profile tab removed; now accessed from header button */}
    </Tab.Navigator>
  );
}

// --- ROOT STACK NAVIGATOR ---
function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="NewPost" component={NewPostScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  console.log('APP VERSION: 2.0 - UPDATED!');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={DarkTheme}>
        {user ? <RootStack /> : <AuthScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --- Stylesheets ---
const AVATAR_SIZE = 120;
const styles = StyleSheet.create({
  editGlow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
    backgroundColor: 'rgba(29,161,242,0.10)',
    borderRadius: 14,
    padding: 10,
  },
  avatarGlow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 18,
    borderRadius: AVATAR_SIZE / 2 + 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    padding: 12,
  },
  editPicOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioSection: {
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  bioText: {
    color: '#D1D1D6',
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    maxWidth: 340,
  },
  profileTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#232325',
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  profileTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  profileTabActive: {
    borderBottomColor: '#1DA1F2',
    backgroundColor: 'rgba(29,161,242,0.07)',
  },
  profileTabText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  profileTabTextActive: {
    color: '#1DA1F2',
    fontWeight: 'bold',
  },
  safeArea: { flex: 1, backgroundColor: '#000000', },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#FFFFFF', fontSize: 20, },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', },
  listContent: { paddingBottom: 50, },
  postCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  avatar: { marginRight: 12, },
  postContent: { flex: 1, },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  nameText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 4, },
  handleText: { color: '#8E8E93', marginRight: 4, },
  locationText: { color: '#8E8E93', },
  bodyText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12, },
  searchHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 10, paddingHorizontal: 10, marginRight: 10, },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 8, },
  searchResultItem: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  searchResultText: { color: '#FFFFFF', fontSize: 16, },
  // New Post Screen Styles
  newPostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, },
  newPostCancel: { color: '#1DA1F2', fontSize: 16, },
  newPostButton: { backgroundColor: '#1DA1F2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, },
  newPostButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, },
  newPostInput: { color: '#FFFFFF', fontSize: 20, padding: 16, },
  newPostToolbarKeyboard: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#18181A',
    borderTopWidth: 1,
    borderTopColor: '#232325',
  },
  // Profile Info Card Styles
  profileInfoCard: {
    backgroundColor: '#18181A',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfoCardNew: {
    backgroundColor: '#18181A',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  profileInfoItemCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    width: '100%',
    gap: 10,
  },
  profileInfoRowHorizontalNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 18,
    marginBottom: 6,
  },
  profileInfoColIconOnlyNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
    justifyContent: 'center',
  },
  profileInfoValueLarge: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    flexShrink: 1,
    fontWeight: '500',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileInfoRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
    gap: 6,
  },
  profileInfoLabelCentered: {
    color: '#8E8E93',
    fontSize: 16,
    marginRight: 6,
    textAlign: 'center',
    minWidth: 70,
  },
  profileInfoValueCentered: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    flexShrink: 1,
  },
  profileInfoRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  profileInfoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 2,
  },
  profileInfoColIconOnly: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
  },
  profileInfoRowCenteredIconOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
    gap: 8,
  },
  profileInfoLabel: {
    color: '#8E8E93',
    fontSize: 16,
    minWidth: 70,
    marginRight: 6,
  },
  profileInfoValue: {
    color: '#fff',
    fontSize: 16,
    flexShrink: 1,
  },
});

const authStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', alignSelf: 'center', marginBottom: 30 },
  input: { backgroundColor: '#1C1C1E', color: '#fff', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, marginHorizontal: 20 },
  button: { backgroundColor: '#1DA1F2', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, marginHorizontal: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { color: '#1DA1F2', alignSelf: 'center' },
  error: { color: 'red', alignSelf: 'center', marginBottom: 10, marginHorizontal: 20 },
  datePickerButton: { backgroundColor: '#1C1C1E', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 10, marginBottom: 15, marginHorizontal: 20, },
  datePickerButtonText: { color: '#fff', fontSize: 16, },
});
