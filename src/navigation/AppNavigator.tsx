import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from './types';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AcceptInviteScreen } from '../screens/AcceptInviteScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DepartmentScreen } from '../screens/DepartmentScreen';
import { CreateRequestScreen } from '../screens/CreateRequestScreen';
import { RequestDetailScreen } from '../screens/RequestDetailScreen';
import { DepartmentQueueScreen } from '../screens/DepartmentQueueScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { InviteUserScreen } from '../screens/InviteUserScreen';
import { ManageUsersScreen } from '../screens/ManageUsersScreen';
import { CompanySetupScreen } from '../screens/CompanySetupScreen';
import { SSOSettingsScreen } from '../screens/SSOSettingsScreen';
import { RegisterCompanyScreen } from '../screens/RegisterCompanyScreen';
import { MfaSetupScreen } from '../screens/MfaSetupScreen';
import { MfaChallengeScreen } from '../screens/MfaChallengeScreen';
import { MfaSettingsScreen } from '../screens/MfaSettingsScreen';
import { OidcProvidersScreen } from '../screens/OidcProvidersScreen';
import { useAuth, canManageAll } from '../auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator();
const AdminStack = createNativeStackNavigator();

function AdminTabs() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
      }}
    >
      <AdminStack.Screen
        name="ManageUsers"
        component={ManageUsersScreen}
        options={{ title: 'Manage Users' }}
      />
      <AdminStack.Screen
        name="InviteUser"
        component={InviteUserScreen}
        options={{ title: 'Invite User' }}
      />
      <AdminStack.Screen
        name="SSOSettings"
        component={SSOSettingsScreen}
        options={{ title: 'SSO Settings' }}
      />
      <AdminStack.Screen
        name="MfaSettings"
        component={MfaSettingsScreen}
        options={{ title: 'MFA Settings' }}
      />
      <AdminStack.Screen
        name="OidcProviders"
        component={OidcProvidersScreen}
        options={{ title: 'OIDC Providers' }}
      />
    </AdminStack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isAdmin = canManageAll(user);

  return (
    <MainTab.Navigator
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
        lazy: true,
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} options={{ title: 'Requests' }} />
      {isAdmin && (
        <MainTab.Screen
          name="Admin"
          component={AdminTabs}
          options={{ title: 'Admin', headerShown: false }}
        />
      )}
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading, newCompany, mfaRequired, mfaToken } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        animation: 'default',
      }}
    >
      {!user ? (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          <RootStack.Screen name="AcceptInvite" component={AcceptInviteScreen} options={{ title: 'Accept Invitation' }} />
          <RootStack.Screen name="RegisterCompany" component={RegisterCompanyScreen} options={{ title: 'Register Company' }} />
          <RootStack.Screen name="MfaChallenge" component={MfaChallengeScreen} options={{ title: 'MFA Verification' }} />
        </>
      ) : newCompany ? (
        <RootStack.Screen name="CompanySetup" component={CompanySetupScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <RootStack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'New Request' }} />
          <RootStack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request' }} />
          <RootStack.Screen name="DepartmentQueue" component={DepartmentQueueScreen} options={{ title: 'Department Queue' }} />
          <RootStack.Screen name="MfaSetup" component={MfaSetupScreen} options={{ title: 'MFA Setup' }} />
          <RootStack.Screen name="MfaSettings" component={MfaSettingsScreen} options={{ title: 'MFA Settings' }} />
          <RootStack.Screen name="OidcProviders" component={OidcProvidersScreen} options={{ title: 'OIDC Providers' }} />
        </>
      )}
    </RootStack.Navigator>
  );
}
