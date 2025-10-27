import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 70,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        },
        tabBarItemStyle: {
          borderRadius: 16,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'index') {
            return <Ionicons name="home" size={size} color={color} />;
          }
          if (route.name === 'explorar') {
            return <Ionicons name="football" size={size} color={color} />;
          }
          if (route.name === 'organizar') {
            return <Ionicons name="construct" size={size} color={color} />;
          }
          if (route.name === 'dashboard') {
            return <Ionicons name="person-circle" size={size} color={color} />;
          }
          return <Ionicons name="ellipse" size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="organizar" options={{ title: 'Organizar' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
