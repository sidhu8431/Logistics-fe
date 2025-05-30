import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
const TrackingApp = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    fetchInTransitShipments();
  }, []);
 
  const fetchInTransitShipments = async () => {
    try {
      setLoading(true);
      const manufacturerId = await AsyncStorage.getItem('manufacturerId');
     
      if (!manufacturerId) {
        setError('Manufacturer ID not found. Please login again.');
        setLoading(false);
        return;
      }
     
      const response = await axios.get(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/manufacturer/${manufacturerId}/latest-In_Transit`
      );
      setShipments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load shipments');
      setLoading(false);
      console.error('API Error:', err);
    }
  };
 
  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
 
  const navigateToShipmentForm = () => {
    navigation.navigate('ShipmentForm');
  };
 
  const navigateToOldShipments = () => {
    navigation.navigate('ShipmentList');
  }
 
  const navigateToInvoice = () => {
    navigation.navigate('PaymentInvoices');
  }
 
  const navigateToPayments = () => {
    navigation.navigate('PaymentRecords');
  }
 
  const navigateToTracking = () => {
    navigation.navigate('ShipmentTracking');
  }
 
  const navigateToAnalytics = () => {
    navigation.navigate('ManufacturerAnalytics');
  }
 
  const viewLocation = (shipmentId) => {
    navigation.navigate('ComingSoonPage', { shipmentId });
  }
 
  const navigateToInsurance = () => {
    navigation.navigate('ComingSoonPage');
  }
 
  const navigatetoStatisticsScreen = () => {
    navigation.navigate('StatisticsScreen');
  }
 
  const navigateToFeedback = () => {
    navigation.navigate('ComingSoonPage');
  };
 
  const handleSeeMore = () => {
    navigation.navigate('ShipmentTracking');
  };
 
  // Render empty state with a nice message and add shipment button
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyStateContainer}>
        <Image
          source={require('../assets/package.png')}
          style={styles.emptyStateImage}
        />
        <Text style={styles.emptyStateTitle}>No Active Shipments</Text>
        <Text style={styles.emptyStateMessage}>
          You don't have any shipments in transit at the moment.
          Create a new shipment to get started.
        </Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={navigateToShipmentForm}
        >
          <Text style={styles.emptyStateButtonText}>Create New Shipment</Text>
        </TouchableOpacity>
      </View>
    );
  };
 
  // Render shipment tracking section
  const renderTrackingSection = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          {/* Removed ActivityIndicator component that was causing issues */}
          <Text style={styles.loadingText}>Loading shipments...</Text>
        </View>
      );
    }
 
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInTransitShipments}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (shipments.length === 0) {
      return renderEmptyState();
    }
 
    // Display only the first 3 shipments
    const displayShipments = shipments.slice(0, 3);
 
    return (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trackingScrollView}
        >
          {displayShipments.map((shipment) => (
            <View key={shipment.shipmentId} style={styles.trackingCard}>
              <Text style={styles.shipmentNumber}>Shipment #{shipment.shipmentId}</Text>
              <View style={styles.trackingRow}>
                <Text style={styles.iconText}>📦</Text>
                <Text style={styles.trackingText}>From: {shipment.pickupState}</Text>
              </View>
              <View style={styles.trackingRow}>
                <Text style={styles.iconText}>📍</Text>
                <Text style={styles.trackingText}>To: {shipment.dropState}</Text>
              </View>
              <View style={styles.trackingRow}>
                <Text style={styles.iconText}>⏳</Text>
                <Text style={styles.trackingText}>Delivery: {formatDate(shipment.deliveryDate)}</Text>
              </View>
              <View style={styles.trackingRow}>
                <Text style={styles.iconText}>✔️</Text>
                <Text style={styles.trackingText}>Status: {shipment.shipmentStatus}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewLocationButton}
                onPress={() => viewLocation(shipment.shipmentId)}
              >
                <Text style={styles.viewLocationText}>View location</Text>
              </TouchableOpacity>
            </View>
          ))}
         
          {shipments.length > 3 && (
            <TouchableOpacity style={styles.seeMoreCard} onPress={handleSeeMore}>
              <Text style={styles.seeMoreText}>See More</Text>
              <Text style={styles.seeMoreIcon}>→</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {/* Tracking Section */}
        <View style={styles.trackingSection}>
          <Text style={styles.sectionHeader}>Current Running Shipments</Text>
          {renderTrackingSection()}
        </View>
 
        {/* Activities Section */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionHeader}>All Activities</Text>
          
          {/* Activities Grid */}
          <View style={styles.activitiesGrid}>
            <TouchableOpacity
              onPress={navigateToShipmentForm}
              style={styles.activityCard}
            >
              <Image source={require('../assets/delivery-truck.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Add Shipment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={navigateToOldShipments}
              style={styles.activityCard}
            >
              <Image source={require('../assets/Package-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Old Shipments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={navigateToInvoice}
              style={styles.activityCard}
            >
              <Image source={require('../assets/invoices-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Invoices</Text>
            </TouchableOpacity>
          
            <TouchableOpacity
              onPress={navigateToPayments}
              style={styles.activityCard}
            >
              <Image source={require('../assets/payment-method-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Payments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={navigateToTracking}
              style={styles.activityCard}
            >
              <Image source={require('../assets/shipment-tracking-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Tracking</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={navigateToAnalytics}
              style={styles.activityCard}
            >
              <Image source={require('../assets/pie-chart-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Savings Analytics</Text>
            </TouchableOpacity>
          
            <TouchableOpacity 
              onPress={navigateToInsurance} 
              style={styles.activityCard}
            >
              <Image source={require('../assets/Protect-Insurances-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Insurances</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={navigatetoStatisticsScreen} 
              style={styles.activityCard}
            >
              <Image source={require('../assets/Analysis-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Shipment Statistics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={navigateToFeedback} 
              style={styles.activityCard}
            >
              <Image source={require('../assets/feedback-loop-Manufacturer.png')} style={styles.activityImage} />
              <Text style={styles.activityText}>Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  trackingSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
    paddingHorizontal: 5,
  },
  trackingScrollView: {
    flexGrow: 0,
    paddingBottom: 5,
  },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    marginLeft: 5,
    marginRight: 15,
    padding: 18,
    borderRadius: 16,
    elevation: 4,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  shipmentNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 18,
    marginRight: 8,
    width: 25,
  },
  trackingText: {
    fontSize: 15,
    flex: 1,
    color: '#555555',
  },
  viewLocationButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ffb74d',
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  viewLocationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  seeMoreCard: {
    backgroundColor: '#f8f8f8',
    margin: 10,
    marginRight: 15,
    padding: 15,
    borderRadius: 16,
    elevation: 2,
    width: 120,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  seeMoreIcon: {
    fontSize: 28,
    color: '#ffb74d',
  },
  activitiesSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  activityImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  activityText: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#444444',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    margin: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    margin: 10,
  },
  errorText: {
    fontSize: 15,
    color: '#d9534f',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ffb74d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    margin: 10,
    marginBottom: 15,
  },
  emptyStateImage: {
    width: 90,
    height: 90,
    opacity: 0.8,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  emptyStateMessage: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#ffb74d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
 
export default TrackingApp;