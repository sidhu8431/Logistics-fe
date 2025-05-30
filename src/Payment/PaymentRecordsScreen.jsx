import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';

const API_BASE_URL = 'http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api';

// Moved the PaymentItem component outside of the parent component
const PaymentItem = ({ item, userType, navigation }) => {
  if (!item) return null;

  const getTransactionType = (payment) => {
    // First check for FAILED or PENDING status
    if (payment.paymentStatus === 'FAILED' || payment.paymentStatus === 'PENDING') {
      return payment.paymentStatus;
    }
    
    // If payment is HELD, show HELD instead of CREDIT/DEBIT
    if (payment.paymentStatus === 'HELD') {
      return 'HELD';
    }
  
    // For RELEASED payments, determine CREDIT/DEBIT based on user type
    if (payment.paymentStatus === 'RELEASED') {
      if (userType === 'manufacturer') {
        // Manufacturer always sees DEBIT when paying to transporters
        return 'DEBIT';
      } else if (userType === 'transporter') {
        if (payment.driver) {
          // Transporter sees DEBIT when paying to drivers
          return 'DEBIT';
        } else if (payment.manufacturer) {
          // Transporter sees CREDIT when receiving from manufacturers
          return 'CREDIT';
        }
      } else if (userType === 'driver') {
        // Driver always sees CREDIT when receiving from transporters
        return 'CREDIT';
      }
    }
    
    return payment.paymentStatus;
  };

  const getStatusColor = (payment, transactionType) => {
    if (payment.paymentStatus === 'FAILED') return '#FF0000';
    if (payment.paymentStatus === 'PENDING') return '#FFA500';
    if (payment.paymentStatus === 'HELD') return '#808080'; // Gray color for held payments
    
    // For RELEASED transactions, use green for CREDIT and red for DEBIT
    return transactionType === 'CREDIT' ? '#4CAF50' : '#FF6B6B';
  };

  const getTransactionIcon = (payment, transactionType) => {
    if (payment.paymentStatus === 'FAILED') return 'close-circle';
    if (payment.paymentStatus === 'PENDING') return 'time';
    if (payment.paymentStatus === 'HELD') return 'lock-closed'; // Lock icon for held payments
    
    return transactionType === 'CREDIT' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const formatAmount = (amount, transactionType, paymentStatus) => {
    if (!amount) return '₹0.00';
    
    const formattedAmount = amount.toFixed(2);
    
    // Extracted the nested ternary into an independent statement
    let formattedAmountWithSign;
    if (paymentStatus !== 'RELEASED') {
      formattedAmountWithSign = `₹${formattedAmount}`;
    } else {
      formattedAmountWithSign = `${transactionType === 'CREDIT' ? '+' : '-'}₹${formattedAmount}`;
    }
    
    return formattedAmountWithSign;
  };

  const getTransactionParties = (payment) => {
    let from = 'N/A';
    let to = 'N/A';

    if (payment.manufacturer && payment.transporter) {
      from = payment.manufacturer.companyName;
      to = payment.transporter.companyName;
    } else if (payment.transporter && payment.driver) {
      from = payment.transporter.companyName;
      to = payment.driver.name;
    }

    return { from, to };
  };

  const transactionType = getTransactionType(item);
  const statusColor = getStatusColor(item, transactionType);
  const transactionIcon = getTransactionIcon(item, transactionType);
  const { from, to } = getTransactionParties(item);

  return (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => navigation.navigate('PaymentDetails', { paymentId: item.paymentId })}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.shipmentId}>
            Shipment #{item.shipment?.shipmentId || 'N/A'}
          </Text>
          <Text style={styles.date}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={[styles.statusContainer, { backgroundColor: `${statusColor}20` }]}>
          <Icon name={transactionIcon} size={16} color={statusColor} style={styles.statusIcon} />
          <Text style={[styles.status, { color: statusColor }]}>
            {transactionType}
          </Text>
        </View>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={[styles.amount, { color: statusColor }]}>
          {formatAmount(item.amount, transactionType, item.paymentStatus)}
        </Text>
      </View>

      <View style={styles.parties}>
        <View style={styles.partyRow}>
          <Text style={styles.partyLabel}>From:</Text>
          <Text style={styles.partyValue}>{from}</Text>
        </View>
        <View style={styles.partyRow}>
          <Text style={styles.partyLabel}>To:</Text>
          <Text style={styles.partyValue}>{to}</Text>
        </View>
      </View>

      {item.razorpayOrderId && (
        <Text style={styles.orderIdText}>Order ID: {item.razorpayOrderId}</Text>
      )}
    </TouchableOpacity>
  );
};

const PaymentRecordsScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => {
            if (userType === 'transporter') {
              navigation.navigate('Dashboard');
            } else {
              navigation.navigate('TrackingApp');
            }
          }}
          style={styles.headerButton}
        >
          <Icon name="caret-back" size={27} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, userType]);

  const getUserInfo = async () => {
    try {
      setUserType(null);
      setUserId(null);
      
      // Get the role first
      const role = await AsyncStorage.getItem('role');
      
      if (role === 'DRIVER') {
        const driverId = await AsyncStorage.getItem('driverId');
        setUserType('driver');
        setUserId(driverId);
      } else if (role === 'TRANSPORTER') {
        const transporterId = await AsyncStorage.getItem('transporterId');
        setUserType('transporter');
        setUserId(transporterId);
      } else if (role === 'MANUFACTURER') {
        const manufacturerId = await AsyncStorage.getItem('manufacturerId');
        setUserType('manufacturer');
        setUserId(manufacturerId);
      }
      
      console.log(`User type set to: ${userType}, ID: ${userId}`);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('Failed to load user information');
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  const fetchPayments = async () => {
    if (!userType || !userId) return;
  
    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE_URL}/payments/${userType}/${userId}`;
      const response = await axios.get(url);
      
      
      if (response.data && typeof response.data === 'string') {
        setError(response.data);
        setPayments([]);
        return;
      }
  
      let paymentsData = Array.isArray(response.data) ? response.data : [response.data];
  
      // **Filter out PENDING payments**
      paymentsData = paymentsData.filter(payment => payment.paymentStatus !== 'PENDING');
  
      // Moved the sort operation to a separate statement
      const sortedPayments = [...paymentsData];
      sortedPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setPayments(sortedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.response?.data || error.message);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userType && userId) {
      fetchPayments();
    }
  }, [userType, userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  // Use the PaymentItem component in renderItem
  const renderPaymentItem = ({ item }) => (
    <PaymentItem 
      item={item} 
      userType={userType} 
      navigation={navigation} 
    />
  );

  // Extract the nested ternary into a function
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#53a20e" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      );
    } else if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPayments}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.paymentId?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#53a20e']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payments found</Text>
            </View>
          }
          contentContainerStyle={payments.length === 0 ? styles.emptyList : null}
        />
      );
    }
  };

  if (!userType || !userId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please log in to view payments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    paddingHorizontal: 15,
  },
  paymentCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  shipmentId: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  status: {
    fontWeight: '600',
    fontSize: 14,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    color: '#666',
    fontSize: 14,
  },
  parties: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  partyLabel: {
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  partyValue: {
    color: '#333',
    fontSize: 14,
    flex: 3,
    textAlign: 'right',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#53a20e',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderIdText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  }
});

export default PaymentRecordsScreen;