import React, { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // ✅ Added useFocusEffect

// Memoized Shipment Item to prevent unnecessary re-renders
const MemoizedShipmentItem = memo(({ item, handleNavigateToQuoteForm, quoteStatuses }) => {
  const status = quoteStatuses[item.shipmentId] || "NEW";

  return (
    <View style={styles.card}>
      <Text style={styles.shipmentId}>📦 Shipment ID: {item.shipmentId}</Text>
      <Text style={styles.label}>🛠 Cargo: {item.cargoType}</Text>
      <Text style={styles.label}>
  📍 Pickup: {item.pickupStreetName}, {item.pickupTown}, {item.pickupState}
</Text>
      <Text style={styles.label}>🚚 Drop: {item.dropStreetName},{item.dropTown},{item.dropState}</Text>

      {status === "QUOTED_SUCCESSFULLY" ? (
        <View style={styles.quotedButton}>
          <Text style={styles.quotedButtonText}>Quoted</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.quoteButton}
          onPress={() => handleNavigateToQuoteForm(item)}
        >
          <Text style={styles.quoteButtonText}>View</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const TransporterShipmentScreen = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transporterId, setTransporterId] = useState(null);
  const [quoteStatuses, setQuoteStatuses] = useState({}); // ✅ Track quote statuses
  const navigation = useNavigation();

  // ✅ Fetch Transporter ID from AsyncStorage
  useEffect(() => {
    const fetchTransporterId = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userId");
        if (!storedUser) {
          throw new Error("User ID not found. Please log in again.");
        }
        setTransporterId(storedUser);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to fetch Transporter ID.");
      }
    };
    fetchTransporterId();
  }, []);

  // ✅ Fetch Pending Shipments
  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/getPendingShipments");
      if (!response.ok) {
        throw new Error("Failed to fetch shipments.");
      }
      const data = await response.json();
      setShipments(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load shipments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // ✅ Auto-refresh data when returning to the screen
  useFocusEffect(
    useCallback(() => {
      fetchShipments();
    }, [])
  );

  // ✅ Navigate to QuoteFormScreen & update status on success
  const handleNavigateToQuoteForm = useCallback((item) => {
    if (!transporterId) {
      Alert.alert("Error", "Transporter ID is missing. Please try again.");
      return;
    }

    navigation.navigate("QuoteFormScreen", {
      shipment: item,
      transporterId,
      updateQuoteStatus: (shipmentId) => {
        setQuoteStatuses((prev) => ({ ...prev, [shipmentId]: "QUOTED_SUCCESSFULLY" }));
      },
    });
  }, [transporterId, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🚚 Pending Shipments</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6A0DAD" />
      ) : (
        <FlatList
          data={shipments}
          keyExtractor={(item) => item.shipmentId.toString()}
          renderItem={({ item }) => (
            <MemoizedShipmentItem
              item={item}
              handleNavigateToQuoteForm={handleNavigateToQuoteForm}
              quoteStatuses={quoteStatuses}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>No pending shipments found.</Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 130,
            offset: 130 * index,
            index,
          })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#F0F4F8", // light bluish-gray
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2937", // dark gray-blue
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20, // increased padding
    borderRadius: 12,
    marginBottom: 16, // more spacing between cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#3B82F6",
  },
  
  shipmentId: {
    fontSize: 16, // was 14
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 6,
  },
  label: {
    fontSize: 14, // was 13
    color: "#374151",
    marginBottom: 4,
  },
  quoteButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#3B82F6", // blue
    alignItems: "center",
  },
  quoteButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  quotedButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#10B981", // green
    alignItems: "center",
  },
  quotedButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  emptyMessage: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280", // soft gray
    marginTop: 20,
  },
});

export default TransporterShipmentScreen;
