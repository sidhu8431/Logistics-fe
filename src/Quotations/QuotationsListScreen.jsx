import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Transporter Details Modal Component
const TransporterDetailsModal = ({ isVisible, transporter, onClose }) => {
  if (!transporter) return null;
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transporter Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="office-building" size={20} color="#2196F3" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Company Name</Text>
                <Text style={styles.detailValue}>{transporter.companyName}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="email" size={20} color="#2196F3" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{transporter.email}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#2196F3" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{transporter.phoneNumber}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#2196F3" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{transporter.address}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="file-document" size={20} color="#2196F3" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>GST Number</Text>
                <Text style={styles.detailValue}>{transporter.companyGstNumber || 'Not provided'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#2196F3" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>PAN Number</Text>
                <Text style={styles.detailValue}>{transporter.companyPanNumber || 'Not provided'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={20} color="#2196F3" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Contact Person</Text>
                <Text style={styles.detailValue}>{transporter.user?.name || 'Not specified'}</Text>
              </View>
            </View>
            
            <View style={styles.statusBadgeContainer}>
              <Text style={styles.statusLabel}>Profile Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: transporter.profileStatus === 'APPROVED' ? '#4CAF50' : '#FFA500' }]}>
                <Text style={styles.statusText}>{transporter.profileStatus}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Define a Quotation Card Component
const QuotationCard = ({ quotation, onCompanyPress }) => {
  const navigation = useNavigation();

  const handleViewDetailsforPayment = () => {
    navigation.navigate('QuotationDetailsScreen', { quotationId: quotation.quotationId });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'accepted':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#607D8B';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity onPress={() => onCompanyPress(quotation.transporter)}>
          <Text style={styles.companyName}>{quotation.transporter.companyName}</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quotation.quoteStatus) }]}>
          <Text style={styles.statusText}>{quotation.quoteStatus}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="truck" size={16} color="#555" />
          <Text style={styles.infoText}>Registration: {quotation.transporter.registrationNumber || 'Not provided'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="currency-inr" size={16} color="#555" />
          <Text style={styles.priceText}>{Number(quotation.totalQuotationPrice).toLocaleString()}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.detailButton} onPress={handleViewDetailsforPayment}>
        <Text style={styles.buttonText}>Check Details for Payment</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Define the main component
const QuotationsListScreen = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const shipmentId = route.params.shipmentId;

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/withTransporter?shipmentId=${shipmentId}`);
      setQuotations(response.data);
      console.log('Quotations Data:', response);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch quotations for the given shipment ID on initial load
    fetchQuotations();
  }, [shipmentId]);

  const handleCompanyPress = (transporter) => {
    setSelectedTransporter(transporter);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchQuotations();
  }, [shipmentId]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loaderText}>Loading Quotations...</Text>
      </View>
    );
  }

  if (!quotations.length) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons name="inbox-outline" size={50} color="#ccc" />
        <Text style={styles.emptyStateText}>No quotations available for this shipment.</Text>
        <TouchableOpacity 
          style={styles.backToShipmentsButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToShipmentsText}>Back to Shipments</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Shipment Info */}
      <View style={styles.shipmentInfoContainer}>
        <Text style={styles.shipmentInfoText}>Shipment ID: <Text style={styles.shipmentId}>{shipmentId}</Text></Text>
        <Text style={styles.quotationCount}>{quotations.length} Quotation{quotations.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Quotation List with Pull-to-Refresh */}
      <FlatList
        data={quotations}
        keyExtractor={(item) => item.quotationId.toString()}
        renderItem={({ item }) => (
          <QuotationCard 
            quotation={item} 
            onCompanyPress={handleCompanyPress}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#2196F3"]}
            tintColor="#2196F3"
            title="Refreshing quotations..."
            titleColor="#666"
          />
        }
      />

      {/* Transporter Details Modal */}
      <TransporterDetailsModal 
        isVisible={modalVisible} 
        transporter={selectedTransporter} 
        onClose={closeModal}
      />
    </View>
  );
};

// Styles
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
  shipmentInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  shipmentInfoText: {
    fontSize: 15,
    color: '#555',
  },
  shipmentId: {
    fontWeight: 'bold',
    color: '#333',
  },
  quotationCount: {
    fontWeight: '500',
    color: '#2196F3',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    flex: 1,
    textDecorationLine: 'underline',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  detailButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  backToShipmentsButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  backToShipmentsText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f7f9fc',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
});

export default QuotationsListScreen;