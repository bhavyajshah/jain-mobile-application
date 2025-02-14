import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, ListItem } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function HistoryScreen() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    thisMonth: 0,
    lastMonth: 0,
  });

  useEffect(() => {
    fetchAttendance();
    calculateStats();
  }, []);

  const fetchAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const { data } = await supabase
        .from('attendance')
        .select('date')
        .eq('user_id', user.id);

      if (!data) return;

      const thisMonthCount = data.filter(record => 
        new Date(record.date) >= thisMonth
      ).length;

      const lastMonthCount = data.filter(record => 
        new Date(record.date) >= lastMonth && new Date(record.date) < thisMonth
      ).length;

      setStats({
        totalClasses: data.length,
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const renderAttendanceItem = ({ item }) => (
    <ListItem bottomDivider>
      <ListItem.Content>
        <ListItem.Title style={styles.itemTitle}>
          {new Date(item.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </ListItem.Title>
        <ListItem.Subtitle style={styles.itemSubtitle}>
          <Ionicons name="time-outline" size={14} color="#666" />
          {' '}
          {new Date(item.date).toLocaleTimeString()}
        </ListItem.Subtitle>
      </ListItem.Content>
      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.statsCard}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalClasses}</Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.lastMonth}</Text>
            <Text style={styles.statLabel}>Last Month</Text>
          </View>
        </View>
      </Card>

      <Card containerStyle={styles.listCard}>
        <Card.Title h4>Attendance History</Card.Title>
        {loading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : (
          <FlatList
            data={attendance}
            renderItem={renderAttendanceItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No attendance records found</Text>
            }
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  statsCard: {
    borderRadius: 10,
    padding: 15,
    margin: 20,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  listCard: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    margin: 20,
    marginTop: 10,
  },
  loading: {
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});