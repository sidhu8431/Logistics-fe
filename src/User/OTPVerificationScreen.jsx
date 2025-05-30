import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";

const OTPVerificationScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleVerifyAndReset = async () => {
    if (!otp || !newPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (response.ok) {
        Alert.alert("Success", "Password reset successfully");
        navigation.navigate("Login");
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Enter OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleVerifyAndReset}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  heading: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: { height: 50, borderColor: "gray", borderWidth: 1, marginBottom: 15, paddingHorizontal: 10 },
  button: { backgroundColor: "#007BFF", padding: 15, borderRadius: 5, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default OTPVerificationScreen;
