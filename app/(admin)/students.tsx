import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, ListItem, Button, SearchBar } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [search, students]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          attendance_count:attendance_requests(count),
          completed_gathas:student_gathas(count)
        `)
        .eq('role', 'student');

      if (error) throw error;
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student) => {
    // To be implemented: Navigate to student details
    Alert.alert('Coming Soon', 'Student details view will be available soon!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading students...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SearchBar
        placeholder="Search students..."
        onChangeText={setSearch}
        value={search}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        lightTheme
        round
      />

      <Card containerStyle={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {students.reduce((sum, student) => sum + (student.attendance_count || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Attendances</Text>
          </View>
        </View>
      </Card>

      <Card containerStyle={styles.listCard}>
        <Card.Title h4>Student List</Card.Title>
        {filteredStudents.map((student) => (
          <ListItem key={student.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={styles.studentName}>
                {student.full_name}
              </ListItem.Title>
              <ListItem.Subtitle>{student.email}</ListItem.Subtitle>
              <View style={styles.studentStats}>
                <Text style={styles.studentStat}>
                  <Ionicons name="calendar" size={14} color="#666" /> {student.attendance_count || 0} Classes
                </Text>
                <Text style={styles.studentStat}>
                  <Ionicons name="book" size={14} color="#666" /> {student.completed_gathas || 0} Gathas
                </Text>
              </View>
            </ListItem.Content>
            <Button
              title="View"
              onPress={() => handleViewDetails(student)}
              buttonStyle={styles.viewButton}
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
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    padding: 10,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
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
  listCard: {
    borderRadius: 15,
    padding: 15,
    margin: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentStats: {
    flexDirection: 'row',
    marginTop: 5,
  },
  studentStat: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
  },
  viewButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});