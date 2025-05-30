import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";

const MyDrivers = () => {
  const [allDrivers, setAllDrivers] = useState([]);
  const [myDrivers, setMyDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingDriver, setAddingDriver] = useState(null);
  const [transporterId, setTransporterId] = useState(null);

  useEffect(() => {
    fetchTransporterId();
  }, []);

  useEffect(() => {
    if (transporterId) {
      fetchAllDrivers();
      fetchMyDrivers(transporterId);
    }
  }, [transporterId]);

  const fetchTransporterId = async () => {
    try {
      const storedTransporterId = await AsyncStorage.getItem("transporterId");
      if (storedTransporterId) {
        setTransporterId(storedTransporterId);
      } else {
        console.error("Transporter ID not found");
      }
    } catch (error) {
      console.error("Error fetching transporterId:", error);
    }
  };

  const fetchAllDrivers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/getAllDrivers");
      const data = response.data;
      setAllDrivers(Array.isArray(data) ? data : data.drivers || []);
    } catch (error) {
      console.error("Error fetching all drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDrivers = async (transporterId) => {
    try {
      const response = await axios.get(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/transportDriver/getTd/${transporterId}`
      );
      // Add transporterId manually for correct comparison
      const updatedDrivers = (response.data || []).map((d) => ({
        ...d,
        transporterId: parseInt(transporterId),
      }));
      setMyDrivers(updatedDrivers);
    } catch (error) {
      console.warn("Error fetching my drivers:", error);
    }
  };

  const addDriverToCompany = async (driverId) => {
    if (!transporterId || !driverId) return;

    setAddingDriver(driverId);

    try {
      const response = await axios.post(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/transportDriver/addTd?transporterId=${transporterId}&driverId=${driverId}`
      );

      if (response.status === 200) {
        const alreadyExists = myDrivers.some(
          (d) =>
            d?.driver?.driverId === driverId &&
            d?.transporterId?.toString() === transporterId.toString()
        );

        if (!alreadyExists) {
          setMyDrivers((prevDrivers) => [
            ...prevDrivers,
            {
              transporterId: parseInt(transporterId),
              driver: {
                driverId,
                name: allDrivers.find((d) => d.driverId === driverId)?.name || "Unnamed",
              },
            },
          ]);
        }
      } else {
        console.error("Failed to add driver:", response.data);
      }
    } catch (error) {
      console.error("Error adding driver:", error);
    } finally {
      setAddingDriver(null);
    }
  };

  const isDriverAdded = (driverId) => {
    return myDrivers.some(
      (driver) =>
        driver?.driver?.driverId === driverId &&
        driver?.transporterId?.toString() === transporterId?.toString()
    );
  };

  const filteredAllDrivers = allDrivers.filter((driver) =>
    driver?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyDrivers = myDrivers.filter((driver) =>
    driver?.driver?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search drivers"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <Text style={styles.sectionTitle}>🚛 My Drivers</Text>
      <View>
        {filteredMyDrivers.length > 0 ? (
          filteredMyDrivers.map((item, index) => (
            <View key={`my-${item?.driver?.driverId || index}`} style={styles.driverItem}>
              <Text style={styles.driverText}>
                {item?.driver?.name || "Unknown Driver"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No drivers in your company.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>🛠️ All Drivers</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <FlatList
          data={filteredAllDrivers}
          keyExtractor={(item, index) =>
            item?.driverId ? `all-${item.driverId}` : index.toString()
          }
          renderItem={({ item }) => {
            const alreadyAdded = isDriverAdded(item.driverId);
            return (
              <View style={styles.driverItem}>
                <Text style={styles.driverText}>{item?.name || "Unknown"}</Text>
                <TouchableOpacity
                  onPress={() => addDriverToCompany(item.driverId)}
                  style={[styles.addButton, alreadyAdded && styles.addedButton]}
                  disabled={alreadyAdded}
                >
                  <LinearGradient
                    colors={alreadyAdded ? ["#ccc", "#aaa"] : ["#34eb86", "#2db26a"]}
                    style={styles.addButtonGradient}
                  >
                    <Text style={styles.addButtonText}>
                      {alreadyAdded ? "Added" : "Add Driver"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No available drivers.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    marginTop: 16,
  },
  driverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  driverText: { fontSize: 16, color: "#333" },
  addButton: { borderRadius: 20, overflow: "hidden" },
  addedButton: { opacity: 0.7 },
  addButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#666",
    marginBottom: 10,
  },
});

export default MyDrivers;
