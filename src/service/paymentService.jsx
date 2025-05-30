import axios from 'axios';
 
const API_BASE_URL = 'http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api';
const TEST_KEY = 'rzp_test_gsFsfyJyJoD5Ja';
 
export const paymentService = {
  createPayment: async (paymentDetails) => {
    const { shipmentId, manufacturerId, transporterId, amount, driverId } = paymentDetails;
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payments/create`,
        null,
        {
          params: {
            shipmentId,
            manufacturerId,
            transporterId,
            driverId,
            amount: parseFloat(amount),
          },
        }
      );
      
      const orderIdMatch = response.data.match(/Order ID: ([^\s]+)/);
      const paymentIdMatch = response.data.match(/Payment ID: (\d+)/);
      
      const orderId = orderIdMatch ? orderIdMatch[1] : null;
      const paymentId = paymentIdMatch ? parseInt(paymentIdMatch[1], 10) : null;
      
      if (!orderId || !paymentId) {
        throw new Error('Invalid payment creation response: Missing order ID or payment ID');
      }
      
      return { orderId, paymentId };
    } catch (error) {
      throw new Error('Failed to create payment: ' + (error.response?.data?.message || error.message));
    }
  },

  getRazorpayOptions: (paymentInfo) => {
    const {
      orderId,
      paymentId,
      amount,
      phoneNumber,
      email,
      companyName,
      cargoType,
      shipmentId,
      isDriverPayment,
    } = paymentInfo;
    
    return {
      description: `Payment to ${companyName} for ${cargoType} shipment #${shipmentId}`,
      image: '../assets/delivery-truck.png',
      currency: 'INR',
      key: TEST_KEY,
      amount: parseFloat(amount) * 100,
      name: companyName,
      order_id: orderId,
      prefill: {
        email: email,
        contact: phoneNumber,
        name: companyName,
      },
      theme: { color: '#53a20e' },
      retry: {
        enabled: true,
        max_count: 3
      },
      send_sms_hash: true,
      remember_customer: true,
      notes: {
        shipmentId: shipmentId.toString(),
        paymentId: paymentId.toString(),
        companyName,
        cargoType,
        isDriverPayment: isDriverPayment ? 'true' : 'false'
      }
    };
  },

  updateShipmentStatus: async (shipmentId, status) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/shipments/${shipmentId}/status/${status}`
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to update shipment status: ' + (error.response?.data?.message || error.message));
    }
  },

  // Extracted function to handle post-confirmation actions
  handlePostConfirmation: async (shipmentId, paymentId, isDriverPayment) => {
    // Skip processing for driver payments
    if (isDriverPayment || !shipmentId) {
      return;
    }
    
    // Update shipment status to "ACCEPTED"
    await paymentService.updateShipmentStatus(shipmentId, 'ACCEPTED');
    
    // Check if payment should be released
    if (paymentId) {
      try {
        const shipmentResponse = await axios.get(`${API_BASE_URL}/shipments/${shipmentId}`);
        if (shipmentResponse.data.status === 'DELIVERED') {
          await paymentService.releasePayment(paymentId);
        }
      } catch (error) {
        console.error('Error checking shipment status:', error.message);
        // Continue execution despite this error
      }
    }
  },

  confirmPayment: async (confirmationDetails) => {
    const { isDriverPayment, ...details } = confirmationDetails;
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payments/confirm`,
        null,
        {
          params: details
        }
      );
  
      if (response.data) {
        const shipmentId = response.data.shipmentId || details.notes?.shipmentId;
        const paymentId = response.data.paymentId;
        
        // Handle post-confirmation actions in a separate function
        await paymentService.handlePostConfirmation(shipmentId, paymentId, isDriverPayment);
      }
  
      return response.data;
    } catch (error) {
      throw new Error('Failed to confirm payment: ' + (error.response?.data?.message || error.message));
    }
  },
  
  releasePayment: async (paymentId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payments/${paymentId}/release`
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to release payment: ' + (error.response?.data?.message || error.message));
    }
  },
  // Add to paymentService object
markAsFailed: async (paymentId, reason) => {
  try {
    await axios.post(
      `${API_BASE_URL}/payments/${paymentId}/fail`,
      null,
      { params: { reason } }
    );
  } catch (error) {
    throw new Error('Failed to report payment failure: ' + (error.response?.data?.message || error.message));
  }
},
}