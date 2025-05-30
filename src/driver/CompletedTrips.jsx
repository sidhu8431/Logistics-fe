

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CompletedTrips = () => {
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState(null);

  // Fetch driverId from AsyncStorage
  useEffect(() => {
    const fetchDriverId = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem("driverId");
        console.log("Driver ID retrieved from AsyncStorage:", storedDriverId);

        if (storedDriverId) {
          setDriverId(storedDriverId.trim()); // Trim spaces to prevent errors
        } else {
          Alert.alert("Error", "Driver ID not found. Please submit driver details.");
        }
      } catch (error) {
        console.error("Error retrieving Driver ID:", error);
        Alert.alert("Error", "Failed to retrieve Driver ID.");
      }
    };

    fetchDriverId();
  }, []);

  // Fetch completed trips only when driverId is available
  useEffect(() => {
    if (!driverId) return;

    const fetchCompletedTrips = async () => {
      try {
        setLoading(true);
        console.log("Fetching completed trips for driverId:", driverId);

        const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/completed-trips/driver/${driverId}`);
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Error: ${response.status} - ${errorData}`);
        }
    
        const data = await response.json();
        console.log("Parsed JSON Response:", data);
    
        setCompletedTrips(data);
      } catch (error) {
        console.error("Error fetching completed trips:", error);
        Alert.alert("Error", `Failed to fetch completed trips: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    
    fetchCompletedTrips();
  }, [driverId]); // Run only when driverId changes

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b0082" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!completedTrips || completedTrips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No completed trips available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Completed Trips</Text>
      {completedTrips.map((item, index) => (
        // <View key={index} style={styles.card}>
        <View key={item.assignmentId} style={styles.card}>
          <Text style={styles.detailText}>
  📍 <Text style={styles.bold}>Pickup Location:</Text> {item.shipment?.pickupPoint || "N/A"}
</Text>
<Text style={styles.detailText}>
  🚛 <Text style={styles.bold}>Drop-off Location:</Text> {item.shipment?.dropPoint || "N/A"}
</Text>
<Text style={styles.detailText}>
  🚗 <Text style={styles.bold}>Vehicle Number:</Text> {item.assignedVehicle?.vehicleNumber || "N/A"}
</Text>
<Text style={styles.detailText}>
  👤 <Text style={styles.bold}>Driver Name:</Text> {item.assignedDriver?.name || "N/A"}
</Text>
<Text style={styles.detailText}>
  🏢 <Text style={styles.bold}>Transporter Name:</Text> {item.transporter?.companyName || "N/A"}
</Text>
<Text style={styles.detailText}>
  🏭 <Text style={styles.bold}>Manufacturer Name:</Text> {item.shipment?.manufacturer?.companyName || "N/A"}
</Text>

          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() =>
              Alert.alert(
                "Details",
                `Trip ID: ${item.assignmentId}\nPickup: ${item.shipment?.pickupPoint}\nDrop: ${item.shipment?.dropPoint}`
              )
            }
          >
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#FFFFFF", // Clean white background
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004d00", // Dark green for a strong header
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  card: {
    backgroundColor: "#FFFFFF", // White background for feedback card
    borderRadius: 15,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFA500", // Orange border
    shadowColor: "#FFA500", // Orange shadow effect
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 3, height: 4 },
    elevation: 8, // Adds depth for Android
  },
  detailText: {
    fontSize: 16,
    color: "#2A0356", // Dark gray for better readability
    marginBottom: 6,
    fontWeight: "500",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "bold",
    color: "#2A0356#", // Teal shade for headings
  },
  viewMoreButton: {
    marginTop: 14,
    backgroundColor: "#FF9800", // Vibrant orange button
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#FFA500", // Orange shadow for button
    shadowOpacity: 0.4,
    shadowOffset: { width: 2, height: 3 },
    shadowRadius: 5,
    elevation: 5, // Adds depth to button
  },
  viewMoreText: {
    color: "#fff", // White text for contrast
    fontWeight: "bold",
    fontSize: 16, // Font size increased
    fontFamily: "italic", // Changed font style
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  emptyText: {
    fontSize: 18,
    color: "#757575", // Soft gray
  },
});


export default CompletedTrips;

