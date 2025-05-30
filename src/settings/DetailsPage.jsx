import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView,Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PersonalDetailsForm from './PersonalDetailsForm';
import AccountDetailsForm from './AccountDetailsForm';
import VehicleInfoForm from './VehicleInfoForm';
import MyDrivers from './MyDrivers';
import DocumentsForm from './DocumentsForm';
import UpdatePasswordForm from './UpdatePasswordScreen';
import CompanyDetailsForm from './CompanyDetailsForm';
import DriverDetailsForm from './DriverDetailsForm';

const { width } = Dimensions.get('window');

const DetailsPage = () => {
  const [activeTab, setActiveTab] = useState('PersonalDetails');
  const [userRole, setUserRole] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        setUserRole(role);
      } catch (error) {
        Alert.alert('Error', 'Failed to retrieve user role');
      }
    };
    fetchUserRole();
  }, []);

  const tabs = [
    { key: 'PersonalDetails', label: 'Personal Details', roles: ['TRANSPORTER', 'DRIVER', 'MANUFACTURER'] },
    { key: 'AccountDetails', label: 'Account Details', roles: ['TRANSPORTER', 'DRIVER', 'MANUFACTURER'] },
    { key: 'VehicleInfo', label: 'Vehicle Info', roles: ['TRANSPORTER'] },
    { key: 'MyDrivers', label: 'My Drivers', roles: ['TRANSPORTER'] },
    { key: 'Documents', label: 'Documents', roles: ['TRANSPORTER', 'DRIVER', 'MANUFACTURER'] },
    { key: 'UpdatePassword', label: 'Update Password', roles: ['TRANSPORTER', 'DRIVER', 'MANUFACTURER'] },
    { key: 'CompanyDetails', label: 'Company Details', roles: ['TRANSPORTER', 'MANUFACTURER'] },
    { key: 'DriverDetails', label: 'Driver Details', roles: ['DRIVER'] },

  ];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainerWrapper}>
        <ScrollView horizontal ref={scrollViewRef} showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          {tabs
            .filter(tab => tab.roles.includes(userRole))
            .map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={styles.tabText}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Forms (Wrapped in ScrollView) */}
      <KeyboardAvoidingView style={styles.formContainer} behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
          {activeTab === 'PersonalDetails' && <PersonalDetailsForm />}
          {activeTab === 'AccountDetails' && <AccountDetailsForm />}
          {activeTab === 'VehicleInfo' && <VehicleInfoForm />}
          {activeTab === 'MyDrivers' && <MyDrivers />}
          {activeTab === 'Documents' && <DocumentsForm />}
          {activeTab === 'UpdatePassword' && <UpdatePasswordForm />}
          {activeTab === 'CompanyDetails' && <CompanyDetailsForm />}
          {activeTab === 'DriverDetails' && <DriverDetailsForm />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabsContainerWrapper: {
    height: 50,
    backgroundColor: '#4b0082',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
});

export default DetailsPage;
