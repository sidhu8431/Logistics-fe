import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const DriverDetailsForm = () => {
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    experience: '',
    licenseNumber: '',
    licenseType: ''
  });
  

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch the userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
          fetchDriverDetails(storedUserId);
        } else {
          Alert.alert("Error", "User ID not found. Please log in again.");
          setFetching(false);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to retrieve User ID.");
        setFetching(false);
      }
    };

    fetchUserId();
  }, []);

  // Fetch driver details if available
  const fetchDriverDetails = async (userId) => {
    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/getDriver/${userId}`);

      if (!response.ok) {
        throw new Error("Driver details not found.");
      }

      const driverData = await response.json();
      console.log("🚀 Driver Details Fetched:", driverData);

      setForm(driverData);
    } catch (error) {
      console.log("❌ No existing driver details found:", error.message);
    } finally {
      setFetching(false);
    }
  };

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    let newErrors = { ...errors };

    if (field === "name") {
      if (!/^[A-Za-z\s]*$/.test(value)) {
        newErrors.name = "⚠ Only letters are allowed.";
      } else if (value.length > 30) {
        newErrors.name = "⚠ Name must not exceed 30 characters.";
      } else if (value.length > 0 && value.length < 6) {
        newErrors.name = "⚠ Name must be at least 6 characters.";
      } else {
        delete newErrors.name;
      }
    }

    if (field === "phoneNumber") {
      if (!/^\d*$/.test(value)) {
        newErrors.phoneNumber = "⚠ Only numbers are allowed.";
      } else if (value.length > 10) {
        newErrors.phoneNumber = "⚠ Phone number must be exactly 10 digits.";
      } else if (value.length < 10 && value.length > 0) {
        newErrors.phoneNumber = "⚠ Phone number must be 10 digits long.";
      } else {
        delete newErrors.phoneNumber;
      }
    }

    if (field === "experience") {
      if (!/^\d{0,2}$/.test(value)) {
        newErrors.experience = "⚠ Only numbers allowed.";
      } else if (value > 30) {
        newErrors.experience = "⚠ Experience cannot exceed 30 years.";
      } else if (value < 1 && value.length > 0) {
        newErrors.experience = "⚠ Minimum experience is 1 year.";
      } else {
        delete newErrors.experience;
      }
    }

    if (field === "licenseNumber") {
      if (value.length > 15) {
        newErrors.licenseNumber = "⚠ License number must not exceed 15 characters.";
      } else {
        delete newErrors.licenseNumber;
      }
    }

    if (field === "licenseType" && !value) {
      newErrors.licenseType = "⚠ Please select a License Type.";
    } else {
      delete newErrors.licenseType;
    }

    setForm({ ...form, [field]: value });
    setErrors(newErrors);
  };

  // Validate Form Before Submission
  const validateForm = () => {
    let newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "⚠ Name is required.";
    } else if (!/^[A-Za-z\s]{6,30}$/.test(form.name)) {
      newErrors.name = "⚠ Name must be 6-30 letters.";
    }

    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "⚠ Phone Number is required.";
    } else if (!/^\d{10}$/.test(form.phoneNumber)) {
      newErrors.phoneNumber = "⚠ Phone Number must be exactly 10 digits.";
    }

    if (!form.experience.trim()) {
      newErrors.experience = "⚠ Experience is required.";
    } else if (!/^\d{1,2}$/.test(form.experience) || form.experience < 1 || form.experience > 30) {
      newErrors.experience = "⚠ Experience must be between 1 and 30 years.";
    }

    if (!form.licenseNumber.trim()) {
      newErrors.licenseNumber = "⚠ License Number is required.";
    } else if (form.licenseNumber.length > 15) {
      newErrors.licenseNumber = "⚠ License Number must not exceed 15 characters.";
    }

    if (!form.licenseType) {
      newErrors.licenseType = "⚠ Please select a License Type.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submission
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fix the errors before submitting.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User ID not available. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/addDriver/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save driver details.");
      }

      Alert.alert("Success", "Driver details saved successfully!");
      fetchDriverDetails(userId); // Fetch details again after saving
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b0082" />
        <Text>Loading...</Text>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Driver Details</Text>
  
        {/* Name Input */}
        <Text style={styles.label}>Name (as per licence):</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(value) => handleInputChange("name", value)}
          placeholder="Enter name as per licence"
          placeholderTextColor="#888"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
  
        {/* Phone Number Input */}
        <Text style={styles.label}>Phone Number (work):</Text>
        <TextInput
          style={styles.input}
          value={form.phoneNumber}
          onChangeText={(value) => handleInputChange("phoneNumber", value)}
          placeholder="Enter phone number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
  
        {/* Experience Input */}
        <Text style={styles.label}>Experience (in years):</Text>
        <TextInput
          style={styles.input}
          value={form.experience}
          onChangeText={(value) => handleInputChange("experience", value)}
          placeholder="Enter experience (e.g., 5 years)"
          placeholderTextColor="#888"
          keyboardType="numeric"
        />
        {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
  
        {/* License Number Input */}
        <Text style={styles.label}>License Number:</Text>
        <TextInput
          style={styles.input}
          value={form.licenseNumber}
          onChangeText={(value) => handleInputChange("licenseNumber", value)}
          placeholder="Enter License Number"
          placeholderTextColor="#888"
          maxLength={15}
        />
        {errors.licenseNumber && <Text style={styles.errorText}>{errors.licenseNumber}</Text>}
  
        {/* License Type Picker */}
        <Text style={styles.label}>License Type:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.licenseType}
            style={styles.picker}
            onValueChange={(value) => handleInputChange("licenseType", value)}
          >
            <Picker.Item label="Select License Type" value="" />
            <Picker.Item label="Light Motor Vehicle (LMV)" value="LIGHT_MOTOR_VEHICLE" />
            <Picker.Item label="Heavy Motor Vehicle (HMV)" value="HEAVY_MOTOR_VEHICLE" />
          </Picker>
        </View>
        {errors.licenseType && <Text style={styles.errorText}>{errors.licenseType}</Text>}
  
        {/* Submit Button */}
        {loading ? (
          <ActivityIndicator size="large" color="#6200EE" />
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
  
}  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5", // Light Gray Background for Android UI consistency
  },
  scrollView: {
    paddingBottom: 30, // Prevents overlap with keyboard
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333", // Dark gray for better visibility
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 45, // Rounded corners for better UI
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12, // More spacing for better visibility
    color: "#333", // Text color for Android readability
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 45,
    backgroundColor: "#fff",
    marginBottom: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: -8,
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#FFDB58", // Material Design primary color for Android
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    elevation: 3, // Android shadow effect
  },
  saveButtonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});


export default DriverDetailsForm;

