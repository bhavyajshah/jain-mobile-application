import { Stack } from 'expo-router';
import { Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function AdminLayout() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: '#FF6B6B',
      },
      headerTintColor: '#fff',
      headerRight: () => (
        <Button
          type="clear"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={24} color="white" />}
        />
      ),
    }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="students"
        options={{
          title: 'Manage Students',
        }}
      />
      <Stack.Screen
        name="gathas"
        options={{
          title: 'Manage Gathas',
        }}
      />
      <Stack.Screen
        name="schedules"
        options={{
          title: 'Manage Schedules',
        }}
      />
      <Stack.Screen
        name="attendance"
        options={{
          title: 'Attendance Requests',
        }}
      />
    </Stack>
  );
}