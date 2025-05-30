// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, FlatList, StyleSheet,ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import { useNavigation } from '@react-navigation/native';

// // Define a Shipment Card Component
// const ShipmentCard = ({ shipment }) => {
//   const navigation = useNavigation();

//   const handleViewDetails = () => {
//     navigation.navigate('ShipmentDetails', { shipmentId: shipment.shipmentId });
//   };
//   return (
//     <View style={styles.card}>
//       <Text style={styles.title}>{shipment.cargoType}</Text>
//       <Text>Status: {shipment.shipmentStatus}</Text>
//       <Text>Created At: {new Date(shipment.createdAt).toLocaleDateString()}</Text>
//       {/* <TouchableOpacity style={styles.button} onPress={() => alert('View Shipment')}> */}
//       <TouchableOpacity style={styles.button} onPress={handleViewDetails}>
//         <Text style={styles.buttonText}>View Quotations</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// // Define the main component
// const ShipmentQuotation = () => {
//   const [shipments, setShipments] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Fetch shipments when component mounts
//     const fetchShipments = async () => {
//       try {
//         const response = await axios.get('http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/manufacturer/1');
//         setShipments(response.data);
//       } catch (error) {
//         console.error('Error fetching shipments:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchShipments();
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#2196F3" />
//         <Text style={styles.loaderText}>Loading Shipments...</Text>
//       </View>
//     );
//   }
//   if (!shipments) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>No shipment details available.</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Transporters Quotations</Text>
//       <FlatList
//         data={shipments}
//         keyExtractor={(item) => item.shipmentId.toString()}
//         renderItem={({ item }) => <ShipmentCard shipment={item} />}
//       />
//     </View>
//   );
// };

// // Styles
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   card: {
//     backgroundColor: '#fff',
//     padding: 15,
//     marginBottom: 10,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   button: {
//     backgroundColor: '#2196F3',
//     padding: 10,
//     marginTop: 10,
//     borderRadius: 5,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loaderText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#555',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     fontSize: 18,
//     color: 'red',
//   },
// });

// export default ShipmentQuotation;
