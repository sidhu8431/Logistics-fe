import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

const ShipmentDocuments = ({ route, navigation }) => {
  const { shipmentId, driverId } = route.params || {};
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);

  useEffect(() => {
    loadImages();
    checkUploadStatus();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs access to your camera to take pictures",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const loadImages = async () => {
    try {
      const storedImages = await AsyncStorage.getItem(`savedImages-${shipmentId}`);
      if (storedImages) {
        setImages(JSON.parse(storedImages));
      }
    } catch (error) {
      console.error("Error loading images:", error);
    }
  };

  const saveImages = async (updatedImages) => {
    try {
      await AsyncStorage.setItem(`savedImages-${shipmentId}`, JSON.stringify(updatedImages));
    } catch (error) {
      console.error("Error saving images:", error);
    }
  };

  const checkUploadStatus = async () => {
    try {
      const status = await AsyncStorage.getItem(`uploadCompleted-${shipmentId}`);
      if (status === "true") {
        setUploadCompleted(true);
      }
    } catch (error) {
      console.error("Error checking upload status:", error);
    }
  };

  const pickImage = async (type) => {
    if (type === "camera") {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Camera access is required to take photos.");
        return;
      }
    }

    const options = { mediaType: "photo", quality: 0.8 };
    const response =
      type === "camera"
        ? await launchCamera(options)
        : await launchImageLibrary(options);

    if (response.didCancel) return;
    if (response.errorMessage) {
      Alert.alert("Error", response.errorMessage);
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const newImages = [...images, response.assets[0].uri];
      setImages(newImages);
      saveImages(newImages);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    saveImages(newImages);
  };

  const uploadImages = async () => {
    if (!shipmentId || !driverId) {
        Alert.alert("Error", "Missing shipment or driver details.");
        console.error("❌ Missing shipmentId or driverId:", { shipmentId, driverId });
        return;
    }

    if (images.length === 0) {
        Alert.alert("Error", "Please add at least one image to upload.");
        return;
    }

    setUploading(true);

    const formData = new FormData();

    images.forEach((img, index) => {
        formData.append("files", {
            uri: img,
            type: "image/jpeg",
            name: `image_${index}.jpg`,
        });
    });

    // Ensure documentType is also included like Postman
    formData.append("documentType", "PICKUP_IMAGE");

    const uploadUrl = `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/shipmentDocuments/uploadDocs/${shipmentId}/${driverId}`;
    console.log("📌 Uploading to:", uploadUrl);
    console.log("📦 FormData Preview:", formData);

    try {
        const response = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json",
                "Content-Type": "multipart/form-data", // Allow RN to handle boundary
            },
        });

        console.log("📌 Response Status:", response.status);
        const responseText = await response.text();
        console.log("📌 Response Body:", responseText);

        if (!response.ok) {
            throw new Error(`Failed to upload images. Server Response: ${responseText}`);
        }

        Alert.alert("Success", "Images uploaded successfully!");
        setImages([]);
        await AsyncStorage.removeItem(`savedImages-${shipmentId}`);
        await AsyncStorage.setItem(`uploadCompleted-${shipmentId}`, "true");
        setUploadCompleted(true);
    } catch (error) {
        console.error("❌ Upload Error:", error.message);
        Alert.alert("Upload Failed", error.message);
    } finally {
        setUploading(false);
    }
};

const handleNavigateToDrop = async () => {
  try {
    console.log("📌 Navigating to Drop-off... Updating status.");

    // ✅ Send status update to backend
    const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/assignShipments/updateStatusByShipment/${shipmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EN_ROUTE_TO_DROP" }),
    });

    if (!response.ok) {
      throw new Error("Failed to update shipment status in backend.");
    }

    // ✅ Save new status in AsyncStorage
    await AsyncStorage.setItem(`shipmentStatus-${shipmentId}`, "EN_ROUTE_TO_DROP");

    // ✅ Navigate to drop-off tracking
    navigation.replace("InTransitTracking", { shipmentId, driverId });

  } catch (error) {
    console.error("❌ Error updating shipment status:", error);
    Alert.alert("Error", "Failed to update shipment status.");
  }
};



  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Pickup Images</Text>

      <ScrollView horizontal contentContainerStyle={styles.imageContainer}>
        {images.map((img, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: img }} style={styles.image} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => pickImage("camera")}>
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.buttonText}> Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => pickImage("gallery")}>
          <Ionicons name="folder" size={20} color="white" />
          <Text style={styles.buttonText}> Select from Gallery</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={images.length > 0 ? styles.uploadButton : styles.disabledButton}
        disabled={images.length === 0 || uploading}
        onPress={uploadImages}
      >
        {uploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color="white" />
            <Text style={styles.uploadButtonText}> Upload Images</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.navigateButton}
  onPress={handleNavigateToDrop} // ✅ Call function to update status and navigate
>
  <Text style={styles.buttonText}>Navigate to Drop</Text>
</TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  imageContainer: { flexDirection: "row", paddingVertical: 10 },
  imageWrapper: { position: "relative", marginRight: 10 },
  image: { width: 100, height: 100, borderRadius: 10 },
  closeButton: { position: "absolute", top: -5, right: -5 },
  uploadButton: { backgroundColor: "green", padding: 12, borderRadius: 5 },
  navigateButton: { backgroundColor: "blue", padding: 12, borderRadius: 5, marginTop: 10 },
});

export default ShipmentDocuments;
