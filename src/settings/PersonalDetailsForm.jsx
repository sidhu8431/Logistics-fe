import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const PersonalDetailsForm = () => {
  const [form, setForm] = useState({
    panNumber: '',
    aadharNumber: '',
    dateOfBirth: '',
    gender: '',
    licenseNumber: '',
    licenseType: '',
  });

  const [errors, setErrors] = useState({});
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedRole = await AsyncStorage.getItem('role');

        if (storedUserId) {
          setUserId(storedUserId);
          setRole(storedRole);
          fetchPersonalDetails(storedUserId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to retrieve user ID');
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const fetchPersonalDetails = async (userId) => {
    try {
      const response = await axios.get(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/profileSettings/getProfile/${userId}`);
  
      if (response.data) {
        // Ensure gender is always stored in uppercase
        const updatedData = {
          ...response.data,
          gender: response.data.gender ? response.data.gender.toUpperCase() : "",
        };
  
        console.log("🔍 Normalized API Response:", updatedData); // Debugging log
  
        setForm(updatedData);
      }
    } catch (error) {
      console.log("❌ No existing personal details found", error);
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleInputChange = (field, value) => {
    let newErrors = { ...errors };
  
     // Convert PAN & License Number to Uppercase
  if (field === "panNumber" || field === "licenseNumber") {
    value = value.toUpperCase().trim();  // Trim spaces
  }
  
    // PAN Number Validation (ABCDE1234F format)
    if (field === "panNumber") {
      if (!/^[A-Z]{0,5}[0-9]{0,4}[A-Z]{0,1}$/.test(value)) {
        newErrors.panNumber = "⚠ Invalid PAN Format: Use ABCDE1234F";
      } else if (value.length === 10 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
        newErrors.panNumber = "⚠ PAN must follow format ABCDE1234F";
      } else {
        delete newErrors.panNumber;
      }
    }
  
    // Aadhaar Number Validation (Must be exactly 12 digits)
    if (field === "aadharNumber") {
      if (!/^\d{0,12}$/.test(value)) {
        newErrors.aadharNumber = "⚠ Aadhaar must contain only 12 digits.";
      } else if (value.length === 12 && !/^\d{12}$/.test(value)) {
        newErrors.aadharNumber = "⚠ Aadhaar must be exactly 12 digits.";
      } else {
        delete newErrors.aadharNumber;
      }
    }
  
    // Date of Birth Validation (YYYY-MM-DD)
    if (field === "dateOfBirth") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        newErrors.dateOfBirth = "⚠ Date of Birth must be in YYYY-MM-DD format.";
      } else {
        const dob = new Date(value);
        const today = new Date();
        if (dob >= today) {
          newErrors.dateOfBirth = "⚠ Date of Birth must be a past date.";
        } else {
          delete newErrors.dateOfBirth;
        }
      }
    }
  
    // Gender Validation (Required)
    if (field === "gender" && !value) {
      newErrors.gender = "⚠ Gender selection is required.";
    } else {
      delete newErrors.gender;
    }
  
    // License Number Validation (Only for DRIVER Role)
    if (field === "licenseNumber") {
      value = value.toUpperCase().trim();
      console.log("📝 Updating License Number:", value); // Debugging log
    }
  
    // License Type Validation (Required for DRIVER Role)
    if (role === "DRIVER" && field === "licenseType" && !value) {
      newErrors.licenseType = "⚠ License Type is required for drivers.";
    } else {
      delete newErrors.licenseType;
    }
  
    // Update Form State & Errors
    setForm({ ...form, [field]: value });
    setErrors(newErrors);
  };
  

  const validateForm = () => {
    let newErrors = {};
  
    // PAN Number Validation
    if (!form.panNumber.trim()) {
      newErrors.panNumber = "⚠ PAN Number is required.";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)) {
      newErrors.panNumber = "⚠ Invalid PAN Format (ABCDE1234F).";
    }
  
    // Aadhaar Number Validation
    if (!form.aadharNumber.trim()) {
      newErrors.aadharNumber = "⚠ Aadhaar Number is required.";
    } else if (!/^\d{12}$/.test(form.aadharNumber)) {
      newErrors.aadharNumber = "⚠ Aadhaar must be exactly 12 digits.";
    }
  
    // Date of Birth Validation (YYYY-MM-DD format)
    if (!form.dateOfBirth.trim()) {
      newErrors.dateOfBirth = "⚠ Date of Birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
      newErrors.dateOfBirth = "⚠ Date of Birth must be in YYYY-MM-DD format.";
    } else {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        newErrors.dateOfBirth = "⚠ Date of Birth must be a past date.";
      }
    }
  
    // Gender Validation
    if (!form.gender) {
      newErrors.gender = "⚠ Gender selection is required.";
    }
    
  
    // License Number Validation (Only for Drivers)
    console.log("🚀 Form Data Before Validation:", form);

  // License Number Validation (Only for Drivers)
  if (role === "DRIVER") {
    const licenseNumber = form.licenseNumber.trim().toUpperCase();
    console.log("✅ Entered License Number:", licenseNumber);

    const isValidLicense = /^[A-Z]{2}\d{14}$/.test(licenseNumber);
    console.log("✅ License Number Validation Result:", isValidLicense);

    if (!licenseNumber) {
      newErrors.licenseNumber = "⚠ License Number is required for drivers.";
    } else if (!isValidLicense) {
      newErrors.licenseNumber = "⚠ Invalid License Number format (e.g., TS09876543212345).";
    } else {
      delete newErrors.licenseNumber;
    }
  }

  console.log("❌ Final Errors:", newErrors);
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
  

const handleSubmit = async () => {
  if (!validateForm()) {
    Alert.alert("Validation Error", "Please fix all errors before submitting.");
    return;
  }

  const requestData = {
    panNumber: form.panNumber.trim(),
    aadharNumber: form.aadharNumber.trim(),
    dateOfBirth: form.dateOfBirth.trim(),
    gender: form.gender.trim(),
    licenseNumber: role === "DRIVER" ? form.licenseNumber.trim() : null,
    licenseType: role === "DRIVER" ? form.licenseType.trim() : null,
  };

  console.log("🚀 Submitting Form Data:", requestData); // Debugging log

  try {
    const response = await axios.post(
      `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/profileSettings/user/${userId}`,
      requestData
    );
    Alert.alert("Success", "Personal details updated successfully!");
    fetchPersonalDetails(userId);
  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);
    Alert.alert("Error", `Failed to update personal details: ${error.response?.data?.message || "Try again."}`);
  }
};


  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 50 }} />;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Personal Details</Text>

        <Text style={styles.label}>PAN Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter PAN Number"
          value={form.panNumber}
          onChangeText={(value) => handleInputChange('panNumber', value)}
          maxLength={10}
          autoCapitalize="characters"        />
        {errors.panNumber ? <Text style={styles.errorText}>{errors.panNumber}</Text> : null}

        <Text style={styles.label}>Aadhaar Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Aadhaar Number"
          value={form.aadharNumber}
          keyboardType="number-pad"
          onChangeText={(value) => handleInputChange('aadharNumber', value)}
          maxLength={12}
        />
        {errors.aadharNumber ? <Text style={styles.errorText}>{errors.aadharNumber}</Text> : null}

        <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
<View style={styles.pickerContainer}>
  <Picker
    selectedValue={form.gender}  // ✅ Normalized gender value
    style={styles.picker}
    onValueChange={(value) => handleInputChange("gender", value)}
  >
    <Picker.Item label="Select Gender" value="" />
    <Picker.Item label="Male" value="MALE" />
    <Picker.Item label="Female" value="FEMALE" />
    <Picker.Item label="Other" value="OTHER" />
  </Picker>
</View>
{errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

<Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
<TextInput
    style={styles.input}
    placeholder="YYYY-MM-DD"
    value={form.dateOfBirth}
    onChangeText={(value) => handleInputChange("dateOfBirth", value)}
/>
{errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}



        {/* Only show license fields if role is DRIVER */}
        {role === 'DRIVER' && (
          <>
            <Text style={styles.label}>License Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter License Number"
              value={form.licenseNumber}
              onChangeText={(value) => handleInputChange('licenseNumber', value)}
            />
            {errors.licenseNumber ? <Text style={styles.errorText}>{errors.licenseNumber}</Text> : null}

            <Text style={styles.label}>License Type <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.licenseType}
                style={styles.picker}
                onValueChange={(value) => handleInputChange('licenseType', value)}
              >
                <Picker.Item label="Select License Type" value="" />
                <Picker.Item label="LMV" value="LIGHT_MOTOR_VEHICLE" />
                <Picker.Item label="HMV" value="HEAVY_MOTOR_VEHICLE" />
              </Picker>
            </View>
            {errors.licenseType ? <Text style={styles.errorText}>{errors.licenseType}</Text> : null}
          </>
        )}

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
  required: {
    color: 'red',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 45,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#FFDB58',
    padding: 12,
    borderRadius: 35,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PersonalDetailsForm;

