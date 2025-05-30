import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

const SubmitQuotation = () => {

  const route = useRoute(); 
  const navigation = useNavigation();
  // const { shipmentId } = route.params; // Get the shipmentId from route params

  const { shipmentId } = route.params ; // Safely access shipmentId
  const [quotedPrice, setQuotedPrice] = useState('');
  const [validityPeriod, setValidityPeriod] = useState('');
  const [showValidityPicker, setShowValidityPicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowValidityPicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setValidityPeriod(formattedDate);
    }
  };

  const submitQuotation = async () => {
    console.log('Route Params:', route.params); // Debugging

    console.log('Shipment ID:', shipmentId);
if (!shipmentId) {
  Alert.alert('Error', 'Shipment ID is missing.');
  return;
}

    if (!quotedPrice) {
      Alert.alert('Error', 'Please enter a quoted price.');
      return;
    }
    if (!validityPeriod) {
      Alert.alert('Error', 'Please select a validity period.');
      return;
    }

     // Make sure you're using template literals for dynamic URL with shipmentId
     const apiUrl = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/full?manufacturerId=1&shipmentId=${shipmentId}`;
    const payload = {
      quotedPrice: parseFloat(quotedPrice),
      quoteStatus: 'PENDING',
      validityPeriod: new Date(validityPeriod).toISOString(), // Use ISO format
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', `Quotation submitted successfully..`);
        navigation.navigate('TrackingApp');
        setQuotedPrice(''); // Clear input fields
        setValidityPeriod('');
      } else {
        Alert.alert('Error', `Failed to submit quotation. Status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', `An error occurred: ${error.message}`);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <Text style={styles.label}>Quoted Price:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={quotedPrice}
          onChangeText={setQuotedPrice}
          placeholder="Enter quoted price"
        />

        <Text style={styles.label}>Validity Period:</Text>
        <TouchableOpacity onPress={() => setShowValidityPicker(true)}>
          <Text style={styles.dateInput}>
            {validityPeriod || 'Select Validity Period'}
          </Text>
        </TouchableOpacity>
        {showValidityPicker && (
          <DateTimePicker
            value={validityPeriod ? new Date(validityPeriod) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Button title="Submit Quotation" onPress={submitQuotation} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    backgroundColor: '#f5f5f5', // Background color
    paddingHorizontal: 20, // Padding on the sides
  },
  container: {
    width: '100%', // Ensure form takes up the full width
    maxWidth: 400, // Limit max width for better UX on larger screens
    backgroundColor: '#fff', // Form background
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
});

export default SubmitQuotation;
