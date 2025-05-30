import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StarRating from "react-native-star-rating-widget";

const TFeedbackForm = ({ navigation, route }) => {
  const { shipmentId, driverName, driverId } = route.params;
  const [transporterId, setTransporterId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false); // Track feedback status

  useEffect(() => {
    fetchTransporterId();
  }, []);

  useEffect(() => {
    if (transporterId) {
      fetchFeedback();
    }
  }, [transporterId]);

  // Fetch Transporter ID from AsyncStorage
  const fetchTransporterId = async () => {
    try {
      const storedId = await AsyncStorage.getItem("transporterId");
      if (storedId) {
        setTransporterId(storedId);
      } else {
        console.warn("Transporter ID not found in AsyncStorage.");
      }
    } catch (error) {
      console.error("Error fetching transporter ID:", error);
    }
  };

  // Fetch Existing Feedback for this Shipment and Driver
  const fetchFeedback = async () => {
    try {
      console.log("Fetching feedback for shipment:", shipmentId, "driver:", driverId, "transporter:", transporterId);

      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/feedback/getByTransporterShipmentDriver?shipmentId=${shipmentId}&transporterId=${transporterId}&driverId=${driverId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched feedback:", data);

      setLoading(false);

      if (data.length > 0) {
        setRating(data[0].rating);
        setComments(data[0].comments);
        setFeedbackSent(true); // ✅ Mark feedback as sent
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      setLoading(false);
    }
  };

  // Submit New Feedback
  const submitFeedback = async () => {
    if (rating === 0 || comments.trim() === "") {
      Alert.alert("Error", "Please provide a rating and comments.");
      return;
    }

    try {
      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/feedback/sendByTransporter?shipmentId=${shipmentId}&transporterId=${transporterId}&driverId=${driverId}&rating=${rating}&comments=${encodeURIComponent(comments)}`,
        { method: "POST" }
      );

      if (response.ok) {
        Alert.alert("Success", "Feedback submitted successfully!");
        fetchFeedback(); // ✅ Fetch feedback immediately after submission
      } else {
        Alert.alert("Error", "Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Submit Feedback</Text>

      {/* Show message if feedback already exists */}
      {feedbackSent && (
        <View style={styles.alreadySentContainer}>
          <Text style={styles.alreadySentText}>✅ Feedback already sent!</Text>
          <Text style={styles.label}>Previous Rating:</Text>
          <StarRating rating={rating} starSize={30} enableHalfStar={true} disabled={true} />
          <Text style={styles.label}>Previous Comment:</Text>
          <Text style={styles.feedbackComment}>{comments}</Text>
        </View>
      )}

      {/* Show form only if feedback hasn't been sent */}
      {!feedbackSent && (
        <>
          {/* Driver Name (Read-Only) */}
          <Text style={styles.label}>Driver Name:</Text>
          <TextInput style={styles.input} value={driverName} editable={false} />

          {/* Star Rating */}
          <Text style={styles.label}>Rating:</Text>
          <StarRating
            rating={rating}
            onChange={setRating}
            starSize={30}
            enableHalfStar={true}
          />

          {/* Comments Input */}
          <Text style={styles.label}>Comments:</Text>
          <TextInput
            style={styles.input}
            placeholder="Write your feedback..."
            multiline
            value={comments}
            onChangeText={setComments}
          />

          {/* Submit Button - Hides if feedback exists */}
          <TouchableOpacity style={styles.button} onPress={submitFeedback}>
            <Text style={styles.buttonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f5f9",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  alreadySentContainer: {
    backgroundColor: "#dff9fb",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#22a6b3",
  },
  alreadySentText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#22a6b3",
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    color: "#2f3640",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  feedbackComment: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#2f3640",
    marginBottom: 10,
  },
});

export default TFeedbackForm;
