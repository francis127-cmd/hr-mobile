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
import { InviteUserScreen } from '../screens/InviteUserScreen';
import { ManageUsersScreen } from '../screens/ManageUsersScreen';
import { useAuth, canManageAll } from '../auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();
  const isAdmin = canManageAll(user);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: 'list-outline',
            Admin: 'shield-checkmark-outline',
            Profile: 'person-circle-outline',
          };
          return <Ionicons name={(icons[route.name] || 'ellipse') as any} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Requests' }} />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminTabs}
          options={{ title: 'Admin', headerShown: false }}
        />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator>
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} options={{ title: 'Manage Users' }} />
      <Stack.Screen name="InviteUser" component={InviteUserScreen} options={{ title: 'Invite User' }} />
    </Stack.Navigator>
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
          <Stack.Screen name="InviteUser" component={InviteUserScreen} options={{ title: 'Invite User' }} />
          <Stack.Screen name="ManageUsers" component={ManageUsersScreen} options={{ title: 'Manage Users' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
