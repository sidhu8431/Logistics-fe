import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import Navigation from "./src/navigation/Navigation";
import { setupLogger } from "./src/Logger";


const App = () => {
  useEffect(() => {
    setupLogger(); // ✅ Initialize logger on app startup

    // Optional test logs
    console.log("✅ App started");
    console.warn("⚠️ Sample warning");
    console.error("❌ Sample error");
  }, []);
  
  return (
    <NavigationContainer>
      <Navigation />
      {/* <TrackingApp/> */}
    </NavigationContainer>
    
  );
};


export default App;


// import React, { useEffect, useState } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Navigation from "./src/navigation/Navigation";
// import { ActivityIndicator, View } from "react-native";

// const App = () => {
//   const [initialScreen, setInitialScreen] = useState(null);

//   useEffect(() => {
//     const checkLoginStatus = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");
//         const role = await AsyncStorage.getItem("role");
//         console.log("🔍 Debug Token:", token);
//         console.log("🔍 Debug Role:", role);
//         if (token && role) {
//           // Decide which screen to go based on role
//           if (role === "MANUFACTURER") setInitialScreen("TrackingApp");
//           else if (role === "TRANSPORTER") setInitialScreen("Dashboard");
//           else if (role === "DRIVER") setInitialScreen("DriverDashboard");
//           else setInitialScreen("Login");
//         } else {
//           setInitialScreen("Login");
//         }
//       } catch (error) {
//         console.error("❌ Error checking login status:", error);
//         setInitialScreen("Login");
//       }
//     };

//     checkLoginStatus();
//   }, []);

//   if (!initialScreen) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#007BFF" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Navigation initialRouteName={initialScreen} />
//     </NavigationContainer>
//   );
// };

// export default App;


// import React, { useEffect, useState } from "react";
// import { ActivityIndicator, View } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { NavigationContainer } from "@react-navigation/native";
// import Navigation from "./src/navigation/Navigation";
// import { createStackNavigator } from "@react-navigation/stack";
// import LoginScreen from "./src/User/LoginScreen";
// import TrackingApp from "./src/dashboards/TrackingApp";
// import Dashboard from "./src/transportation/Dashboard";
// import DriverDashboard from "./src/driver/DriverDashboard";
// // import LoginScreen from "./src/screens/LoginScreen"; // adjust path
// // import TrackingApp from "./src/screens/TrackingApp"; // Manufacturer Dashboard
// // import Dashboard from "./src/screens/Dashboard"; // Transporter
// // import DriverDashboard from "./src/screens/DriverDashboard"; // Driver

// const Stack = createStackNavigator();

// const App = () => {
//   const [initialRoute, setInitialRoute] = useState(null);

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");
//         const role = await AsyncStorage.getItem("role");
//         console.log("🧪 Token on load:", token);
//         console.log("🧪 Role on load:", role);

//         if (token && role) {
//           if (role === "MANUFACTURER") setInitialRoute("TrackingApp");
//           else if (role === "TRANSPORTER") setInitialRoute("Dashboard");
//           else if (role === "DRIVER") setInitialRoute("DriverDashboard");
//           else setInitialRoute("Login");
//         } else {
//           setInitialRoute("Login");
//         }
//       } catch (e) {
//         console.error("🔴 Error checking auth", e);
//         setInitialRoute("Login");
//       }
//     };

//     checkAuth();
//   }, []);

//   if (!initialRoute) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName={initialRoute}>
//         <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="TrackingApp" component={TrackingApp} options={{ headerShown: false }} />
//         <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
//         <Stack.Screen name="DriverDashboard" component={DriverDashboard} options={{ headerShown: false }} />
//         <Stack.Screen name="MainNavigation" component={Navigation} options={{ headerShown: false }} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;
