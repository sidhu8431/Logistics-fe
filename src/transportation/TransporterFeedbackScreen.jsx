import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const TransporterFeedbackScreen = () => {
  const [transporterId, setTransporterId] = useState(null);
  const [manufacturerFeedback, setManufacturerFeedback] = useState([]);
  const [driverFeedback, setDriverFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('manufacturer'); // Default selection

  useEffect(() => {
    fetchTransporterId();
  }, []);

  useEffect(() => {
    if (transporterId) {
      fetchFeedback();
    }
  }, [transporterId]);

  // Fetch Transporter ID from AsyncStorage
  const fetchTransporterId = async () => {
    try {
      const storedId = await AsyncStorage.getItem('transporterId');
      if (storedId) {
        setTransporterId(storedId);
      } else {
        console.warn('Transporter ID not found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error fetching transporter ID:', error);
    }
  };

  // Fetch feedback from API
  const fetchFeedback = async () => {
    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/feedback/get/transporter/${transporterId}`);
      const data = await response.json();

      if (!data || data.length === 0) {
        console.warn('No feedback found.');
        setLoading(false);
        return;
      }

      // Categorize feedback
      const fromManufacturers = data.filter(item => item.driver === null); // Manufacturer to Transporter
      const fromTransporters = data.filter(item => item.manufacturer === null); // Transporter to Driver

      setManufacturerFeedback(fromManufacturers);
      setDriverFeedback(fromTransporters);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setLoading(false);
    }
  };

  // Render star ratings
  const renderStars = (rating) => {
    const fullStar = '⭐';
    return fullStar.repeat(Math.round(rating));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.heading}>Feedback</Text>

        {/* Dropdown to Select Feedback Type */}
        <Picker
          selectedValue={selectedType}
          onValueChange={(value) => setSelectedType(value)}
          style={styles.picker}
        >
          <Picker.Item label="Feedback from Manufacturers" value="manufacturer" />
          <Picker.Item label="Feedback for Drivers" value="driver" />
        </Picker>

        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : (
          <FlatList
            data={selectedType === 'manufacturer' ? manufacturerFeedback : driverFeedback}
            keyExtractor={(item) => item.feedbackId.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.label}>📝 Reviewer: {item.transporter?.user.name || 'Unknown'}</Text>
                <Text style={styles.ratingText}>⭐ Rating: {renderStars(item.rating)}</Text>
                <Text style={styles.comment}>💬 {item.comments}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.noDataText}>No feedback available.</Text>
            }
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f5f9', // Light background
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#d1d8e0',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#007BFF', // Highlight bar
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2f3640',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12', // Gold for rating
  },
  comment: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    marginTop: 5,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 20,
  },
});

export default TransporterFeedbackScreen;
