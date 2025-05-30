import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import DocumentPicker from "react-native-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000";
const API_BASE_URL2 = "http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080";

const DocumentsForm = () => {
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedUserRole = await AsyncStorage.getItem("role"); // Fetching role from AsyncStorage

        if (!storedUserId || storedUserId === "null") {
          Alert.alert("Error", "User ID not found. Please login again.");
          return;
        }

        setUserId(storedUserId);
        setUserRole(storedUserRole?.toUpperCase() || null); // Convert role to uppercase for consistency

        // Fetch uploaded documents after setting user details
        await fetchUploadedDocs(storedUserId);

      } catch (error) {
        console.error("Error retrieving user details from AsyncStorage:", error);
      }
    };

    getUserDetails();
}, []);


  const fetchUploadedDocs = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL2}/documents/user/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        console.warn("Error fetching uploaded documents:", data?.message || "Unknown error");
        return;
      }

      if (!Array.isArray(data)) {
        console.warn("Unexpected API response:", data);
        return;
      }

      console.log("Fetched Uploaded Documents:", data);

      const uploadedFiles = {};
      data.forEach((doc) => {
        uploadedFiles[doc.documentType.toLowerCase()] = true;
      });

      setUploadedDocs(uploadedFiles);
    } catch (error) {
      console.error("Fetch documents error:", error);
    }
  };
  
  const handleSelectFile = async (docType) => {
    try {
      if (uploadedDocs[docType]) {
        Alert.alert("Already Uploaded", `${docType} is already uploaded.`);
        return;
      }

      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });

      Alert.alert("Success", `${docType} selected successfully!`);
      await verifyAndStoreDocument(result, docType);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        Alert.alert("Cancelled", "No file selected");
      } else {
        console.error(error);
        Alert.alert("Error", "Failed to upload document");
      }
    }
  };

  const verifyAndStoreDocument = async (file, docType) => {
    if (!userId) {
      Alert.alert("Error", "User ID not found. Cannot verify documents.");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("doc_type", formatDocType(docType));
      formData.append("file", {
        uri: file.uri.startsWith("file://") ? file.uri.replace("file://", "") : file.uri,
        name: file.fileName || file.name,
        type: file.type || "image/jpeg",
      });

      const verifyResponse = await fetch(`${API_BASE_URL}/verify/`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const verifyData = await verifyResponse.json();
      setIsLoading(false);

      if (!verifyResponse.ok || verifyData.status !== "success") {
        Alert.alert("Verification Failed", "Document verification failed. Please try again.");
        return;
      }

      Alert.alert("Success", `${docType} verified successfully!`);
      await uploadDocument(file, docType);
    } catch (error) {
      setIsLoading(false);
      console.error("Verification error:", error);
      Alert.alert("Error", "Failed to verify document. Please try again.");
    }
  };

  const uploadDocument = async (file, docType) => {
    try {
      if (!userId) {
        Alert.alert("Error", "User ID is missing. Please try again.");
        return;
      }

      setIsLoading(true);
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("documentType", formatDocType(docType));
      formData.append("file", {
        uri: file.uri.startsWith("file://") ? file.uri.replace("file://", "") : file.uri,
        name: file.fileName || file.name,
        type: file.type || "image/jpeg",
      });

      console.log("Uploading Document:", docType);
      console.log("FormData:", formData);

      const response = await fetch(`${API_BASE_URL}/encrypt/upload`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.message === "File uploaded and metadata stored successfully") {
        setUploadedDocs((prev) => ({ ...prev, [docType]: true }));
        Alert.alert("Success", `${docType} uploaded successfully!`);
      } else if (data.message.includes("already exists")) {
        Alert.alert("Already Uploaded", `${docType} is already uploaded.`);
      } else {
        console.warn("Upload Failed Response:", data);
        Alert.alert("Upload Failed", `Failed to upload ${docType}`);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload document.");
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Profile Documents</Text>
      {isLoading && <ActivityIndicator size="large" color="#4b0082" />}
  
      {["pan_card", "aadhar_card", "profile_picture", "license"].map((docType) => (
        <View key={docType} style={styles.documentRow}>
          <Text style={styles.documentLabel}>{formatLabel(docType)}</Text>
  
          <TouchableOpacity
            style={[
              styles.fileButton,
              uploadedDocs[docType] ? styles.uploadedButton : styles.selectButton,
            ]}
            onPress={() => handleSelectFile(docType)}
            disabled={uploadedDocs[docType]}
          >
            <Text style={[styles.fileButtonText, uploadedDocs[docType] && styles.uploadedText]}>
              {uploadedDocs[docType] ? "✔ File Uploaded" : "📂 Select File"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
  
      {(userRole === "MANUFACTURER" || userRole === "TRANSPORTER") && (
        <>
          <Text style={styles.companyHeading}>Company Details</Text>
          <View style={styles.separator} />
  
          {["gst_card", "company_pan_card"].map((docType) => (
            <View key={docType} style={styles.documentRow}>
              <Text style={styles.documentLabel}>{formatLabel(docType)}</Text>
  
              <TouchableOpacity
                style={[
                  styles.fileButton,
                  uploadedDocs[docType] ? styles.uploadedButton : styles.selectButton,
                ]}
                onPress={() => handleSelectFile(docType)}
                disabled={uploadedDocs[docType]}
              >
                <Text style={[styles.fileButtonText, uploadedDocs[docType] && styles.uploadedText]}>
                  {uploadedDocs[docType] ? "✔ File Uploaded" : "📂 Select File"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const formatLabel = (key) => key.replace(/_/g, " ").replace(/^./, (str) => str.toUpperCase());

const formatDocType = (docType) => ({
  pan_card: "PAN_CARD",
  aadhar_card: "AADHAR_CARD",
  profile_picture: "PROFILE_PICTURE",
  license: "LICENSE",
  gst_card: "GST_CARD",
  company_pan_card: "COMPANY_PAN_CARD",
}[docType] || docType.toUpperCase());

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: "#F9FAFC" },
  container: { padding: 12 },
  heading: { fontSize: 20, fontWeight: "bold", marginVertical: 12, textAlign: "center", color: "#4B0082" },
  documentRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, backgroundColor: "#FFF", padding: 10, borderRadius: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 2, elevation: 1 },
  documentLabel: { fontSize: 14, color: "#333", flex: 2 },
  fileButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: "center", flex: 1 },
  selectButton: { backgroundColor: "#DAB1DA" },
  uploadedButton: { backgroundColor: "#32CD32" },
  fileButtonText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  uploadedText: { color: "#fff" },
  companyHeading: { fontSize: 16, fontWeight: "bold", color: "#4B0082", marginTop: 16, textAlign: "center" },
  separator: { height: 1, backgroundColor: "#ccc", marginVertical: 8 },
});

export default DocumentsForm;
