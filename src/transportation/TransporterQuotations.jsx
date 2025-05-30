import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity ,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Picker } from '@react-native-picker/picker'; // ✅ Fixed import
import AsyncStorage from "@react-native-async-storage/async-storage";

const TransporterQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transporterId, setTransporterId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");


  // ✅ Fetch Transporter ID from AsyncStorage
  useEffect(() => {
    const getTransporterId = async () => {
      try {
        const storedTransporterId = await AsyncStorage.getItem("transporterId");

        if (storedTransporterId) {
          console.log("Retrieved Transporter ID:", storedTransporterId);
          setTransporterId(storedTransporterId);
        } else {
          console.error("Transporter ID not found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error fetching transporterId:", error);
      }
    };

    getTransporterId();
  }, []);

  
  // ✅ Fetch Quotations based on Transporter ID
  useEffect(() => {
    if (!transporterId) return;

    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/quotationByTransporter/${transporterId}`
        );
        if (!response.ok) throw new Error("Failed to fetch quotations");
        const data = await response.json();
        setQuotations(data);
        setFilteredQuotations(data); // Initialize filtered list
      } catch (error) {
        console.error("Error fetching quotations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [transporterId]);

  // ✅ Handle Search Filter
  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  
    if (!query) {
      setFilteredQuotations(quotations);
      return;
    }
  
    const filtered = quotations.filter((quote) =>
      (quote.quotationId && quote.quotationId.toString().includes(query)) ||
      (quote.shipment?.shipmentId && quote.shipment.shipmentId.toString().includes(query)) ||
      (quote.shipment?.pickupLocation && quote.shipment.pickupLocation.toLowerCase().includes(query)) ||
      (quote.shipment?.dropLocation && quote.shipment.dropLocation.toLowerCase().includes(query)) ||
      (quote.totalQuotationPrice && quote.totalQuotationPrice.toString().includes(query)) ||
      (quote.quoteStatus && quote.quoteStatus.toLowerCase().includes(query))
    );
  
    setFilteredQuotations(filtered);
  };
  

  // ✅ Handle Status Filter
  const handleStatusChange = (status) => {
  setSelectedStatus(status);

  if (status === "ALL" || status === "") {
    setFilteredQuotations(quotations); // Show all quotations when "ALL" is selected
  } else {
    const filtered = quotations.filter(
      (quote) => quote.quoteStatus.toLowerCase() === status.toLowerCase()
    );
    setFilteredQuotations(filtered);
  }
};

return (
  <View style={styles.container}>
    <Text style={styles.heading}>📜 Transporter Quotations</Text>

    {/* Search Bar */}
    <TextInput
  style={styles.searchBar}
  placeholder="Search by ID"
  placeholderTextColor="#777"
  value={searchQuery}
  onChangeText={handleSearch}
/>

    {/* Status Filter Dropdown (inside a container for better visibility) */}
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedStatus}
        style={styles.picker}
        onValueChange={(itemValue) => handleStatusChange(itemValue)}
        mode="dropdown"
      >
        <Picker.Item label="ALL" value="ALL" />
        <Picker.Item label="Pending" value="PENDING" />
        <Picker.Item label="Accepted" value="ACCEPTED" />
      </Picker>
    </View>

    {/* Show loading indicator */}
    {loading ? (
      <ActivityIndicator size="large" color="#0084ff" />
    ) : (
      <FlatList
        data={filteredQuotations}
        keyExtractor={(item) => item.quotationId.toString()}
        renderItem={({ item }) => <QuotationCard quotation={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>No quotations found.</Text>
        }
      />
    )}
  </View>
);
}
// ✅ Quotation Card Component
const QuotationCard = ({ quotation }) => {
  const navigation = useNavigation();
  const [paymentStatus, setPaymentStatus] = useState("PENDING");


  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(
          `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/payments/shipment/${quotation.shipment.shipmentId}`
        );
        if (!response.ok) throw new Error("Failed to fetch payment");
        const data = await response.json();
        if (data && data.length > 0) {
          setPaymentStatus(data[0].paymentStatus); // assuming it's a list
        }
      } catch (error) {
        console.error("Payment status fetch failed:", error);
      }
    };

    fetchPaymentStatus();
  }, [quotation.shipment.shipmentId]);


  const handleNavigation = () => {
    const quoteStatus = quotation.quoteStatus?.toLowerCase();
    const payStatus = paymentStatus?.toLowerCase();
  
    if (quoteStatus === "pending") {
      Alert.alert("⏳ Status", "Waiting for Manufacturer to Accept");
      return;
    }
  
    if (quoteStatus === "accepted" && payStatus === "pending") {
      Alert.alert("⏳ Status", "Waiting for payment");
      return;
    }
  
    if (quoteStatus === "accepted" && payStatus === "held") {
      navigation.navigate("AssignDriverScreen", {
        shipmentId: quotation.shipment.shipmentId,
      });
      return;
    }
  
    if (quoteStatus === "accepted" && payStatus === "released") {
      navigation.navigate("ShipmentCompletedScreen", {
        shipmentId: quotation.shipment.shipmentId,
      });
      return;
    }
  
    if (quoteStatus === "intransit") {
      navigation.navigate("ViewTrackingScreen", {
        shipmentId: quotation.shipment.shipmentId,
      });
      return;
    }
  
    if (quoteStatus === "completed") {
      navigation.navigate("ShipmentCompletedScreen", {
        shipmentId: quotation.shipment.shipmentId,
      });
      return;
    }
  };
  

  return (
    <TouchableOpacity onPress={handleNavigation}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Quotation ID: <Text style={styles.highlight}>{quotation.quotationId}</Text></Text>

        <Text style={styles.cardText}>🚚 Shipment: {quotation.shipment.shipmentId}</Text>
        <Text style={styles.cardText}>📍 Pickup: <Text style={styles.bold}>{quotation.shipment.pickupTown}, {quotation.shipment.pickupState}</Text></Text>
        <Text style={styles.cardText}>🏁 Drop: <Text style={styles.bold}>{quotation.shipment.dropTown}, {quotation.shipment.dropState}</Text></Text>
        <Text style={styles.cardText}>💰 Price: <Text style={styles.highlight}>${quotation.totalQuotationPrice.toFixed(2)}</Text></Text>
        <Text style={styles.cardText}>📅 Created: {new Date(quotation.createdAt).toLocaleDateString()}</Text>

        <View style={[styles.statusBadge, styles[quotation.quoteStatus.toLowerCase()]]}>
          <Text style={styles.statusText}>{quotation.quoteStatus}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.paymentStatus}>
          💳 Payment Status: <Text style={styles.paymentHighlight}>{paymentStatus}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f3faff",
  },

  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#00509d",
    marginBottom: 15,
    textTransform: "uppercase",
  },

  searchBar: {
    height: 45,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
    overflow: "hidden",
  },

  picker: {
    height: 50,
    width: "100%",
    color: "#333",
  },

  card: {
    backgroundColor: "#f9f9f9",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: "#0084ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
  },

  highlight: {
    fontWeight: "bold",
    color: "#00509d",
  },

  bold: {
    fontWeight: "600",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  paymentStatus: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },

  paymentHighlight: {
    color: "#f7022b",
    fontWeight: "bold",
  },

  divider: {
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
    marginTop: 12,
    marginBottom: 6,
  },

  emptyMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 20,
  },

  // Status Colors
  pending: { backgroundColor: "#ffae42" },
  accepted: { backgroundColor: "#4CAF50" },
  intransit: { backgroundColor: "#3498db" },
  completed: { backgroundColor: "#8E44AD" },
});


export default TransporterQuotations;
