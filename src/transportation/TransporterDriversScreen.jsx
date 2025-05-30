import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransporterDriversScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      const transporterId = await AsyncStorage.getItem('transporterId');
      if (!transporterId) {
        Alert.alert('Error', 'Transporter ID not found in storage.');
        return;
      }

      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/transportDriver/getTd/${transporterId}`);
      if (response.ok) {
        const data = await response.json();
        // Extract only the driver part from each object
        const mappedDrivers = data.map((entry) => entry.driver);
        setDrivers(mappedDrivers);
      } else {
        Alert.alert('Error', 'Failed to fetch driver data from server.');
      }
    } catch (error) {
      console.error('Driver fetch error:', error);
      Alert.alert('Error', 'Something went wrong while fetching drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const renderItem = ({ item }) => {
  const getStatusColor = (status) => {
    if (status === 'ASSIGNED') return '#8b5cf6';
    if (status === 'AVAILABLE') return 'green';
    return 'red';
  };

  return (
    <View style={styles.card}>
      <Image
        source={require('../assets/delivery.png')}
        style={styles.profileImage}
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>👤 {item.name}</Text>
        <Text style={styles.subText}>📞 {item.phoneNumber || 'Not Available'}</Text>
        <Text style={styles.subText}>
          License: {item.driverLicenseNumber || 'Not Provided'}
        </Text>

        {/* Status with colored dot */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.driverStatus) },
            ]}
          />
          <Text style={[styles.subText, { color: getStatusColor(item.driverStatus), marginLeft: 6 }]}>
            Status: {item.driverStatus || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
};



  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Drivers</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1e40af" />
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item.driverId?.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default TransporterDriversScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f7', padding: 16 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1e293b' },
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 16,
    resizeMode: 'cover',
  },
  detailsContainer: {
    flex: 1,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  subText: { fontSize: 14, color: '#475569' },
  statusRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},
statusDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
},

});
