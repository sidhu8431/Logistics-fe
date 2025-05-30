





import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  Alert, ActivityIndicator, Animated, Pressable, Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const DriverDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [driverCoords, setDriverCoords] = useState(null);
  const [shipmentId, setShipmentId] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [showFeed, setShowFeed] = useState(false);

  const [feedbackList, setFeedbackList] = useState([
    { comment: "Quick delivery", rating: 4.5, transporterName: "Fast Movers Ltd" },
    { comment: "On time and polite", rating: 4.2, transporterName: "Express Cargo" },
  ]);
  const [averageRating, setAverageRating] = useState(4.35);

  const dummyFeeds = [
    {
      type: "feed",
      description: "Hyderabad to Nalgonda highway update",
      distance_from_driver_km: 0.07,
    },
    {
      type: "weather",
      description: "Broken clouds around Khammam",
      distance_from_driver_km: 1.0,
    },
    {
      type: "restaurant",
      description: "Iqbal Hotel nearby",
      distance_from_driver_km: 1.9,
    },
    {
      type: "parking",
      description: "Hospital Parking available",
      distance_from_driver_km: 2.0,
    },
    {
      type: "fuel",
      description: "HP Fuel Station ahead",
      distance_from_driver_km: 2.9,
    },
  ];

  const groupFeedsByType = (feeds) => {
    const grouped = { feed: [], weather: [], restaurant: [], parking: [], fuel: [] };
    feeds.forEach((item) => {
      const type = item.type || 'feed';
      if (grouped[type]) grouped[type].push(item);
    });
    return grouped;
  };

  const groupedFeeds = groupFeedsByType(dummyFeeds);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let currentDriverId = await AsyncStorage.getItem("driverId");
        console.log("My driverId:", currentDriverId);
  
        if (!currentDriverId) {
          const userId = await AsyncStorage.getItem("userId");
          if (!userId) {
            throw new Error("User ID not found in storage.");
          }
  
          const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/getDriver/${userId}`);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Driver not found");
          }
  
          const data = await response.json();
          currentDriverId = data.driverId;
  
          if (!currentDriverId) {
            throw new Error("driverId not found in response.");
          }
  
          await AsyncStorage.setItem("driverId", currentDriverId.toString());
        }
  
        setDriverId(currentDriverId);
  
        // ✅ Fetch shipment details using driverId
        const shipmentRes = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/ongoing/${currentDriverId}`);
        if (!shipmentRes.ok) {
          throw new Error("Failed to fetch shipment details");
        }
  
        const shipmentData = await shipmentRes.json();
  
        if (shipmentData?.assignedDriver?.driverLatitude && shipmentData?.assignedDriver?.driverLongitude) {
          setDriverCoords({
            latitude: parseFloat(shipmentData.assignedDriver.driverLatitude),
            longitude: parseFloat(shipmentData.assignedDriver.driverLongitude),
          });
        }
  
        if (shipmentData?.shipment?.shipmentId) {
          setShipmentId(shipmentData.shipment.shipmentId);
        }
      } catch (err) {
        console.error("❌ Driver Dashboard Error:", err.message);
        Alert.alert("Error", err.message);
      }
    };
  
    fetchData();
  }, []);
  
  
  
  const toggleMapSize = () => setIsMapExpanded(prev => !prev);

  const getCategoryIcon = (type) => {
    switch (type) {
      case "feed": return "🖼️";
      case "weather": return "🌤️";
      case "restaurant": return "🍽️";
      case "parking": return "🅿️";
      case "fuel": return "⛽";
      default: return "📌";
    }
  };

  const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

  const sections = [
    { key: "driverShipment", title: "Shipments", image: require("../assets/shipmentRequests.png") },
    { key: "completedTrips", title: "Trips", image: require("../assets/done.png") },
    { key: "invoices", title: "Invoices", image: require("../assets/invoice1.png") },
    { key: "profile", title: "Profile", image: require("../assets/profile.png") },
  ];

  const handleSectionPress = (key) => {
    switch (key) {
      case "driverShipment": navigation.navigate("DriverShipment"); break;
      case "completedTrips": navigation.navigate("CompletedTrips"); break;
      case "profile": navigation.navigate("DriverProfile"); break;
      case "invoices": navigation.navigate("PaymentRecords"); break;
      default: Alert.alert("Unknown section");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4b0082" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.feedbackSection}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome to Driver Dashboard</Text>
        <Text style={styles.welcomeText}>Drive Safe!</Text>
      </View>

      <Image source={require("../assets/board.png")} style={styles.driverImage} />

      <View style={styles.cardWrapper}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={styles.card}
            onPress={() => handleSectionPress(section.key)}
          >
            <Image source={section.image} style={styles.iconImage} />
            <Text style={styles.cardText}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>🧭 Ongoing Trip</Text>

      <TouchableOpacity onPress={toggleMapSize} activeOpacity={1}
        style={[styles.mapCard, isMapExpanded && styles.mapCardExpanded]}>
        <Text style={styles.mapToggleText}>
          {isMapExpanded ? "Minimize" : "Maximize"}
        </Text>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.mapStyle}
          region={{
            latitude: driverCoords?.latitude || 17.385,
            longitude: driverCoords?.longitude || 78.4867,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          pointerEvents="none"
        >
          {driverCoords && (
            <Marker coordinate={driverCoords} title="Driver Location" pinColor="blue" />
          )}
        </MapView>
      </TouchableOpacity>

      
      
      <TouchableOpacity
  style={styles.feedButton}
  onPress={() => navigation.navigate("DriverFeedScreen")}
>
  <Text style={styles.feedButtonText}>📸 Show AI Feed</Text>
</TouchableOpacity>


      {showFeed && (
        <View style={styles.feedContainer}>
          {Object.entries(groupedFeeds).map(([type, items]) => (
            <View key={type} style={styles.feedCategorySection}>
              <Text style={styles.categoryTitle}>
                {getCategoryIcon(type)} {capitalize(type)}
              </Text>
              {items.map((item, index) => (
                <View key={index} style={styles.feedCard}>
                  <Text style={styles.feedDescription}>📝 {item.description}</Text>
                  <Text style={styles.feedDistance}>📍 {item.distance_from_driver_km.toFixed(2)} km</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.feedbackTitle}>DRIVER FEEDBACK</Text>
      <Text style={styles.averageRating}>⭐ Average Rating: {averageRating}</Text>

      {feedbackList.map((item, index) => (
        <AnimatedFeedbackCard key={index} item={item} />
      ))}
    </ScrollView>
  );
};

const AnimatedFeedbackCard = ({ item }) => {
  const animation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(animation, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animation]);

  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E6FFF2", "#FFFBEA"],
  });

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 1.05, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start()}
    >
      <Animated.View style={[styles.feedbackCard, { backgroundColor, transform: [{ scale }] }]}>
        <Text style={styles.feedbackText}>💬 <Text style={styles.bold}>Comments:</Text> {item.comment}</Text>
        <Text style={styles.feedbackText}>⭐ <Text style={styles.bold}>Rating:</Text> {item.rating}</Text>
        <Text style={styles.feedbackText}>🚚 <Text style={styles.bold}>Transporter:</Text> {item.transporterName}</Text>
        <View style={styles.tail} />
      </Animated.View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  scrollArea: { flex: 1, backgroundColor: "#F3EEFF" },
  feedbackSection: { paddingBottom: 60 },
  welcomeContainer: { alignItems: "center", marginBottom: 6 },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9B5DE5",
    textAlign: "center",
  },
  driverImage: {
    width: "100%",
    height: Dimensions.get("window").height / 3.8,
    resizeMode: "contain",
    marginTop: 10,
    marginBottom: -20,
  },
  cardWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: -10,
    marginBottom: 20,
  },
  card: {
    width: 80,
    height: 80,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginTop: 6,
  },
  iconImage: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 10,
    marginTop: 20,
    paddingLeft: 20,
  },
  mapCard: {
    height: 150,
    width: "90%",
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#4B0082",
    elevation: 5,
    backgroundColor: "#fff",
    position: "relative",
  },
  mapCardExpanded: {
    height: Dimensions.get("window").height / 1.8,
  },
  mapToggleText: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "bold",
    fontSize: 12,
    color: "#4B0082",
    elevation: 3,
  },
  mapStyle: {
    ...StyleSheet.absoluteFillObject,
  },

  // 🔸 DRIVER FEED BUTTON
  feedButton: {
    backgroundColor: "#FFA500", // orange
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: "center",
    marginVertical: 15,
    elevation: 4,
  },
  feedButtonText: {
    color: "#000", // black text
    fontWeight: "bold",
    fontSize: 14,
  },

  // 🔹 FEED CONTAINER
  feedContainer: {
    backgroundColor: "#ffffff",
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 5,
  },
  feedCategorySection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B0082",
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#9B5DE5",
    paddingBottom: 4,
  },
  feedCard: {
    backgroundColor: "#F8F8FF",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    borderLeftWidth: 5,
    borderLeftColor: "#9B5DE5",
    elevation: 3,
  },
  feedDescription: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
  },
  feedDistance: {
    fontSize: 13,
    color: "#555",
  },

  // 🔸 FEEDBACK SECTION
  feedbackTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "green",
    marginBottom: 5,
    paddingLeft: 20,
  },
  averageRating: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#780606",
    marginBottom: 15,
    paddingLeft: 20,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#59A871",
    marginBottom: 25,
    width: "85%",
    marginLeft: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  feedbackText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "bold",
    color: "#4B0082",
  },
  tail: {
    position: "absolute",
    top: 12,
    right: -10,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 15,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#E6FFF2",
    zIndex: 1,
    elevation: 6,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
});


export default DriverDashboard;



