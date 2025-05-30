import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOMTOM_API_KEY = "mFUHenY06q5J3JhxjygEHatnLVHvnN6B"; // Replace with your actual TomTom API Key

const ShipmentTrack = ({ route }) => {
  const { driverId, shipmentId, transporterId } = route.params || {};

  const [driverCoords, setDriverCoords] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [travelInfo, setTravelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);

  useEffect(() => {
    fetchShipmentDetails();
  }, []);

  // Fetch Shipment Details (Pickup and Drop locations)
  const fetchShipmentDetails = async () => {
    try {
      const shipmentResponse = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/${shipmentId}`);
      if (!shipmentResponse.ok) throw new Error("Failed to fetch shipment details.");
      
      const shipmentData = await shipmentResponse.json();
      console.log("📦 Shipment Data:", shipmentData);

      // Get pickup and drop-off coordinates
      const pickupLocation = {
        latitude: parseFloat(shipmentData.pickupLatitude),
        longitude: parseFloat(shipmentData.pickupLongitude),
      };

      const dropLocation = {
        latitude: parseFloat(shipmentData.droppingLatitude),
        longitude: parseFloat(shipmentData.droppingLongitude),
      };

      if (!pickupLocation.latitude || !pickupLocation.longitude || !dropLocation.latitude || !dropLocation.longitude) {
        throw new Error("Invalid pickup or drop coordinates.");
      }

      setPickupCoords(pickupLocation);
      setDropCoords(dropLocation);
      fetchDriverLocation(pickupLocation, dropLocation);
    } catch (error) {
      console.error("❌ Shipment Fetch Error:", error.message);
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  // Fetch Driver's Live Location
  const fetchDriverLocation = async (pickupLocation, dropLocation) => {
    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/getDriverDetails/${driverId}`);
      if (!response.ok) throw new Error("Failed to fetch driver location.");
      
      const driverData = await response.json();
      const driverLocation = {
        latitude: parseFloat(driverData.driverLatitude),
        longitude: parseFloat(driverData.driverLongitude),
      };

      if (!driverLocation.latitude || !driverLocation.longitude) {
        throw new Error("Invalid driver coordinates.");
      }

      setDriverCoords(driverLocation);
      fetchRoute(driverLocation, dropLocation);
    } catch (error) {
      console.error("❌ Driver Location Fetch Error:", error.message);
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  // Fetch Route from Driver to Drop-off using TomTom API
  const fetchRoute = async (origin, destination) => {
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}/json?key=${TOMTOM_API_KEY}&travelMode=car&traffic=false`;
      console.log("TomTom API URL:", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error("TomTom API Error");

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) throw new Error("No route found.");

      // Extract Route Coordinates
      const routePoints = data.routes[0].legs[0].points.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      }));

      // Get Estimated Time & Distance
      setTravelInfo({
        time: (data.routes[0].summary.travelTimeInSeconds / 60).toFixed(1) + " mins",
        distance: (data.routes[0].summary.lengthInMeters / 1000).toFixed(2) + " km",
      });

      setRouteCoords(routePoints);
      setLoading(false);
    } catch (error) {
      console.error("❌ Route Fetch Error:", error.message);
      Alert.alert("Route Error", error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: driverCoords.latitude,
            longitude: driverCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Driver's Location Marker */}
          {driverCoords && (
            <Marker coordinate={driverCoords} title="Driver Location" pinColor="blue" />
          )}

          {/* Pickup Location Marker */}
          {pickupCoords && (
            <Marker coordinate={pickupCoords} title="Pickup Location" pinColor="green" />
          )}

          {/* Drop-Off Location Marker */}
          {dropCoords && (
            <Marker coordinate={dropCoords} title="Drop-Off Location" pinColor="red" />
          )}

          {/* Route Path */}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeColor="blue" strokeWidth={4} />
          )}
        </MapView>
      )}
      
      {/* Display Estimated Time & Distance */}
      {travelInfo && (
        <View style={styles.travelInfo}>
          <Text style={styles.infoText}>🚗 Estimated Time: {travelInfo.time}</Text>
          <Text style={styles.infoText}>📏 Distance: {travelInfo.distance}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  travelInfo: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default ShipmentTrack;
