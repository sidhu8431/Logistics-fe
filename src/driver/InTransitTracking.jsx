import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { getDistance } from 'geolib';


const TOMTOM_API_KEY = "1uJKbI1Dykg7mPpdFQZA4tF7Ss7fHQp9";

const InTransitTracking = ({ route, navigation }) => {
  const { driverId, shipmentId } = route.params || {};

  const [driverCoords, setDriverCoords] = useState(null);
  const [dropOffCoords, setDropOffCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [fuelStations, setFuelStations] = useState([]);
  const [atDropOff, setAtDropOff] = useState(false);
  const [trackingStarted, setTrackingStarted] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState(null);
  const [travelInfo, setTravelInfo] = useState(null);
  const [tripCompleted, setTripCompleted] = useState(false);



  const mapRef = useRef(null);
  const trackingInterval = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      restoreTrackingState();
      fetchCoordinates();
    }, [])
  );

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (driverCoords) {
      fetchFuelStations(driverCoords.latitude, driverCoords.longitude);
      fetchTrafficData(driverCoords.latitude, driverCoords.longitude);
    }
  }, [driverCoords]);
  

  useEffect(() => {
    if (driverCoords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverCoords.latitude,
        longitude: driverCoords.longitude,
        latitudeDelta: 0.02, // Controls zoom level
        longitudeDelta: 0.02,
      });
      console.log("📍 Centering map on driver's location:", driverCoords);
    }
  }, [driverCoords]);
  

  const restoreTrackingState = async () => {
    try {
      console.log("🔄 Restoring previous tracking state...");
      const savedDriverCoords = await AsyncStorage.getItem(`driverCoords-${shipmentId}`);
      const savedDropOffCoords = await AsyncStorage.getItem(`dropOffCoords-${shipmentId}`);
      const savedRouteCoords = await AsyncStorage.getItem(`routeCoords-${shipmentId}`);

      if (savedDriverCoords) setDriverCoords(JSON.parse(savedDriverCoords));
      if (savedDropOffCoords) setDropOffCoords(JSON.parse(savedDropOffCoords));
      if (savedRouteCoords) setRouteCoords(JSON.parse(savedRouteCoords));
    } catch (error) {
      console.error("❌ Error restoring tracking state:", error);
    }
  };
  const fetchDriverLocation = async () => {
    try {
      console.log("🚗 Fetching driver location...");
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/getDriverDetails/${driverId}`);
      
      if (!response.ok) {
        throw new Error(`❌ Failed to fetch driver location. Status: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (!data.driverLatitude || !data.driverLongitude) {
        throw new Error("❌ Missing latitude/longitude in API response.");
      }
  
      return {
        latitude: parseFloat(data.driverLatitude),
        longitude: parseFloat(data.driverLongitude),
      };
    } catch (error) {
      console.error("❌ Driver Location Fetch Error:", error.message);
      Alert.alert("Error", "Failed to retrieve driver location.");
      return null;
    }
  };
  
  console.log("🚗 Driver Coordinates:", driverCoords);
  console.log("📌 Drop-Off Coordinates:", dropOffCoords);
  
  const fetchCoordinates = async () => {
    try {
      if (!driverId || !shipmentId) {
        throw new Error("Missing driver or shipment ID.");
      }
  
      const driverLocation = await fetchDriverLocation();
      if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
        throw new Error("❌ Driver location not found.");
      }
  
      console.log("🚗 Driver Location:", driverLocation);
  
      const shipmentResponse = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/${shipmentId}`);
      if (!shipmentResponse.ok) throw new Error("❌ Failed to fetch shipment details.");
  
      const shipmentData = await shipmentResponse.json();
      console.log("📦 Shipment Data:", shipmentData);
  
      const dropLocation = {
        latitude: parseFloat(shipmentData.droppingLatitude),
        longitude: parseFloat(shipmentData.droppingLongitude),
      };
  
      if (!dropLocation.latitude || !dropLocation.longitude || isNaN(dropLocation.latitude) || isNaN(dropLocation.longitude)) {
        throw new Error("❌ Invalid drop-off coordinates received.");
      }
  
      setDriverCoords(driverLocation);
      setDropOffCoords(dropLocation);
      setShipmentDetails(shipmentData);
  
      console.log("📌 Drop-Off Location:", dropLocation);
  
      if (driverLocation.latitude && driverLocation.longitude && dropLocation.latitude && dropLocation.longitude) {
        await fetchRoute(driverLocation, dropLocation);
      } else {
        console.error("🚨 Skipping route fetch due to missing coordinates.");
      }
    } catch (error) {
      console.error("❌ Fetch Coordinates Error:", error.message);
      Alert.alert("Error", error.message || "Failed to retrieve shipment details.");
    }
  };
  
  
  
  const fetchRoute = async (origin, destination) => {
  try {
    if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
      console.error("🚨 Missing or invalid coordinates:", origin, destination);
      throw new Error("Missing origin or destination coordinates.");
    }

    console.log("🛣️ Fetching route from", origin.latitude, origin.longitude, "to", destination.latitude, destination.longitude);

    const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}/json?key=${TOMTOM_API_KEY}&travelMode=car&traffic=false`;

    console.log("TomTom API URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      console.error("TomTom API Response:", response.statusText);
      throw new Error(`TomTom API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("📍 Route Data:", data);

    if (!data.routes || data.routes.length === 0) throw new Error("No route found.");

    const routePoints = data.routes[0].legs[0].points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

    setRouteCoords(routePoints);
    setTravelInfo({
      time: (data.routes[0].summary.travelTimeInSeconds / 60).toFixed(1) + " mins",
      distance: (data.routes[0].summary.lengthInMeters / 1000).toFixed(2) + " km",
    });

    console.log("🛤️ Route Coordinates:", routePoints);
  } catch (error) {
    console.error("❌ Route Fetch Error:", error.message);
    Alert.alert("Route Error", error.message || "Failed to fetch route.");
  }
};


  
  const fetchFuelStations = async (latitude, longitude) => {
    try {
      console.log("⛽ Fetching Fuel Stations...");
      const url = `https://api.tomtom.com/search/2/poiSearch/fuel.json?key=${TOMTOM_API_KEY}&lat=${latitude}&lon=${longitude}&radius=5000&categorySet=7311`;
  
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fuel API Error: ${response.status}`);
  
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new Error("No fuel stations found.");
      }
  
      const stations = data.results.map((station) => ({
        id: station.id,
        name: station.poi.name,
        latitude: station.position.lat,
        longitude: station.position.lon,
        distance: station.dist, // Distance from driver
      }));
  
      setFuelStations(stations);
      console.log("✅ Updated Fuel Stations:", stations);
    } catch (error) {
      console.error("❌ Fuel API Error:", error.message);
    }
  };
  
  
  const fetchTrafficData = async (latitude, longitude) => {
    try {
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${TOMTOM_API_KEY}&point=${latitude},${longitude}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log("🚦 Traffic Data:", data);
    } catch (error) {
      console.error("Traffic API Error:", error);
    }
  };

  const startTracking = async () => {
    if (trackingStarted) return;

    setTrackingStarted(true);
    let lastFetchedLocation = null; // Store last fetched location to avoid redundant API calls

    trackingInterval.current = setInterval(async () => {
        const newDriverLocation = await fetchDriverLocation();
        if (!newDriverLocation || !newDriverLocation.latitude || !newDriverLocation.longitude) return;

        setDriverCoords(newDriverLocation);
        storeLocationHistory(newDriverLocation);
        checkGeofencing(newDriverLocation);

        // Fetch fuel stations only if driver has moved significantly (500m+)
        if (
            !lastFetchedLocation ||
            getDistance(lastFetchedLocation, newDriverLocation) > 500
        ) {
            fetchFuelStations(newDriverLocation.latitude, newDriverLocation.longitude);
            lastFetchedLocation = newDriverLocation;
        }
    }, 5000); // Update every 5 seconds
};


  const stopTracking = () => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
  };

  const storeLocationHistory = async (location) => {
    try {
      let history = await AsyncStorage.getItem(`locationHistory-${shipmentId}`);
      history = history ? JSON.parse(history) : [];
      history.push(location);
      await AsyncStorage.setItem(`locationHistory-${shipmentId}`, JSON.stringify(history));
    } catch (error) {
      console.error("Error storing location history:", error);
    }
  };

  const checkGeofencing = async (location) => {
    if (!dropOffCoords) return; // Prevent errors if dropOffCoords is missing
  
    const radius = 500;
    const distance = getDistance(location, dropOffCoords);
    if (distance < radius) {
      sendNotification("🚛 Your shipment is arriving soon!");
      Alert.alert("🚀 Geofence Alert", "Driver is near the drop-off location!");
    }
  };

  const completeTrip = async () => {
    try {
      const url = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/${shipmentId}/status/DELIVERED`;
      const response = await fetch(url, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to update shipment status.");
      }

      Alert.alert("Success", "Shipment marked as Delivered!");
      setTripCompleted(true);

      // Navigate to CompletedTrips screen after a short delay
      setTimeout(() => {
        navigation.navigate("CompletedTrips");
      }, 1000);
    } catch (error) {
      console.error("❌ Shipment Update Error:", error.message);
      Alert.alert("Error", error.message || "Failed to update shipment status.");
    }
  };
  

  const sendNotification = async (message) => {
    console.log("🚀 Notification sent:", message);
  };

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
      <MapView
  ref={mapRef}
  style={styles.map}
  region={
    driverCoords && dropOffCoords
      ? {
          latitude: driverCoords.latitude,
          longitude: driverCoords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : undefined
  }
  showsUserLocation={true}
  showsMyLocationButton={true}
>
  {/* Driver Location Marker */}
  {driverCoords && (
    <Marker coordinate={driverCoords} title="Driver Location" pinColor="blue" />
  )}

  {/* Drop-Off Location Marker */}
  {dropOffCoords && (
    <Marker coordinate={dropOffCoords} title="Drop-Off Location" pinColor="red" />
  )}

  {/* Route Path Display */}
  {routeCoords.length > 0 && (
    <Polyline coordinates={routeCoords} strokeColor="blue" strokeWidth={4} />
  )}

  {/* Fuel Stations Markers */}
  {fuelStations.length > 0 &&
    fuelStations.map((station) => (
      <Marker
        key={station.id}
        coordinate={{ latitude: station.latitude, longitude: station.longitude }}
        title={station.name}
        pinColor="orange"
      />
    ))}
</MapView>


      </View>
  
      {/* Details Container */}
      <View style={styles.detailsContainer}>
  <Text style={styles.successMessage}>✅ Successfully Picked Up, On The Way to Destination</Text>

  {/* Shipment Details */}
  {shipmentDetails ? (
    <ScrollView contentContainerStyle={styles.shipmentInfo}>
      <Text style={styles.detailText}>📍 Drop-Off: {shipmentDetails.dropPoint || "N/A"}</Text>
      {/* Format Drop Date & Time */}
<Text style={styles.detailText}>
  📅 Drop Date: {shipmentDetails.deliveryDate ? new Date(shipmentDetails.deliveryDate).toLocaleDateString() : "N/A"}
</Text>
<Text style={styles.detailText}>
  ⏰ Drop Time: {shipmentDetails.deliveryDate ? new Date(shipmentDetails.deliveryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
</Text>
    </ScrollView>
  ) : (
    <Text style={styles.errorText}>❌ Shipment details not available.</Text>
  )}

  {/* Upcoming Fuel Stations */}
  {/* Fuel Stations List (Dynamically Updates) */}
{fuelStations.length > 0 ? (
  <View style={styles.fuelStationContainer}>
    <Text style={styles.fuelStationTitle}>⛽ Nearest Fuel Stations:</Text>
    {fuelStations.slice(0, 3).map((station) => (
      <Text key={station.id} style={styles.fuelStationText}>
        🔹 {station.name} - {station.distance ? `${station.distance.toFixed(1)} meters` : "N/A"}
      </Text>
    ))}
  </View>
) : (
  <Text style={styles.errorText}>⛽ No nearby fuel stations found.</Text>
)}

{/* Start Navigation or Complete Trip Button */}
{!trackingStarted ? (
  <TouchableOpacity style={styles.startButton} onPress={startTracking}>
    <Text style={styles.startButtonText}>Start Navigation</Text>
  </TouchableOpacity>
) : !tripCompleted ? (
  <TouchableOpacity
    style={atDropOff ? styles.completeButton : styles.disabledButton}
    disabled={!atDropOff}
    onPress={completeTrip}
  >
    <Text style={styles.startButtonText}>Complete Trip</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity style={styles.goToCompletedButton} onPress={() => navigation.navigate("CompletedTrips")}>
    <Text style={styles.startButtonText}>Go to Completed Shipments</Text>
  </TouchableOpacity>
)}

</View>
 
    </View>
  );
}  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light background for better visibility
  },
  
  mapContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  map: {
    flex: 1,
  },

  detailsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // For Android shadow effect
  },

  successMessage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
    textAlign: "center",
    marginBottom: 10,
  },

  shipmentInfo: {
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f1f3f4",
    padding: 10,
    borderRadius: 10,
  },

  detailText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
    fontWeight: "500",
  },

  dropDateTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff5733",
    textAlign: "center",
    marginTop: 5,
  },

  routeInfo: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#e9ecef",
    borderRadius: 10,
    alignItems: "center",
  },

  routeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
  },

  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    fontWeight: "bold",
  },

  startButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#007bff",
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },

  completeButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#28a745",
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },

  disabledButton: {
    backgroundColor: "#6c757d",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    opacity: 0.6,
  },

  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  evMarker: {
    backgroundColor: "green",
    borderRadius: 10,
    padding: 5,
  },

  markerIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  markerText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default InTransitTracking;


















