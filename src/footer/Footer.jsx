import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Footer = ({ navigation }) => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
    };
    fetchRole();
  }, []);

  const handleHomeNavigation = () => {
    switch (role) {
      case 'MANUFACTURER':
        navigation.navigate('TrackingApp');
        break;
      case 'TRANSPORTER':
        navigation.navigate('Dashboard');
        break;
      case 'DRIVER':
        navigation.navigate('DriverDashboard');
        break;
      default:
        Alert.alert('Error', 'Unknown role');
    }
  };

  const handleShipmentsNavigation = () => {
    switch (role) {
      case 'MANUFACTURER':
        navigation.navigate('ShipmentList');
        break;
      case 'TRANSPORTER':
        navigation.navigate('TransporterShipmentScreen');
        break;
      case 'DRIVER':
        navigation.navigate('DriverShipment');
        break;
      default:
        Alert.alert('Error', 'Unknown role for shipments');
    }
  };

  const handleShipmentsQuotation = () => {
    switch (role) {
      case 'MANUFACTURER':
        navigation.navigate('ShipmentsQuotation');
        break;
      case 'TRANSPORTER':
        navigation.navigate('TransporterQuotations');
        break;
      case 'DRIVER':
        navigation.navigate('');
        break;
      default:
        Alert.alert('Error', 'Unknown role for shipments');
    }
  };


  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={handleHomeNavigation} style={styles.footerItem}>
        <Text style={[styles.footerIcon, styles.activeIcon]}>🏠</Text>
        <Text style={[styles.footerText, styles.activeText]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShipmentsQuotation} style={styles.footerItem}>
        <Text style={styles.footerIcon}>🧮</Text>
        <Text style={styles.footerText}>Quotations</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShipmentsNavigation} style={styles.footerItem}>
        <Text style={styles.footerIcon}>📦</Text>
        <Text style={styles.footerText}>Shipments</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('DetailsPage')} style={styles.footerItem}>
        <Text style={styles.footerIcon}>👤</Text>
        <Text style={styles.footerText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 24,
    color: '#aaa',
  },
  footerText: {
    fontSize: 14,
    marginTop: 2,
    color: '#000',
  },
  activeIcon: {
    color: '#6200ee',
  },
  activeText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
});

export default Footer;
