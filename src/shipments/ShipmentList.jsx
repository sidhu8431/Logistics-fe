import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
 
const { width } = Dimensions.get('window');
 
const ShipmentList = () => {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const navigation = useNavigation();
  const fadeAnim = useState(new Animated.Value(0))[0];
 
  const fetchShipments = async () => {
    try {
      const manufacturerId = await AsyncStorage.getItem('manufacturerId');
      if (!manufacturerId) {
        console.error('Manufacturer ID not found in AsyncStorage');
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/manufacturer/${manufacturerId}`);
      setShipments(response.data);
      setFilteredShipments(response.data);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShipments();
  };
 
  const handleFilterChange = (status) => {
    setSelectedFilter(status);
    if (status === 'ALL') {
      setFilteredShipments(shipments);
    } else {
      setFilteredShipments(shipments.filter((shipment) => shipment.shipmentStatus === status));
    }
  };
 
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FFE5CC', text: '#FF8C00' };
      case 'ACCEPTED': return { bg: '#FFF3E0', text: '#FB8C00' };
      case 'IN_TRANSIT': return { bg: '#E5F2FF', text: '#1976D2' };
      case 'DELIVERED': return { bg: '#E0F2E0', text: '#388E3C' };
      case 'CANCELLED': return { bg: '#FFE0E0', text: '#D32F2F' };
      case 'COMPLETED': return { bg: '#FFE0E0', text: '#00796B' };
      default: return { bg: '#F5F5F5', text: '#757575' };
    }
  };
 
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return 'clock-outline';
      case 'ACCEPTED': return 'thumb-up-outline'
      case 'IN_TRANSIT': return 'truck-delivery';
      case 'DELIVERED': return 'check-circle-outline';
      case 'CANCELLED': return 'close-circle-outline';
      case 'COMPLETED': return 'flag-checkered';
      default: return 'help-circle-outline';
    }
  };
 
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ');
  };
 
  const renderItem = ({ item }) => {
    const status = item.shipmentStatus || 'UNKNOWN';
    const statusStyle = getStatusColor(status);
   
    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.cargoType || 'Unnamed Shipment'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Icon name={getStatusIcon(status)} size={16} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {formatStatus(status)}
            </Text>
          </View>
        </View>
       
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color="#757575" />
            <Text style={styles.dateText}>
              Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
            </Text>
          </View>
         
          <View style={styles.infoRow}>
            <Icon name="package" size={16} color="#757575" />
            <Text style={styles.shipmentIdText}>
              ID: #{item.shipmentId || 'Unknown'}
            </Text>
          </View>
        </View>
       
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ShipmentDetails', { shipmentId: item.shipmentId })}
        >
          <Text style={styles.buttonText}>View Details</Text>
          <Icon name="chevron-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
    );
  };
 
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loaderText}>Loading Shipments...</Text>
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedFilter}
            style={styles.filterDropdown}
            onValueChange={(itemValue) => handleFilterChange(itemValue)}
            dropdownIconColor="#555"
          >
            <Picker.Item label="All Shipments" value="ALL" />
            <Picker.Item label="Pending" value="PENDING" />
            <Picker.Item label='Accepted' value="ACCEPTED"/>
            <Picker.Item label="In Transit" value="IN_TRANSIT" />
            <Picker.Item label="Delivered" value="DELIVERED" />
            <Picker.Item label="Cancelled" value="CANCELLED" />
            <Picker.Item label="Completed" value="COMPLETED" />
          </Picker>
        </View>
      </View>
 
      {filteredShipments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="package-variant" size={60} color="#CCCCCC" />
          <Text style={styles.noDataText}>No shipments available for the selected status.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredShipments}
          keyExtractor={(item) => (item.shipmentId || Math.random().toString()).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
              tintColor="#2196F3"
              title="Pull to refresh..."
              titleColor="#757575"
            />
          }
        />
      )}
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    flex: 1,
  },
  filterSection: {
    backgroundColor: 'white',
    padding: 14,
    elevation: 3,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
  },
  filterDropdown: {
    height: 50,
    width: '100%',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 15,
    color: 'black',
    marginLeft: 8,
  },
  shipmentIdText: {
    fontSize: 15,
    color: 'black',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
    maxWidth: width * 0.7,
  },
});
 
export default ShipmentList;