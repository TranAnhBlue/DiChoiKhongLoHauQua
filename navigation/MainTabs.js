import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EventsListScreen from '../screens/EventsListScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let name = 'list';
          if (route.name === 'Map') name = 'map';
          if (route.name === 'Profile') name = 'person';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Events" component={EventsListScreen} options={{ title: 'Sự kiện' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Bản đồ' }} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Cá nhân',
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 12 }} onPress={() => navigation.navigate('Profile', { edit: true })}>
              <Ionicons name="create-outline" size={20} color="#8E2DE2" />
            </TouchableOpacity>
          ),
        })}
      />
    </Tab.Navigator>
  );
}
