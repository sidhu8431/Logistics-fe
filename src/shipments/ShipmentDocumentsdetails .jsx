import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width * 0.9;

const ShipmentDocumentsdetails  = ({ route, navigation }) => {
  const { shipmentId, shipmentInfo } = route.params;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Get manufacturer ID from AsyncStorage
      const manufacturerId = await AsyncStorage.getItem('manufacturerId');
      
      if (!manufacturerId) {
        throw new Error('Manufacturer ID not found in storage');
      }

      const response = await axios.get(
        'http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/shipmentDocuments/getDocuments', 
        {
          params: {
            manufacturerId: manufacturerId,
            shipmentId: shipmentId
          }
        }
      );
      
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeDisplay = (type) => {
    switch (type) {
      case 'PICKUP_IMAGE': return 'Pickup Image';
      case 'DELIVERY_IMAGE': return 'Delivery Image';
      case 'INVOICE': return 'Invoice';
      case 'WAYBILL': return 'Way Bill';
      case 'OTHER': return 'Other Document';
      default: return type;
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'PICKUP_IMAGE': return 'truck-delivery';
      case 'DELIVERY_IMAGE': return 'package-variant-closed-check';
      case 'INVOICE': return 'file-document-outline';
      case 'WAYBILL': return 'file-chart-outline';
      default: return 'file-outline';
    }
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={50} color="#D32F2F" />
        <Text style={styles.errorText}>Failed to load documents</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchDocuments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.noDocumentsContainer}>
        <Icon name="file-document-outline" size={80} color="#BDBDBD" />
        <Text style={styles.noDocumentsText}>No documents available for this shipment</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Shipment Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipment Documents</Text>
      </View> */}

      <View style={styles.shipmentInfoCard}>
        <Text style={styles.shipmentInfoHeader}>Shipment #{shipmentInfo.id}</Text>
        <View style={styles.shipmentInfoRow}>
          <Text style={styles.shipmentInfoLabel}>Cargo Type:</Text>
          <Text style={styles.shipmentInfoValue}>{shipmentInfo.cargoType || 'N/A'}</Text>
        </View>
        <View style={styles.shipmentInfoRow}>
          <Text style={styles.shipmentInfoLabel}>Status:</Text>
          <Text style={[
            styles.shipmentInfoValue, 
            styles.statusText,
            {color: shipmentInfo.status === 'DELIVERED' ? '#388E3C' :
                   shipmentInfo.status === 'IN_TRANSIT' ? '#1976D2' : 
                   shipmentInfo.status === 'ACCEPTED' ? '#2E7D32' :
                   shipmentInfo.status === 'PENDING' ? '#FF8C00' : '#757575'}
          ]}>
            {shipmentInfo.status || 'N/A'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.documentsList}>
        {documents.map((document, index) => (
          <View key={document.shipmentDocumentId} style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <Icon name={getDocumentIcon(document.documentType)} size={24} color="#6200EE" />
              <Text style={styles.documentType}>
                {getDocumentTypeDisplay(document.documentType)}
              </Text>
              <Text style={styles.documentDate}>
                {new Date(document.postedAt).toLocaleDateString()}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleImagePress(document.s3Url)}
            >
              <Image
                source={{ uri: document.s3Url }}
                style={styles.documentImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setModalVisible(false)}
          >
            <Icon name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.modalImageContainer}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333333',
  },
  shipmentInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  shipmentInfoHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  shipmentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shipmentInfoLabel: {
    fontSize: 14,
    color: '#757575',
    width: 100,
  },
  shipmentInfoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },
  statusText: {
    fontWeight: 'bold',
  },
  documentsList: {
    padding: 16,
    paddingBottom: 32,
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  documentType: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
    color: '#333333',
  },
  documentDate: {
    fontSize: 14,
    color: '#757575',
  },
  documentImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
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
  },
  errorSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  noDocumentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 24,
  },
  noDocumentsText: {
    fontSize: 18,
    color: '#555555',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
});

export default ShipmentDocumentsdetails ;