import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";


const VehicleInfoForm = () => {
  const [form, setForm] = useState({
    brand: "",
    model: "",
    vehicleNumber: "",
    refrigerator: false,
    registrationDate: "",
    maxCapacity: "",
    mileage: "",
    fuelType: "",
  });

  const [transporterId, setTransporterId] = useState(null); // Store transporterId
  const [vehicleData, setVehicleData] = useState([]);
  const [uniqueBrands, setUniqueBrands] = useState([]);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);
  const [showRegistrationDatePicker, setShowRegistrationDatePicker] = useState(false);


  useEffect(() => {
    fetchVehicleData();
    getTransporterId(); // Fetch transporter ID from AsyncStorage
  }, []);

  const getTransporterId = async () => {
    try {
      const storedId = await AsyncStorage.getItem("transporterId");
      if (storedId) {
        setTransporterId(JSON.parse(storedId)); // Parse it since it's stored as a string
        console.log("Transporter ID:", storedId);
      }
    } catch (error) {
      console.error("Error fetching transporter ID:", error);
    }
  };

  // ✅ Fetch vehicle data from API
  const fetchVehicleData = async () => {
    try {
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/vehicleData/vehicles/all");
      const data = await response.json();

      if (data && Array.isArray(data)) {
        const uniqueBrands = [...new Set(data.map((vehicle) => vehicle.brandName))];
        setVehicleData(data);
        setUniqueBrands(uniqueBrands);
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      Alert.alert("Error", "Failed to fetch vehicle data.");
    }
  };

  // ✅ Extract numeric values from maxCapacity & mileage
  const extractNumericValue = (value) => {
    if (!value) return "";
    return value.replace(/[^0-9.]/g, ""); // Remove non-numeric characters except "."
  };

  // ✅ Handle input change
  const handleInputChange = (field, value) => {
    let updatedValue = value;
  
    if (field === "refrigerator") {
      updatedValue = value === "Yes"; // Convert "Yes" to `true`
    }
  
    if (field === "vehicleNumber") {
      updatedValue = value.trim(); // Ensure trimming
    }
  
    if (field === "brand") {
      setForm((prevForm) => ({
        ...prevForm,
        brand: updatedValue,
        model: "",
        maxCapacity: "",
        mileage: "",
        fuelType: "",
      }));
      setSelectedVehicleDetails(null);
      return;
    }
  
    if (field === "model") {
      const vehicleDetails = vehicleData.find(
        (v) => v.brandName === form.brand && v.modelName === updatedValue
      );
  
      if (vehicleDetails) {
        setForm((prevForm) => ({
          ...prevForm,
          model: updatedValue,
          maxCapacity: extractNumericValue(vehicleDetails.maxCapacity),
          mileage: extractNumericValue(vehicleDetails.mileage),
          fuelType: vehicleDetails.fuelType || "",
        }));
        setSelectedVehicleDetails(vehicleDetails);
      } else {
        setSelectedVehicleDetails(null);
      }
      return;
    }
  
    setForm((prevForm) => ({
      ...prevForm,
      [field]: updatedValue,
    }));
  };
  

  // ✅ Handle date selection
  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
      setForm({ ...form, registrationDate: formattedDate });
    }
    setShowRegistrationDatePicker(false);
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    console.log("🚀 Form Data Before Submit:", form); // Debugging
  
    // ✅ Validation checks before submission
    if (!form.vehicleNumber) {
      Alert.alert("Error", "Vehicle Number is required.");
      return;
    }
  
    if (!form.brand) {
      Alert.alert("Error", "Brand is required.");
      return;
    }
  
    if (!form.model) {
      Alert.alert("Error", "Model is required.");
      return;
    }
  
    if (!form.registrationDate) {
      Alert.alert("Error", "Registration Date is required.");
      return;
    }
  
    if (!form.maxCapacity || !form.mileage) {
      Alert.alert("Error", "Vehicle details are missing. Please select a valid model.");
      return;
    }
  
    // ✅ Convert maxCapacity and mileage to numbers
    const formattedMaxCapacity = parseFloat(form.maxCapacity);
    const formattedMileage = parseFloat(form.mileage);
  
    // ✅ Ensure numeric validation
    if (isNaN(formattedMaxCapacity) || isNaN(formattedMileage)) {
      Alert.alert("Error", "Max Capacity and Mileage must be numeric.");
      return;
    }
  
    // ✅ Prepare the request body
    const requestBody = {
      brand: form.brand,
      model: form.model,
      vehicleNumber: form.vehicleNumber,
      refrigerator: Boolean(form.refrigerator), // Ensure Boolean
      registrationDate: form.registrationDate,
      maxCapacity: formattedMaxCapacity, // Converted to number
      mileage: formattedMileage, // Converted to number
      fuelType: form.fuelType,
    };
  
    console.log("🚀 Submitting Data:", JSON.stringify(requestBody, null, 2));
  
    try {
      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/vehicles/postVehicles/${transporterId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
  
      const responseJson = await response.json();
      console.log("✅ Response:", responseJson);
  
      if (response.ok) {
        Alert.alert("Success", "Vehicle Info Submitted Successfully!");
        
        // ✅ Reset the form after successful submission
        setForm({
          brand: "",
          model: "",
          vehicleNumber: "",
          refrigerator: false,
          registrationDate: "",
          maxCapacity: "",
          mileage: "",
          fuelType: "",
        });
      } else {
        Alert.alert("Error", JSON.stringify(responseJson));
      }
    } catch (error) {
      Alert.alert("Error", "Network error: Unable to connect to the server.");
    }
  };
  

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : null}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Vehicle Information</Text>

        <View style={styles.inputContainer}>
  <Text style={styles.label}>Vehicle Number</Text>
  <TextInput
    style={styles.input}
    placeholder="Enter Vehicle Number"
    value={form.vehicleNumber}
    onChangeText={(value) => handleInputChange("vehicleNumber", value)}
  />
</View>


        {/* Brand Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Brand</Text>
          <Picker selectedValue={form.brand} onValueChange={(value) => handleInputChange("brand", value)}>
            <Picker.Item label="Select Brand" value="" />
            {uniqueBrands.map((brand, index) => (
              <Picker.Item key={index} label={brand} value={brand} />
            ))}
          </Picker>
        </View>

        {/* Model Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Model</Text>
          <Picker selectedValue={form.model} onValueChange={(value) => handleInputChange("model", value)}>
            <Picker.Item label="Select Model" value="" />
            {vehicleData.filter(v => v.brandName === form.brand).map((v, index) => (
              <Picker.Item key={index} label={v.modelName} value={v.modelName} />
            ))}
          </Picker>
        </View>

        {/* Registration Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Registration Date</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowRegistrationDatePicker(true)}>
            <Text style={styles.datePickerText}>
              {form.registrationDate || "Select Registration Date"}
            </Text>
          </TouchableOpacity>
        </View>
        {showRegistrationDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  heading: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  submitButton: { backgroundColor: "#ffd700", padding: 12, borderRadius: 4, alignItems: "center" },
  submitButtonText: { fontSize: 16, fontWeight: "bold", color: "#000" },
});

export default VehicleInfoForm;
