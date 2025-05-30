

// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   TextInput,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Icon from "react-native-vector-icons/FontAwesome";

// const DriverShipment = ({ navigation }) => {
//   const [shipmentDetails, setShipmentDetails] = useState([]);
//   const [filteredShipments, setFilteredShipments] = useState([]);
//   const [driverId, setDriverId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState("ALL");
//   const scrollViewRef = useRef(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const storedDriverId = await AsyncStorage.getItem("driverId");
//         if (storedDriverId) {
//           setDriverId(storedDriverId);
//           const response = await fetch(
//             `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/driverShipments/${storedDriverId}`
//           );
//           if (!response.ok) throw new Error("Failed to fetch data.");
//           const data = await response.json();
//           setShipmentDetails(data);
//           setFilteredShipments(data);
//         } else {
//           Alert.alert("Error", "Driver ID not found.");
//         }
//       } catch (error) {
//         Alert.alert("Error", "Failed to load shipments.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const handleStatusClick = (status) => {
//     setSelectedStatus(status);
//     const updatedShipments =
//       status === "ALL"
//         ? shipmentDetails
//         : shipmentDetails.filter((item) => item.assignmentStatus === status);

//     setFilteredShipments(updatedShipments);

//     setTimeout(() => {
//       if (scrollViewRef.current) {
//         scrollViewRef.current.scrollTo({ y: 0, animated: true });
//       }
//     }, 200);
//   };

//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#6200ea" />
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Shipment Requests</Text>

//       <TextInput
//         style={styles.searchBar}
//         placeholder="Search by Shipment ID"
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//         keyboardType="numeric"
//       />

//       {/* Status Cards */}
//       <View style={styles.gridContainer}>
//         {[
//           "ALL",
//           "COMPLETED",
//           "PICKED_UP",
//           "PENDING",
//           "IN_TRANSIT",
//           "ACCEPTED",
//         ].map((status, index) => (
//           <TouchableOpacity
//             key={index}
//             style={[
//               styles.statusCard,
//               selectedStatus === status && styles.activeCard,
//             ]}
//             onPress={() => handleStatusClick(status)}
//           >
//             <Text
//               style={[
//                 styles.statusText,
//                 selectedStatus === status && styles.activeText,
//               ]}
//             >
//               {status}
//             </Text>
//             <TouchableOpacity
//               style={styles.arrowCircle}
//               onPress={() => handleStatusClick(status)}
//             >
//               <Text style={styles.arrowSymbol}>›</Text>
//             </TouchableOpacity>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Shipment List */}
//       <ScrollView
//         ref={scrollViewRef}
//         contentContainerStyle={styles.scrollContainer}
//         style={{ flex: 1, marginTop: 10 }}
//       >
//         {filteredShipments.length > 0 ? (
//           filteredShipments.map((item, index) => (
//             <View key={index} style={styles.card}>
//               <Text style={styles.detailText}>
//                 <Icon name="barcode" size={16} color="#006400" />{" "}
//                 <Text style={styles.bold}>Shipment ID:</Text>{" "}
//                 {item.shipment?.shipmentId || "N/A"}
//               </Text>
//               <Text style={styles.detailText}>
//                 <Icon name="map-marker" size={16} color="#d9534f" />{" "}
//                 <Text style={styles.bold}>Pick-up Location:</Text>{" "}
//                 {item.shipment?.pickupPoint || "N/A"}
//               </Text>
//               <Text style={styles.detailText}>
//                 <Icon name="truck" size={16} color="#d9534f" />{" "}
//                 <Text style={styles.bold}>Drop Location:</Text>{" "}
//                 {item.shipment?.dropPoint || "N/A"}
//               </Text>
//               <Text style={styles.detailText}>
//                 <Icon name="archive" size={16} color="#00796B" />{" "}
//                 <Text style={styles.bold}>Cargo Type:</Text>{" "}
//                 {item.shipment?.cargoType || "N/A"}
//               </Text>
//               <Text style={styles.statusText}>
//                 <Icon name="info-circle" size={16} color="#FF0000" />{" "}
//                 <Text style={styles.bold}>Status:</Text>{" "}
//                 {item.assignmentStatus || "N/A"}
//               </Text>
//               <TouchableOpacity
//                 style={styles.viewMoreButton}
//                 onPress={() =>
//                   navigation.navigate("DriverShipmentDetails", {
//                     shipment: item.shipment,
//                     transporter: item.transporter,
//                     assignmentId: item.assignmentId,
//                     driverId,
//                   })
//                 }
//               >
//                 <Text style={styles.viewMoreText}>View More</Text>
//               </TouchableOpacity>
//             </View>
//           ))
//         ) : (
//           <View style={styles.noShipmentsContainer}>
//             <Text style={styles.noShipmentsText}>
//               No shipments found for the selected status.
//             </Text>
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#f3f2f8",
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#006400",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   searchBar: {
//     height: 45,
//     borderWidth: 1,
//     borderColor: "#6200ea",
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     backgroundColor: "#fff",
//     marginBottom: 15,
//   },

//   gridContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//     rowGap: 12,
//     columnGap: 10,
//     paddingHorizontal: 10,
//   },
//   statusCard: {
//     width: "30%",
//     borderRadius: 18,
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     backgroundColor: "#fff",
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
 
//   statusText: {
//     fontSize: 13,
//     fontWeight: "bold",
//     color: "523b50",
//   },
//   activeText: {
//     color: "#000",
//   },
//   arrowCircle: {
//     width: 26,
//     height: 26,
//     borderRadius: 13,
//     backgroundColor: "#8ea9fa", // Your blue shade
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 0,
//     margin: 0,
//   },
  
//   arrowSymbol: {
//     color: "#fff",
//     fontSize: 16,         // ⬅ Reduced from 20 to center better
//     fontWeight: "bold",
//     lineHeight: 18,       // ⬅ Helps center vertically
//     textAlign: "center",  // ⬅ Ensures horizontal centering
//   },
  
//   scrollContainer: {
//     flexGrow: 1,
//     paddingBottom: 20,
//     alignItems: "center",
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 15,
//     padding: 12,
//     marginBottom: 8,
//     width: "90%",
//     borderWidth: 2,
//     borderColor: "#cccccc",
//     shadowOpacity: 0.2,
//     shadowOffset: { width: 1, height: 2 },
//     shadowRadius: 4,
//     elevation: 2,
//     alignSelf: "center",
//   },
//   viewMoreButton: {
//     marginTop: 6,
//     backgroundColor: "#FFA500",
//     borderRadius: 20,
//     paddingVertical: 8,
//     alignItems: "center",
//   },
//   viewMoreText: {
//     color: "#FFFFFF",
//     fontWeight: "bold",
//     fontSize: 14,
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   detailText: {
//     marginBottom: 5,
//   },
//   bold: {
//     fontWeight: "bold",
//   },
//   statusTextShipment: {
//     marginTop: 4,
//   },
//   noShipmentsContainer: {
//     padding: 20,
//   },
//   noShipmentsText: {
//     color: "#888",
//     fontStyle: "italic",
//   },
// });





// export default DriverShipment;






import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/FontAwesome";

const DriverShipment = ({ navigation }) => {
  const [shipmentDetails, setShipmentDetails] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem("driverId");
        if (storedDriverId) {
          setDriverId(storedDriverId);
          const response = await fetch(
            `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/driverShipments/${storedDriverId}`
          );
          if (!response.ok) throw new Error("Failed to fetch data.");
          const data = await response.json();
          setShipmentDetails(data);
          setFilteredShipments(data);
        } else {
          Alert.alert("Error", "Driver ID not found.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load shipments.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    const updatedShipments =
      status === "ALL"
        ? shipmentDetails
        : shipmentDetails.filter((item) => item.assignmentStatus === status);

    setFilteredShipments(updatedShipments);

    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }, 200);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shipment Requests</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search by Shipment ID"
        value={searchQuery}
        onChangeText={setSearchQuery}
        keyboardType="numeric"
      />

      {/* Dropdown instead of status cards */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedStatus}
          onValueChange={(itemValue) => handleStatusClick(itemValue)}
          mode="dropdown"
          style={styles.picker}
        >
          <Picker.Item label="ALL" value="ALL" />
          <Picker.Item label="COMPLETED" value="COMPLETED" />
          <Picker.Item label="PICKED UP" value="PICKED_UP" />
          <Picker.Item label="PENDING" value="PENDING" />
          <Picker.Item label="IN TRANSIT" value="IN_TRANSIT" />
          <Picker.Item label="ACCEPTED" value="ACCEPTED" />
        </Picker>
      </View>

      {/* Shipment List */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        style={{ flex: 1, marginTop: 10 }}
      >
        {filteredShipments.length > 0 ? (
          filteredShipments.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.detailText}>
                <Icon name="barcode" size={16} color="#006400" />{" "}
                <Text style={styles.bold}>Shipment ID:</Text>{" "}
                {item.shipment?.shipmentId || "N/A"}
              </Text>
              <Text style={styles.detailText}>
                <Icon name="map-marker" size={16} color="#d9534f" />{" "}
                <Text style={styles.bold}>Pick-up Location:</Text>{" "}
                {item.shipment?.pickupPoint || "N/A"}
              </Text>
              <Text style={styles.detailText}>
                <Icon name="truck" size={16} color="#d9534f" />{" "}
                <Text style={styles.bold}>Drop Location:</Text>{" "}
                {item.shipment?.dropPoint || "N/A"}
              </Text>
              <Text style={styles.detailText}>
                <Icon name="archive" size={16} color="#00796B" />{" "}
                <Text style={styles.bold}>Cargo Type:</Text>{" "}
                {item.shipment?.cargoType || "N/A"}
              </Text>
              <Text style={styles.statusText}>
                <Icon name="info-circle" size={16} color="#FF0000" />{" "}
                <Text style={styles.bold}>Status:</Text>{" "}
                {item.assignmentStatus || "N/A"}
              </Text>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() =>
                  navigation.navigate("DriverShipmentDetails", {
                    shipment: item.shipment,
                    transporter: item.transporter,
                    assignmentId: item.assignmentId,
                    driverId,
                  })
                }
              >
                <Text style={styles.viewMoreText}>View More</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.noShipmentsContainer}>
            <Text style={styles.noShipmentsText}>
              No shipments found for the selected status.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f3f2f8",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#006400",
    marginBottom: 10,
    textAlign: "center",
  },
  searchBar: {
    height: 45,
    borderWidth: 1.5,
    borderColor: "#6200ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },

  dropdown: {
    height: 45,
    borderColor: "#6200ea",
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  dropdownContainer: {
    borderColor: "#6200ea",
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: "#fff",
    zIndex: 1000,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 12,
    marginBottom: 8,
    width: "90%",
    borderWidth: 2,
    borderColor: "#cccccc",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center",
  },
  viewMoreButton: {
    marginTop: 6,
    backgroundColor: "#FFA500",
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: "center",
  },
  viewMoreText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  detailText: {
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  statusTextShipment: {
    marginTop: 4,
  },
  noShipmentsContainer: {
    padding: 20,
  },
  noShipmentsText: {
    color: "#888",
    fontStyle: "italic",
  },
});


export default DriverShipment;
