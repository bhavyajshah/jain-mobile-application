import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ListItem } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGathas: 0,
    pendingRequests: 0,
    todaySchedules: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        studentsCount,
        gathasCount,
        requestsCount,
        schedulesCount,
        activities
      ] = await Promise.all([
        fetchStudentsCount(),
        fetchGathasCount(),
        fetchPendingRequestsCount(),
        fetchTodaySchedulesCount(),
        fetchRecentActivities()
      ]);

      setStats({
        totalStudents: studentsCount,
        totalGathas: gathasCount,
        pendingRequests: requestsCount,
        todaySchedules: schedulesCount,
      });
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsCount = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');
    return count || 0;
  };

  const fetchGathasCount = async () => {
    const { count } = await supabase
      .from('gathas')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  };

  const fetchPendingRequestsCount = async () => {
    const { count } = await supabase
      .from('attendance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    return count || 0;
  };

  const fetchTodaySchedulesCount = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('daily_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('date', today);
    return count || 0;
  };

  const fetchRecentActivities = async () => {
    const { data } = await supabase
      .from('attendance_requests')
      .select(`
        *,
        student:profiles!attendance_requests_student_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    return data || [];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        <Link href="/admin/students" asChild>
          <Card containerStyle={styles.statsCard}>
            <Ionicons name="people" size={32} color="#FF6B6B" />
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </Card>
        </Link>

        <Link href="/admin/gathas" asChild>
          <Card containerStyle={styles.statsCard}>
            <Ionicons name="book" size={32} color="#FF6B6B" />
            <Text style={styles.statNumber}>{stats.totalGathas}</Text>
            <Text style={styles.statLabel}>Gathas</Text>
          </Card>
        </Link>

        <Link href="/admin/attendance" asChild>
          <Card containerStyle={styles.statsCard}>
            <Ionicons name="time" size={32} color="#FF6B6B" />
            <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </Card>
        </Link>

        <Link href="/admin/schedules" asChild>
          <Card containerStyle={styles.statsCard}>
            <Ionicons name="calendar" size={32} color="#FF6B6B" />
            <Text style={styles.statNumber}>{stats.todaySchedules}</Text>
            <Text style={styles.statLabel}>Today's Classes</Text>
          </Card>
        </Link>
      </View>

      <Card containerStyle={styles.activityCard}>
        <Card.Title h4>Recent Activities</Card.Title>
        {recentActivities.map((activity) => (
          <ListItem key={activity.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={styles.activityTitle}>
                {activity.student.full_name}
              </ListItem.Title>
              <ListItem.Subtitle>
                Requested attendance on {new Date(activity.date).toLocaleDateString()}
              </ListItem.Subtitle>
              <View style={styles.statusContainer}>
                <Text style={[
                  styles.statusText,
                  { color: activity.status === 'pending' ? '#FFA726' :
                          activity.status === 'approved' ? '#4CAF50' : '#FF6B6B' }
                ]}>
                  {activity.status.toUpperCase()}
                </Text>
              </View>
            </ListItem.Content>
          </ListItem>
        ))}
      </Card>

      <View style={styles.quickActions}>
        <Button
          title="New Schedule"
          icon={<Ionicons name="add-circle-outline" size={20} color="white" style={styles.buttonIcon} />}
          buttonStyle={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => router.push('/admin/schedules')}
        />
        <Button
          title="View Reports"
          icon={<Ionicons name="bar-chart-outline" size={20} color="white" style={styles.buttonIcon} />}
          buttonStyle={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
          onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}
        />
      </View>
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
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  statsCard: {
    width: '45%',
    borderRadius: 15,
    padding: 15,
    margin: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  activityCard: {
    borderRadius: 15,
    padding: 15,
    margin: 20,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
});