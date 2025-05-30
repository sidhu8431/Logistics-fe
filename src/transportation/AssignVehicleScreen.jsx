import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const AssignVehicleScreen = ({ route, navigation }) => {
  const { shipment = {}, transporterId = null } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [vehicleList, setVehicleList] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  // ✅ Fetch assigned vehicle **only if the shipment is accepted**
  const fetchAssignedVehicle = async () => {
    try {
      setLoading(true);
      console.log("🚀 Fetching assigned vehicle...");

      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/getShipmentAssignment?shipmentId=${shipment.shipmentId}&transporterId=${transporterId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assigned vehicle.");
      }

      const data = await response.json();
      console.log("🚀 Shipment Assignment Data:", data);

      // ✅ Find the assignment with **ACCEPTED** status
      const acceptedAssignment = data.find(item => item.assignmentStatus === "ACCEPTED");

      if (acceptedAssignment?.assignedVehicle) {
        console.log("✅ Found assigned vehicle:", acceptedAssignment.assignedVehicle);
        setAssignedVehicle(acceptedAssignment.assignedVehicle);
      } else {
        setAssignedVehicle(null);
      }
    } catch (error) {
      console.error("❌ Error fetching assigned vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch available vehicles **only if no assigned vehicle exists**
  const fetchAvailableVehicles = async () => {
    if (assignedVehicle) return; // 🚫 Skip fetching if a vehicle is already assigned

    try {
      setLoading(true);
      console.log("🚀 Fetching available vehicles...");

      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/vehicles/transporter/${transporterId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch available vehicles.");
      }

      const data = await response.json();
      console.log("🚀 Available Vehicles:", JSON.stringify(data, null, 2));

      setVehicleList(data);
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
      Alert.alert("Error", "Failed to fetch available vehicles.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch assigned vehicle on screen load
  useEffect(() => {
    const fetchData = async () => {
      await fetchAssignedVehicle(); // ✅ Fetch assigned vehicle first

      if (!assignedVehicle) {
        await fetchAvailableVehicles(); // ✅ Fetch available vehicles only if no assigned one
      }
    };

    fetchData();
  }, [shipment.shipmentId, transporterId]); // ✅ Depend on shipment and transporterId

  // ✅ Fetch assigned vehicle when navigating back to this screen
  useFocusEffect(
    React.useCallback(() => {
      fetchAssignedVehicle();
    }, [])
  );

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleAssignVehicle = async () => {
    if (!selectedVehicle) {
      Alert.alert("Error", "Please select a vehicle before assigning.");
      return;
    }

    try {
      setLoading(true);
      console.log(`🚀 Assigning Vehicle ID: ${selectedVehicle.vehicleId} to Shipment ID: ${shipment.shipmentId}`);

      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/vehicle/${shipment.shipmentId}/${selectedVehicle.vehicleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error(`Failed to assign vehicle: ${errorText}`);
      }

      Alert.alert("✅ Success", "Vehicle assigned successfully!");

      // ✅ Fetch assigned vehicle immediately after assigning
      await fetchAssignedVehicle();

      // ✅ Clear available vehicles list
      setVehicleList([]);

      // ✅ Clear selection
      setSelectedVehicle(null);

    } catch (error) {
      console.error("❌ Error assigning vehicle:", error);
      Alert.alert("Error", `Failed to assign vehicle. Reason: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.heading}>Select a Vehicle</Text>
        <Text style={styles.subHeading}>Shipment ID: {shipment?.shipmentId || "N/A"}</Text>
        <Text style={styles.subHeading}>Required Vehicle Type: {shipment?.vehicleTypeRequired || "N/A"}</Text>

        {assignedVehicle ? (
          // ✅ Show assigned vehicle details only
          <View style={[styles.vehicleCard, styles.selectedVehicleCard]}>
            <Text style={styles.vehicleNumber}>Assigned Vehicle No: {assignedVehicle.vehicleNumber}</Text>
            <Text style={styles.vehicleText}>Type: {assignedVehicle.vehicleType || "N/A"}</Text>
            <Text style={styles.vehicleText}>Status: {assignedVehicle.vehicleStatus}</Text>
            <Text style={styles.vehicleText}>Refrigerator: {assignedVehicle.refrigerator ? "Yes" : "No"}</Text>
          </View>
        ) : (
          <>
            {vehicleList.length === 0 ? (
              <Text style={styles.noVehiclesText}>No available vehicles.</Text>
            ) : (
              <FlatList
                data={vehicleList}
                keyExtractor={(item) => item.vehicleId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.vehicleCard,
                      selectedVehicle?.vehicleId === item.vehicleId && styles.selectedVehicleCard,
                    ]}
                    onPress={() => handleSelectVehicle(item)}
                  >
                    <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
                    <Text style={styles.vehicleText}>Type: {item.vehicleType || "N/A"}</Text>
                    <Text style={styles.vehicleText}>Status: {item.vehicleStatus}</Text>
                    <Text style={styles.vehicleText}>Refrigerator: {item.refrigerator ? "Yes" : "No"}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}

<TouchableOpacity
  style={styles.assignVehicleButton}
  onPress={() => {
    if (assignedVehicle) {
      navigation.navigate("DriverPaymentScreen", {
        shipment: shipment, // Ensure shipment object is passed
        transporterId: transporterId, // Ensure transporterId is passed
        selectedVehicle: assignedVehicle, // Pass assigned vehicle details
      });
      
    } else {
      handleAssignVehicle();
    }
  }}
>
  <Text style={styles.buttonText}>{assignedVehicle ? "Check Shipment" : "Assign Vehicle"}</Text>
</TouchableOpacity>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  heading: { fontSize: 26, fontWeight: "bold", color: "#333", marginBottom: 10, textAlign: "center" },
  subHeading: { fontSize: 18, fontWeight: "600", color: "#666", marginBottom: 8, textAlign: "center" },
  noVehiclesText: { fontSize: 18, color: "#ff4444", textAlign: "center", marginVertical: 10 },

  vehicleCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    elevation: 3,
  },

  selectedVehicleCard: {
    backgroundColor: "#cce5ff",
    borderColor: "#007bff",
    borderWidth: 2,
  },

  assignVehicleButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18, textAlign: "center" },
});

export default AssignVehicleScreen;
