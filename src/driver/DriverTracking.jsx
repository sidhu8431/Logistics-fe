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


const TOMTOM_API_KEY = "1uJKbI1Dykg7mPpdFQZA4tF7Ss7fHQp9";

const DriverTracking = ({ route, navigation }) => {
  const { driverId, shipmentId } = route.params || {};

  const [driverCoords, setDriverCoords] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [atPickup, setAtPickup] = useState(false);
  const [trackingStarted, setTrackingStarted] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState(null);
  const [fuelStations, setFuelStations] = useState([]);
  const [eta, setETA] = useState("Loading...");
  const [isExpanded, setIsExpanded] = useState(false); // ✅ Toggle for map expansion
  const [trafficInfo, setTrafficInfo] = useState(null);
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [pickedUp, setPickedUp] = useState(false);




  const mapRef = useRef(null);
  const trackingInterval = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      restoreTrackingState();
      fetchCoordinates();
    }, [])
  );
  useEffect(() => {
    const checkPickupStatus = async () => {
      try {
        const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/${shipmentId}/driver/${driverId}`);
        if (!response.ok) throw new Error("Failed to fetch shipment status");
  
        const data = await response.json();
        if (data.assignmentStatus === "PICKED_UP") {
          setPickedUp(true);
        } else {
          setPickedUp(false);
        }
      } catch (error) {
        console.error("Error fetching assignment status:", error);
      }
    };
  
    checkPickupStatus();
  }, [shipmentId, driverId]);  // Runs whenever shipmentId or driverId changes
  

  useEffect(() => {
    if (driverCoords) {
      fetchTrafficData(driverCoords.latitude, driverCoords.longitude);
      fetchNearbyPOIs(driverCoords.latitude, driverCoords.longitude, "restaurant"); // Example: Fetching nearby restaurants
    }
  }, [driverCoords]); // Runs only when driverCoords change
  

  useEffect(() => {
    return () => stopTracking();
  }, []);

  useEffect(() => {
    if (driverCoords && pickupCoords) {
      fetchETA(driverCoords, pickupCoords);
      fetchFuelStations(driverCoords.latitude, driverCoords.longitude);
    }
  }, [driverCoords, pickupCoords]);

  useEffect(() => {
    console.log("📌 Updated driverCoords:", driverCoords);
}, [driverCoords]);

useEffect(() => {
  fetchAssignmentStatus();
}, [shipmentId, driverId]);

  useEffect(() => {
    if (driverCoords && pickupCoords) {
        console.log("📌 Updating Markers & Route...");
        fetchRoute(driverCoords, pickupCoords);
        mapRef.current?.animateToRegion({
            latitude: driverCoords.latitude,
            longitude: driverCoords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    }
}, [driverCoords, pickupCoords]);
useEffect(() => {
  const fetchAndUpdateLocation = async () => {
      const backendLocation = await fetchDriverLocation();
      if (backendLocation) {
          setDriverCoords(backendLocation);
      }
  };
  fetchAndUpdateLocation();
}, []);  // ✅ Runs only on first load

useEffect(() => {
  if (driverCoords && pickupCoords) {
    fetchRoute(driverCoords, pickupCoords);
    checkProximity(driverCoords.latitude, driverCoords.longitude);
  }
}, [checkProximity, driverCoords, pickupCoords]);


  // ✅ Restore previous tracking state
  const restoreTrackingState = async () => {
    try {
        console.log("🔄 Restoring tracking state from backend...");
        
        // ✅ Always fetch fresh location from backend
        const backendDriverCoords = await fetchDriverLocation(); 
        if (backendDriverCoords) {
            setDriverCoords(backendDriverCoords);
        }

        const savedPickupCoords = await AsyncStorage.getItem("pickupCoords");
        if (savedPickupCoords) {
            setPickupCoords(JSON.parse(savedPickupCoords));
        }

        if (backendDriverCoords && pickupCoords) {
            await fetchRoute(backendDriverCoords, pickupCoords);
        }
    } catch (error) {
        console.error("❌ Error restoring tracking state:", error);
    }
};

  const fetchCoordinates = async () => {
    try {
      if (!driverId || !shipmentId) throw new Error("Missing IDs.");

      const driverLocation = await fetchDriverLocation();
      if (!driverLocation) throw new Error("Driver location not found.");

      const shipmentResponse = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/${shipmentId}`);
      if (!shipmentResponse.ok) throw new Error("Failed to fetch shipment details.");

      const shipmentData = await shipmentResponse.json();
      const pickupLocation = {
        latitude: parseFloat(shipmentData.pickupLatitude),
        longitude: parseFloat(shipmentData.pickupLongitude),
      };

      setPickupCoords(pickupLocation);
      setDriverCoords(driverLocation);
      setShipmentDetails(shipmentData);
    } catch (error) {
      console.error("❌ Error fetching data:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  

  // ✅ Fetch driver location
 const fetchDriverLocation = async () => {
    try {
      console.log("🚗 Fetching driver location...");
      if (!driverId) throw new Error("❌ Driver ID missing.");

      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/getDriverDetails/${driverId}`);
      if (!response.ok) throw new Error("Failed to fetch driver location.");

      const data = await response.json();
      if (!data.driverLatitude || !data.driverLongitude) {
        throw new Error("❌ Invalid location data.");
      }

      const location = {
        latitude: parseFloat(data.driverLatitude),
        longitude: parseFloat(data.driverLongitude),
      };

      setDriverCoords(location);
      checkProximity(location.latitude, location.longitude);
      return location;
    } catch (error) {
      console.error("❌ Driver Location Error:", error.message);
      return null;
    }
  };
const checkProximity = (lat, lon) => {
    if (!pickupCoords) return;

    const distance = calculateDistance(lat, lon, pickupCoords.latitude, pickupCoords.longitude);
    console.log(`📍 Distance to Pickup: ${distance.toFixed(2)} meters`);

    if (distance <= 500) {
      setAtPickup(true);
    } else {
      setAtPickup(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };



  // ✅ Fetch and draw route
  const fetchRoute = async (origin, destination) => {
    try {
        if (!origin || !destination) throw new Error("❌ Missing coordinates.");

        console.log("🛣️ Fetching route from", origin, "to", destination);

        const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}/json?key=${TOMTOM_API_KEY}&travelMode=car&computeTravelTimeFor=all`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`❌ Route Fetch Failed - HTTP ${response.status}`);
            return;
        }

        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
            throw new Error("❌ No valid route found.");
        }

        const routePoints = data.routes[0].legs[0]?.points?.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
        }));

        if (!routePoints || routePoints.length === 0) {
            throw new Error("❌ Route contains no valid points.");
        }

        setRouteCoords(routePoints);
        console.log("🛣️ Route Updated - Total Points:", routePoints.length);
    } catch (error) {
        console.error("❌ Route Fetch Error:", error.message);
        setRouteCoords([]);  // Prevents Polyline crash
    }
};


  const fetchFuelStations = async (latitude, longitude) => {
    try {
      const url = `https://api.tomtom.com/search/2/poiSearch/fuel.json?key=${TOMTOM_API_KEY}&lat=${latitude}&lon=${longitude}&radius=5000&categorySet=7311`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch fuel stations.");

      const data = await response.json();
      const stations = data.results.map((station) => ({
        id: station.id,
        name: station.poi.name,
        latitude: station.position.lat,
        longitude: station.position.lon,
        distance: station.dist,
      }));

      setFuelStations(stations);
    } catch (error) {
      console.error("❌ Fuel API Error:", error.message);
    }
  };
  

  // ✅ Start tracking location
  const startTracking = async () => {
    if (trackingStarted) return;

    console.log("🚀 Starting real-time tracking...");
    setTrackingStarted(true);
    await AsyncStorage.setItem("trackingStarted", "true");

    trackingInterval.current = setInterval(async () => {
        try {
            const newDriverLocation = await fetchDriverLocation(); // ✅ Fetch live location from backend
            if (!newDriverLocation) {
                console.warn("⚠️ No valid driver location found.");
                return;
            }

            setDriverCoords(newDriverLocation);
            await AsyncStorage.setItem("driverCoords", JSON.stringify(newDriverLocation));

            if (!pickupCoords) {
                console.warn("⚠️ No pickup location set.");
                return;
            }

            // ✅ Fetch route only if the location has changed
            const distanceMoved = calculateDistance(
                newDriverLocation.latitude,
                newDriverLocation.longitude,
                driverCoords?.latitude || 0,
                driverCoords?.longitude || 0
            );

            if (distanceMoved > 10) { // Update only if the driver moves significantly
                console.log("📍 Fetching new route...");
                const routeSuccess = await fetchRoute(newDriverLocation, pickupCoords);
                if (!routeSuccess) {
                    console.error("❌ Route update failed.");
                }
            }

            // ✅ Update ETA dynamically
            await fetchETA(newDriverLocation, pickupCoords);

            // ✅ Check if the driver is near the pickup location
            checkProximity(newDriverLocation.latitude, newDriverLocation.longitude);

            // ✅ Fetch live traffic updates
            fetchTrafficData(newDriverLocation.latitude, newDriverLocation.longitude);

            // ✅ Fetch nearby fuel stations and restaurants dynamically
            fetchFuelStations(newDriverLocation.latitude, newDriverLocation.longitude);
            fetchNearbyPOIs(newDriverLocation.latitude, newDriverLocation.longitude, "restaurant");

            // ✅ Update map view smoothly
            mapRef.current?.animateToRegion({
                latitude: newDriverLocation.latitude,
                longitude: newDriverLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });

        } catch (error) {
            console.error("❌ Error in startTracking:", error.message);
        }
    }, 5000); // ✅ Fetch updates every 5 seconds
};



  // ✅ Stop tracking
  const stopTracking = () => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    setTrackingStarted(false);
  };
  // ✅ Handle Pickup Shipment Button Click
  const handlePickupShipment = async () => {
    try {
      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/${shipmentId}/driver/${driverId}/pickup`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
  
      if (response.ok) {
        Alert.alert("Success", "Shipment status updated to PICKED_UP!");
        
        // ✅ Update UI to show "Go to Upload Documents" instead of "Pickup Shipment"
        setPickedUp(true);
        await AsyncStorage.setItem(`pickedUp_${shipmentId}`, "true");
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText);
      }
    } catch (error) {
      console.error("❌ Error updating shipment:", error);
      Alert.alert("Error", "Failed to update shipment status.");
    }
  };
  

  const fetchTrafficData = async (latitude, longitude) => {
    try {
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${TOMTOM_API_KEY}&point=${latitude},${longitude}`;
      const response = await fetch(url);
      const data = await response.json();
      setTrafficInfo(`${data.flowSegmentData.currentSpeed} km/h`);
    } catch (error) {
      console.error("🚦 Traffic API Error:", error);
    }
  };

  const fetchNearbyPOIs = async (latitude, longitude, category) => {
    try {
      const url = `https://api.tomtom.com/search/2/search/${category}.json?key=${TOMTOM_API_KEY}&lat=${latitude}&lon=${longitude}&radius=5000`;
      const response = await fetch(url);
      const data = await response.json();
      setNearbyPOIs(data.results.slice(0, 3));
    } catch (error) {
      console.error("📍 POI Fetch Error:", error);
    }
  };

  
  
  const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}: Fetching ${url}`);
            const response = await fetch(url);

            if (response.ok) {
                return await response.json();
            }

            console.warn(`⚠️ Attempt ${attempt} failed with status ${response.status}`);
            await new Promise(res => setTimeout(res, delay)); // Wait before retrying
        } catch (error) {
            console.error("❌ Fetch error:", error);
        }
    }
    console.warn("❌ All attempts failed. Using fallback.");
    return null;
};

  
const fetchETA = async (origin, destination) => {
  try {
      if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
          console.error("🚨 Invalid coordinates for ETA:", origin, destination);
          throw new Error("Invalid coordinates for ETA calculation.");
      }

      console.log("⏳ Fetching ETA from", origin, "to", destination);

      const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}/json?key=${TOMTOM_API_KEY}&travelMode=car&computeTravelTimeFor=all`;

      const response = await fetch(url);
      if (!response.ok) {
          console.error(`❌ Fetch ETA Failed - HTTP ${response.status}`);
          setETA("Unavailable");
          return;
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
          throw new Error("No ETA found.");
      }

      const travelTime = data.routes[0]?.summary?.travelTimeInSeconds;
      if (!travelTime) throw new Error("Travel time unavailable.");

      const hours = Math.floor(travelTime / 3600);
      const minutes = Math.floor((travelTime % 3600) / 60);
      const etaString = `${hours}h ${minutes}m`;

      console.log("🚗 ETA:", etaString);
      setETA(etaString);
  } catch (error) {
      console.error("❌ Fetch ETA Error:", error.message);
      setETA("Unavailable");  // ✅ Prevents app crash
  }
};
 const fetchAssignmentStatus = async () => {
    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/${shipmentId}/driver/${driverId}`);
      if (!response.ok) throw new Error("Failed to fetch assignment status.");

      const data = await response.json();
      console.log("🚛 Assignment Data:", data);
      setAssignmentStatus(data.assignmentStatus);
    } catch (error) {
      console.error("❌ Error fetching assignment status:", error.message);
    }
  };
return (
  <View style={styles.container}>
    {/* 📌 Fixed Map Section */}
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={
          driverCoords && pickupCoords
            ? {
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }
            : {
                latitude: 17.3850, // Default Hyderabad
                longitude: 78.4867,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }
        }
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Driver Marker */}
        {driverCoords && (
          <Marker coordinate={driverCoords} title="Driver Location" pinColor="blue" />
        )}

        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker coordinate={pickupCoords} title="Pickup Location" pinColor="red" />
        )}

        {/* Route Path */}
        {routeCoords.length > 0 && Array.isArray(routeCoords) && (
          <Polyline coordinates={routeCoords} strokeColor="blue" strokeWidth={4} />
        )}

        {/* Fuel Station Markers */}
        {fuelStations.length > 0 &&
          fuelStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              title={station.name}
              description={`Distance: ${station.distance?.toFixed(1)} meters`}
              pinColor="orange"
            />
          ))}
      </MapView>

      {/* 🔹 Expand/Collapse Button */}
      <TouchableOpacity style={styles.expandButton} onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.expandButtonText}>{isExpanded ? "🔽" : "🔼"}</Text>
      </TouchableOpacity>
    </View>

    {/* ✅ Show only "Successfully Picked Up" if pickedUp is true */}
    {pickedUp ? (
      <View style={styles.successContainer}>
        <Text style={styles.successText}>✅ Successfully Picked Up</Text>
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={() => navigation.navigate("ShipmentDocuments", { shipmentId, driverId })}
        >
          <Text style={styles.buttonText}>Go to Upload Documents</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.detailsScroll} nestedScrollEnabled={true}>
        <View style={styles.detailsContainer}>
          <Text style={styles.successMessage}>✅ Enroute to Pickup</Text>

          {/* Shipment Details */}
          {shipmentDetails ? (
            <View style={styles.shipmentInfo}>
              <Text style={styles.detailText}>
                📍 Pickup: {shipmentDetails.pickupPoint && shipmentDetails.pickupPoint.trim() !== "" 
                  ? shipmentDetails.pickupPoint 
                  : `${shipmentDetails.pickupHouseNo || ""} ${shipmentDetails.pickupStreetName || ""}, ${shipmentDetails.pickupTown || ""}`
                }
              </Text>
              <Text style={styles.detailText}>
                📅 Pickup Date: {shipmentDetails.pickupDate ? new Date(shipmentDetails.pickupDate).toLocaleDateString() : "N/A"}
              </Text>
              <Text style={styles.detailText}>
                ⏰ Pickup Time: {shipmentDetails.pickupDate ? new Date(shipmentDetails.pickupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
              </Text>
            </View>
          ) : (
            <Text style={styles.errorText}>❌ Shipment details not available.</Text>
          )}

          {/* Fuel Stations */}
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

          {/* 🚦 Traffic Information */}
          <View style={styles.trafficContainer}>
            <Text style={styles.trafficTitle}>🚦 Traffic Info:</Text>
            <Text style={styles.trafficText}>Current Speed: {trafficInfo || "N/A"}</Text>
          </View>

          {/* 📍 Nearby POIs */}
          {nearbyPOIs.length > 0 ? (
            <View style={styles.poiContainer}>
              <Text style={styles.poiTitle}>📍 Nearby Points of Interest:</Text>
              {nearbyPOIs.map((poi, index) => (
                <Text key={index} style={styles.poiText}>
                  • {poi.poi.name} ({poi.dist.toFixed(1)} meters)
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.errorText}>📍 No nearby POIs found.</Text>
          )}

          {/* 🚗 Estimated Arrival Time */}
          <View style={styles.etaContainer}>
            <Text style={styles.etaText}>
              🚗 Estimated Arrival: {eta || "Unavailable"}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            {!trackingStarted && (
              <TouchableOpacity style={styles.startButton} onPress={startTracking}>
                <Text style={styles.buttonText}>Start Tracking</Text>
              </TouchableOpacity>
            )}

            {/* ✅ Conditional Button Logic */}
            <TouchableOpacity
              style={atPickup ? styles.pickupButton : styles.disabledButton}
              disabled={!atPickup}
              onPress={handlePickupShipment}
            >
              <Text style={styles.buttonText}>Pickup Shipment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    )}
  </View>
);


}  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* 📌 Map Section - Fixed Half-Screen */
  mapContainer: {
    height: "40%", // Ensures map is always visible
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    overflow: "hidden",
  },

  map: {
    flex: 1,
  },

  /* 🔹 Expand Button */
  expandButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 5,
  },

  expandButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  scrollContainer: {
    flex: 1,
  },

  /* 📌 Scrollable Details Below */
  detailsScroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  /* 📌 Details Section */
  detailsContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  /* ✅ General Text Styles */
  detailText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 6,
    fontWeight: "500",
  },

  successMessage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
    textAlign: "center",
    marginBottom: 10,
  },

  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    fontWeight: "bold",
  },

  /* ⛽ Fuel Station Section */
  fuelStationContainer: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  fuelStationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 6,
  },

  fuelStationText: {
    fontSize: 14,
    color: "#333",
    paddingVertical: 3,
  },

  /* 🚦 Traffic Info */
  trafficContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    elevation: 3,
  },

  trafficTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff5722",
  },

  trafficText: {
    fontSize: 14,
    color: "#333",
  },

  /* 📍 POI (Nearby Places) */
  poiContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    elevation: 3,
  },

  poiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },

  poiText: {
    fontSize: 14,
    color: "#333",
    paddingVertical: 3,
  },

  /* 🚗 ETA */
  etaContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    elevation: 3,
  },

  etaText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc3545",
  },

  /* 🚀 Buttons */
  startButton: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#007bff",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  pickupButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#28a745",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  disabledButton: {
    backgroundColor: "#6c757d",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    opacity: 0.6,
    marginVertical: 12,
  },

  uploadButton: {
    backgroundColor: "#ff9800", // Orange color for Upload Documents button
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#ff9800",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  successContainer: {
  alignItems: "center",
  justifyContent: "center",
  marginTop: 20,
  padding: 20,
  backgroundColor: "#fff",
  borderRadius: 10,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 5,
},

successText: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#28a745",
  textAlign: "center",
},

});


export default DriverTracking;