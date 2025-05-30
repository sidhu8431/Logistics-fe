import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TrackingScreen = () => {
  const navigation = useNavigation();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manufacturerId, setManufacturerId] = useState(null);

  useEffect(() => {
    // Get manufacturerId from AsyncStorage
    const getManufacturerId = async () => {
      try {
        const storedManufacturerId = await AsyncStorage.getItem('manufacturerId');
        if (storedManufacturerId) {
          setManufacturerId(storedManufacturerId);
          fetchInTransitShipments(storedManufacturerId);
        } else {
          setError('Manufacturer ID not found. Please login again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error retrieving manufacturerId from AsyncStorage:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    getManufacturerId();
  }, []);

  const fetchInTransitShipments = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/manufacturer/${id}/latest-In_Transit`
      );
      setShipments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load shipments');
      setLoading(false);
      Alert.alert('Error', 'Failed to load shipment data');
      console.error('API Error:', err);
    }
  };

  const handleViewTracking = (shipmentId) => {
    navigation.navigate('ComingSoonPage', { shipmentId });
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRetry = async () => {
    if (manufacturerId) {
      fetchInTransitShipments(manufacturerId);
    } else {
      try {
        const storedManufacturerId = await AsyncStorage.getItem('manufacturerId');
        if (storedManufacturerId) {
          setManufacturerId(storedManufacturerId);
          fetchInTransitShipments(storedManufacturerId);
        } else {
          Alert.alert('Error', 'Manufacturer ID not found. Please login again.');
          navigation.navigate('Login'); // Navigate to login if ID is not found
        }
      } catch (err) {
        console.error('Error on retry:', err);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffb74d" />
        <Text style={styles.loadingText}>Loading shipments...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      
      {shipments.length === 0 ? (
        <View style={styles.noShipmentsContainer}>
          <Text style={styles.noShipmentsText}>No Running Shipments Avaiable</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {shipments.map((shipment) => (
            <View key={shipment.shipmentId} style={styles.shipmentCard}>
              <View style={styles.shipmentHeader}>
                <Text style={styles.shipmentId}>Shipment #{shipment.shipmentId}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{shipment.shipmentStatus}</Text>
                </View>
              </View>
              
              <View style={styles.shipmentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cargo Type:</Text>
                  <Text style={styles.detailValue}>{shipment.cargoType || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created On:</Text>
                  <Text style={styles.detailValue}>{formatDate(shipment.createdAt)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(shipment.deliveryDate)}</Text>
                </View>
                
                <View style={styles.locationRow}>
                  <View style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>From</Text>
                    <Text style={styles.locationValue}>{shipment.pickupTown}</Text>
                  </View>
                  
                  <View style={styles.locationDivider}>
                    <Text style={styles.arrow}>→</Text>
                  </View>
                  
                  <View style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>To</Text>
                    <Text style={styles.locationValue}>{shipment.dropTown}</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.trackingButton} 
                onPress={() => handleViewTracking(shipment.shipmentId)}
              >
                <Text style={styles.trackingButtonText}>View Tracking</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  shipmentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shipmentId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#f0ad4e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  shipmentDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  locationContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  locationDivider: {
    paddingHorizontal: 10,
  },
  arrow: {
    fontSize: 18,
    color: '#666',
  },
  trackingButton: {
    backgroundColor: '#ffb74d',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 5,
  },
  trackingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d9534f',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ffb74d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noShipmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noShipmentsText: {
    fontSize: 16,
    color: '#666',
  },
});

export default TrackingScreen;