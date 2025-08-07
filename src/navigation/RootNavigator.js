import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import NewPostScreen from '../screens/NewPostScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="NewPost" component={NewPostScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

export default RootStack;
