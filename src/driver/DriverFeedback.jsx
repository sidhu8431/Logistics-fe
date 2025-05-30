import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DriverFeedback = ({ route }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState(null);

  // Fetch driverId from AsyncStorage or route params
  useEffect(() => {
    const fetchDriverId = async () => {
      try {
        let storedDriverId = route?.params?.driverId;
        if (!storedDriverId) {
          storedDriverId = await AsyncStorage.getItem("driverId");
        }
        if (storedDriverId) {
          setDriverId(storedDriverId);
        } else {
          Alert.alert("Error", "Driver ID not found. Please go back.");
        }
      } catch (error) {
        console.error("Error retrieving Driver ID:", error);
        Alert.alert("Error", "Failed to retrieve Driver ID.");
      }
    };

    fetchDriverId();
  }, [route?.params?.driverId]);

  // Fetch feedback data for the driver
  useEffect(() => {
    if (!driverId) return;

    const fetchDriverFeedback = async () => {
      try {
        setLoading(true);
        console.log(`Fetching feedback for driver: ${driverId}`);

        const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/feedback/driver/${driverId}`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);

        if (data.feedbacks && Array.isArray(data.feedbacks)) {
          setFeedback(data.feedbacks);
        } else {
          setFeedback([]); // Ensure default state if response is unexpected
        }
      } catch (error) {
        console.error("Error fetching driver feedback:", error);
        Alert.alert("Error", "Failed to fetch feedback.");
        setFeedback([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverFeedback();
  }, [driverId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b0082" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Driver Feedback</Text>
      {feedback.length > 0 ? (
        feedback.map((item, index) => (
          // <View key={index} style={styles.card}>
          <View key={item.id || item.createdDate || index} style={styles.card}>
          
            <Text style={styles.detailText}>
  🗨 <Text style={styles.bold}>Comments:</Text> {item.comments || "N/A"}
</Text>
<Text style={styles.detailText}>
  ⭐ <Text style={styles.bold}>Rating:</Text> {item.rating ? item.rating.toFixed(1) : "N/A"}
</Text>
<Text style={styles.detailText}>
  🚛 <Text style={styles.bold}>Transporter:</Text> {item.transporter?.companyName || "N/A"}
</Text>
<Text style={styles.detailText}>
  📅 <Text style={styles.bold}>Created On:</Text> {item.createdDate ? new Date(item.createdDate).toLocaleDateString() : "N/A"}
</Text>

          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No feedback available for this driver.</Text>
      )}
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
    color: "#006400", // Dark Green for title
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  card: {
    backgroundColor: "#FFFFFF", // White background for feedback card
    padding: 16,
    borderRadius: 14,
    elevation: 6, // Adds depth for Android
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#FFA500", // Orange border
    shadowColor: "#FFA500", // Orange shadow effect
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 3, height: 4 },
  },
  detailText: {
    fontSize: 16,
    color: "#2A0356", // Dark Purple for contrast
    fontWeight: "500",
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
    color: "#2A0356", // Dark Green for emphasis
  },
  emptyText: {
    fontSize: 18,
    color: "#006400", // Dark Green for empty state
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});


export default DriverFeedback;
