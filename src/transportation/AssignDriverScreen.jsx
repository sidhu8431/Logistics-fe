import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList ,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AssignDriverScreen = ({ route, navigation }) => {
  const { shipmentId } = route.params || {};
  const [transporterId, setTransporterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipmentDetails, setShipmentDetails] = useState({});
  const [manufacturerDetails, setManufacturerDetails] = useState({});
  const [driverWages, setDriverWages] = useState(null);
  const [myDrivers, setMyDrivers] = useState([]);
  const [otherDrivers, setOtherDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [isAssigned, setIsAssigned] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState("N/A"); 
  const [acceptedDriver, setAcceptedDriver] = useState(null); 
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    fetchTransporterId();
  }, []);

  useEffect(() => {
    if (transporterId && shipmentId) {
      checkIfAlreadyAssigned();
      fetchQuotationDetails();
      fetchMyDrivers();
      fetchOtherDrivers();
    }
  }, [transporterId, shipmentId]);

  // ✅ Polling: Keep checking status every 5 seconds
  useEffect(() => {
    if (polling) {
      const interval = setInterval(() => {
        checkIfAlreadyAssigned();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [polling]);

  const fetchTransporterId = async () => {
    try {
      const storedTransporterId = await AsyncStorage.getItem("transporterId");
      if (storedTransporterId) {
        setTransporterId(storedTransporterId);
      } else {
        Alert.alert("Error", "Transporter ID not found. Please log in again.");
      }
    } catch (error) {
      console.error("❌ Error fetching transporterId:", error);
    }
  };

  const checkIfAlreadyAssigned = async () => {
    try {
      if (!shipmentId || !transporterId) return;
  
      const API_URL = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/getShipmentAssignment?shipmentId=${shipmentId}&transporterId=${transporterId}`;
      const response = await fetch(API_URL);
  
      if (response.ok) {
        const data = await response.json();
  
        if (data.length > 0) {
          // ✅ Check if there is an "ACCEPTED" assignment
          const acceptedAssignment = data.find(assignment => assignment.assignmentStatus === "ACCEPTED");
  
          if (acceptedAssignment) {
            setAssignmentStatus("ACCEPTED");
            setAcceptedDriver(acceptedAssignment.assignedDriver);
            setIsAssigned(true);
            setPolling(false); // ✅ Stop polling when accepted
          } else {
            // ✅ If a request is sent but not accepted yet, keep "PENDING"
            setAssignmentStatus("PENDING");
            setIsAssigned(true);
          }
        } else {
          // ✅ No assignments found → Reset to default state
          setAssignmentStatus("N/A");
          setIsAssigned(false);
        }
      }
    } catch (error) {
      console.error("❌ Error checking assignment status:", error);
    }
  };
  
  

  const fetchQuotationDetails = async () => {
    try {
      setLoading(true);
      const API_URL = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/quotations/get/${transporterId}/${shipmentId}`;
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch quotation details.");
      const data = await response.json();

      setShipmentDetails(data.shipment || {});
      setManufacturerDetails(data.shipment?.manufacturer || {});
      setDriverWages(data.driverWages || "N/A");
    } catch (error) {
      console.error("❌ Error fetching quotation details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDrivers = async () => {
    try {
      setLoading(true);
      const API_URL = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/transportDriver/getTd/${transporterId}`;
      const response = await fetch(API_URL);
      
      if (!response.ok) throw new Error("Failed to fetch drivers.");
      const data = await response.json();
  
      // ✅ Ensure data is correctly extracted and set
      if (data && Array.isArray(data)) {
        const driversList = data.map((item) => item.driver);
        setMyDrivers(driversList);
      } else {
        setMyDrivers([]); // ✅ Prevent errors when no drivers exist
      }
    } catch (error) {
      console.error("❌ Error fetching my drivers:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const fetchOtherDrivers = async () => {
    try {
      setLoading(true);
      console.log("Fetching all available drivers...");
      
      const API_URL = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/getAllDrivers`;
      const response = await fetch(API_URL);
  
      if (!response.ok) {
        throw new Error(`Failed to fetch drivers: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Fetched Other Drivers:", data);
  
      if (data && Array.isArray(data)) {
        setOtherDrivers(data);
      } else {
        console.error("Unexpected data format for drivers:", data);
        setOtherDrivers([]); // Ensure it doesn't break the app
      }
    } catch (error) {
      console.error("❌ Error fetching other drivers:", error.message);
      Alert.alert("Error", "Failed to fetch available drivers.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleSendRequest = async () => {
    if (!Array.isArray(selectedDrivers) || selectedDrivers.length === 0) {
      Alert.alert("Error", "Please select at least one driver.");
      return;
    }

    try {
      setIsAssigned(true);
      setAssignmentStatus("Pending");

      for (const driverId of selectedDrivers) {
        const formData = new URLSearchParams();
        formData.append("shipmentId", shipmentId);
        formData.append("transporterId", transporterId);
        formData.append("assignAmount", driverWages);
        formData.append("driverId", driverId);

        const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/assign", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        if (!response.ok) {
          throw new Error(`Failed to assign shipment for driver ${driverId}`);
        }
      }

      Alert.alert("Success", "Shipment assigned successfully!");
      checkIfAlreadyAssigned();
    } catch (error) {
      console.error("❌ Error assigning shipment:", error);
      setAssignmentStatus("N/A");
    }
  };
  

  // ✅ Handle Multi-Selection of Drivers
  const toggleDriverSelection = (driverId) => {
    setSelectedDrivers((prev) =>
      Array.isArray(prev)
        ? prev.includes(driverId)
          ? prev.filter((id) => id !== driverId)
          : [...prev, driverId]
        : [driverId] // Ensure it stays an array
    );
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <View style={styles.container}>
          {/* Manufacturer Details Button */}
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setModalType("manufacturer")}
          >
            <Text style={styles.buttonText}>🚚 MANUFACTURER DETAILS</Text>
          </TouchableOpacity>
  
          {/* Shipment Details Button */}
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setModalType("shipment")}
          >
            <Text style={styles.buttonText}>📦 SHIPMENT DETAILS</Text>
          </TouchableOpacity>
  
          {/* Driver Wages */}
          <Text style={styles.heading}>💰 DRIVER WAGES</Text>
          <View style={styles.row}>
            <Text style={styles.priceText}>₹ {driverWages}</Text>
  
            {/* Assignment Status Section */}
            <View
              style={[
                styles.statusContainer,
                assignmentStatus === "N/A"
                  ? styles.statusNA
                  : assignmentStatus === "Pending"
                  ? styles.statusPending
                  : styles.statusAccepted,
              ]}
            >
              <Text style={styles.statusText}>Status: {assignmentStatus}</Text>
            </View>
          </View>

          {/* ✅ Hide "Other Available Drivers" if already assigned */}
{!isAssigned && otherDrivers.length > 0 ? (
  <>
    <Text style={styles.subHeading}>🌍 Other Available Drivers</Text>
    <FlatList
      data={otherDrivers}
      keyExtractor={(item) => item?.driverId?.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.driverItem,
            selectedDrivers.includes(item.driverId) && styles.selectedDriver,
          ]}
          onPress={() => toggleDriverSelection(item.driverId)}
        >
          <Text style={styles.driverText}>
            {item.name} (⭐ {item.driverRating})
          </Text>
        </TouchableOpacity>
      )}
      nestedScrollEnabled={true} // ✅ Fix VirtualizedList warning
    />
  </>
) : null}

  
          {/* ✅ Hide "My Drivers" when status is accepted */}
          {assignmentStatus !== "ACCEPTED" && (
            <>
              <Text style={styles.subHeading}>🚛 My Drivers</Text>
              <FlatList
                data={myDrivers}
                keyExtractor={(item) => item?.driverId?.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.driverItem,
                      selectedDrivers.includes(item.driverId) &&
                        styles.selectedDriver,
                    ]}
                    onPress={() => toggleDriverSelection(item.driverId)}
                  >
                    <Text style={styles.driverText}>
                      {item.name} (⭐ {item.driverRating})
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
  
          {/* ✅ Accepted Driver Details Instead of Other Drivers */}
          {assignmentStatus === "ACCEPTED" && acceptedDriver && (
            <View style={styles.driverDetailContainer}>
              <Text style={styles.heading}>🚛 ACCEPTED DRIVER DETAILS</Text>
              <Text style={styles.label}>Name: {acceptedDriver.name}</Text>
              <Text style={styles.label}>Phone: {acceptedDriver.phoneNumber}</Text>
              <Text style={styles.label}>Experience: {acceptedDriver.experience} years</Text>
              <Text style={styles.label}>License Type: {acceptedDriver.licenseType}</Text>
              <Text style={styles.label}>Rating: ⭐ {acceptedDriver.driverRating}</Text>
            </View>
          )}
  
          {/* ✅ Action Button (Send Request or Assign Vehicle) */}
          {/* ✅ Action Button (Send Request or Assign Vehicle) */}
{isAssigned ? (
  acceptedDriver ? (
    <TouchableOpacity
      style={styles.assignButton}
      onPress={() =>
        navigation.navigate("AssignVehicleScreen", {
          shipment: shipmentDetails || {}, 
          transporterId: transporterId || null, 
        })
      }
    >
      <Text style={styles.buttonText}>Assign Vehicle</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={[styles.sendButton, { backgroundColor: "#ccc" }]}
      disabled
    >
      <Text style={styles.buttonText}>Waiting for Acceptance...</Text>
    </TouchableOpacity>
  )
) : (
  <TouchableOpacity
    style={[
      styles.sendButton,
      selectedDrivers.length === 0 && styles.disabledButton,
    ]}
    disabled={selectedDrivers.length === 0}
    onPress={handleSendRequest}
  >
    <Text style={styles.buttonText}>Send Request</Text>
  </TouchableOpacity>
)}

        </View>
      )}
  
      {/* Popup Modal */}
      <Modal visible={modalType !== null} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {modalType === "manufacturer" ? (
              <>
                <Text style={styles.heading}>🚚 MANUFACTURER DETAILS</Text>
                <Text style={styles.label}>
                  Company: {manufacturerDetails?.companyName || "N/A"}
                </Text>
                <Text style={styles.label}>
                  Phone: {manufacturerDetails?.phoneNumber || "N/A"}
                </Text>
                <Text style={styles.label}>
                  Email: {manufacturerDetails?.email || "N/A"}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.heading}>📦 SHIPMENT DETAILS</Text>
                <Text style={styles.label}>
                  Shipment ID: {shipmentDetails?.shipmentId || "N/A"}
                </Text>
                <Text style={styles.label}>
                  Cargo Type: {shipmentDetails?.cargoType || "N/A"}
                </Text>
                <Text style={styles.label}>
                  Pickup: {shipmentDetails?.pickupTown || "N/A"}
                </Text>
                <Text style={styles.label}>
                  Drop: {shipmentDetails?.dropTown || "N/A"}
                </Text>
                <Text style={styles.label}>
                  Vehicle Type: {shipmentDetails?.vehicleTypeRequired || "N/A"}
                </Text>
              </>
            )}
  
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
  

  
}
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginTop: 15,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#28a745",
    marginRight: 10,
  },

  // ✅ Status Styling
  driverDetailContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  statusContainer: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  statusNA: { backgroundColor: "#ddd" },
  statusPending: { backgroundColor: "#ffcc00" },
  statusAccepted: { backgroundColor: "#28a745" },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },

  // ✅ Buttons
  detailButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  assignButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  sendButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // ✅ Modal Styling
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
    elevation: 3,
  },
  closeButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },

  // ✅ Driver List Styling
  driverListContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    elevation: 3,
  },
  driverItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f1f1f1",
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedDriver: {
    backgroundColor: "#d1f2eb",
    borderColor: "#28a745",
    borderWidth: 2,
  },
  driverText: {
    fontSize: 16,
    color: "#333",
  },
  noDriversText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 5,
  },
});

export default AssignDriverScreen;
