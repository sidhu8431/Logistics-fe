import React, { useState, useEffect, useCallback   } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";


const CompanyDetailsForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phoneNumber: "",
    address: "",
    companyPanNumber: "",
    companyGstNumber: "",
    companyLicenseType: "",
    companyLicenseNumber: "",
    subLicenseNumber: "",
    subLicenseType: "",
  });

  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const storedUserId = await AsyncStorage.getItem("userId");
          const storedRole = await AsyncStorage.getItem("role");

          if (storedUserId && storedRole) {
            setUserId(parseInt(storedUserId, 10));
            setRole(storedRole);

            const apiUrl =
              storedRole === "TRANSPORTER"
                ? `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/transporter/getTransporter/${storedUserId}`
                : `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/manufacturer/getManufacturer/${storedUserId}`;
                
            fetchCompanyDetails(apiUrl);
          } else {
            Alert.alert("Login Required", "User ID or Role not found. Please log in again.");
          }
        } catch (error) {
          console.error("Error fetching AsyncStorage data:", error);
          Alert.alert("Error", "Failed to retrieve user data.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [])
  );
  
  // Fetch Company Details
  const fetchCompanyDetails = async (url) => {
    try {
      const response = await axios.get(url);
      if (response.data) {
        setFormData(response.data);
      }
    } catch (error) {
      console.log("No existing company details found", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Validation
  const validateForm = () => {
    if (!formData.companyName.trim()) {
      Alert.alert("Validation Error", "Company Name is required.");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("Validation Error", "Email is required.");
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert("Validation Error", "Phone Number is required.");
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert("Validation Error", "Address is required.");
      return false;
    }
    if (!formData.companyGstNumber.trim()) {
      Alert.alert("Validation Error", "GST Number is required.");
      return false;
    }
    if (!formData.companyLicenseNumber.trim()) {
      Alert.alert("Validation Error", "Company License Number is required.");
      return false;
    }
    if (!formData.companyLicenseType.trim()) {
      Alert.alert("Validation Error", "Company License Type is required.");
      return false;
    }
    return true;
  };
  

  // Handle Form Submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    // Remove optional fields if empty
    const requestData = { ...formData };
    if (!requestData.subLicenseType) delete requestData.subLicenseType;
    if (!requestData.subLicenseNumber) delete requestData.subLicenseNumber;
  
    console.log("Submitting Data:", requestData);
  
    const apiUrl =
      role === "TRANSPORTER"
        ? `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/transporter/saveTransporter/${userId}`
        : `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/manufacturer/postManufacturer/${userId}`;
  
    try {
      const response = await axios.post(apiUrl, requestData);
      Alert.alert("Success", "Company details submitted successfully!");
      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error Response:", error.response ? error.response.data : error);
      Alert.alert("Error", `Failed to submit: ${JSON.stringify(error.response?.data)}`);
    }
  };
  
  
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b0082" />
        <Text>Loading...</Text>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : null}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4b0082" />
          <Text style={styles.loadingText}>Loading Company Details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Company Details</Text>
  
          {/* Company Name Input */}
          <Text style={styles.label}>Company Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Company Name"
            value={formData.companyName}
            onChangeText={(value) => handleInputChange("companyName", value)}
          />
  
          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Email"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
          />
  
          {/* Phone Number Input */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Phone Number"
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange("phoneNumber", value)}
          />
  
          {/* Address Input */}
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter Address"
            multiline
            numberOfLines={3}
            value={formData.address}
            onChangeText={(value) => handleInputChange("address", value)}
          />
  
          {/* GST Number Input */}
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter GST Number"
            value={formData.companyGstNumber}
            onChangeText={(value) => handleInputChange("companyGstNumber", value)}
          />
  
          {/* Company License Type Dropdown */}
          <Text style={styles.label}>Company License Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.companyLicenseType}
              style={styles.picker}
              onValueChange={(itemValue) => handleInputChange("companyLicenseType", itemValue)}
            >
              <Picker.Item label="Select License Type" value="" />
              <Picker.Item label="Trade License" value="trade_license" />
              <Picker.Item label="Business Registration" value="business_registration" />
            </Picker>
          </View>
  
          {/* Company License Number Input */}
          <Text style={styles.label}>Company License Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Company License Number"
            value={formData.companyLicenseNumber}
            onChangeText={(value) => handleInputChange("companyLicenseNumber", value)}
          />
  
          {/* Conditionally render Sub License Type and Sub License Number */}
          {formData.companyLicenseType === "business_registration" && (
            <>
              {/* Sub License Type Dropdown (Optional) */}
              <Text style={styles.label}>Sub License Type (Optional)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.subLicenseType}
                  style={styles.picker}
                  onValueChange={(itemValue) => handleInputChange("subLicenseType", itemValue)}
                >
                  <Picker.Item label="Select Sub License Type" value="" />
                  <Picker.Item label="Sole Proprietorship" value="sole_proprietorship" />
                  <Picker.Item label="Partnership" value="partnership" />
                  <Picker.Item label="LLP" value="LLP" />
                  <Picker.Item label="PVT Limited Company" value="pvt_limited_company" />
                </Picker>
              </View>
  
              {/* Sub License Number Input (Optional) */}
              <Text style={styles.label}>Sub License Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Sub License Number"
                value={formData.subLicenseNumber}
                onChangeText={(value) => handleInputChange("subLicenseNumber", value)}
              />
            </>
          )}
  
          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
  
}  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4b0082",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#4b0082",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    textAlignVertical: "top",
    height: 80,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  submitButton: {
    backgroundColor: "#FFD400",
    padding: 16,
    borderRadius: 35,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});



export default CompanyDetailsForm;