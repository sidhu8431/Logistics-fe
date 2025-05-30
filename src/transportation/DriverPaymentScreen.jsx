import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";

const DriverPaymentScreen = ({ route, navigation }) => {
  const shipmentId = route?.params?.shipment?.shipmentId || null;
  const transporterId = route?.params?.transporterId || null;

  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  if (!shipmentId || !transporterId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ Missing shipmentId or transporterId</Text>
      </View>
    );
  }

  // ✅ Fetch Shipment, Vehicle, and Driver Details
  const fetchShipmentAssignmentDetails = async () => {
    try {
      console.log("🚀 Fetching shipment, driver & vehicle details...");
      setLoading(true);

      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/getShipmentAssignment?shipmentId=${shipmentId}&transporterId=${transporterId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assignment details.");
      }

      const data = await response.json();
      console.log("🚀 Fetched Assignment Data:", data);

      // ✅ Filter only the accepted assignment
      const acceptedAssignment = data.find(
        (item) => item.assignmentStatus === "ACCEPTED" && item.assignedVehicle
      );

      if (acceptedAssignment) {
        setShipment(acceptedAssignment.shipment);
        setAssignedDriver(acceptedAssignment.assignedDriver);
        setAssignedVehicle(acceptedAssignment.assignedVehicle);
      } else {
        console.warn("⚠️ No accepted assignment found!");
      }
    } catch (error) {
      console.error("❌ Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentAssignmentDetails();
  }, []);

  // ✅ Handle "Go to Payments" Button Click
  const handleGoToPayments = () => {
    navigation.navigate("TransporterPaymentsScreen", {
      shipment,
      transporterId,
      assignedDriver,
      assignedVehicle,
    });
  };

  // ✅ Show loading indicator while fetching data
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
        
        {/* 🚚 Shipment Details */}
        {shipment && (
          <View style={[styles.card, styles.shipmentCard]}>
            <Text style={styles.cardTitle}>📦 Shipment Details</Text>
            <Text style={styles.cardText}>Shipment ID: {shipment.shipmentId}</Text>
            <Text style={styles.cardText}>Cargo Type: {shipment.cargoType}</Text>
            <Text style={styles.cardText}>Weight: {shipment.weight} kg</Text>
            <Text style={styles.cardText}>Pickup: {shipment.pickupPoint}</Text>
            <Text style={styles.cardText}>Drop: {shipment.dropPoint}</Text>
            <Text style={styles.cardText}>Vehicle Type Required: {shipment.vehicleTypeRequired}</Text>
          </View>
        )}

        {/* 🚛 Vehicle Details */}
        {assignedVehicle && (
          <View style={[styles.card, styles.vehicleCard]}>
            <Text style={styles.cardTitle}>🚛 Assigned Vehicle</Text>
            <Text style={styles.cardText}>Vehicle No: {assignedVehicle.vehicleNumber}</Text>
            <Text style={styles.cardText}>Type: {assignedVehicle.vehicleType}</Text>
            <Text style={styles.cardText}>Status: {assignedVehicle.vehicleStatus}</Text>
            <Text style={styles.cardText}>
              Refrigerator: {assignedVehicle.refrigerator ? "Yes" : "No"}
            </Text>
          </View>
        )}

        {/* 👨‍✈️ Driver Details */}
        {assignedDriver && (
          <View style={[styles.card, styles.driverCard]}>
            <Text style={styles.cardTitle}>👨‍✈️ Assigned Driver</Text>
            <Text style={styles.cardText}>Name: {assignedDriver.name}</Text>
            <Text style={styles.cardText}>Phone: {assignedDriver.phoneNumber}</Text>
            <Text style={styles.cardText}>Experience: {assignedDriver.experience} years</Text>
            <Text style={styles.cardText}>License Type: {assignedDriver.licenseType}</Text>
            <Text style={styles.cardText}>Rating: ⭐ {assignedDriver.driverRating}</Text>
          </View>
        )}

        {/* 🚀 Go to Payments Button */}
        {shipment && assignedVehicle && assignedDriver && (
          <TouchableOpacity style={styles.paymentButton} onPress={handleGoToPayments}>
            <Text style={styles.buttonText}>Go to Payments</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  scrollContainer: { flexGrow: 1, justifyContent: "center" },

  // ✅ Styled Card Layout with Colors
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  shipmentCard: { borderLeftWidth: 5, borderLeftColor: "#ff9800" }, // Orange
  vehicleCard: { borderLeftWidth: 5, borderLeftColor: "#2196f3" }, // Blue
  driverCard: { borderLeftWidth: 5, borderLeftColor: "#4caf50" }, // Green

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  cardText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },

  // ✅ Styled Button
  paymentButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },

  // ✅ Error Styling
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#d9534f", fontSize: 16, textAlign: "center" },

  // ✅ Loader
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default DriverPaymentScreen;
