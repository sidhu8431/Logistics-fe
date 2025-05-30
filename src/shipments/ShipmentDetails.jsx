import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ShipmentDetails = ({ route }) => {
  const { shipmentId } = route.params;
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchShipmentDetails = async () => {
      try {
        const response = await axios.get(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/${shipmentId}`);
        setShipment(response.data);
      } catch (error) {
        console.error('Error fetching shipment details:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchShipmentDetails();
  }, [shipmentId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FFE5CC', text: '#FF8C00' };
      case 'IN_TRANSIT': return { bg: '#E5F2FF', text: '#1976D2' };
      case 'DELIVERED': return { bg: '#E0F2E0', text: '#388E3C' };
      case 'CANCELLED': return { bg: '#FFE0E0', text: '#D32F2F' };
      case 'ACCEPTED': return { bg: '#E8F5E9', text: '#2E7D32' };
      default: return { bg: '#F5F5F5', text: '#757575' };
    }
  };

  const navigateToDocuments = () => {
    navigation.navigate('ShipmentDocumentsdetails', { 
      shipmentId: shipmentId,
      shipmentInfo: {
        id: shipmentId,
        cargoType: shipment?.cargoType,
        status: shipment?.shipmentStatus
      }
    });
  };

  // Function to check if documents button should be shown
  const shouldShowDocumentsButton = (status) => {
    const allowedStatuses = ['ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
    return allowedStatuses.includes(status);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loaderText}>Loading Shipment Details...</Text>
      </View>
    );
  }

  if (!shipment) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={50} color="#D32F2F" />
        <Text style={styles.errorText}>No shipment details available.</Text>
        <TouchableOpacity 
          style={styles.backToListButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToListButtonText}>Back to Shipments</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusColor(shipment.shipmentStatus);

  return (
    <View style={styles.root}>
      <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
        <Icon 
          name={shipment.shipmentStatus === 'DELIVERED' ? 'check-circle-outline' : 
               shipment.shipmentStatus === 'IN_TRANSIT' ? 'truck-delivery' :
               shipment.shipmentStatus === 'PENDING' ? 'clock-outline' :
               shipment.shipmentStatus === 'ACCEPTED' ? 'check-decagram' :
               shipment.shipmentStatus === 'CANCELLED' ? 'close-circle-outline' : 'help-circle-outline'} 
          size={24} 
          color={statusStyle.text} 
        />
        <Text style={[styles.statusText, { color: statusStyle.text }]}>
          {shipment.shipmentStatus ? shipment.shipmentStatus.replace('_', ' ') : 'Unknown'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* View Documents Button - Only show for specific statuses */}
        {shouldShowDocumentsButton(shipment.shipmentStatus) && (
          <TouchableOpacity 
            style={styles.documentsButton}
            onPress={navigateToDocuments}
          >
            <Icon name="file-document-multiple" size={20} color="#FFFFFF" />
            <Text style={styles.documentsButtonText}>View Shipment Documents</Text>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipment Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Cargo Type</Text>
              <Text style={styles.value}>{shipment.cargoType || 'N/A'}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>ID</Text>
              <Text style={styles.value}>#{shipment.shipmentId}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Weight</Text>
              <Text style={styles.value}>{shipment.weight || 'N/A'} kg</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Dimensions</Text>
              <Text style={styles.value}>{shipment.dimensions || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pickup & Delivery</Text>
          <View style={styles.locationContainer}>
            <View style={styles.locationPoint}>
              <Icon name="circle-outline" size={20} color="#6200EE" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.label}>Pickup Point</Text>
                <Text style={styles.value}>{shipment.pickupPoint || 'N/A'}</Text>
                <Text style={styles.dateText}>
                  {shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString() : 'Date not set'}
                </Text>
              </View>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationPoint}>
              <Icon name="map-marker" size={20} color="#6200EE" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.label}>Drop Point</Text>
                <Text style={styles.value}>{shipment.dropPoint || 'N/A'}</Text>
                <Text style={styles.dateText}>
                  {shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleDateString() : 'Date not set'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.distanceContainer}>
            <Icon name="map-marker-distance" size={20} color="#757575" />
            <Text style={styles.distanceText}>Distance: {shipment.distance || 'N/A'} km</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing</Text>
          <View style={styles.pricingContainer}>
            <View style={styles.priceItem}>
              <Text style={styles.label}>Estimated Price</Text>
              <Text style={styles.priceValue}>RS{shipment.estimatedPrice || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <View style={styles.contactRow}>
            <Icon name="account" size={20} color="#757575" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.label}>Contact Name</Text>
              <Text style={styles.value}>{shipment.contactName || 'Not specified'}</Text>
            </View>
          </View>
          <View style={styles.contactRow}>
            <Icon name="phone" size={20} color="#757575" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <Text style={styles.value}>{shipment.contactNumber || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          <View style={styles.timelineRow}>
            <Icon name="calendar-plus" size={20} color="#757575" />
            <View style={styles.timelineTextContainer}>
              <Text style={styles.label}>Created</Text>
              <Text style={styles.value}>{new Date(shipment.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.timeText}>{new Date(shipment.createdAt).toLocaleTimeString()}</Text>
            </View>
          </View>
          <View style={styles.timelineRow}>
            <Icon name="calendar-edit" size={20} color="#757575" />
            <View style={styles.timelineTextContainer}>
              <Text style={styles.label}>Last Updated</Text>
              <Text style={styles.value}>{new Date(shipment.updatedAt).toLocaleDateString()}</Text>
              <Text style={styles.timeText}>{new Date(shipment.updatedAt).toLocaleTimeString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  documentsButton: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    elevation: 2,
  },
  documentsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoColumn: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: 'black',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginLeft: 9,
    marginBottom: 12,
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  distanceText: {
    fontSize: 15,
    color: '#555555',
    marginLeft: 8,
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6200EE',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTextContainer: {
    marginLeft: 16,
    flex: 1,
   
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#555555',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backToListButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToListButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ShipmentDetails;