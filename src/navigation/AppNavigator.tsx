import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from './types';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DepartmentScreen } from '../screens/DepartmentScreen';
import { CreateRequestScreen } from '../screens/CreateRequestScreen';
import { RequestDetailScreen } from '../screens/RequestDetailScreen';
import { DepartmentQueueScreen } from '../screens/DepartmentQueueScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAuth } from '../auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: 'list-outline',
            Profile: 'person-circle-outline',
          };
          return <Ionicons name={(icons[route.name] || 'ellipse') as any} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Requests' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'New Request' }} />
          <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request' }} />
          <Stack.Screen name="DepartmentQueue" component={DepartmentQueueScreen} options={{ title: 'Department Queue' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
