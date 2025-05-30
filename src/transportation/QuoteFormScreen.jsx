import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";


const QuoteFormScreen = ({ route, navigation }) => {
  const { shipment, manufacturer } = route.params;

  const [transporterId, setTransporterId] = useState(null);

  // State variables
  const [fuelCostPerKM, setFuelCostPerKM] = useState("");
  const [totalFuelCost, setTotalFuelCost] = useState("");
  const [tollsAndTaxes, setTollsAndTaxes] = useState("");
  const [driverWages, setDriverWages] = useState("");
  const [transporterCharges, setTransporterCharges] = useState("");
  const [refrigeratorCharges, setRefrigeratorCharges] = useState("");
  const [totalQuotationPrice, setTotalQuotationPrice] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("NEW");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransporterId = async () => {
      const storedId = await AsyncStorage.getItem("transporterId");
      if (storedId) {
        const parsedId = parseInt(storedId, 10); // ✅ Convert to number
        setTransporterId(parsedId);
        console.log("✅ Using Stored Transporter ID:", parsedId);
      } else {
        console.error("🚨 No Transporter ID found in AsyncStorage!");
      }
    };
    fetchTransporterId();
  }, []);
  
  useEffect(() => {
    console.log("🚀 Received manufacturer data:", manufacturer);
  }, [manufacturer]);

  // Debugging
  useEffect(() => {
    console.log("🚀 Current transporterId:", transporterId);
  }, [transporterId]);


 const calculateTotalQuotationPrice = useCallback(() => {
   const total =
     (parseFloat(fuelCostPerKM) || 0) +
     (parseFloat(totalFuelCost) || 0) +
     (parseFloat(tollsAndTaxes) || 0) +
     (parseFloat(driverWages) || 0) +
     (parseFloat(transporterCharges) || 0) +
     (parseFloat(refrigeratorCharges) || 0);
 
   const totalWithAppCharges = total * 1.05; // ✅ Adding 5% app charges
   setTotalQuotationPrice(totalWithAppCharges.toFixed(2)); // ✅ Keep 2 decimal places
 }, [
   fuelCostPerKM,
   totalFuelCost,
   tollsAndTaxes,
   driverWages,
   transporterCharges,
   refrigeratorCharges,
 ]);
 
 useEffect(() => {
   if (quoteStatus === "NEW") {
     calculateTotalQuotationPrice();
   }
 }, [calculateTotalQuotationPrice, quoteStatus]); // ✅ Correct dependencies
 
  // 🚀 Recalculate TotalQuotationPrice when inputs change
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // 🚀 Fetch quote details with fallback
  const fetchQuoteStatusAndDetails = useCallback(async () => {
    try {
      if (!transporterId) return; // ✅ Prevent API call if transporterId is missing
  
      setLoading(true);
      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/get/${transporterId}/${shipment.shipmentId}`
      );
  
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched Quote Status from Quotations Table:", data);
  
        setQuoteStatus(data.quoteStatus || "NEW");
  
        // ✅ Ensure all fields are updated correctly
        setFuelCostPerKM(data.fuelCostPerKM ? data.fuelCostPerKM.toString() : "");
        setTotalFuelCost(data.totalFuelCost ? data.totalFuelCost.toString() : "");
        setTollsAndTaxes(data.tollsAndTaxes ? data.tollsAndTaxes.toString() : "");
        setDriverWages(data.driverWages ? data.driverWages.toString() : "");
        setTransporterCharges(data.transporterCharges ? data.transporterCharges.toString() : "");
        setRefrigeratorCharges(data.refrigeratorCharges ? data.refrigeratorCharges.toString() : "");
        setTotalQuotationPrice(data.totalQuotationPrice ? data.totalQuotationPrice.toString() : "");
      } else {
        console.warn("No data in Quotations Table. Fetching Estimated Data...");
  
        const fallbackResponse = await fetch(
          `http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000/suggest_estimated_quotation/${shipment.shipmentId}/${transporterId}`
        );
  
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log("Fetched Estimated Data:", fallbackData);
  
          setQuoteStatus("NEW");
          setFuelCostPerKM(fallbackData.fuel_cost_per_km ? fallbackData.fuel_cost_per_km.toString() : "");
          setTotalFuelCost(fallbackData.total_cost_of_fuel ? fallbackData.total_cost_of_fuel.toString() : "");
          setTollsAndTaxes(fallbackData.tollsAndTaxes ? fallbackData.tollsAndTaxes.toString() : "");
          setDriverWages(fallbackData.driverWages ? fallbackData.driverWages.toString() : "");
          setTransporterCharges(fallbackData.transporterCharges ? fallbackData.transporterCharges.toString() : "");
          setRefrigeratorCharges(fallbackData.refrigeratorCharges ? fallbackData.refrigeratorCharges.toString() : "");
          setTotalQuotationPrice(
            fallbackData["totalQuotationPrice_with_5%_app_charges"] ? fallbackData["totalQuotationPrice_with_5%_app_charges"].toString() : ""
          );
        } else {
          throw new Error("Failed to fetch from fallback API.");
        }
      }
    } catch (error) {
      console.error("Error fetching quote status or fallback data:", error);
      Alert.alert("Error", "Failed to fetch quote details. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [transporterId, shipment.shipmentId]); // ✅ Dependencies added
  

  // 🚀 Handle sending the quote
  const handleSendQuote = async () => {
    try {
      if (!transporterId) {
        Alert.alert("Error", "Transporter ID is missing. Please log in again.");
        return;
      }
  
      const API_URL = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/create/${transporterId}/${shipment.shipmentId}`;
      console.log("🚀 Sending Quote to:", API_URL);
  
      const payload = {
        fuelCostPerKM,
        totalFuelCost,
        tollsAndTaxes,
        driverWages,
        transporterCharges,
        refrigeratorCharges,
        totalQuotationPrice,
      };
  
      setLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const responseText = await response.text();
  
      if (!response.ok) {
        throw new Error(`Failed to send quote. Status: ${response.status}, Response: ${responseText}`);
      }
  
      Alert.alert("Success", "Quotation submitted successfully!");
      setQuoteStatus("PENDING");
      fetchQuoteStatusAndDetails();
    } catch (error) {
      console.error("Error sending quote:", error);
      Alert.alert("Error", `Failed to send the quotation. Please try again. \nDetails: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleCheckQuotations = () => {
    if (quoteStatus === "ACCEPTED") {
      navigation.navigate("TransporterQuotations", {
        shipment,
        transporterId,
        manufacturer,
      });
    }
  };
  

  // ✅ Now, use it inside useEffect
  useEffect(() => {
    if (transporterId) {
      fetchQuoteStatusAndDetails();
    }
  }, [fetchQuoteStatusAndDetails, transporterId]); // ✅ Add transporterId as a dependency
  

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>



      {/* 🚀 Enhanced Shipment Details */}
      <View style={styles.shipmentCard}>
  <View style={styles.shipmentHeader}>
    <Text style={styles.cardIcon}>📦</Text>
    <Text style={styles.cardTitle}>Shipment Details</Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.iconText}>🆔</Text>
    <Text style={styles.label}>Shipment ID:</Text>
    <Text style={styles.value}>{shipment?.shipmentId || "N/A"}</Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.iconText}>❄️</Text>
    <Text style={styles.label}>Cargo Type:</Text>
    <Text style={styles.value}>{shipment?.cargoType || "N/A"}</Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.iconText}>📍</Text>
    <Text style={styles.label}>Pickup:</Text>
    <Text style={styles.value}>{shipment?.pickupTown || "N/A"}</Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.iconText}>📦</Text>
    <Text style={styles.label}>Drop:</Text>
    <Text style={styles.value}>{shipment?.dropTown || "N/A"}</Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.iconText}>⚖️</Text>
    <Text style={styles.label}>Weight:</Text>
    <Text style={styles.value}>{shipment?.weight || "N/A"} kg</Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.iconText}>🚚</Text>
    <Text style={styles.label}>Vehicle Type:</Text>
    <Text style={styles.value}>{shipment?.vehicleType || "N/A"}</Text>
  </View>
</View>


        {/* Quote Form */}
        <Text style={styles.title}>Quote Form</Text>

        <Text style={styles.fieldLabel}>Fuel Cost per KM</Text>
        <TextInput style={styles.input} value={fuelCostPerKM} onChangeText={setFuelCostPerKM} editable={quoteStatus === "NEW"} />

        <Text style={styles.fieldLabel}>Total Fuel Cost</Text>
        <TextInput style={styles.input} value={totalFuelCost} onChangeText={setTotalFuelCost} editable={quoteStatus === "NEW"} />

        <Text style={styles.fieldLabel}>Tolls and Taxes</Text>
        <TextInput style={styles.input} value={tollsAndTaxes} onChangeText={setTollsAndTaxes} editable={quoteStatus === "NEW"} />

        <Text style={styles.fieldLabel}>Driver Wages</Text>
        <TextInput style={styles.input} value={driverWages} onChangeText={setDriverWages} editable={quoteStatus === "NEW"} />

        <Text style={styles.fieldLabel}>Transporter Charges</Text>
        <TextInput style={styles.input} value={transporterCharges} onChangeText={setTransporterCharges} editable={quoteStatus === "NEW"} />

        <Text style={styles.fieldLabel}>Refrigerator Charges</Text>
        <TextInput style={styles.input} value={refrigeratorCharges} onChangeText={setRefrigeratorCharges} editable={quoteStatus === "NEW"} />

        <Text style={styles.fieldLabel}>Total Quotation Price</Text>
        <TextInput style={styles.input} value={totalQuotationPrice} editable={false} />

        {/* Dynamic Button */}
        <TouchableOpacity
  style={[
    styles.sendButton,
    quoteStatus === "PENDING" ? styles.pendingButton : {},
    quoteStatus === "ACCEPTED" ? styles.acceptedButton : {},
  ]}
  onPress={quoteStatus === "ACCEPTED" ? handleCheckQuotations : handleSendQuote}
  disabled={quoteStatus === "PENDING"}
>
  <Text style={styles.buttonText}>
    {quoteStatus === "PENDING"
      ? "Pending"
      : quoteStatus === "ACCEPTED"
      ? "Check Quotations"
      : "Send Quote"}
  </Text>
</TouchableOpacity>


      </View>
    </ScrollView>
  );
};


  

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#333" },
  label: { fontSize: 16, marginBottom: 5, color: "#555" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#333",textAlign:"center" },
  fieldLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  sendButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 4, alignItems: "center" },
  pendingButton: { backgroundColor: "#6c757d" },
  acceptedButton: { backgroundColor: "#28a745" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  shipmentCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    // ❌ Don't center content here
  },
  
  shipmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
     justifyContent: "center",
  },
  
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E2937",
  },
  
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  
  iconText: {
    width: 30,
    fontSize: 18,
    textAlign: "center",
    marginTop: 1,
  },
  
  label: {
    fontSize: 18,
    color: "#475569",
    fontWeight: "600",
    marginRight: 6,
    minWidth: 120,
  },
  
  value: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "400",
    flexShrink: 1,
  },
  
  
});

export default QuoteFormScreen;
