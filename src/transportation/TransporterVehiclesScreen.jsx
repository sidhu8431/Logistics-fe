import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Linking
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';

const screenWidth = Dimensions.get('window').width;

const TransporterVehiclesScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleImagesMap, setVehicleImagesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);

  const getStatusColor = (status) => {
    if (status === 'AVAILABLE') return 'green';
    if (status === 'ASSIGNED') return '#8b5cf6';
    return 'red';
  };

 const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Storage Access Required',
            message: 'App needs access to your images to upload vehicle images.',
            buttonPositive: 'Allow',
          }
        );

        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Required',
            'Please enable storage permission in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        } else {
          return false;
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  } else {
    return true; // iOS
  }
};


  const fetchVehicleImages = async (vehicleId) => {
    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/vehicleImage/vehicle/${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error(`Image fetch failed for vehicle ${vehicleId}:`, err.message);
    }
    return [];
  };

  const fetchAllVehicleImages = async (vehiclesList) => {
    const imageMap = {};
    for (const vehicle of vehiclesList) {
      const images = await fetchVehicleImages(vehicle.vehicleId);
      imageMap[vehicle.vehicleId] = images;
    }
    setVehicleImagesMap(imageMap);
  };

  const fetchVehicles = async () => {
    try {
      const transporterId = await AsyncStorage.getItem('transporterId');
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/vehicles/transporter/${transporterId}`);
      const data = await response.json();
      setVehicles(data);
      await fetchAllVehicleImages(data);
    } catch (error) {
      Alert.alert('Network Error', 'Unable to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleViewImages = (images) => {
    setSelectedImages(images);
    setPopupVisible(true);
    setExpandedImage(null);
  };

  const toggleImageSize = (image) => {
    if (expandedImage === image) {
      setExpandedImage(null);
    } else {
      setExpandedImage(image);
    }
  };

  const handleAddImage = async (vehicleId) => {
    try {
      const hasPermission = await requestStoragePermission();
      console.log("Storage permission result:", hasPermission);

      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage permission is needed to upload images.');
        return;
      }

      const transporterId = await AsyncStorage.getItem('transporterId');
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        allowMultiSelection: false,
      });

      const file = result[0];

      const formData = new FormData();
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      });

      const response = await fetch(
        `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/vehicleImage/upload/${transporterId}/${vehicleId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Image uploaded successfully');
        fetchVehicles(); // Refresh
      } else {
        Alert.alert('Upload Failed', 'Something went wrong while uploading.');
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        Alert.alert('Error', 'Could not select or upload file');
        console.error(err);
      }
    }
  };

  const renderItem = ({ item }) => {
    const images = vehicleImagesMap[item.vehicleId] || [];

    return (
      <View style={styles.card}>
        <Text style={styles.title}>🚚 {item.vehicleNumber}</Text>
        <Text style={[styles.statusText, { color: getStatusColor(item.vehicleStatus) }]}>
          Status: {item.vehicleStatus}
        </Text>
        <Text style={styles.fieldLabel}>
          Fuel Type: <Text style={styles.fieldValue}>{item.fuelType}</Text>
        </Text>
        <Text style={styles.fieldLabel}>
          Vehicle Type: <Text style={styles.fieldValue}>{item.vehicleType}</Text>
        </Text>
        <Text style={[styles.fieldLabel, { color: item.refrigerator ? 'green' : 'red' }]}>
          Refrigerator: <Text style={styles.fieldValue}>{item.refrigerator ? 'Yes' : 'No'}</Text>
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            images.length > 0
              ? handleViewImages(images)
              : Alert.alert('No Images', 'No images available for this vehicle.')
          }
        >
          <Text style={styles.buttonText}>View Images</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { marginTop: 6, backgroundColor: '#4f46e5' }]}
          onPress={() => handleAddImage(item.vehicleId)}
        >
          <Text style={styles.buttonText}>Add Image</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Vehicles</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1e40af" />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.vehicleId?.toString()}
          renderItem={renderItem}
        />
      )}

      <Modal visible={popupVisible} animationType="fade" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupTitle}>Vehicle Images</Text>
            <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
              {selectedImages.map((img) => (
                <TouchableOpacity key={img.vehicleImageId} onPress={() => toggleImageSize(img)}>
                  <Image
                    source={{ uri: img.s3Url }}
                    style={
                      expandedImage === img
                        ? styles.expandedImage
                        : styles.thumbnailImage
                    }
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPopupVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TransporterVehiclesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f7', padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1e293b' },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 4,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  statusText: { fontSize: 16, fontWeight: 'bold', marginTop: 6 },
  fieldLabel: { fontSize: 16, fontWeight: 'bold', color: '#475569', marginTop: 4 },
  fieldValue: { fontWeight: 'bold' },
  button: {
    marginTop: 10,
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  thumbnailImage: {
    width: screenWidth * 0.4,
    height: 100,
    margin: 5,
    borderRadius: 8,
  },
  expandedImage: {
    width: screenWidth * 0.85,
    height: screenWidth * 0.85,
    marginVertical: 10,
    borderRadius: 10,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
