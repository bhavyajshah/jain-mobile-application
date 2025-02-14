import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Avatar, Input } from '@rneui/themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    streak: 0,
    lastAttendance: null,
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchUserProfile();
    fetchStats();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    // In a real app, fetch user's name from a profiles table
    setName(user?.phone || '');
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!data) return;

      // Calculate streak
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const record of data) {
        const attendanceDate = new Date(record.date);
        attendanceDate.setHours(0, 0, 0, 0);

        if (currentDate.getTime() - attendanceDate.getTime() <= 24 * 60 * 60 * 1000) {
          streak++;
          currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }

      setStats({
        totalClasses: data.length,
        streak,
        lastAttendance: data[0]?.date,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <View style={styles.header}>
          <Avatar
            rounded
            size="large"
            icon={{ name: 'user', type: 'font-awesome' }}
            containerStyle={styles.avatar}
          />
          {editing ? (
            <Input
              value={name}
              onChangeText={setName}
              containerStyle={styles.nameInput}
              onSubmitEditing={() => setEditing(false)}
            />
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text h4 style={styles.name}>{name}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={24} color="#FF6B6B" />
            <Text style={styles.statNumber}>{stats.totalClasses}</Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flame" size={24} color="#FF6B6B" />
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {stats.lastAttendance && (
          <View style={styles.lastAttendance}>
            <Text style={styles.lastAttendanceLabel}>Last Attendance:</Text>
            <Text style={styles.lastAttendanceDate}>
              {new Date(stats.lastAttendance).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        <Button
          title="Logout"
          onPress={handleLogout}
          buttonStyle={styles.logoutButton}
          titleStyle={styles.logoutButtonText}
        />
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title h4>App Information</Card.Title>
        <Text style={styles.infoText}>
          Welcome to Jain Pathshala! This app helps you track your attendance and progress
          in your spiritual journey. Regular attendance in classes will help you learn
          and grow in the principles of Jainism.
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  card: {
    borderRadius: 10,
    padding: 20,
    margin: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    backgroundColor: '#FF6B6B',
    marginBottom: 10,
  },
  name: {
    color: '#333',
    marginBottom: 5,
  },
  nameInput: {
    width: 200,
    marginBottom: 5,
  },
  phone: {
    color: '#666',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  lastAttendance: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  lastAttendanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lastAttendanceDate: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});