import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const UserProfile = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // Clear all relevant AsyncStorage data stored during login
              const keysToRemove = [
                'token',
                'role',
                'userId',
                'manufacturerId',
                'transporterId',
                'driverId'
              ];
              
              // Check if data exists before removing
              const values = await AsyncStorage.multiGet(keysToRemove);
              const existingData = values.filter(item => item[1] !== null);
              
              // Remove all keys in a single operation
              await AsyncStorage.multiRemove(keysToRemove);
              
              // Verify data was removed
              const afterRemoval = await AsyncStorage.multiGet(keysToRemove);
              const removedSuccess = afterRemoval.every(item => item[1] === null);
              
              console.log('🔑 Login data cleared successfully:', removedSuccess);
              console.log('Keys removed:', existingData.map(item => item[0]));
              
              // If you're tracking location for drivers, stop that too
              if (global.locationInterval) {
                clearInterval(global.locationInterval);
                global.locationInterval = null;
                console.log('🚫 Stopped location tracking');
              }
              
              // Redirect to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('❌ Error during logout:', error);
              Alert.alert('Error', 'Failed to logout completely');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#e53935',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserProfile;