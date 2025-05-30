import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,

} from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const QuotationDetailsScreen = () => {
  const [quotationDetails, setQuotationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();
  const { quotationId } = route.params;

  useEffect(() => {
    const fetchQuotationDetails = async () => {
      try {
        const response = await axios.get(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/${quotationId}`);
        setQuotationDetails(response.data);
        console.error('Quotation Data:',quotationDetails );

      } catch (error) {
        console.error('Error fetching quotation details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationDetails();
  }, [quotationId]);

  const handleAccept = async () => {
    try {
      await axios.put(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/updateQuote/${quotationId}`, {
        quoteStatus: 'ACCEPTED',
      });
      setQuotationDetails((prev) => ({ ...prev, quoteStatus: 'ACCEPTED' }));
    } catch (error) {
      console.error('Error updating quotation:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await axios.put(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/updateQuote/${quotationId}`, {
        quoteStatus: 'PENDING',
      });
      setQuotationDetails((prev) => ({ ...prev, quoteStatus: 'PENDING' }));
    } catch (error) {
      console.error('Error canceling quotation:', error);
    }
  };

  const handlePay = () => {
    if (quotationDetails) {
      navigation.navigate('Payment', {
        amount: quotationDetails.totalQuotationPrice.toString(),
        shipmentDetails: {
          shipmentId: quotationDetails.shipment.shipmentId,
          manufacturerId: quotationDetails.shipment.manufacturer?.manufacturerId,  // Fixed path
        transporterId: quotationDetails.transporter.transporterId,  // Change to correct property name

        },
        companyName: quotationDetails.transporter.companyName,
        cargoType: quotationDetails.shipment.cargoType,
        description: `Payment for ${quotationDetails.shipment.cargoType} shipment`,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loaderText}>Loading Quotation Details...</Text>
      </View>
    );
  }

  if (!quotationDetails) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#FF5722" />
        <Text style={styles.errorText}>Failed to load quotation details</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { shipment, transporter, totalQuotationPrice, quoteStatus } = quotationDetails;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return '#4CAF50';
      case 'PENDING': return '#FFA000';
      case 'REJECTED': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar backgroundColor="#2196F3" barStyle="light-content" /> */}
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quotation Details</Text>
      </View> */}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quotation Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.price}>₹{Number(totalQuotationPrice).toLocaleString()}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quoteStatus) }]}>
              <Text style={styles.statusText}>{quoteStatus}</Text>
            </View>
          </View>
        </View>

        {/* Transporter Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="truck-delivery" size={22} color="#2196F3" />
            <Text style={styles.sectionTitle}>Transporter Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company</Text>
            <Text style={styles.infoValue}>{transporter.companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{transporter.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{transporter.phoneNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration</Text>
            <Text style={styles.infoValue}>{transporter.registrationNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{transporter.address}</Text>
          </View>
        </View>

        {/* Shipment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="package" size={22} color="#2196F3" />
            <Text style={styles.sectionTitle}>Shipment Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Shipment ID</Text>
            <Text style={styles.infoValue}>{shipment.shipmentId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{shipment.shipmentStatus}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cargo Type</Text>
            <Text style={styles.infoValue}>{shipment.cargoType}</Text>
          </View>
          {/* <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dimensions</Text>
            <Text style={styles.infoValue}>{shipment.dimensions}</Text>
          </View> */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>{shipment.weight} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Type</Text>
            <Text style={styles.infoValue}>{shipment.vehicleTypeRequired}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pickup</Text>
            <Text style={styles.infoValue}>{shipment.pickupPoint}, {shipment.pickupTown}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery</Text>
            <Text style={styles.infoValue}>{shipment.dropPoint}, {shipment.dropTown}</Text>
          </View>
          {/* <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{shipment.distance} km</Text>
          </View> */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pickup Date</Text>
            <Text style={styles.infoValue}>{formatDate(shipment.pickupDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Date</Text>
            <Text style={styles.infoValue}>{formatDate(shipment.deliveryDate)}</Text>
          </View>
        </View>

        {/* Quotation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document" size={22} color="#2196F3" />
            <Text style={styles.sectionTitle}>Quotation Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quotation ID</Text>
            <Text style={styles.infoValue}>{quotationId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quotation Price</Text>
            <Text style={styles.infoValue}>₹{Number(totalQuotationPrice).toLocaleString()}</Text>

          </View>
        </View>
      </ScrollView>

      {quoteStatus === 'ACCEPTED' ? (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancel}
          >
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.payButton]}
            onPress={handlePay}
          >
            <MaterialCommunityIcons name="cash" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.singleButtonContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
          >
            <MaterialCommunityIcons name="check" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Accept Quotation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
    padding: 20,
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 4,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
  },
  singleButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  payButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#FF5722',
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF5722',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2196F3',
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default QuotationDetailsScreen;