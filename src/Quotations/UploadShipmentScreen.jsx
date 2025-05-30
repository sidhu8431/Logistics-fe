import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import DocumentPicker from "react-native-document-picker";
import axios from "axios";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';

const UploadShipmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [goodsImages, setGoodsImages] = useState([]);
  const [invoiceDocs, setInvoiceDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true); // Default to true

  // Extract shipment details from route params
  const { manufacturerId, shipmentId, transporterId } = route.params || {};

  // Improved function to check if location services are enabled
  const checkLocationEnabled = async () => {
    if (Platform.OS === 'android') {
      try {
        // First method: Try using the isLocationEnabled method if available
        if (typeof Geolocation.isLocationEnabled === 'function') {
          const isEnabled = await Geolocation.isLocationEnabled();
          console.log("Location enabled check (method 1):", isEnabled);
          setIsLocationEnabled(isEnabled);
          return isEnabled;
        }
        
        // Second method: Try to get current position as a test
        return new Promise((resolve) => {
          Geolocation.getCurrentPosition(
            (position) => {
              console.log("Location enabled check (method 2): true - got position");
              setIsLocationEnabled(true);
              resolve(true);
            },
            (error) => {
              console.log("Location enabled check (method 2) error:", error);
              // Error code 2 means location services are disabled
              if (error.code === 2) {
                console.log("Location services are disabled");
                setIsLocationEnabled(false);
                resolve(false);
              } else {
                // For other errors (permission denied, timeout), assume location services are enabled
                // but we may have permission issues
                console.log("Location services assumed enabled, but error occurred:", error.message);
                setIsLocationEnabled(true);
                resolve(true);
              }
            },
            { 
              enableHighAccuracy: false, 
              timeout: 5000, 
              maximumAge: 60000 
            }
          );
        });
      } catch (error) {
        console.error("Error checking location enabled status:", error);
        // If we can't check, assume it's enabled to avoid false warnings
        setIsLocationEnabled(true);
        return true;
      }
    }
    // For iOS, assume location services are available
    setIsLocationEnabled(true);
    return true;
  };

  // Improved permission handling function
  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, request location permission
        Geolocation.requestAuthorization('whenInUse').then((authStatus) => {
          const permissionGranted = authStatus === 'granted';
          console.log('iOS location permission status:', authStatus);
          setLocationPermissionGranted(permissionGranted);
          return permissionGranted;
        }).catch((error) => {
          console.error('iOS permission request error:', error);
          setLocationPermissionGranted(false);
          return false;
        });
        return true; // Return true for iOS to continue with the flow
      }

      // For Android
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      // Check specifically for location permissions
      const hasLocationPermission =
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

      console.log('Android location permission status:', {
        fine: granted['android.permission.ACCESS_FINE_LOCATION'],
        coarse: granted['android.permission.ACCESS_COARSE_LOCATION'],
        hasLocationPermission
      });

      setLocationPermissionGranted(hasLocationPermission);

      // Check camera and storage permissions too
      const allPermissionsGranted =
        granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        hasLocationPermission;

      if (!hasLocationPermission) {
        console.log('Location permission denied');
        Alert.alert(
          'Permission Required',
          'Location permission is required to get accurate address information. Please grant permission in your device settings.',
          [
            { text: 'Continue Anyway' },
            {
              text: 'Open Settings',
              onPress: () => {
                // This will open app settings on Android
                if (Platform.OS === 'android') {
                  PermissionsAndroid.openSettings();
                }
              }
            }
          ]
        );
      }

      return hasLocationPermission;
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  };

  useEffect(() => {
    console.log('Received shipment details in UploadShipmentScreen:', {
      manufacturerId,
      shipmentId,
      transporterId
    });

    // Initialize everything
    const initializeScreen = async () => {
      // Request permissions first
      const hasPermission = await requestPermissions();
      
      // Set up Geolocation config
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
        enableBackgroundLocationUpdates: false
      });

      // Check if location services are enabled (with delay to allow permissions to settle)
      setTimeout(async () => {
        const locationEnabled = await checkLocationEnabled();
        console.log('Location services enabled:', locationEnabled);
      }, 1000);
    };

    initializeScreen();
  }, [manufacturerId, shipmentId, transporterId]);

  // Function to convert longitude and latitude to address using OpenStreetMap Nominatim
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      console.log(`Getting address for coordinates: ${latitude}, ${longitude}`);

      // Use a more reliable API with proper error handling
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LogisticsApp/1.0', // Use your app name
            'Accept-Language': 'en'
          },
          timeout: 8000 // 8 seconds timeout
        }
      );

      console.log("Address API response status:", response.status);

      if (response.data && response.data.display_name) {
        console.log("Got address:", response.data.display_name);
        return response.data.display_name;
      }

      console.log("No address found in API response");
      return `${latitude}, ${longitude}`;
    } catch (error) {
      // Better error logging
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error("Address API error response:", {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Address API no response:", error.request);
      } else {
        // Something happened in setting up the request
        console.error("Address API error:", error.message);
      }

      return `${latitude}, ${longitude}`;
    }
  };

  // Function to convert timestamp to IST
  const convertToIST = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };

    return new Intl.DateTimeFormat('en-IN', options).format(date);
  };

  // More robust location retrieval function
  const getLocation = () => {
    return new Promise((resolve) => {
      // First check if we have permission
      if (!locationPermissionGranted) {
        console.log("Location permission not granted, using default location");
        resolve(null);
        return;
      }

      // Set a timeout to avoid UI freezes
      const locationTimeout = setTimeout(() => {
        console.log("Location fetch timed out");
        resolve(null);
      }, 15000); // 15 seconds max wait

      // Configure geolocation
      if (Platform.OS === 'android') {
        // For Android, explicitly set these settings
        Geolocation.setRNConfiguration({
          skipPermissionRequests: false,
          authorizationLevel: 'whenInUse',
          enableBackgroundLocationUpdates: false
        });
      }

      // Get current position with improved error handling
      Geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          console.log("Got location successfully:", position.coords);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          clearTimeout(locationTimeout);
          console.error("Location retrieval error:", {
            code: error.code,
            message: error.message
          });

          // Show error based on error code
          if (error.code === 1) {
            // Permission denied
            console.log("Location permission denied by user");
            setLocationPermissionGranted(false);
          } else if (error.code === 2) {
            // Position unavailable - this could mean location services are disabled
            console.log("Position unavailable - location services might be disabled");
            setIsLocationEnabled(false);
          } else if (error.code === 3) {
            // Timeout
            console.log("Location request timed out");
          }

          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,  // 12 seconds timeout
          maximumAge: 30000, // Accept 30-second old location data
          distanceFilter: 10 // Minimum distance in meters to trigger update
        }
      );
    });
  };

  // Improved media selection handler with better location integration
  const handleMediaSelection = async (type, source) => {
    try {
      // First request permissions if not already granted
      const hasLocationPermission = await requestPermissions();
      console.log("Permission check result:", { hasLocationPermission });

      // Re-check location services status
      const locationEnabled = await checkLocationEnabled();

      // Proceed with media selection
      const result = source === "camera"
        ? await launchCamera({ mediaType: "photo", quality: 0.7, cameraType: 'back', saveToPhotos: true })
        : await launchImageLibrary({ mediaType: "photo", quality: 0.7 });

      console.log('Media selection result:', result.assets ? 'Success' : 'Cancelled');

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const timestamp = file.timestamp || new Date().getTime();

        // Convert timestamp to IST
        const istTimestamp = convertToIST(timestamp);
        console.log('IST Time Stamp:', istTimestamp);

        // Get device name
        const deviceName = await DeviceInfo.getDeviceName();

        // Create the new file object
        const newFile = {
          uri: file.uri,
          name: file.fileName || `file_${Date.now()}.jpg`,
          type: file.type || "image/jpeg",
          timestamp,
          istTimestamp,
          location: null, // Will be updated after location fetch
          address: "Getting location...",
          deviceName,
        };

        // Add to state immediately for better UX
        if (type === "goods") {
          setGoodsImages(prev => [...prev, newFile]);
        } else if (type === "invoice") {
          setInvoiceDocs(prev => [...prev, newFile]);
        }

        // Start location fetch in background
        if (hasLocationPermission && locationEnabled) {
          console.log("Starting location fetch for media");
          try {
            // Get location data
            const location = await getLocation();
            console.log("Location fetch result:", location);

            let address = "Location unavailable";

            if (location && location.latitude && location.longitude) {
              console.log("Getting address for location");
              // Get address from coordinates
              address = await getAddressFromCoordinates(
                location.latitude,
                location.longitude
              );
            } else {
              console.log("No location data available");
            }

            // Update file with location info
            const updatedFile = {
              ...newFile,
              location,
              address
            };

            // Update state with the location data
            if (type === "goods") {
              setGoodsImages(prev => prev.map(item =>
                item.uri === newFile.uri ? updatedFile : item
              ));
            } else if (type === "invoice") {
              setInvoiceDocs(prev => prev.map(item =>
                item.uri === newFile.uri ? updatedFile : item
              ));
            }
          } catch (locErr) {
            console.error("Location processing error:", locErr);

            // Update with error info
            const updatedFile = {
              ...newFile,
              address: "Location error"
            };

            // Update state with error message
            if (type === "goods") {
              setGoodsImages(prev => prev.map(item =>
                item.uri === newFile.uri ? updatedFile : item
              ));
            } else if (type === "invoice") {
              setInvoiceDocs(prev => prev.map(item =>
                item.uri === newFile.uri ? updatedFile : item
              ));
            }
          }
        } else {
          console.log("No location permission or location services disabled, skipping location fetch");

          // Update the file immediately to show no permission
          const updatedFile = {
            ...newFile,
            address: hasLocationPermission ? "Location services disabled" : "No location permission"
          };

          // Update state
          if (type === "goods") {
            setGoodsImages(prev => prev.map(item =>
              item.uri === newFile.uri ? updatedFile : item
            ));
          } else if (type === "invoice") {
            setInvoiceDocs(prev => prev.map(item =>
              item.uri === newFile.uri ? updatedFile : item
            ));
          }
        }
      }
    } catch (err) {
      console.error("Media selection error:", err);
      Alert.alert("Error", "Something went wrong while selecting media.");
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        allowMultiSelection: true,
      });

      // For PDF docs, we don't need location info
      const formattedDocs = result.map((doc) => ({
        uri: doc.uri,
        name: doc.name || `doc_${Date.now()}.pdf`,
        type: doc.type || "application/pdf",
        timestamp: new Date().toISOString(),
        istTimestamp: convertToIST(new Date().toISOString()),
      }));

      setInvoiceDocs([...invoiceDocs, ...formattedDocs]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert("Error", "Failed to pick a document.");
      }
    }
  };

  const removeImage = (index, type) => {
    if (type === "goods") {
      setGoodsImages(goodsImages.filter((_, i) => i !== index));
    } else {
      setInvoiceDocs(invoiceDocs.filter((_, i) => i !== index));
    }
  };

  // Improved upload function with better error handling
  const uploadAllFiles = async () => {
    if (goodsImages.length === 0 && invoiceDocs.length === 0) {
      Alert.alert("No files selected", "Please add images or documents to upload.");
      return;
    }

    if (!shipmentId || !manufacturerId) {
      Alert.alert("Missing Data", "Shipment ID or Manufacturer ID is missing.");
      return;
    }

    setIsUploading(true);

    // Function to upload a single file type with improved error handling
    const uploadFiles = async (files, documentType) => {
      const formData = new FormData();
      formData.append("shipmentId", shipmentId);
      formData.append("manufacturerId", manufacturerId);
      formData.append("documentType", documentType);

      files.forEach((file) => {
        // Add location data to the form data if available
        if (file.location) {
          formData.append("latitude", file.location.latitude.toString());
          formData.append("longitude", file.location.longitude.toString());
        } else {
          // Add default values when location not available
          formData.append("latitude", "0");
          formData.append("longitude", "0");
        }

        if (file.address && file.address !== "Getting location...") {
          formData.append("address", file.address);
        } else {
          formData.append("address", "Address not available");
        }

        if (file.istTimestamp) {
          formData.append("timestamp", file.istTimestamp);
        }

        formData.append("files", {
          uri: file.uri,
          name: file.name,
          type: file.type
        });
      });

      try {
        console.log(`Uploading ${documentType} files:`, files.length);
        console.log('Using shipmentId:', shipmentId, 'and manufacturerId:', manufacturerId);

        // Add retry mechanism for API failures
        let retries = 3;
        let response = null;

        while (retries > 0) {
          try {
            response = await axios.post(
              "http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/shipmentDocuments/upload",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  "Accept": "application/json"
                },
                timeout: 30000, // 30 seconds timeout
              }
            );
            break; // Break if successful
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            console.log(`Retrying upload... (${retries} attempts left)`);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
          }
        }

        console.log(`${documentType} upload response:`, response.data);
        return true;
      } catch (error) {
        console.error(`Upload error for ${documentType}:`, error.response ? error.response.data : error.message);
        throw error; // Propagate error with more context
      }
    };

    try {
      let successCount = 0;
      let failedUploads = [];
      let totalUploads = 0;

      if (goodsImages.length > 0) {
        totalUploads++;
        try {
          await uploadFiles(goodsImages, "PICKUP_IMAGE");
          successCount++;
        } catch (error) {
          failedUploads.push("goods images");
          console.error("Goods images upload failed:", error);
        }
      }

      if (invoiceDocs.length > 0) {
        totalUploads++;
        try {
          await uploadFiles(invoiceDocs, "INVOICE");
          successCount++;
        } catch (error) {
          failedUploads.push("invoice documents");
          console.error("Invoice docs upload failed:", error);
        }
      }

      setIsUploading(false);

      if (successCount === totalUploads) {
        Alert.alert("Success", "All files uploaded successfully", [
          { text: "OK", onPress: () => navigation.navigate('TrackingApp') }
        ]);
      } else if (successCount > 0) {
        Alert.alert(
          "Partial Success",
          `${successCount} of ${totalUploads} uploads completed successfully. Failed uploads: ${failedUploads.join(", ")}`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Upload Failed",
          "All uploads failed. Please check your network connection and try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      setIsUploading(false);
      console.error("Upload error:", error);
      Alert.alert(
        "Error",
        "Failed to upload files. Please check your network connection and try again."
      );
    }
  };

  // Custom component for showing images with location and timestamp
  const ImageWithInfo = ({ image, index, type }) => (
    <View style={styles.imageContainer}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: image.uri }} style={styles.image} />
        <TouchableOpacity
          onPress={() => removeImage(index, type)}
          style={styles.removeButton}
        >
          <Icon name="close" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageInfoContainer}>
        {image.istTimestamp && (
          <View style={styles.infoRow}>
            <Icon name="access-time" size={12} color="#757575" />
            <Text style={styles.infoText} numberOfLines={1}>{image.istTimestamp}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="location-on" size={12} color="#757575" />
          {image.address === "Getting location..." ? (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={[styles.infoText, {marginRight: 4}]}>Getting location</Text>
              <ActivityIndicator size="small" color="#757575" />
            </View>
          ) : (
            <Text style={styles.infoText} numberOfLines={2}>
              {image.address === "Location unavailable" ?
                "Location unavailable" : image.address}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Upload Shipment Documents</Text>
        <Text style={styles.subHeader}>
          Add photos of goods and invoice documents for shipment #{shipmentId}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Icon name="photo-camera" size={20} color="#4a4a4a" />
          <Text style={styles.sectionHeader}>Goods Images</Text>
          <Text style={styles.count}>{goodsImages.length} added</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleMediaSelection("goods", "camera")}
            style={styles.primaryButton}
          >
            <Icon name="camera-alt" size={16} color="#fff" />
            <Text style={styles.buttonTextWhite}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMediaSelection("goods", "gallery")}
            style={styles.secondaryButton}
          >
            <Icon name="photo-library" size={16} color="#4285F4" />
            <Text style={styles.buttonTextBlue}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {goodsImages.length > 0 && (
          <View style={styles.previewContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {goodsImages.map((img, index) => (
                <ImageWithInfo
                  key={index}
                  image={img}
                  index={index}
                  type="goods"
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Icon name="description" size={20} color="#4a4a4a" />
          <Text style={styles.sectionHeader}>Invoices & Bills</Text>
          <Text style={styles.count}>{invoiceDocs.length} added</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleMediaSelection("invoice", "camera")}
            style={styles.primaryButton}
          >
            <Icon name="camera-alt" size={16} color="#fff" />
            <Text style={styles.buttonTextWhite}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMediaSelection("invoice", "gallery")}
            style={styles.secondaryButton}
          >
            <Icon name="photo-library" size={16} color="#4285F4" />
            <Text style={styles.buttonTextBlue}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDocumentPicker}
            style={styles.secondaryButton}
          >
            <Icon name="insert-drive-file" size={16} color="#4285F4" />
            <Text style={styles.buttonTextBlue}>Documents</Text>
          </TouchableOpacity>
        </View>

        {invoiceDocs.length > 0 && (
          <View style={styles.previewContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {invoiceDocs.map((doc, index) => {
                // Check if this is an image type
                const isImage = doc.type && doc.type.startsWith('image');

                return isImage ? (
                  // Image preview with location and timestamp for invoice images
                  <ImageWithInfo
                    key={index}
                    image={doc}
                    index={index}
                    type="invoice"
                  />
                ) : (
                  // Document item for non-image files
                  <View key={index} style={styles.documentItem}>
                    <View style={styles.docInfo}>
                      <Icon
                        name={doc.type.includes('pdf') ? 'picture-as-pdf' : 'insert-drive-file'}
                        size={22}
                        color={doc.type.includes('pdf') ? '#F44336' : '#4CAF50'}
                      />
                      <Text style={styles.docName} numberOfLines={1} ellipsizeMode="middle">
                        {doc.name}
                      </Text>
                    </View>
                    {doc.istTimestamp && (
                      <View style={styles.infoRow}>
                        <Icon name="access-time" size={12} color="#757575" />
                        <Text style={styles.infoText} numberOfLines={1}>{doc.istTimestamp}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => removeImage(index, "invoice")}
                      style={styles.removeDocButton}
                    >
                      <Icon name="close" size={16} color="#757575" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {!locationPermissionGranted && (
        <View style={styles.warningContainer}>
          <Icon name="warning" size={18} color="#F57C00" />
          <Text style={styles.warningText}>
            Location permission not granted. Images will be uploaded without location data.
          </Text>
        </View>
      )}

      {!isLocationEnabled && locationPermissionGranted && (
        <View style={styles.warningContainer}>
          <Icon name="gps-off" size={18} color="#F57C00" />
          <Text style={styles.warningText}>
            Location services are disabled. Please enable them in your device settings for accurate location information.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={uploadAllFiles}
        style={[
          styles.uploadButton,
          (goodsImages.length === 0 && invoiceDocs.length === 0) && styles.uploadButtonDisabled
        ]}
        disabled={isUploading || (goodsImages.length === 0 && invoiceDocs.length === 0)}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Icon name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>
              Upload {goodsImages.length + invoiceDocs.length} Files
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// Styles remain the same as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: '#212121',
  },
  subHeader: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: '#212121',
    marginLeft: 8,
    flex: 1,
  },
  count: {
    fontSize: 12,
    color: '#757575',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTextWhite: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 6,
  },
  buttonTextBlue: {
    color: "#4285F4",
    fontWeight: "500",
    marginLeft: 6,
  },
  previewContainer: {
    marginTop: 10,
  },
  imageContainer: {
    width: 160,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageWrapper: {
    position: "relative",
    width: 160,
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  imageInfoContainer: {
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#616161',
    marginLeft: 4,
    flex: 1,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  documentsList: {
    marginTop: 10,
  },
  documentItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginRight: 8,
    width: 220,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  docName: {
    marginLeft: 10,
    color: '#212121',
    fontSize: 14,
    flex: 1,
  },
  removeDocButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#f0f0f0',
  },
  divider: {
    height: 6,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
  },
  warningText: {
    fontSize: 13,
    color: '#5D4037',
    marginLeft: 8,
    flex: 1,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    margin: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  uploadButtonDisabled: {
    backgroundColor: "#A5D6A7",
    opacity: 0.7,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default UploadShipmentScreen;
