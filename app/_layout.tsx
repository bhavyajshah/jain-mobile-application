import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@rneui/themed';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const theme = {
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: '#F7F7F7',
  },
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const inProtectedRoute = segments[0] === '(tabs)';
        
        if (!session && inProtectedRoute) {
          router.replace('/login');
        } else if (session && !inProtectedRoute) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!initialized) return;
      
      const inProtectedRoute = segments[0] === '(tabs)';
      
      if (!session && inProtectedRoute) {
        router.replace('/login');
      } else if (session && !inProtectedRoute) {
        router.replace('/(tabs)');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, segments, initialized]);

  if (isLoading || !initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <StatusBar style="auto" />
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}