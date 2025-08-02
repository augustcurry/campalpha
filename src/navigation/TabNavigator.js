import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import DiscoverScreen from '../screens/DiscoverScreen';
import EventsScreen from '../screens/EventsScreen';
import MapScreen from '../screens/MapScreen';
import SearchScreen from '../screens/SearchScreen';

const Tab = createBottomTabNavigator();

function TabNavigator({ navigation }) { // It now receives navigation prop from the stack
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
      <Tab.Screen 
        name="Discover" 
        options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="compass" color={color} size={30} />)}}
      >
        {/* Pass the stack's navigation prop down to the screen */}
        {(props) => <DiscoverScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="calendar-star" color={color} size={30} />) }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="map-marker" color={color} size={30} />) }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="magnify" color={color} size={30} />) }} />
    </Tab.Navigator>
  );
}

export default TabNavigator;
