import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  InteractionManager ,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useRoute } from '@react-navigation/native';
import { paymentService } from '../service/paymentService';
 
const PaymentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const { amount, shipmentDetails, companyName, cargoType, phoneNumber, email } = route.params;
  const isDriverPayment = route.params.shipmentDetails.driverId;
 
  const updateShipmentStatus = async (shipmentId) => {
    try {
      // Only update status if it's a manufacturer-transporter payment
      if (!isDriverPayment) {
        console.log('Updating shipment status for manufacturer-transporter payment:', shipmentId);
        const updatedShipment = await paymentService.updateShipmentStatus(shipmentId, 'ACCEPTED');
        console.log('Shipment status updated successfully:', updatedShipment);
        return true;
      }
      console.log('Skipping status update for driver payment');
      return true;
    } catch (error) {
      console.error('Failed to update shipment status:', error);
      return false;
    }
  };

  const processRazorpayPayment = async (options) => {
    console.log('Opening Razorpay with options:', options);
    const razorpayResponse = await RazorpayCheckout.open(options);
    console.log('Razorpay Response:', razorpayResponse);
    return razorpayResponse;
  };

  // const handlePaymentSuccess = async (shipmentId) => {
  //   // Only update status for manufacturer-transporter payments
  //   if (!isDriverPayment) {
  //     const statusUpdateSuccess = await updateShipmentStatus(shipmentId);
  //     if (!statusUpdateSuccess) {
  //       console.warn('Payment successful but status update failed');
  //     }
  //   }

  //   Alert.alert(
  //     'Success',
  //     'Payment completed successfully!',
  //     [
  //       {
  //         text: 'OK',
  //         onPress: () => navigation.reset({
  //           index: 0,
  //           routes: [{ name: 'UploadShipmentScreen' }],
  //         })
  //       }
  //     ]
  //   );
  // };


  const handlePaymentSuccess = async (shipmentId) => {
    try {
      // Only update status for manufacturer-transporter payments
      if (!isDriverPayment) {
        const statusUpdateSuccess = await updateShipmentStatus(shipmentId);
        if (!statusUpdateSuccess) {
          console.warn('Payment successful but status update failed');
        }
      }
  
      // Log the shipment details before navigating
      console.log('Sending shipment details to UploadShipmentScreen:', {
        manufacturerId: shipmentDetails.manufacturerId,
        shipmentId: shipmentDetails.shipmentId,
        transporterId: shipmentDetails.transporterId
      });
  
      // Store data in AsyncStorage as backup
      try {
        await AsyncStorage.setItem('pendingShipmentData', JSON.stringify({
          manufacturerId: shipmentDetails.manufacturerId,
          shipmentId: shipmentDetails.shipmentId,
          transporterId: shipmentDetails.transporterId,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.warn('Failed to store shipment data:', storageError);
      }
  
      // Use InteractionManager to ensure navigation happens after all interactions
      InteractionManager.runAfterInteractions(() => {
        const navigationParams = {
          manufacturerId: shipmentDetails.manufacturerId,
          shipmentId: shipmentDetails.shipmentId,
          transporterId: shipmentDetails.transporterId
        };
  
        console.log('Navigating with params:', navigationParams);
  
        // Try multiple navigation strategies
        try {
          // Strategy 1: Reset navigation stack
          navigation.reset({
            index: 0,
            routes: [{ 
              name: 'UploadShipmentScreen',
              params: navigationParams
            }],
          });
        } catch (resetError) {
          console.error('Reset navigation failed:', resetError);
          try {
            // Strategy 2: Simple navigate
            navigation.navigate('UploadShipmentScreen', navigationParams);
          } catch (navError) {
            console.error('Navigate failed:', navError);
            // Strategy 3: Use CommonActions
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ 
                  name: 'UploadShipmentScreen',
                  params: navigationParams
                }],
              })
            );
          }
        }
  
        // Show success message after navigation
        setTimeout(() => {
          Alert.alert('Success', 'Payment completed successfully!');
        }, 300);
      });
  
    } catch (error) {
      console.error('Error in handlePaymentSuccess:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  
  const handlePaymentError = (error) => {
    console.error('Payment Error:', error);
    
    let errorMessage = 'Failed to process payment. Please try again.';
    
    if (error.description) {
      try {
        const parsedError = typeof error.description === 'string' ? 
          JSON.parse(error.description) : error.description;
        
        errorMessage = parsedError.error?.description || 
                      parsedError.error?.reason || 
                      'Payment authentication failed';
      } catch (e) {
        console.log('Error parsing error message:', e);
        errorMessage = error.description || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
  
    Alert.alert(
      'Payment Failed',
      errorMessage,
      [{ text: 'OK', onPress: () => setLoading(false) }]
    );
  };
 
  const handlePayment = async () => {
    let paymentId;
    try {
      setLoading(true);
      console.log('Starting payment process with details:', {
        amount,
        shipmentDetails,
        companyName,
        cargoType,
        isDriverPayment
      });
 
      // Create payment
      const { orderId, paymentId: createdPaymentId  } = await paymentService.createPayment({
        shipmentId: shipmentDetails.shipmentId,
        manufacturerId: shipmentDetails.manufacturerId,
        transporterId: shipmentDetails.transporterId,
        driverId: shipmentDetails.driverId,
        amount,
      });
      paymentId = createdPaymentId;
      console.log('Payment created successfully:', { orderId, paymentId });
 
      // Get Razorpay options
      const options = paymentService.getRazorpayOptions({
        orderId,
        paymentId,
        amount,
        phoneNumber: phoneNumber || '9999999999', // fallback
        email: email || 'test@example.com', // fallback
        companyName,
        cargoType,
        shipmentId: shipmentDetails.shipmentId,
        isDriverPayment
      });
 
      // Process payment with Razorpay
      const razorpayResponse = await processRazorpayPayment(options);
 
      // Confirm payment
      const confirmationResponse = await paymentService.confirmPayment({
        paymentId,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpayOrderId: orderId,
        razorpaySignature: razorpayResponse.razorpay_signature,
        isDriverPayment
      });
 
      console.log('Payment confirmation response:', confirmationResponse);
 
      if (confirmationResponse) {
        await handlePaymentSuccess(shipmentDetails.shipmentId);
      } else {
        throw new Error('Payment confirmation failed: No response data');
      }
    } catch (error)  {
      // Report failed payment to backend if paymentId exists
      if (paymentId) {
        try {
          await paymentService.markAsFailed(
            paymentId,
            error.message || 'Payment process aborted'
          );
        } catch (markError) {
          console.error('Failed to record payment failure:', markError);
        }
      }
      
      handlePaymentError(error);
    } finally {
      setLoading(false);
    }
  };
 
  // Input validation
  if (!amount || !shipmentDetails || !shipmentDetails.shipmentId || !companyName || !cargoType) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid payment details. Please try again.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Payment Details</Text>
       
        <View style={styles.detailsContainer}>
          <Text style={styles.label}>Amount to Pay:</Text>
          <Text style={styles.amount}>₹{parseFloat(amount).toLocaleString('en-IN')}</Text>
         
          <Text style={styles.label}>Shipment ID:</Text>
          <Text style={styles.detail}>#{shipmentDetails.shipmentId}</Text>
         
          <Text style={styles.label}>{isDriverPayment ? 'Driver' : 'Transporter'}:</Text>
          <Text style={styles.detail}>{companyName}</Text>
         
          <Text style={styles.label}>Cargo Type:</Text>
          <Text style={styles.detail}>{cargoType}</Text>
        </View>
         
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Proceed to Pay</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  detail: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#53a20e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
 
export default PaymentScreen;