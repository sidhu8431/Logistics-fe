
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   Image,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import axios from "axios";

// const RegisterScreen = ({ navigation }) => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("");

//   const handleRegister = async () => {
//     if (!name || !email || !password || !role) {
//       Alert.alert("Error", "All fields are required");
//       return;
//     }

//     try {
//       const response = await axios.post("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/register", {
//         name,
//         email,
//         password,
//         role,
//       });

//       if (response.status === 201) {
//         Alert.alert("Success", "Registration successful");
//         navigation.navigate("Login");
//       } else {
//         Alert.alert("Registration Failed", response.data || "An error occurred");
//       }
//     } catch (error) {
//       console.error(error);
//       const errorMessage = error.response?.data || "An error occurred while registering";
//       Alert.alert("Error", errorMessage);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Logo Section */}
//       <Image
//         source={require("../assets/password.png")} // Replace with the correct path to your logo
//         style={styles.logo}
//       />
//       <Text style={styles.title}>Create an Account</Text>

//       {/* Input Fields */}
//       <TextInput
//         style={styles.input}
//         placeholder="Name"
//         value={name}
//         onChangeText={setName}
//         placeholderTextColor="#999"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         autoCapitalize="none"
//         placeholderTextColor="#999"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//         placeholderTextColor="#999"
//       />
//       <View style={styles.pickerContainer}>
//         <Picker
//           selectedValue={role}
//           style={styles.picker}
//           onValueChange={(itemValue) => setRole(itemValue)}
//         >
//           <Picker.Item label="Select Role" value="" />
//           <Picker.Item label="Driver" value="DRIVER" />
//           <Picker.Item label="Transporter" value="TRANSPORTER" />
//           <Picker.Item label="Manufacturer" value="MANUFACTURER" />
//         </Picker>
//       </View>

//       {/* Register Button */}
//       <TouchableOpacity style={styles.button} onPress={handleRegister}>
//         <Text style={styles.buttonText}>Register</Text>
//       </TouchableOpacity>

//       {/* Login Link */}
//       <TouchableOpacity onPress={() => navigation.navigate("Login")}>
//         <Text style={styles.link}>Already have an account? Login</Text>
//       </TouchableOpacity>
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
//   input: {
//     width: "100%",
//     height: 50,
//     borderColor: "#ddd",
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     backgroundColor: "#fff",
//     fontSize: 16,
//   },
//   pickerContainer: {
//     width: "100%",
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     backgroundColor: "#fff",
//     marginBottom: 15,
//   },
//   picker: {
//     width: "100%",
//     height: 50,
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
// });

// export default RegisterScreen;

// using
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons"; // For the back icon

// Register Screen Component
const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !phoneNumber || !password || !role) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      const response = await axios.post("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/register", {
        name,
        email,
        phoneNumber,
        password,
        role,
      });

      if (response.status === 201) {
        Alert.alert("Success", "Registration successful");
        navigation.navigate("Login");
      } else {
        Alert.alert("Registration Failed", response.data || "An error occurred");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data || "An error occurred while registering";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Logo and Title */}
      <Image source={require("../assets/password.png")} style={styles.logo} />
      <Text style={styles.title}>Create an Account</Text>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          style={styles.picker}
          onValueChange={(itemValue) => setRole(itemValue)}
        >
          <Picker.Item label="Select Role" value="" />
          <Picker.Item label="Driver" value="DRIVER" />
          <Picker.Item label="Transporter" value="TRANSPORTER" />
          <Picker.Item label="Manufacturer" value="MANUFACTURER" />
        </Picker>
      </View>

      {/* Register Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      {/* Navigate to Login */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#333",
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
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  picker: {
    width: "100%",
    height: 50,
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

export default RegisterScreen;

// latest
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   Image,
//   ImageBackground,
//   ScrollView,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import axios from "axios";
// import Ionicons from "react-native-vector-icons/Ionicons";

// const RegisterScreen = ({ navigation }) => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("");

//   const handleRegister = async () => {
//     if (!name || !email || !phoneNumber || !password || !role) {
//       Alert.alert("Error", "All fields are required");
//       return;
//     }

//     try {
//       const response = await axios.post("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/register", {
//         name,
//         email,
//         phoneNumber,
//         password,
//         role,
//       });

//       if (response.status === 201) {
//         Alert.alert("Success", "Registration successful");
//         navigation.navigate("Login");
//       } else {
//         Alert.alert("Registration Failed", response.data || "An error occurred");
//       }
//     } catch (error) {
//       console.error(error);
//       const errorMessage = error.response?.data || "An error occurred while registering";
//       Alert.alert("Error", errorMessage);
//     }
//   };

//   return (
//     <ImageBackground
//       source={require("../assets/registerBack.png")}
//       style={styles.background}
//       resizeMode="cover"
//     >
      
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.container}>
//         <Image source={require("../assets/password.png")} style={styles.logo} />

//           <View style={styles.card}>
//             <Text style={styles.title}>Sign Up</Text>

//             <TextInput
//               style={styles.input}
//               placeholder="Full Name"
//               value={name}
//               onChangeText={setName}
//               placeholderTextColor="#ccc"
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="Email Address"
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               placeholderTextColor="#ccc"
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="Phone Number"
//               value={phoneNumber}
//               onChangeText={setPhoneNumber}
//               keyboardType="phone-pad"
//               placeholderTextColor="#ccc"
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="Password"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry
//               placeholderTextColor="#ccc"
//             />

//             <View style={styles.pickerContainer}>
//               <Picker
//                 selectedValue={role}
//                 onValueChange={(itemValue) => setRole(itemValue)}
//                 style={styles.picker}
//               >
//                 <Picker.Item label="Select Role" value="" />
//                 <Picker.Item label="Driver" value="DRIVER" />
//                 <Picker.Item label="Transporter" value="TRANSPORTER" />
//                 <Picker.Item label="Manufacturer" value="MANUFACTURER" />
//               </Picker>
//             </View>

//             <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
//               <Text style={styles.buttonText}>Register</Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={() => navigation.navigate("Login")}>
//               <Text style={styles.loginText}>Already have an account? Login</Text>
//             </TouchableOpacity>
//           </View>

//           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </ImageBackground>
//   );
// };

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     width: "100%",
//     height: "100%",
//   },
//   scrollContainer: {
//     flexGrow: 1,
//   },
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "flex-end",
//     padding: 20,
//   },
  
//   card: {
//     width: "100%",
//     backgroundColor: "rgba(255, 255, 255, 0.1)", // Transparent glassy effect
//     borderRadius: 20,
//     padding: 20,
//     backdropFilter: "blur(10px)", // Only on web. For native: use Expo BlurView for actual blur
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.3)",
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "#fff",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   input: {
//     height: 50,
//     borderColor: "rgba(255,255,255,0.3)",
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     fontSize: 16,
//     color: "#fff",
//     backgroundColor: "rgba(255,255,255,0.1)",
//   },
//   pickerContainer: {
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.3)",
//     borderRadius: 10,
//     marginBottom: 15,
//     backgroundColor: "rgba(255,255,255,0.1)",
//   },
//   picker: {
//     color: "#fff",
//     height: 50,
//     width: "100%",
//   },
//   registerButton: {
//     backgroundColor: "#007BFF",
//     height: 50,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 10,
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   loginText: {
//     textAlign: "center",
//     color: "#fff",
//     marginTop: 15,
//     fontSize: 16,
//   },
//   backButton: {
//     position: "absolute",
//     top: 45,
//     left: 20,
//     padding: 10,
//   },
//   logo: {
//         width: 180,
//         height: 180,
//         marginBottom: 50,
//         resizeMode: "contain",
//       },
// });

// export default RegisterScreen;

