import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'rn-fetch-blob';

const PaymentInvoices = () => {
  const navigation = useNavigation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const manufacturerId = await AsyncStorage.getItem('manufacturerId');
      
      if (!manufacturerId) {
        setError('Manufacturer ID not found. Please login again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/payments/held?manufacturerId=${manufacturerId}`
      );
      
      setPayments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load payments');
      setLoading(false);
      console.error('API Error:', err);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return '₹ ' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  const viewInvoice = (payment) => {
    navigation.navigate('InvoiceDetail', { payment });
  };

  const downloadInvoice = async (payment) => {
    // Navigate to invoice detail and then download automatically
    navigation.navigate('InvoiceDetail', { 
      payment,
      downloadAutomatically: true  // Add a flag to trigger download
    });
  };

  const renderPaymentCard = ({ item }) => {
    const payment = item;
    const shipment = payment.shipment;
    
    return (
      <View style={styles.card}>
        <Text style={styles.paymentId}>Payment #{payment.paymentId}</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Shipment ID:</Text>
          <Text style={styles.value}>#{shipment.shipmentId}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>{formatCurrency(payment.amount)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, styles.statusText]}>{payment.paymentStatus}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(payment.createdAt)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>{shipment.pickupTown}, {shipment.pickupState}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.value}>{shipment.dropTown}, {shipment.dropState}</Text>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.viewButton]}
            onPress={() => viewInvoice(payment)}
          >
            <Text style={styles.buttonText}>View Invoice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.downloadButton]}
            onPress={() => downloadInvoice(payment)}
          >
            <Text style={styles.buttonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyStateContainer}>
        <Image
          source={require('../assets/invoices-Manufacturer.png')}
          style={styles.emptyStateImage}
        />
        <Text style={styles.emptyStateTitle}>No Invoices Found</Text>
        <Text style={styles.emptyStateMessage}>
          You don't have any payment invoices at the moment.
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffb74d" />
        <Text style={styles.loadingText}>Loading invoices...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPayments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Invoices</Text>
      </View> */}
      
      {payments.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentCard}
          keyExtractor={(item) => item.paymentId.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  viewButton: {
    backgroundColor: '#ffb74d',
    marginRight: 8,
  },
  downloadButton: {
    backgroundColor: '#26A69A',
    marginLeft: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ffb74d',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    opacity: 0.7,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PaymentInvoices;