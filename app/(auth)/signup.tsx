import { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignupScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (user) {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: name,
              role: 'student', // Default role is student
            },
          ]);

        if (profileError) throw profileError;
      }

      Alert.alert(
        'Success',
        'Account created successfully! Please login to continue.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
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
        <Text h2 style={styles.title}>Join Jain Pathshala</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.form}>
          <Input
            placeholder="Full Name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError('');
            }}
            leftIcon={{ type: 'ionicon', name: 'person-outline' }}
            autoCapitalize="words"
            disabled={loading}
          />

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
          }

          <Button
            title={loading ? "Creating Account..." : "Sign Up"}
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            containerStyle={styles.buttonContainer}
            buttonStyle={styles.button}
          />

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/login" style={styles.link}>
              <Text style={styles.linkText}>Login here</Text>
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
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  link: {
    marginLeft: 5,
  },
  linkText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
});