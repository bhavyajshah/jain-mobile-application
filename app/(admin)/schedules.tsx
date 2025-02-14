import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, ListItem, Button, Input } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function SchedulesScreen() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_schedules')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.start_time || !newSchedule.end_time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('daily_schedules')
        .insert([{
          ...newSchedule,
          created_by: user.id,
        }]);

      if (error) throw error;

      Alert.alert('Success', 'Schedule added successfully');
      setIsAdding(false);
      setNewSchedule({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        start_time: '',
        end_time: '',
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('Error', 'Failed to add schedule');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {schedules.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length}
            </Text>
            <Text style={styles.statLabel}>Today's Classes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {schedules.filter(s => new Date(s.date) > new Date()).length}
            </Text>
            <Text style={styles.statLabel}>Upcoming Classes</Text>
          </View>
        </View>
      </Card>

      <Button
        title={isAdding ? "Cancel" : "Add New Schedule"}
        onPress={() => setIsAdding(!isAdding)}
        icon={<Ionicons name={isAdding ? "close" : "add"} size={20} color="white" style={styles.buttonIcon} />}
        buttonStyle={[styles.addButton, { backgroundColor: isAdding ? '#FF6B6B' : '#4CAF50' }]}
        containerStyle={styles.addButtonContainer}
      />

      {isAdding && (
        <Card containerStyle={styles.formCard}>
          <Card.Title h4>Add New Schedule</Card.Title>
          <Input
            placeholder="Title"
            value={newSchedule.title}
            onChangeText={(text) => setNewSchedule({ ...newSchedule, title: text })}
          />
          <Input
            placeholder="Description"
            value={newSchedule.description}
            onChangeText={(text) => setNewSchedule({ ...newSchedule, description: text })}
            multiline
          />
          <Input
            placeholder="Start Time (HH:MM)"
            value={newSchedule.start_time}
            onChangeText={(text) => setNewSchedule({ ...newSchedule, start_time: text })}
          />
          <Input
            placeholder="End Time (HH:MM)"
            value={newSchedule.end_time}
            onChangeText={(text) => setNewSchedule({ ...newSchedule, end_time: text })}
          />
          <Button
            title="Save Schedule"
            onPress={handleAddSchedule}
            buttonStyle={styles.saveButton}
          />
        </Card>
      )}

      <Card containerStyle={styles.listCard}>
        <Card.Title h4>Schedule List</Card.Title>
        {schedules.map((schedule) => (
          <ListItem key={schedule.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={styles.scheduleTitle}>
                {schedule.title}
              </ListItem.Title>
              <ListItem.Subtitle>
                {new Date(schedule.date).toLocaleDateString()}
              </ListItem.Subtitle>
              <View style={styles.scheduleTime}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.timeText}>
                  {schedule.start_time} - {schedule.end_time}
                </Text>
              </View>
              {schedule.description && (
                <Text style={styles.description}>{schedule.description}</Text>
              )}
            </ListItem.Content>
            <Button
              title="Edit"
              onPress={() => Alert.alert('Coming Soon', 'Edit feature will be available soon!')}
              buttonStyle={styles.editButton}
            />
          </ListItem>
        ))}
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
  },
  statsCard: {
    borderRadius: 15,
    padding: 15,
    margin: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  addButtonContainer: {
    margin: 10,
  },
  addButton: {
    borderRadius: 10,
    paddingVertical: 12,
  },
  buttonIcon: {
    marginRight: 10,
  },
  formCard: {
    borderRadius: 15,
    padding: 15,
    margin: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginTop: 10,
  },
  listCard: {
    borderRadius: 15,
    padding: 15,
    margin: 10,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  editButton: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});