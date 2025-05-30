// import React, { useState, useEffect } from "react";

// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const DriverShipmentDetails = ({ route, navigation }) => {
//   const { shipment, transporter, assignmentId: passedAssignmentId, driverId: passedDriverId } = route.params || {};
//   const shipmentId = shipment?.shipmentId || null; 

//   const [loading, setLoading] = useState(false);
//   const [driverId, setDriverId] = useState(passedDriverId || null);
//   const [assignmentId, setAssignmentId] = useState(passedAssignmentId || null);
//   const [assignmentStatus, setAssignmentStatus] = useState("PENDING");
//   const [accepted, setAccepted] = useState(false); // Track whether shipment is accepted

//   const formatDateTime = (dateTimeString) => {
//     if (!dateTimeString) return { date: "N/A", time: "N/A" };
//     const [date, time] = dateTimeString.split("T");
//     return { date, time };
//   };

//   const pickupDateTime = formatDateTime(shipment?.pickupDate);
//   const deliveryDateTime = formatDateTime(shipment?.deliveryDate);

//   useEffect(() => {
//     const fetchDriverId = async () => {
//       if (driverId) return;
//       try {
//         const storedDriverId = await AsyncStorage.getItem("driverId");
//         if (storedDriverId) setDriverId(storedDriverId);
//       } catch (error) {
//         console.error("❌ Error retrieving Driver ID:", error.message);
//       }
//     };
//     fetchDriverId();
//   }, [driverId]);

//   useEffect(() => {
//     const fetchAssignmentStatus = async () => {
//       if (!shipmentId) return;
//       try {
//         const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/checkStatus?shipmentId=${shipmentId}`;
//         console.log("📡 Fetching assignment status from:", url);
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`API Error ${response.status}: Failed to fetch assignment status`);
//         const data = await response.json();
  
//         setAssignmentStatus(data.assignmentStatus || "PENDING");
  
//         // ✅ Check if the shipment was already accepted before
//         if (data.assignmentStatus === "ACCEPTED") {
//           console.log("🚛 Shipment already ACCEPTED, updating UI...");
//           setAccepted(true);
//         }
  
//         // ✅ Auto-navigate if status is "IN_TRANSIT"
//         if (data.assignmentStatus === "IN_TRANSIT") {
//           console.log("🚀 Status is IN_TRANSIT, navigating to InTransitTracking...");
//           navigation.replace("InTransitTracking", { driverId, shipmentId });
//         }
  
//         // ✅ Auto-navigate if status is "PICKED_UP"
//         if (data.assignmentStatus === "PICKED_UP") {
//           console.log("📦 Shipment is PICKED_UP, navigating to ShipmentDocuments...");
//           navigation.replace("ShipmentDocuments", { shipmentId, driverId });
//         }
  
//       } catch (error) {
//         console.error("❌ Error fetching assignment status:", error.message);
//       }
//     };
  
//     fetchAssignmentStatus();
//   }, [driverId, navigation, shipmentId]);
  
//   useEffect(() => {
//     console.log("📦 Received Params:", route.params);
//     console.log("🚛 Driver ID:", driverId);
//     console.log("📦 Shipment ID:", shipmentId);
//     console.log("📝 Assignment ID:", assignmentId);
//   }, [assignmentId, driverId, route.params, shipmentId]);

//   // ✅ Handle Accept Shipment Button Click
//   const handleAcceptShipment = async () => {
//     setLoading(true);
//     try {
//       const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/accept/${shipmentId}/${driverId}`;
//       console.log("🔗 Sending Accept Request to:", url);

//       const response = await fetch(url, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) throw new Error(`API Error ${response.status}: Failed to accept shipment`);
//       const result = await response.json();

//       console.log("✅ Shipment Accepted Successfully:", result);

//       // ✅ Update state immediately
//       setAccepted(true);
//       setAssignmentStatus("ACCEPTED");

//       // ✅ Store acceptance status locally
//       await AsyncStorage.setItem(`acceptedShipment-${shipmentId}`, "true");

//       Alert.alert("Shipment Accepted", "You have accepted the shipment. You can now navigate to the pickup point.");
//     } catch (error) {
//       console.error("❌ Error Accepting Shipment:", error.message);
//       Alert.alert("Error", "Failed to accept shipment. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
//         {loading ? (
//           <View style={styles.loaderContainer}>
//             <ActivityIndicator size="large" color="#4b0082" />
//             <Text style={styles.loadingText}>Processing your request...</Text>
//           </View>
//         ) : (
//           <>
//             {/* Shipment Details */}
//             <Text style={styles.title}>Shipment Details</Text>
//             <View style={styles.card}>
//               <Text style={styles.detailText}><Text style={styles.bold}>📍 Pick-up:</Text> {shipment?.pickupPoint || "N/A"}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📅 Pick-up Date:</Text> {pickupDateTime.date}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>⏰ Pick-up Time:</Text> {pickupDateTime.time}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📍 Drop:</Text> {shipment?.dropPoint || "N/A"}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📅 Delivery Date:</Text> {deliveryDateTime.date}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>⏰ Delivery Time:</Text> {deliveryDateTime.time}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📦 Cargo Type:</Text> {shipment?.cargoType || "N/A"}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>⚖️ Weight:</Text> {shipment?.weight || "N/A"} kg</Text>
//             </View>

//             {/* Status Display */}
//             <Text style={styles.statusText}>🚛 Status: {assignmentStatus}</Text>

//             {/* ✅ Accept Button (Hidden if already accepted) */}
//             {!accepted && (
//               <TouchableOpacity
//                 style={[styles.acceptButton, loading && styles.disabledButton]}
//                 activeOpacity={0.7}
//                 disabled={loading}
//                 onPress={handleAcceptShipment}
//               >
//                 <Text style={styles.buttonText}>{loading ? "Processing..." : "✅ Accept Shipment"}</Text>
//               </TouchableOpacity>
//             )}

//             {/* 🚗 Navigate to Pickup Button (Visible after accepting) */}
//             {accepted && (
//               <TouchableOpacity
//                 style={styles.navigateButton}
//                 activeOpacity={0.7}
//                 onPress={() => {
//                   if (!driverId || !shipmentId) {
//                     Alert.alert("Navigation Error", "Driver ID or Shipment ID is missing.");
//                     console.error("❌ Missing driverId or shipmentId:", { driverId, shipmentId });
//                     return;
//                   }
//                   console.log("🔍 Navigating with:", { driverId, shipmentId });
//                   navigation.navigate("DriverTracking", { driverId, shipmentId });
//                 }}
//               >
//                 <Text style={styles.buttonText}>🚗 Navigate to Pickup</Text>
//               </TouchableOpacity>
//             )}
//           </>
//         )}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//     paddingTop: 20,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     alignItems: "center",
//     paddingBottom: 50,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#333",
//     marginVertical: 10,
//     textAlign: "center",
//     textTransform: "uppercase",
//   },
//   card: {
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     padding: 20,
//     marginVertical: 10,
//     width: "90%",
//     borderWidth: 1,
//     borderColor: "#ddd",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   detailText: {
//     fontSize: 16,
//     color: "#333",
//     marginBottom: 6,
//     lineHeight: 22,
//     textAlign: "left",
//   },
//   bold: {
//     fontWeight: "bold",
//     color: "#222",
//   },
//   statusText: {
//     fontSize: 18,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginVertical: 10,
//     padding: 10,
//     borderRadius: 8,
//     backgroundColor: "#f1f3f4",
//   },
//   statusAccepted: {
//     backgroundColor: "#d4edda",
//     color: "#155724",
//   },
//   acceptButton: {
//     backgroundColor: "#28a745",
//     paddingVertical: 16,
//     borderRadius: 30,
//     alignItems: "center",
//     elevation: 5,
//     width: "80%",
//     marginTop: 20,
//     shadowColor: "#28a745",
//     shadowOpacity: 0.5,
//     shadowRadius: 3,
//   },
//   navigateButton: {
//     backgroundColor: "#007bff",
//     paddingVertical: 16,
//     borderRadius: 30,
//     alignItems: "center",
//     elevation: 5,
//     width: "80%",
//     marginTop: 20,
//     shadowColor: "#007bff",
//     shadowOpacity: 0.5,
//     shadowRadius: 3,
//   },
//   disabledButton: {
//     backgroundColor: "#6c757d",
//     paddingVertical: 16,
//     borderRadius: 30,
//     alignItems: "center",
//     width: "80%",
//     marginTop: 20,
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     fontSize: 16,
//     color: "#333",
//     marginTop: 10,
//   },
// });

// export default DriverShipmentDetails;


// ========================================================






// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const DriverShipmentDetails = ({ route, navigation }) => {
//   const { shipment, transporter, assignmentId: passedAssignmentId, driverId: passedDriverId } = route.params || {};
//   const shipmentId = shipment?.shipmentId || null; 

//   const [loading, setLoading] = useState(false);
//   const [driverId, setDriverId] = useState(passedDriverId || null);
//   const [assignmentId, setAssignmentId] = useState(passedAssignmentId || null);
//   const [assignmentStatus, setAssignmentStatus] = useState("PENDING");
//   const [accepted, setAccepted] = useState(false);
//   const [paymentReleased, setPaymentReleased] = useState(false);

//   const formatDateTime = (dateTimeString) => {
//     if (!dateTimeString) return { date: "N/A", time: "N/A" };
//     const [date, time] = dateTimeString.split("T");
//     return { date, time };
//   };

//   const pickupDateTime = formatDateTime(shipment?.pickupDate);
//   const deliveryDateTime = formatDateTime(shipment?.deliveryDate);

//   useEffect(() => {
//     const fetchDriverId = async () => {
//       if (driverId) return;
//       try {
//         const storedDriverId = await AsyncStorage.getItem("driverId");
//         if (storedDriverId) setDriverId(storedDriverId);
//       } catch (error) {
//         console.error("❌ Error retrieving Driver ID:", error.message);
//       }
//     };
//     fetchDriverId();
//   }, [driverId]);

//   // ✅ Using useCallback to avoid ESLint warning
//   const checkPaymentStatus = useCallback(async () => {
//     try {
//       const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/payments/driver/{driverId}/shipment/{shipmentId}/status`);
//       if (!response.ok) throw new Error("Failed to fetch payment status");

//       const statuses = await response.json();
//       console.log("💰 Payment Statuses:", statuses);
//       const allReleased = statuses.every(status => status === "RELEASED");
//       setPaymentReleased(allReleased);
//     } catch (error) {
//       console.error("❌ Payment status fetch error:", error.message);
//       setPaymentReleased(false);
//     }
//   }, []);

//   // ✅ Fetch payment status when driverId is available
//   useEffect(() => {
//     if (driverId) {
//       checkPaymentStatus();
//     }
//   }, [driverId, checkPaymentStatus]);

//   useEffect(() => {
//     const fetchAssignmentStatus = async () => {
//       if (!shipmentId) return;
//       try {
//         const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/checkStatus?shipmentId=${shipmentId}`;
//         console.log("📡 Fetching assignment status from:", url);
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`API Error ${response.status}: Failed to fetch assignment status`);
//         const data = await response.json();
  
//         setAssignmentStatus(data.assignmentStatus || "PENDING");
  
//         if (data.assignmentStatus === "ACCEPTED") {
//           console.log("🚛 Shipment already ACCEPTED, updating UI...");
//           setAccepted(true);
//         }
//         if (data.assignmentStatus === "IN_TRANSIT") {
//           console.log("🚀 Status is IN_TRANSIT, navigating to InTransitTracking...");
//           navigation.replace("InTransitTracking", { driverId, shipmentId });
//         }
//         if (data.assignmentStatus === "PICKED_UP") {
//           console.log("📦 Shipment is PICKED_UP, navigating to ShipmentDocuments...");
//           navigation.replace("ShipmentDocuments", { shipmentId, driverId });
//         }
//       } catch (error) {
//         console.error("❌ Error fetching assignment status:", error.message);
//       }
//     };
//     fetchAssignmentStatus();
//   }, [driverId, navigation, shipmentId]);
  
//   useEffect(() => {
//     console.log("📦 Received Params:", route.params);
//     console.log("🚛 Driver ID:", driverId);
//     console.log("📦 Shipment ID:", shipmentId);
//     console.log("📝 Assignment ID:", assignmentId);
//   }, [assignmentId, driverId, route.params, shipmentId]);

//   const handleAcceptShipment = async () => {
//     setLoading(true);
//     try {
//       const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/accept/${shipmentId}/${driverId}`;
//       console.log("🔗 Sending Accept Request to:", url);

//       const response = await fetch(url, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) throw new Error(`API Error ${response.status}: Failed to accept shipment`);
//       const result = await response.json();

//       console.log("✅ Shipment Accepted Successfully:", result);

//       setAccepted(true);
//       setAssignmentStatus("ACCEPTED");

//       await AsyncStorage.setItem(`acceptedShipment-${shipmentId}`, "true");

//       Alert.alert("Shipment Accepted", "You have accepted the shipment. You can now navigate to the pickup point.");
//     } catch (error) {
//       console.error("❌ Error Accepting Shipment:", error.message);
//       Alert.alert("Error", "Failed to accept shipment. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
//         {loading ? (
//           <View style={styles.loaderContainer}>
//             <ActivityIndicator size="large" color="#4b0082" />
//             <Text style={styles.loadingText}>Processing your request...</Text>
//           </View>
//         ) : (
//           <>
//             <Text style={styles.title}>Shipment Details</Text>
//             <View style={styles.card}>
//               <Text style={styles.detailText}><Text style={styles.bold}>📍 Pick-up:</Text> {shipment?.pickupPoint || "N/A"}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📅 Pick-up Date:</Text> {pickupDateTime.date}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>⏰ Pick-up Time:</Text> {pickupDateTime.time}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📍 Drop:</Text> {shipment?.dropPoint || "N/A"}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📅 Delivery Date:</Text> {deliveryDateTime.date}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>⏰ Delivery Time:</Text> {deliveryDateTime.time}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>📦 Cargo Type:</Text> {shipment?.cargoType || "N/A"}</Text>
//               <Text style={styles.detailText}><Text style={styles.bold}>⚖️ Weight:</Text> {shipment?.weight || "N/A"} kg</Text>
//             </View>

//             <Text style={styles.statusText}>🚛 Status: {assignmentStatus}</Text>
//             <Text style={styles.statusText}>💰 Payment: {paymentReleased ? "RELEASED" : "PENDING"}</Text>

//             {!accepted && (
//               <TouchableOpacity
//                 style={[styles.acceptButton, loading && styles.disabledButton]}
//                 activeOpacity={0.7}
//                 disabled={loading}
//                 onPress={handleAcceptShipment}
//               >
//                 <Text style={styles.buttonText}>{loading ? "Processing..." : "✅ Accept Shipment"}</Text>
//               </TouchableOpacity>
//             )}

//             {accepted && (
//               <TouchableOpacity
//                 style={[styles.navigateButton, !paymentReleased && styles.disabledButton]}
//                 activeOpacity={0.7}
//                 disabled={!paymentReleased}
//                 onPress={() => {
//                   if (!paymentReleased) {
//                     Alert.alert("⏳ Waiting for Payment", "Please wait until payment is released.");
//                     return;
//                   }
//                   if (!driverId || !shipmentId) {
//                     Alert.alert("Navigation Error", "Driver ID or Shipment ID is missing.");
//                     return;
//                   }
//                   navigation.navigate("DriverTracking", { driverId, shipmentId });
//                 }}
//               >
//                 <Text style={styles.buttonText}>🚗 Navigate to Pickup</Text>
//               </TouchableOpacity>
//             )}
//           </>
//         )}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//     paddingTop: 20,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     alignItems: "center",
//     paddingBottom: 50,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#333",
//     marginVertical: 10,
//     textAlign: "center",
//     textTransform: "uppercase",
//   },
//   card: {
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     padding: 20,
//     marginVertical: 10,
//     width: "90%",
//     borderWidth: 1,
//     borderColor: "#ddd",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   detailText: {
//     fontSize: 16,
//     color: "#333",
//     marginBottom: 6,
//     lineHeight: 22,
//     textAlign: "left",
//   },
//   bold: {
//     fontWeight: "bold",
//     color: "#222",
//   },
//   statusText: {
//     fontSize: 18,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginVertical: 10,
//     padding: 10,
//     borderRadius: 8,
//     backgroundColor: "#f1f3f4",
//   },
//   acceptButton: {
//     backgroundColor: "#28a745",
//     paddingVertical: 16,
//     borderRadius: 30,
//     alignItems: "center",
//     elevation: 5,
//     width: "80%",
//     marginTop: 20,
//     shadowColor: "#28a745",
//     shadowOpacity: 0.5,
//     shadowRadius: 3,
//   },
//   navigateButton: {
//     backgroundColor: "#007bff",
//     paddingVertical: 16,
//     borderRadius: 30,
//     alignItems: "center",
//     elevation: 5,
//     width: "80%",
//     marginTop: 20,
//     shadowColor: "#007bff",
//     shadowOpacity: 0.5,
//     shadowRadius: 3,
//   },
//   disabledButton: {
//     backgroundColor: "#6c757d",
//     paddingVertical: 16,
//     borderRadius: 30,
//     alignItems: "center",
//     width: "80%",
//     marginTop: 20,
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     fontSize: 16,
//     color: "#333",
//     marginTop: 10,
//   },
// });

// export default DriverShipmentDetails;





import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DriverShipmentDetails = ({ route, navigation }) => {
  const { shipment, transporter, assignmentId: passedAssignmentId, driverId: passedDriverId } = route.params || {};
  const shipmentId = shipment?.shipmentId || null;

  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState(passedDriverId || null);
  const [assignmentId, setAssignmentId] = useState(passedAssignmentId || null);
  const [assignmentStatus, setAssignmentStatus] = useState("PENDING");
  const [accepted, setAccepted] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState("PENDING");

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: "N/A", time: "N/A" };
    const [date, time] = dateTimeString.split("T");
    return { date, time };
  };

  const pickupDateTime = formatDateTime(shipment?.pickupDate);
  const deliveryDateTime = formatDateTime(shipment?.deliveryDate);

  useEffect(() => {
    const fetchDriverId = async () => {
      if (driverId) return;
      try {
        const storedDriverId = await AsyncStorage.getItem("driverId");
        if (storedDriverId) setDriverId(storedDriverId);
      } catch (error) {
        console.error("❌ Error retrieving Driver ID:", error.message);
      }
    };
    fetchDriverId();
  }, [driverId]);

  const checkPaymentStatus = useCallback(async () => {
    try {
      const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/payments/driver/${driverId}/shipment/${shipmentId}/status`;
      console.log("🔍 Fetching payment status from:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch payment status");

      const statuses = await response.json();
      console.log("💰 Payment Statuses:", statuses);

      const allEligible = statuses.every(
        status => status === "RELEASED" || status === "HELD"
      );
      setPaymentReleased(allEligible);

      // Set the display text to the first payment status
      if (statuses.length > 0) {
        setPaymentStatusText(statuses[0]);
      }
    } catch (error) {
      console.error("❌ Payment status fetch error:", error.message);
      setPaymentReleased(false);
      setPaymentStatusText("PENDING");
    }
  }, [driverId, shipmentId]);

  useEffect(() => {
    if (driverId && shipmentId) {
      checkPaymentStatus();
    }
  }, [driverId, shipmentId, checkPaymentStatus]);

  useEffect(() => {
    const fetchAssignmentStatus = async () => {
      if (!shipmentId) return;
      try {
        const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/checkStatus?shipmentId=${shipmentId}`;
        console.log("📡 Fetching assignment status from:", url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error ${response.status}: Failed to fetch assignment status`);
        const data = await response.json();

        setAssignmentStatus(data.assignmentStatus || "PENDING");

        if (data.assignmentStatus === "ACCEPTED") {
          console.log("🚛 Shipment already ACCEPTED, updating UI...");
          setAccepted(true);
        }

        if (data.assignmentStatus === "IN_TRANSIT") {
          console.log("🚀 Status is IN_TRANSIT, navigating to InTransitTracking...");
          navigation.replace("InTransitTracking", { driverId, shipmentId });
        }

        if (data.assignmentStatus === "PICKED_UP") {
          console.log("📦 Shipment is PICKED_UP, navigating to ShipmentDocuments...");
          navigation.replace("ShipmentDocuments", { shipmentId, driverId });
        }
      } catch (error) {
        console.error("❌ Error fetching assignment status:", error.message);
      }
    };
    fetchAssignmentStatus();
  }, [driverId, navigation, shipmentId]);

  useEffect(() => {
    console.log("📦 Received Params:", route.params);
    console.log("🚛 Driver ID:", driverId);
    console.log("📦 Shipment ID:", shipmentId);
    console.log("📝 Assignment ID:", assignmentId);
  }, [assignmentId, driverId, route.params, shipmentId]);

  const handleAcceptShipment = async () => {
    setLoading(true);
    try {
      const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/accept/${shipmentId}/${driverId}`;
      console.log("🔗 Sending Accept Request to:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`API Error ${response.status}: Failed to accept shipment`);
      const result = await response.json();

      console.log("✅ Shipment Accepted Successfully:", result);

      setAccepted(true);
      setAssignmentStatus("ACCEPTED");

      await AsyncStorage.setItem(`acceptedShipment-${shipmentId}`, "true");

      Alert.alert("Shipment Accepted", "You have accepted the shipment. You can now navigate to the pickup point.");
    } catch (error) {
      console.error("❌ Error Accepting Shipment:", error.message);
      Alert.alert("Error", "Failed to accept shipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4b0082" />
            <Text style={styles.loadingText}>Processing your request...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Shipment Details</Text>
            <View style={styles.card}>
              <Text style={styles.detailText}><Text style={styles.bold}>📍 Pick-up:</Text> {shipment?.pickupPoint || "N/A"}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>📅 Pick-up Date:</Text> {pickupDateTime.date}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>⏰ Pick-up Time:</Text> {pickupDateTime.time}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>📍 Drop:</Text> {shipment?.dropPoint || "N/A"}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>📅 Delivery Date:</Text> {deliveryDateTime.date}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>⏰ Delivery Time:</Text> {deliveryDateTime.time}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>📦 Cargo Type:</Text> {shipment?.cargoType || "N/A"}</Text>
              <Text style={styles.detailText}><Text style={styles.bold}>⚖️ Weight:</Text> {shipment?.weight || "N/A"} kg</Text>
            </View>

            <Text style={styles.statusText}>🚛 Status: {assignmentStatus}</Text>
            <Text style={styles.statusText}>💰 Payment: {paymentStatusText}</Text>

            {!accepted && (
              <TouchableOpacity
                style={[styles.acceptButton, loading && styles.disabledButton]}
                activeOpacity={0.7}
                disabled={loading}
                onPress={handleAcceptShipment}
              >
                <Text style={styles.buttonText}>{loading ? "Processing..." : "✅ Accept Shipment"}</Text>
              </TouchableOpacity>
            )}

            {accepted && (
              <TouchableOpacity
                style={[styles.navigateButton, !paymentReleased && styles.disabledButton]}
                activeOpacity={0.7}
                onPress={() => {
                  if (!paymentReleased) {
                    Alert.alert("⏳ Waiting for Payment", "Please wait until payment is released or held.");
                    return;
                  }
                  if (!driverId || !shipmentId) {
                    Alert.alert("Navigation Error", "Driver ID or Shipment ID is missing.");
                    return;
                  }
                  navigation.navigate("DriverTracking", { driverId, shipmentId });
                }}
              >
                <Text style={styles.buttonText}>🚗 Navigate to Pickup</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 10,
    textAlign: "center",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    width: "90%",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 6,
    lineHeight: 22,
    textAlign: "left",
  },
  bold: {
    fontWeight: "bold",
    color: "#222",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f1f3f4",
  },
  acceptButton: {
    backgroundColor: "#28a745",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    elevation: 5,
    width: "80%",
    marginTop: 20,
    shadowColor: "#28a745",
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  navigateButton: {
    backgroundColor: "#007bff",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    elevation: 5,
    width: "80%",
    marginTop: 20,
    shadowColor: "#007bff",
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    width: "80%",
    marginTop: 20,
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    marginTop: 10,
  },
});

export default DriverShipmentDetails;
