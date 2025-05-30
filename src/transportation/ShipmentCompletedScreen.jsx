import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const ShipmentCompletedScreen = ({ navigation }) => {
  const [transporterId, setTransporterId] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('IN_TRANSIT');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransporterId();
  }, []);

  useEffect(() => {
    if (transporterId) {
      fetchShipments();
    }
  }, [transporterId]);

  useEffect(() => {
    filterShipments(selectedStatus);
  }, [selectedStatus, shipments]);

  const handleStatusChange = (itemValue) => {
    setSelectedStatus(itemValue);
  };

  // Retrieve Transporter ID from AsyncStorage
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

  // Fetch shipments from the API using Transporter ID
  const fetchShipments = async () => {
    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/getAll/${transporterId}`);
      const data = await response.json();
      setShipments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setLoading(false);
    }
  };

  // Filter shipments based on selected status
  const filterShipments = (status) => {
    if (!shipments.length) return;

    if (status === 'DELIVERED') {
      // Fetch shipments with statuses COMPLETED and DELIVERED
      const filtered = shipments.filter(
        (item) => item.assignmentStatus === 'COMPLETED' || item.assignmentStatus === 'DELIVERED'
      );
      setFilteredShipments(filtered);
    } else {
      // Fetch only IN_TRANSIT shipments
      const filtered = shipments.filter((item) => item.assignmentStatus === 'IN_TRANSIT');
      setFilteredShipments(filtered);
    }
  };

 
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.heading}>Shipments</Text>

        {/* Status Dropdown */}
        <Picker selectedValue={selectedStatus} onValueChange={handleStatusChange} style={styles.picker}>
          <Picker.Item label="In Transit" value="IN_TRANSIT" />
          <Picker.Item label="Delivered (Includes Completed)" value="DELIVERED" />
        </Picker>

        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : (
          <FlatList
            data={filteredShipments}
            keyExtractor={(item) => item.assignmentId.toString()}
            renderItem={({ item }) => (
              <View style={[styles.card, item.assignmentStatus === 'IN_TRANSIT' ? styles.inTransitCard : styles.deliveredCard]}>
                <Text style={styles.label}>📦 Shipment ID: {item.shipment?.shipmentId}</Text>
                <Text style={styles.label}>📋 Cargo Type: {item.shipment?.cargoType}</Text>
                <Text style={styles.label}>📍 Pickup: {item.shipment?.pickupStreetName}, {item.shipment?.pickupTown}</Text>
                <Text style={styles.label}>📍 Drop: {item.shipment?.dropStreetName}, {item.shipment?.dropTown}</Text>
                <Text style={styles.label}>🚚 Vehicle No: {item.assignedVehicle?.vehicleNumber}</Text>
                <Text style={styles.label}>👨‍✈️ Driver Name: {item.assignedDriver?.name}</Text>
                <Text style={[styles.statusLabel, item.assignmentStatus === 'IN_TRANSIT' ? styles.inTransitStatus : styles.deliveredStatus]}>
                  {item.assignmentStatus === 'COMPLETED' || item.assignmentStatus === 'DELIVERED' ? '✔ Delivered' : '🚛 In Transit'}
                </Text>

                {/* Track Shipment Button (For In Transit Shipments) */}
                {item.assignmentStatus === 'IN_TRANSIT' && (
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => navigation.navigate('ShipmentTrack', {
                      shipmentId: item.shipment?.shipmentId,
                      driverId: item.assignedDriver?.driverId,
                      transporterId: transporterId,
                    })}
                  >
                    <Text style={styles.trackButtonText}>Track Shipment</Text>
                  </TouchableOpacity>
                )}

                {/* Send Feedback Button (Only for Delivered or Completed) */}
                {(item.assignmentStatus === 'COMPLETED' || item.assignmentStatus === 'DELIVERED') && (
                  <TouchableOpacity
                    style={styles.feedbackButton}
                    onPress={() => navigation.navigate('TFeedbackForm', {
                      shipmentId: item.shipment?.shipmentId,
                      driverName: item.assignedDriver?.name,
                      driverId: item.assignedDriver?.driverId,
                      transporterId: transporterId,
                    })}
                  >
                    <Text style={styles.feedbackButtonText}>Send Feedback</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.noDataText}>No shipments available.</Text>}
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
    backgroundColor: '#f0f5f9',
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
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#d1d8e0',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inTransitCard: {
    backgroundColor: '#d6e4ff',
    borderLeftWidth: 6,
    borderLeftColor: '#4c8bf5',
  },
  deliveredCard: {
    backgroundColor: '#daf5dc',
    borderLeftWidth: 6,
    borderLeftColor: '#47b847',
  },
  trackButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackButton: {
    backgroundColor: '#4ee2ca',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2f3640',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  inTransitStatus: {
    color: '#1e5cd9',
  },
  deliveredStatus: {
    color: '#2b8a3e',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 20,
  },
  feedbackButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShipmentCompletedScreen;
