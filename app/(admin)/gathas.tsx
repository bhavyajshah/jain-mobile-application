import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, ListItem, Button, Input } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function GathasScreen() {
  const [gathas, setGathas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newGatha, setNewGatha] = useState({
    title: '',
    content: '',
    difficulty_level: 'beginner',
  });

  useEffect(() => {
    fetchGathas();
  }, []);

  const fetchGathas = async () => {
    try {
      const { data, error } = await supabase
        .from('gathas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGathas(data || []);
    } catch (error) {
      console.error('Error fetching gathas:', error);
      Alert.alert('Error', 'Failed to load gathas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGatha = async () => {
    if (!newGatha.title || !newGatha.content) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('gathas')
        .insert([newGatha]);

      if (error) throw error;

      Alert.alert('Success', 'Gatha added successfully');
      setIsAdding(false);
      setNewGatha({
        title: '',
        content: '',
        difficulty_level: 'beginner',
      });
      fetchGathas();
    } catch (error) {
      console.error('Error adding gatha:', error);
      Alert.alert('Error', 'Failed to add gatha');
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FFA726';
      case 'advanced':
        return '#FF6B6B';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading gathas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{gathas.length}</Text>
            <Text style={styles.statLabel}>Total Gathas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {gathas.filter(g => g.difficulty_level === 'beginner').length}
            </Text>
            <Text style={styles.statLabel}>Beginner Level</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {gathas.filter(g => g.difficulty_level === 'advanced').length}
            </Text>
            <Text style={styles.statLabel}>Advanced Level</Text>
          </View>
        </View>
      </Card>

      <Button
        title={isAdding ? "Cancel" : "Add New Gatha"}
        onPress={() => setIsAdding(!isAdding)}
        icon={<Ionicons name={isAdding ? "close" : "add"} size={20} color="white" style={styles.buttonIcon} />}
        buttonStyle={[styles.addButton, { backgroundColor: isAdding ? '#FF6B6B' : '#4CAF50' }]}
        containerStyle={styles.addButtonContainer}
      />

      {isAdding && (
        <Card containerStyle={styles.formCard}>
          <Card.Title h4>Add New Gatha</Card.Title>
          <Input
            placeholder="Title"
            value={newGatha.title}
            onChangeText={(text) => setNewGatha({ ...newGatha, title: text })}
          />
          <Input
            placeholder="Content"
            value={newGatha.content}
            onChangeText={(text) => setNewGatha({ ...newGatha, content: text })}
            multiline
            numberOfLines={4}
          />
          <Button
            title="Save Gatha"
            onPress={handleAddGatha}
            buttonStyle={styles.saveButton}
          />
        </Card>
      )}

      <Card containerStyle={styles.listCard}>
        <Card.Title h4>Gatha List</Card.Title>
        {gathas.map((gatha) => (
          <ListItem key={gatha.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={styles.gathaTitle}>
                {gatha.title}
              </ListItem.Title>
              <View style={styles.gathaInfo}>
                <Text style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(gatha.difficulty_level) }
                ]}>
                  {gatha.difficulty_level.toUpperCase()}
                </Text>
                <Text style={styles.dateText}>
                  Added: {new Date(gatha.created_at).toLocaleDateString()}
                </Text>
              </View>
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
  gathaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gathaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: 'white',
    fontSize: 12,
    marginRight: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});