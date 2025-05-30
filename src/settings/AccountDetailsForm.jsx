import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AccountDetailsForm = () => {
  const [form, setForm] = useState({
    bankName: '',
    ifscCode: '',
    accountNumber: '',
    accountHolderName: '',
    accountType: '',
  });

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});


  // Fetch userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          fetchBankDetails(storedUserId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to retrieve user ID');
        setLoading(false);
      }
    };
    fetchUserId();
  }, []);

  // Fetch existing bank details
  const fetchBankDetails = async (userId) => {
    try {
      console.log(`Fetching bank details for userId: ${userId}`);
  
      const response = await axios.get(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/bank/user/${userId}`);
  
      if (response.data && response.data.length > 0) {
        const bankDetails = response.data[0]; // Extract first object from the array
        console.log("Updated Bank Details:", bankDetails);
        
        setForm({
          bankName: bankDetails.bankName || '',
          accountHolderName: bankDetails.accountHolderName || '',
          ifscCode: bankDetails.ifscCode || '',
          accountNumber: bankDetails.accountNumber || '',
          accountType: bankDetails.accountType || '',
        });
      } else {
        console.log('No bank details found.');
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  

  // Input handler
  const handleInputChange = (field, value) => {
    let newErrors = { ...errors };
  
    // Enforce Uppercase for IFSC Code
    if (field === 'ifscCode') {
      value = value.toUpperCase();
    }
  
    // Bank Name Validation (Max 30 characters)
    if (field === 'bankName') {
      if (value.length > 30) {
        newErrors.bankName = '⚠ Bank Name must not exceed 30 characters.';
      } else {
        delete newErrors.bankName;
      }
    }
  
    // Account Holder Name Validation (Max 30 characters)
    if (field === 'accountHolderName') {
      if (value.length > 30) {
        newErrors.accountHolderName = '⚠ Account Holder Name must not exceed 30 characters.';
      } else {
        delete newErrors.accountHolderName;
      }
    }
  
    // IFSC Code Validation (Must match standard format)
    if (field === 'ifscCode') {
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value) && value.length > 0) {
        newErrors.ifscCode = '⚠ Invalid IFSC Code format (e.g., KKBK0007466 or SBIN0011077).';
      } else {
        delete newErrors.ifscCode;
      }
    }
  
    // Account Number Validation (Only digits, min 6, max 18)
    if (field === 'accountNumber') {
      if (!/^\d*$/.test(value)) {
        newErrors.accountNumber = '⚠ Account Number must contain only digits.';
      } else if (value.length < 6 || value.length > 18) {
        newErrors.accountNumber = '⚠ Account Number must be between 6 and 18 digits.';
      } else {
        delete newErrors.accountNumber;
      }
    }
  
    setForm({ ...form, [field]: value });
    setErrors(newErrors);
  };
  

  // Validation Function
  const validateForm = () => {
    let newErrors = {};
  
    if (!form.bankName.trim()) {
      newErrors.bankName = '⚠ Bank Name is required.';
    } else if (form.bankName.length > 30) {
      newErrors.bankName = '⚠ Bank Name must not exceed 30 characters.';
    }
  
    if (!form.accountHolderName.trim()) {
      newErrors.accountHolderName = '⚠ Account Holder Name is required.';
    } else if (form.accountHolderName.length > 30) {
      newErrors.accountHolderName = '⚠ Account Holder Name must not exceed 30 characters.';
    }
  
    if (!form.ifscCode.trim()) {
      newErrors.ifscCode = '⚠ IFSC Code is required.';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode)) {
      newErrors.ifscCode = '⚠ Invalid IFSC Code format (e.g., KKBK0007466 or SBIN0011077).';
    }
  
    if (!form.accountNumber.trim()) {
      newErrors.accountNumber = '⚠ Account Number is required.';
    } else if (!/^\d{6,18}$/.test(form.accountNumber)) {
      newErrors.accountNumber = '⚠ Account Number must be between 6 and 18 digits.';
    }
  
    if (!form.accountType) {
      newErrors.accountType = '⚠ Please select an Account Type.';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  // Form submission handler
  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    try {
      await axios.post(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/bank/user/${userId}`, form);
      Alert.alert('Success', 'Account details updated successfully!');
      
      // Immediately fetch the updated data
      fetchBankDetails(userId);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update account details.');
    }
  };
  

  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 50 }} />;
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Account Details</Text>

        {/* Bank Name Input */}
<Text style={styles.label}>Bank Name</Text>
<TextInput
  style={styles.input}
  placeholder="Enter Bank Name"
  value={form.bankName}
  onChangeText={(value) => handleInputChange('bankName', value)}
  maxLength={30}
/>
{errors.bankName ? <Text style={styles.errorText}>{errors.bankName}</Text> : null}

{/* Account Holder Name Input */}
<Text style={styles.label}>Account Holder Name</Text>
<TextInput
  style={styles.input}
  placeholder="Enter Account Holder Name"
  value={form.accountHolderName}
  onChangeText={(value) => handleInputChange('accountHolderName', value)}
  maxLength={30}
/>
{errors.accountHolderName ? <Text style={styles.errorText}>{errors.accountHolderName}</Text> : null}

{/* IFSC Code Input */}
<Text style={styles.label}>IFSC Code</Text>
<TextInput
  style={styles.input}
  placeholder="Enter IFSC Code"
  value={form.ifscCode}
  autoCapitalize="characters"
  maxLength={11}
  onChangeText={(value) => handleInputChange('ifscCode', value)}
/>
{errors.ifscCode ? <Text style={styles.errorText}>{errors.ifscCode}</Text> : null}

{/* Account Number Input */}
<Text style={styles.label}>Account Number</Text>
<TextInput
  style={styles.input}
  placeholder="Enter Account Number"
  value={form.accountNumber}
  keyboardType="number-pad"
  maxLength={18}
  onChangeText={(value) => handleInputChange('accountNumber', value)}
/>
{errors.accountNumber ? <Text style={styles.errorText}>{errors.accountNumber}</Text> : null}


        {/* Account Type Dropdown */}
        <Text style={styles.label}>Account Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.accountType}
            style={styles.picker}
            onValueChange={(value) => handleInputChange('accountType', value)}
          >
            <Picker.Item label="Select Account Type" value="" />
            <Picker.Item label="Savings" value="Savings" />
            <Picker.Item label="Current" value="Current" />
            <Picker.Item label="Fixed Deposit" value="FixedDeposit" />
          </Picker>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 45,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 45,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#FFDB58',
    padding: 12,
    borderRadius: 35,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',   // ✅ Error message in red
    fontSize: 14,   // ✅ Adjust font size for visibility
    marginTop: 4,   // ✅ Add spacing from the input field
    marginBottom: 6, // ✅ Space between the error and next field
  },
});

export default AccountDetailsForm;
