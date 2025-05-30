import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ImageBackground,
  PermissionsAndroid,
  Platform,
  NativeModules,
} from "react-native";
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Animated } from "react-native";
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Global variable to track interval - moved outside to ensure proper cleanup
let locationInterval = null; 

const LoginScreen = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [showPassword, setShowPassword] = useState(false);
 
  useEffect(() => {
    // 🚀 Configure Geolocation on mount
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
    });
  
    // ✨ Start blinking animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
  
    // 🧹 Clean up on unmount
    return () => {
      animation.stop(); // stop animation loop
      stopDriverLocationUpdates(); // stop interval
      console.log("🧼 Cleanup: Animation and location tracking stopped.");
    };
  }, []);
  
  
  const ensureLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    
      const result = await check(permission);
    
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.DENIED || result === RESULTS.LIMITED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      } else {
        return false; // BLOCKED, UNAVAILABLE, or PERMANENTLY DENIED
      }
    } catch (error) {
      console.error("❌ Error checking permissions:", error);
      return false;
    }
  };
 
  // Function to get the current location with improved error handling and timeouts
  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      const fallbackLocation = {
        latitude: 17.4401,
        longitude: 78.3489,
        accuracy: 100,
        timestamp: Date.now(),
      };
  
      const timeout = setTimeout(() => {
        console.warn("⏳ Location request timed out. Using fallback location.");
        resolve(fallbackLocation);
      }, 30000);
  
      Geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          clearTimeout(timeout);
          console.error("❌ Error fetching GPS:", error.message);
          resolve(fallbackLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000,
        }
      );
    });
  };
  
  
  
  
  // const getCurrentLocation = () => {
  //   return Promise.resolve({
  //     latitude: 17.385067,
  //     longitude: 78.486667,
  //     accuracy: 5,
  //     timestamp: Date.now(),
  //   });
  // };
  
  // Function to update the driver's location with improved error handling
  const updateLocation = async (driverId) => {
    if (!driverId) {
      console.warn("⚠️ updateLocation: Missing driverId");
      return;
    }
  
    try {
      console.log("🌍 Fetching current location for driver:", driverId);
  
      const location = await getCurrentLocation();
  
      if (!location) {
        console.warn("⚠️ No location received, skipping update");
        return;
      }
  
      const payload = {
        driverLatitude: location.latitude.toString(),
        driverLongitude: location.longitude.toString(),
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      };
  
      console.log("📦 Sending location payload:", payload);
  
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/driver/updateLocation/${driverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to update location:", errorText);
      } else {
        console.log("✅ Location successfully updated in DB.");
      }
    } catch (error) {
      console.error("❌ updateLocation error:", error.message || error);
    }
  };
  
  
  // Function to start driver location updates with additional safety
  const startDriverLocationUpdates = async (driverId) => {
    if (!driverId) {
      console.error("❌ Cannot start location updates — driverId is missing.");
      return;
    }
  
    try {
      // Skip permission check here since we've already checked before calling
      setHasLocationPermission(true);
      
      // Make sure any previous tracking is stopped
      stopDriverLocationUpdates();
      
      console.log("🚀 Starting location tracking process for driver:", driverId);
  
      // Wait a moment before the first update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try the first update, but don't let it crash the app
      try {
        console.log("🌍 Attempting first location update...");
        await updateLocation(driverId);
        console.log("✅ First location update completed successfully");
      } catch (err) {
        console.error("⚠️ First location update failed, but continuing:", err);
        // Don't interrupt the process, continue to set up interval
      }
  
      // Use safe interval that can't overlap with itself
      let isUpdating = false;
      locationInterval = setInterval(() => {
        // Skip this update if a previous one is still running
        if (isUpdating) {
          console.log("⏩ Skipping location update because previous one is still running");
          return;
        }
        
        isUpdating = true;
        updateLocation(driverId)
          .catch(err => {
            console.error("❌ Error in periodic update:", err);
          })
          .finally(() => {
            isUpdating = false;
          });
      }, 10000); // Increased to 10 seconds to reduce load
  
      console.log("📍 Started location updates every 10 seconds");
  
    } catch (error) {
      console.error("❌ startDriverLocationUpdates failed:", error);
      // Only show alert if this isn't a background process
      try {
        Alert.alert(
          "Location Notice",
          "Location tracking may be limited. The app will continue to work normally.",
          [{ text: "OK" }]
        );
      } catch (alertError) {
        console.error("Could not show alert:", alertError);
      }
    }
  };
  
  // Function to stop driver location updates
  const stopDriverLocationUpdates = () => {
    if (locationInterval) {
      clearInterval(locationInterval);
      locationInterval = null;
      console.log("🚫 Stopped location updates");
    }
  };
 
  // Function to handle login
  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert("Error", "Please enter email/phone and password");
      return;
    }
 
    try {
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrPhone.includes("@") ? emailOrPhone : null,
          phoneNumber: emailOrPhone.includes("@") ? null : emailOrPhone,
          password,
        }),
      });
     
      if (!response.ok) {
        Alert.alert("Login Failed", await response.text());
        return;
      }
 
      Alert.alert("Success", "OTP sent to your email/phone");
      setIsOtpSent(true);
    } catch (error) {
      Alert.alert("Error", `An error occurred: ${error.message}`);
    }
  };
 
  // Flag to prevent double calls to location services
  const [isLocationStarted, setIsLocationStarted] = useState(false);
  
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }
  
    try {
      // Prevent multiple rapid clicks
      if (isLocationStarted) {
        console.log("⚠️ Location updates already starting, ignoring duplicate call");
        return;
      }
  
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrPhone.includes("@") ? emailOrPhone : null,
          phoneNumber: emailOrPhone.includes("@") ? null : emailOrPhone,
          otp,
        }),
      });
  
      if (!response.ok) {
        Alert.alert("Verification Failed", await response.text());
        return;
      }
  
      const data = await response.json();
      console.log('✅ Login successful, response data:', data);
  
      // Handle potential null/undefined values
      const { token, role, userId, manufacturerId, transporterId, driverId } = data;
  
      // Store values that are guaranteed to exist
      await AsyncStorage.setItem("token", token || "");
      await AsyncStorage.setItem("role", role || "");
      
      // Store optional IDs only if they exist
      if (userId !== undefined && userId !== null) {
        await AsyncStorage.setItem("userId", userId.toString());
      }
      if (manufacturerId) {
        await AsyncStorage.setItem("manufacturerId", manufacturerId.toString());
      }
      if (transporterId) {
        await AsyncStorage.setItem("transporterId", transporterId.toString());
      }
      if (driverId) {
        await AsyncStorage.setItem("driverId", driverId.toString());
      }
  
      console.log("🚗 Stored UserId:", userId);
      console.log("🛠 Stored ManufacturerId:", manufacturerId);
      console.log("🚛 Stored TransporterId:", transporterId);
      console.log("🚚 Stored DriverId:", driverId);
      console.log("👑 Stored Role:", role);
  
      // Immediate navigation for non-driver roles
      if (role !== "DRIVER") {
        const dashboardScreen =
          role === "MANUFACTURER" ? "TrackingApp" :
          role === "TRANSPORTER" ? "Dashboard" :
          "Unknown";
  
        if (dashboardScreen !== "Unknown") {
          navigation.navigate(dashboardScreen, { 
            userId: userId ? userId.toString() : null 
          });
        } else {
          Alert.alert("Error", "Unknown user role, cannot navigate.");
        }
        return;
      }
      
      // If we get here, user is a driver
      const driverIdentifier = driverId || userId;
      if (!driverIdentifier) {
        console.error("❌ No driver ID available for tracking");
        Alert.alert("Login Error", "Missing driver information. Please contact support.");
        return;
      }
      
      // Prevent double initialization of location services
      setIsLocationStarted(true);
      
      // Show success message first, then handle permissions
      Alert.alert("Success", "Login successful!", [
        {
          text: "OK",
          onPress: async () => {
            try {
              console.log("📍 Checking location permission for driver:", driverIdentifier);
              const granted = await ensureLocationPermission();
              
              // Navigate first, before any potential crashes in location code
              navigation.navigate("DriverDashboard", { 
                userId: userId ? userId.toString() : null, 
                driverId: driverId ? driverId.toString() : null 
              });
              
              // Start location updates 2 seconds after navigation
              if (granted) {
                console.log("✅ Location permission granted");
                // Delay location updates to ensure navigation completes first
                setTimeout(() => {
                  console.log("🚀 Starting location updates now...");
                  startDriverLocationUpdates(driverIdentifier.toString());
                }, 2000);
              } else {
                console.warn("⚠️ Location permission not granted, skipping location tracking.");
                Alert.alert("Location Permission Needed", "Please allow location access for live tracking.");
              }
            } catch (error) {
              console.error("❌ Location permission error:", error);
              // Still navigate even if location fails
              navigation.navigate("DriverDashboard", { 
                userId: userId ? userId.toString() : null, 
                driverId: driverId ? driverId.toString() : null 
              });
            }
          }
        }
      ]);
    } catch (error) {
      setIsLocationStarted(false); // Reset flag on error
      console.error("❌ Error during OTP verification:", error.message || error);
      Alert.alert("Error", "An error occurred during login. Please try again.");
    }
  };
  
  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!emailOrPhone) {
      Alert.alert("Error", "Please enter your email or phone number");
      return;
    }
 
    try {
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrPhone.includes("@") ? emailOrPhone : null,
          phoneNumber: emailOrPhone.includes("@") ? null : emailOrPhone,
        }),
      });
      if (response.ok) {
        Alert.alert("Success", "OTP sent to your email/phone for account recovery");
        setIsOtpSent(true);
        setIsForgotPassword(true);
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while processing your request");
    }
  };
  
//   return (
//     <View style={styles.container}>
//       <Image source={require("../assets/login.png")} style={styles.logo} />
//       <Text style={styles.title}>Welcome Back!</Text>
 
//       <Text style={styles.tagline}>
//        🚛 "India's fastest-moving platform – smart tracking, smoother deliveries."
//       </Text>
 
//       <View style={styles.inputContainer}>
//         <TextInput
//           style={styles.input}
//           placeholder="Email or Phone Number"
//           value={emailOrPhone}
//           onChangeText={setEmailOrPhone}
//           keyboardType="default"
//           autoCapitalize="none"
//           placeholderTextColor="#999"
//         />
//         <View style={styles.passwordContainer}>
//     <TextInput
//       style={styles.passwordInput}
//       placeholder="Password"
//       value={password}
//       onChangeText={setPassword}
//       secureTextEntry={!showPassword}
//       placeholderTextColor="#999"
//     />
//     <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
//       <Text style={styles.eyeIcon}>
//         {showPassword ? "🙈" : "👁️"}
//       </Text>
//     </TouchableOpacity>
//   </View>
//         {isOtpSent && (
//           <TextInput
//             style={styles.passwordInput}
//             placeholder="Enter OTP"
//             value={otp}
//             onChangeText={setOtp}
//             keyboardType="numeric"
//             placeholderTextColor="#999"
//           />
//         )}
//       </View>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={isOtpSent ? handleVerifyOtp : handleLogin}
//       >
//         <Text style={styles.buttonText}>
//           {isOtpSent ? "Verify OTP" : "Login"}
//         </Text>
//       </TouchableOpacity>
 
//       {!isOtpSent && !isForgotPassword && (
//         <TouchableOpacity onPress={handleForgotPassword}>
//           <Text style={styles.link}>Forgot Password?</Text>
//         </TouchableOpacity>
//       )}
 
//       {isOtpSent && (
//         <TouchableOpacity onPress={() => setIsOtpSent(false)}>
//           <Text style={styles.link}>Back to Login</Text>
//         </TouchableOpacity>
//       )}
 
//       {!isOtpSent && !isForgotPassword && (
//         <TouchableOpacity onPress={() => navigation.navigate("Register")}>
//           <Text style={styles.link}>Don't have an account? Register</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };
 
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#f8f9fa",
//   },
//   logo: {
//     width: 120,
//     height: 120,
//     marginBottom: 20,
//     resizeMode: "contain",
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 20,
//   },
//   inputContainer: {
//     width: "100%",
//     marginBottom: 15,
//   },
//   input: {
//     height: 50,
//     borderColor: "#ddd",
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     backgroundColor: "#fff",
//     fontSize: 16,
//     marginBottom: 10,
//   },
//   button: {
//     width: "100%",
//     height: 50,
//     backgroundColor: "#007BFF",
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 8,
//     marginBottom: 10,
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   link: {
//     color: "#007BFF",
//     fontSize: 16,
//     marginTop: 10,
//   },
//   tagline: {
//   fontSize: 21,
//   color: "#333",
//   fontWeight: "bold",
//   textAlign: "center",
//   marginBottom: 20,
//   fontStyle: "italic",
//   paddingHorizontal: 20,
// },
// passwordContainer: {
//   flexDirection: "row",
//   alignItems: "center",
//   borderColor: "#ddd",
//   borderWidth: 1,
//   borderRadius: 8,
//   paddingHorizontal: 15,
//   backgroundColor: "#fff",
//   height: 50,
//   marginBottom: 10,
// },

// passwordInput: {
//   flex: 1,
//   fontSize: 16,
//   color: "#000",
// },

// eyeIcon: {
//   fontSize: 20,
//   paddingHorizontal: 10,
//   color: "#333",
// },


// });
// export default LoginScreen;

return (
  <View style={styles.container}>
    <Image source={require("../assets/login.png")} style={styles.logo} />
    <Text style={styles.title}>Welcome Back!</Text>

    <Text style={styles.tagline}>
      🚛 "India's fastest-moving platform – smart tracking, smoother
      deliveries."
    </Text>

    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Email or Phone Number"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        keyboardType="default"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />

      {!isOtpSent && !isForgotPassword && (
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>
              {showPassword ? "🙈" : "👁️"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isOtpSent && (
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      )}
    </View>

    <TouchableOpacity
      style={styles.button}
      onPress={isOtpSent ? handleVerifyOtp : handleLogin}
    >
      <Text style={styles.buttonText}>
        {isOtpSent ? "Verify OTP" : "Login"}
      </Text>
    </TouchableOpacity>

    {!isOtpSent && !isForgotPassword && (
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>
    )}

    {isOtpSent && (
      <TouchableOpacity onPress={() => setIsOtpSent(false)}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    )}

    {!isOtpSent && !isForgotPassword && (
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    )}
  </View>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  backgroundColor: "#f8f9fa",
},
logo: {
  width: 120,
  height: 120,
  marginBottom: 20,
  resizeMode: "contain",
},
title: {
  fontSize: 28,
  fontWeight: "bold",
  color: "#333",
  marginBottom: 20,
},
tagline: {
  fontSize: 21,
  color: "#333",
  fontWeight: "bold",
  textAlign: "center",
  marginBottom: 20,
  fontStyle: "italic",
  paddingHorizontal: 20,
},
inputContainer: {
  width: "100%",
  marginBottom: 15,
},
input: {
  height: 50,
  borderColor: "#ddd",
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 15,
  backgroundColor: "#fff",
  fontSize: 16,
  marginBottom: 10,
},
passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderColor: "#ddd",
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 15,
  backgroundColor: "#fff",
  height: 50,
  marginBottom: 10,
},
passwordInput: {
  flex: 1,
  fontSize: 16,
  color: "#000",
},
eyeIcon: {
  fontSize: 20,
  paddingHorizontal: 10,
  color: "#333",
},
button: {
  width: "100%",
  height: 50,
  backgroundColor: "#007BFF",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 8,
  marginBottom: 10,
},
buttonText: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold",
},
link: {
  color: "#007BFF",
  fontSize: 16,
  marginTop: 10,
},
});

export default LoginScreen;