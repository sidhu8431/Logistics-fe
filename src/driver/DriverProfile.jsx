
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList, 
  Alert, 
  ScrollView 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DriverProfile = ({ route }) => {
  const [driverId, setDriverId] = useState(route.params?.driverId || null);
  const [loading, setLoading] = useState(true);
  const [driverDetails, setDriverDetails] = useState(null);

  useEffect(() => {
    const fetchDriverId = async () => {
      if (!driverId) {
        try {
          const storedDriverId = await AsyncStorage.getItem("driverId");
          if (storedDriverId) {
            setDriverId(storedDriverId);
          } else {
            throw new Error("Driver ID not found. Please log in again.");
          }
        } catch (error) {
          Alert.alert("Error", error.message);
        }
      }
    };

    fetchDriverId();
  }, [driverId]);

  useEffect(() => {
    const fetchDriverDetails = async () => {
      if (!driverId) return;

      try {
        const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/${driverId}/feedbacks`);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        setDriverDetails(data);
      } catch (error) {
        console.error("Error fetching driver details:", error.message);
        Alert.alert("Error", `Failed to fetch driver details: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverDetails();
  }, [driverId]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4b0082" />
        <Text>Loading Profile...</Text>
      </View>
    );
  }

  if (!driverDetails || !driverDetails.feedbacks.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No feedbacks found for this driver.</Text>
      </View>
    );
  }

  // Extract driver info from the first feedback item
  const driverInfo = driverDetails.feedbacks[0].driver;

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Driver Profile</Text>
        <View style={styles.profileContainer}>
  <Text style={styles.label}>
    <Icon name="user" size={18} color="#2A0356" /> <Text style={styles.bold}> Name:</Text> {driverInfo.name}
  </Text>
  <Text style={styles.label}>
    <Icon name="star" size={18} color="#FFD700" /> <Text style={styles.bold}> Rating:</Text> {driverDetails.averageRating} / 5
  </Text>
  <Text style={styles.label}>
    <Icon name="phone" size={18} color="##2A0356" /> <Text style={styles.bold}> Phone Number:</Text> {driverInfo.phoneNumber}
  </Text>
</View>


        <Text style={styles.feedbackTitle}>Feedbacks</Text>
        <FlatList
          data={driverDetails.feedbacks}
          keyExtractor={(item) => item.feedbackId.toString()}
          renderItem={({ item }) => (
            <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              <Icon name="star" size={18} color="#FFD700" /> {item.rating} / 5
            </Text>
            <Text style={styles.feedbackText}>
              <MaterialIcons name="chat-bubble-outline" size={18} color="#2A0356" /> {item.comments}
            </Text>
            <Text style={styles.dateText}>
              <MaterialIcons name="event" size={18} color="#757575" /> {new Date(item.createdDate).toLocaleDateString()}
            </Text>
          </View>
          
          )}
          scrollEnabled={false} // Allow ScrollView to handle scrolling
        />
      </View>
    </ScrollView>
  );
};

 const styles = StyleSheet.create({
  scrollContainer: { 
    flex: 1, 
    backgroundColor: "#FFFFFF", // Light background for contrast
  },
  container: { 
    flex: 1, 
    padding: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 20, 
    color: "#006400", // Deep Green Title
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  profileContainer: { 
    backgroundColor: "#FFFFFF", // Light blue background for profile card
    padding: 20, 
    borderRadius: 14, 
    elevation: 10, 
    marginBottom: 20,
    borderWidth: 2, 
    borderColor: "#FF9800", // Orange border for contrast
    shadowColor: "#FF9800", // Orange shadow effect
    shadowOpacity: 0.5, 
    shadowRadius: 10, 
    shadowOffset: { width: 4, height: 6 }, 
  },
  label: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#2A0356", // Deep Green Labels
    marginBottom: 5 
  },
  value: { 
    fontWeight: "bold", 
    color: "#2A0356", // Dark Purple for contrast
    fontSize: 16
  },
  feedbackTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginTop: 20, 
    color: "#006400", // Deep Green Feedback Title
    textAlign: "center",
    textTransform: "uppercase", 
  },
  feedbackContainer: { 
    backgroundColor: "#FFFFFF", // Light blue feedback card
    padding: 18, 
    borderRadius: 14, 
    elevation: 10, 
    marginBottom: 14, 
    borderWidth: 2, 
    borderColor: "#FF9800", // Orange border
    shadowColor: "#FF9800", // Orange shadow effect
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 6 },
  },
  feedbackText: { 
    fontSize: 18, 
    color: "#2A0356", // Dark Purple text
    fontWeight: "500", 
    marginBottom: 5 
  },
  dateText: { 
    fontSize: 15, 
    color: "#757575", // Soft Gray for date
    marginTop: 5,
    fontStyle: "italic"
  },
  viewMoreButton: {
    marginTop: 12,
    backgroundColor: "#FF9800", // Vibrant orange button
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#FF9800",
    shadowOpacity: 0.6,
    shadowOffset: { width: 4, height: 5 },
    shadowRadius: 8,
    elevation: 8,
  },
  viewMoreText: {
    color: "#FFFFFF", // White text for contrast
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: "center",
    alignItems: "center" 
  },
  errorText: { 
    textAlign: "center", 
    color: "red", 
    fontSize: 16 
  }
});


export default DriverProfile;

