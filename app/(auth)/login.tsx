import { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1567447615075-6632d1e3fb16?w=500' }}
          style={styles.logo}
        />
        <Text h2 style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue learning</Text>

        <View style={styles.form}>
          <Input
            placeholder="Email Address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            leftIcon={{ type: 'ionicon', name: 'mail-outline' }}
            autoCapitalize="none"
            keyboardType="email-address"
            disabled={loading}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            leftIcon={{ type: 'ionicon', name: 'lock-closed-outline' }}
            secureTextEntry
            disabled={loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}


          <Button
            title={loading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            containerStyle={styles.buttonContainer}
            buttonStyle={styles.button}
          />

          <View style={styles.signupLink}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <Text style={styles.linkText}>Sign up here</Text>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  title: {
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 15,
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
  },
  linkText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
});