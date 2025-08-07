import React, { useState, useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Animated, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import DiscoverScreen from '../screens/DiscoverScreen';
import EventsScreen from '../screens/EventsScreen.js';
import MapScreen from '../screens/MapScreen';
import SearchScreen from '../screens/SearchScreen';

const Tab = createBottomTabNavigator();

function AnimatedTabBar({ state, descriptors, navigation, tabBarVisible }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: tabBarVisible ? 0 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: tabBarVisible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabBarVisible]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        transform: [{ translateY }],
        opacity,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingBottom: 20,
          paddingTop: 10,
          zIndex: 10,
        }}
      >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconColor = isFocused ? '#FFFFFF' : '#8E8E93';
        
        return (
          <TouchableOpacity
            key={route.key}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onPress}
          >
            {options.tabBarIcon && options.tabBarIcon({ color: iconColor })}
          </TouchableOpacity>
        );
      })}
      </View>
    </Animated.View>
  );
}

function TabNavigator({ navigation }) {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
      tabBar={(props) => <AnimatedTabBar {...props} tabBarVisible={tabBarVisible} />}
    >
      <Tab.Screen 
        name="Discover" 
        options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="compass" color={color} size={30} />)}}
      >
        {(props) => <DiscoverScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Events" 
        options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="calendar-star" color={color} size={30} />) }}
      >
        {(props) => <EventsScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Map" 
        options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="map-marker" color={color} size={30} />) }}
      >
        {(props) => <MapScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Search" 
        options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="magnify" color={color} size={30} />) }}
      >
        {(props) => <SearchScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default TabNavigator;
