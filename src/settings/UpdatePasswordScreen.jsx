// import React, { useState } from "react";
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
// import axios from "axios";

// const UpdatePasswordScreen = () => {
//   const [email, setEmail] = useState("");
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [reenterPassword, setReenterPassword] = useState("");
  

//   // Validate form inputs
//   const validateInputs = () => {
//     if (!email || !currentPassword || !newPassword || !reenterPassword) {
//       Alert.alert("Error", "All fields are required.");
//       return false;
//     }

//     if (newPassword !== reenterPassword) {
//       Alert.alert("Error", "New passwords do not match.");
//       return false;
//     }

//     // Example: Password validation (min length 6, at least one uppercase, one lowercase, one number)
//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
//     if (!passwordRegex.test(newPassword)) {
//       Alert.alert(
//         "Error",
//         "Password must be at least 6 characters long, and include one uppercase letter, one lowercase letter, and one number."
//       );
//       return false;
//     }

//     return true;
//   };

//   const handleUpdatePassword = async () => {
//     if (!validateInputs()) {
//       return;
//     }

//     try {
//       const response = await axios.post("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/update", {
//         email,
//         currentPassword,
//         newPassword,
//         reenterPassword,
//       });

//       Alert.alert("Success", response.data.message);
//     } catch (error) {
//       Alert.alert("Error", error.response?.data || "An error occurred");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Update Password</Text>

//       <TextInput
//         placeholder="Email"
//         style={styles.input}
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//       />
//       <TextInput
//         placeholder="Current Password"
//         style={styles.input}
//         value={currentPassword}
//         secureTextEntry
//         onChangeText={setCurrentPassword}
//       />
//       <TextInput
//         placeholder="New Password"
//         style={styles.input}
//         value={newPassword}
//         secureTextEntry
//         onChangeText={setNewPassword}
//       />
//       <TextInput
//         placeholder="Re-enter New Password"
//         style={styles.input}
//         value={reenterPassword}
//         secureTextEntry
//         onChangeText={setReenterPassword}
//       />

//       <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
//         <Text style={styles.buttonText}>Update Password</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" },
//   title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
//   input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginVertical: 10 },
//   button: { backgroundColor: "#007BFF", padding: 15, borderRadius: 5, marginTop: 10 },
//   buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
// });

// export default UpdatePasswordScreen;


import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome icons

const UpdatePasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [reenterPassword, setReenterPassword] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isReenterPasswordVisible, setIsReenterPasswordVisible] = useState(false);

  // Validate form inputs
  const validateInputs = () => {
    if (!email || !currentPassword || !newPassword || !reenterPassword) {
      Alert.alert("Error", "All fields are required.");
      return false;
    }

    if (newPassword !== reenterPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return false;
    }

    // Example: Password validation (min length 6, at least one uppercase, one lowercase, one number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        "Error",
        "Password must be at least 6 characters long, and include one uppercase letter, one lowercase letter, and one number."
      );
      return false;
    }

    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const response = await axios.post("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/update", {
        email,
        currentPassword,
        newPassword,
        reenterPassword,
      });

      Alert.alert("Success", response.data.message);
    } catch (error) {
      Alert.alert("Error", error.response?.data || "An error occurred");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Password</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Current Password"
          style={styles.input}
          value={currentPassword}
          secureTextEntry={!isCurrentPasswordVisible}
          onChangeText={setCurrentPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
        >
          <Icon name={isCurrentPasswordVisible ? "eye" : "eye-slash"} size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="New Password"
          style={styles.input}
          value={newPassword}
          secureTextEntry={!isNewPasswordVisible}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
        >
          <Icon name={isNewPasswordVisible ? "eye" : "eye-slash"} size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Re-enter New Password"
          style={styles.input}
          value={reenterPassword}
          secureTextEntry={!isReenterPasswordVisible}
          onChangeText={setReenterPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsReenterPasswordVisible(!isReenterPasswordVisible)}
        >
          <Icon name={isReenterPasswordVisible ? "eye" : "eye-slash"} size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 45, padding: 10, marginVertical: 10, flex: 1 },
  passwordContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  eyeIcon: { position: "absolute", right: 10 },
  button: { backgroundColor: "#FFDB58", padding: 15, borderRadius: 35, marginTop: 10 },
  buttonText: { color: "#000000", textAlign: "center", fontWeight: "bold" },
});

export default UpdatePasswordScreen;
