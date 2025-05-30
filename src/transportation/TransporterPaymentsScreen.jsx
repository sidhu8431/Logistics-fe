import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
const TransporterPaymentsScreen = ({ route }) => {
  const [transporterId, setTransporterId] = useState(null);
  const [shipmentId, setShipmentId] = useState(""); // Search bar state
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); // Get navigation object
 
  // Fetch Transporter ID from AsyncStorage if not passed via route params
  useEffect(() => {
    const getTransporterId = async () => {
      try {
        let storedTransporterId = await AsyncStorage.getItem("transporterId");
 
        if (route.params?.transporterId) {
          setTransporterId(route.params.transporterId);
        } else if (storedTransporterId) {
          setTransporterId(parseInt(storedTransporterId)); // Ensure it's a number
        } else {
          console.warn("No transporterId found in AsyncStorage or route params.");
        }
      } catch (error) {
        console.error("Error fetching transporterId from AsyncStorage:", error);
      }
    };
 
    getTransporterId();
  }, [route.params?.transporterId]);
 
  // Fetch Payments Based on Transporter ID
  useEffect(() => {
    if (!transporterId) return; // Prevent unnecessary fetches
 
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/getAccepted/${transporterId}`
        );
        if (response.ok) {
          const data = await response.json();
          setPayments(data);
        } else {
          console.error(`Error fetching payments: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };
 
    fetchPayments();
  }, [transporterId]);
 
  // Filter Payments by Shipment ID
  const filteredPayments = payments.filter((payment) =>
    shipmentId ? payment.shipment.shipmentId.toString().includes(shipmentId) : true
  );
 
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.heading}>Payments</Text>
 
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Enter Shipment ID..."
          keyboardType="numeric"
          value={shipmentId}
          onChangeText={setShipmentId}
        />
 
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : filteredPayments.length > 0 ? (
          <FlatList
            data={filteredPayments}
            keyExtractor={(item) => item.assignmentId.toString()}
            renderItem={({ item }) => (
              <View style={styles.paymentCard}>
                <Text style={styles.label}>Shipment ID:</Text>
                <Text style={styles.value}>{item.shipment.shipmentId}</Text>
 
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>₹{item.assignAmount}</Text>
 
                <Text style={styles.label}>Transporter Name:</Text>
                <Text style={styles.value}>{item.transporter?.companyName || "N/A"}</Text>
 
                <Text style={styles.label}>Driver Name:</Text>
                <Text style={styles.value}>{item.assignedDriver?.name || "N/A"}</Text>
 
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => navigation.navigate('Payment', {
                    amount: item.assignAmount.toString(),
                    shipmentDetails: {
                      shipmentId: item.shipment.shipmentId,
                      transporterId: transporterId,
                      driverId: item.assignedDriver.driverId,
                    },
                    companyName: item.assignedDriver.name,
                    cargoType: item.shipment.cargoType,
                    description: `Payment to ${item.assignedDriver.name}`,
                  })}
                >
                  <Text style={styles.payButtonText}>Pay</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.noDataText}>No matching shipments found.</Text>}
          />
        ) : (
          <Text style={styles.noDataText}>No payments available.</Text>
        )}
      </View>
    </ScrollView>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfbe1",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  paymentCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  payButton: {
    marginTop: 10,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
 
export default TransporterPaymentsScreen;
 
 