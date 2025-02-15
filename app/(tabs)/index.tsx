import { useState, useEffect, useCallback } from 'react';
import { View, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
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
  const [userProfile, setUserProfile] = useState<any>(null);
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

      const profile = await fetchUserProfile();
      if (!profile) throw new Error('Failed to verify user profile');

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

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text className="mt-2 text-gray-600">Loading...</Text>
      </View>
    );
  }

  const status = getAttendanceStatus();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card containerStyle={{ borderRadius: 15, margin: 20 }}>
        <View className="flex-row items-center mb-2">
          <Ionicons name="sunny" size={32} color="#FF6B6B" />
          <Text h4 className="ml-2 text-gray-800">
            Welcome, {userProfile?.full_name || 'Student'}
          </Text>
        </View>
        <Text className="text-gray-600 text-base">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Card>

      {error && (
        <Card containerStyle={{ borderRadius: 15, margin: 20, backgroundColor: '#FFE5E5' }}>
          <Text className="text-red-500 text-center">{error}</Text>
        </Card>
      )}

      <Card containerStyle={{ borderRadius: 15, margin: 20 }}>
        {status ? (
          <View className="items-center p-5">
            <Ionicons name={status.icon} size={48} color={status.color} />
            <Text className="text-lg font-bold mt-2 text-center" style={{ color: status.color }}>
              {status.text}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
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
              <View className="mr-2">
                <Ionicons name="hand-right" size={24} color="white" />
              </View>
            }
            buttonStyle={{
              backgroundColor: '#FF6B6B',
              borderRadius: 10,
              paddingVertical: 15,
            }}
            raised
          />
        )}
      </Card>

      <View className="flex-row justify-between px-5">
        <Card containerStyle={{ flex: 1, borderRadius: 15, margin: 5 }}>
          <View className="items-center">
            <Ionicons name="flame" size={32} color="#FF6B6B" />
            <Text className="text-2xl font-bold text-gray-800 mt-1">{streak}</Text>
            <Text className="text-sm text-gray-600">Day Streak</Text>
          </View>
        </Card>

        <Card containerStyle={{ flex: 1, borderRadius: 15, margin: 5 }}>
          <View className="items-center">
            <Ionicons name="book" size={32} color="#FF6B6B" />
            <Text className="text-2xl font-bold text-gray-800 mt-1">{gathaCount}</Text>
            <Text className="text-sm text-gray-600">Gathas Learned</Text>
          </View>
        </Card>
      </View>

      {completedGathas.length > 0 && (
        <Card containerStyle={{ borderRadius: 15, margin: 20 }}>
          <Card.Title h4>Recently Completed Gathas</Card.Title>
          {completedGathas.map((item: any) => (
            <View key={item.id} className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <View className="ml-4 flex-1">
                <Text className="text-base font-bold text-gray-800">{item.gatha.title}</Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {new Date(item.completed_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Card containerStyle={{ borderRadius: 15, margin: 20 }}>
        <Card.Title h4>Today's Schedule</Card.Title>
        {schedules.length === 0 ? (
          <Text className="text-center text-gray-600 italic py-5">No schedules for today</Text>
        ) : (
          schedules.map((schedule: any) => (
            <View key={schedule.id} className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
              <Ionicons name="time" size={24} color="#FF6B6B" />
              <View className="ml-4 flex-1">
                <Text className="text-base font-bold text-gray-800">
                  {schedule.start_time} - {schedule.end_time}
                </Text>
                <Text className="text-sm text-red-500 mt-1">{schedule.title}</Text>
                {schedule.description && (
                  <Text className="text-sm text-gray-600 mt-1">
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