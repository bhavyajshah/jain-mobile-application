import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Button, Card } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceRequest, setAttendanceRequest] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [gathaCount, setGathaCount] = useState(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [completedGathas, setCompletedGathas] = useState<any[]>([]);
  interface UserProfile {
    full_name: string;
    // Add other properties as needed
  }

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              role: 'student',
              full_name: user.user_metadata?.full_name || 'Student'
            }, {
              onConflict: 'id'
            })
            .select()
            .single();

          if (createError) throw createError;
          return newProfile;
        }
        throw profileError;
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkAttendanceRequest(),
        calculateStreak(),
        fetchStudentGathaCount(),
        fetchTodaySchedules(),
        fetchCompletedGathas()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const profile = await fetchUserProfile();
        setUserProfile(profile);

        if (profile) {
          await Promise.all([
            checkAttendanceRequest(),
            calculateStreak(),
            fetchStudentGathaCount(),
            fetchTodaySchedules(),
            fetchCompletedGathas()
          ]);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load data. Pull down to refresh.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const requestAttendance = async () => {
    if (attendanceRequest) {
      Alert.alert('Already Requested', 'You have already requested attendance for today.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Ensure profile exists
      const profile = await fetchUserProfile();
      if (!profile) throw new Error('Failed to verify user profile');

      // Create attendance request
      const { error: requestError } = await supabase
        .from('attendance_requests')
        .insert([
          {
            student_id: user.id,
            date: new Date().toISOString(),
            status: 'pending'
          }
        ]);

      if (requestError) throw requestError;

      Alert.alert('Success', 'Attendance request submitted successfully!');
      await checkAttendanceRequest();
    } catch (error) {
      console.error('Request attendance error:', error);
      setError('Failed to submit attendance request. Please try again.');
      Alert.alert('Error', 'Failed to submit attendance request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkAttendanceRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('attendance_requests')
        .select('*')
        .eq('student_id', user.id)
        .gte('date', today.toISOString())
        .lt('date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (error) throw error;
      setAttendanceRequest(data);
    } catch (error) {
      console.error('Error checking attendance request:', error);
      setError('Failed to check attendance status.');
    }
  };

  const calculateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: attendanceData, error } = await supabase
        .from('attendance_requests')
        .select('date, status')
        .eq('student_id', user.id)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;

      if (!attendanceData || attendanceData.length === 0) {
        setStreak(0);
        return;
      }

      let currentStreak = 0;
      let lastDate = new Date();
      lastDate.setHours(0, 0, 0, 0);

      for (const record of attendanceData) {
        const attendanceDate = new Date(record.date);
        attendanceDate.setHours(0, 0, 0, 0);

        const daysDifference = Math.floor((lastDate.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDifference <= 1) {
          currentStreak++;
          lastDate = attendanceDate;
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error('Error calculating streak:', error);
    }
  };

  const fetchStudentGathaCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('student_gathas')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);

      if (error) throw error;
      setGathaCount(count || 0);
    } catch (error) {
      console.error('Error fetching gatha count:', error);
    }
  };

  const fetchTodaySchedules = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_schedules')
        .select('*')
        .eq('date', today)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchCompletedGathas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('student_gathas')
        .select(`
          *,
          gatha:gathas(title)
        `)
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setCompletedGathas(data || []);
    } catch (error) {
      console.error('Error fetching completed gathas:', error);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const getAttendanceStatus = () => {
    if (!attendanceRequest) return null;

    switch (attendanceRequest.status) {
      case 'approved':
        return {
          icon: 'checkmark-circle' as 'checkmark-circle',
          color: '#4CAF50',
          text: "Today's Attendance Marked",
          time: new Date(attendanceRequest.updated_at).toLocaleTimeString()
        };
      case 'rejected':
        return {
          icon: 'close-circle' as 'close-circle',
          color: '#FF6B6B',
          text: 'Attendance Request Rejected',
          time: new Date(attendanceRequest.updated_at).toLocaleTimeString()
        };
      default:
        return {
          icon: 'time' as 'time',
          color: '#FFA726',
          text: 'Attendance Under Review',
          time: new Date(attendanceRequest.created_at).toLocaleTimeString()
        };
    }
  };

  const status = getAttendanceStatus();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card containerStyle={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <Ionicons name="sunny" size={32} color="#FF6B6B" />
          <Text h4 style={styles.welcomeText}>
            Welcome, {userProfile?.full_name || 'Student'}
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Card>

      {error && (
        <Card containerStyle={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <Card containerStyle={styles.attendanceCard}>
        {status ? (
          <View style={styles.markedContainer}>
            <Ionicons name={status.icon} size={48} color={status.color} />
            <Text style={[styles.markedText, { color: status.color }]}>
              {status.text}
            </Text>
            <Text style={styles.markedTime}>
              {status.time}
            </Text>
          </View>
        ) : (
          <Button
            title={loading ? "Requesting..." : "Request Today's Attendance"}
            onPress={requestAttendance}
            loading={loading}
            disabled={loading}
            icon={
              <View style={styles.buttonIconContainer}>
                <Ionicons name="hand-right" size={24} color="white" />
              </View>
            }
            buttonStyle={styles.button}
            raised
          />
        )}
      </Card>

      <View style={styles.statsRow}>
        <Card containerStyle={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="flame" size={32} color="#FF6B6B" />
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </Card>

        <Card containerStyle={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="book" size={32} color="#FF6B6B" />
            <Text style={styles.statNumber}>{gathaCount}</Text>
            <Text style={styles.statLabel}>Gathas Learned</Text>
          </View>
        </Card>
      </View>

      {completedGathas.length > 0 && (
        <Card containerStyle={styles.gathasCard}>
          <Card.Title h4>Recently Completed Gathas</Card.Title>
          {completedGathas.map((item: any) => (
            <View key={item.id} style={styles.gathaItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <View style={styles.gathaText}>
                <Text style={styles.gathaTitle}>{item.gatha.title}</Text>
                <Text style={styles.gathaDate}>
                  {new Date(item.completed_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Card containerStyle={styles.scheduleCard}>
        <Card.Title h4>Today's Schedule</Card.Title>
        {schedules.length === 0 ? (
          <Text style={styles.noSchedule}>No schedules for today</Text>
        ) : (
          schedules.map((schedule: any) => (
            <View key={schedule.id} style={styles.scheduleItem}>
              <Ionicons name="time" size={24} color="#FF6B6B" />
              <View style={styles.scheduleText}>
                <Text style={styles.scheduleTime}>
                  {schedule.start_time} - {schedule.end_time}
                </Text>
                <Text style={styles.scheduleSubject}>{schedule.title}</Text>
                {schedule.description && (
                  <Text style={styles.scheduleDescription}>
                    {schedule.description}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  welcomeCard: {
    borderRadius: 15,
    padding: 20,
    margin: 20,
    marginBottom: 10,
    backgroundColor: '#FFF',
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    marginLeft: 10,
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  errorCard: {
    borderRadius: 15,
    padding: 15,
    margin: 20,
    marginTop: 0,
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
  attendanceCard: {
    borderRadius: 15,
    padding: 20,
    margin: 20,
    marginTop: 10,
    backgroundColor: '#FFF',
    elevation: 4,
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 15,
  },
  buttonIconContainer: {
    marginRight: 10,
  },
  markedContainer: {
    alignItems: 'center',
    padding: 20,
  },
  markedText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  markedTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    margin: 0,
    marginHorizontal: 5,
    backgroundColor: '#FFF',
    elevation: 4,
  },
  statContent: {
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
  gathasCard: {
    borderRadius: 15,
    padding: 20,
    margin: 20,
    backgroundColor: '#FFF',
    elevation: 4,
  },
  gathaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gathaText: {
    marginLeft: 15,
    flex: 1,
  },
  gathaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  gathaDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scheduleCard: {
    borderRadius: 15,
    padding: 20,
    margin: 20,
    backgroundColor: '#FFF',
    elevation: 4,
  },
  noSchedule: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleText: {
    marginLeft: 15,
    flex: 1,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleSubject: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 4,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});