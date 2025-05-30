import React, {  useState, useEffect, useCallback, useRef, useMemo, PureComponent } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pure Component version of Icon
class IconComponent extends PureComponent {
  render() {
    const { name, size, color } = this.props;
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
}

// Pure Component version of StatusBadge
class StatusBadgeComponent extends PureComponent {
  getStatusColor() {
    const { status } = this.props;
    switch (status.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  }

  render() {
    const backgroundColor = this.getStatusColor();
    return (
      <View style={[styles.badge, { backgroundColor }]}>
        <Text style={styles.badgeText}>{this.props.status}</Text>
      </View>
    );
  }
}

// Pure Component version of ShipmentCard
class ShipmentCardComponent extends PureComponent {
  constructor(props) {
    super(props);
    this.handlePress = this.handlePress.bind(this);
  }

  handlePress() {
    this.props.onPressViewQuotations(this.props.shipment.shipmentId);
  }

  render() {
    const { shipment } = this.props;
    const formattedDate = new Date(shipment.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>{shipment.cargoType}</Text>
            <StatusBadgeComponent status={shipment.shipmentStatus} />
          </View>
          <IconComponent name="chevron-right" size={24} color="#CBD5E1" />
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <IconComponent name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>Created: {formattedDate}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <IconComponent name="package-variant-closed" size={16} color="#64748B" />
            <Text style={styles.infoText}>Shipment ID: #{shipment.shipmentId}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={this.handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>View Quotations</Text>
          <IconComponent name="clipboard-list-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }
}

// Extremely simplified separator
class ItemSeparatorComponent extends PureComponent {
  render() {
    return <View style={styles.separator} />;
  }
}

const ShipmentsQuotation = () => {
  const navigation = useNavigation();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const fetchTimeout = useRef(null);

  // Simplified data model - create only what's needed for rendering
  const prepareShipmentData = useCallback((rawData) => {
    return rawData.map(item => ({
      shipmentId: item.shipmentId,
      cargoType: item.cargoType,
      shipmentStatus: item.shipmentStatus,
      createdAt: item.createdAt
    }));
  }, []);


  const fetchShipments = useCallback(async (showLoader = true) => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
  
    if (showLoader) {
      setLoading(true);
    }
  
    fetchTimeout.current = setTimeout(async () => {
      try {
        const manufacturerId = await AsyncStorage.getItem('manufacturerId');
        if (!manufacturerId) {
          console.warn('Manufacturer ID not found in AsyncStorage');
          setLoading(false);
          setRefreshing(false);
          return;
        }
  
        const response = await axios.get(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/manufacturer/${manufacturerId}/latest-pending`);
        setShipments(prepareShipmentData(response.data));
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, 500);
  }, [prepareShipmentData]);
  
  
  useEffect(() => {
    fetchShipments();
    return () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    };
  }, [fetchShipments]);
  
  const handleViewQuotationsDetails = useCallback((shipmentId) => {
    navigation.navigate('QuotationsListScreen', { shipmentId });
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShipments(false);
  }, [fetchShipments]);

  const renderShipmentCard = useCallback(({ item }) => (
    <ShipmentCardComponent 
      shipment={item} 
      onPressViewQuotations={handleViewQuotationsDetails}
    />
  ), [handleViewQuotationsDetails]);

  const keyExtractor = useCallback((item) => `shipment-${item.shipmentId}`, []);

  const getItemLayout = useCallback((_, index) => ({
    length: 180,
    offset: 180 * index,
    index,
  }), []);

  const cachedStyles = useMemo(() => ({
    headerContainer: styles.headerContainer,
    backButton: styles.backButton,
    header: styles.header,
    listContainer: styles.listContainer
  }), []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loaderText}>Loading Shipments...</Text>
      </View>
    );
  }

  if (!shipments.length) {
    return (
      <View style={styles.errorContainer}>
        <IconComponent name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>No shipment details available</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => fetchShipments(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* <View style={cachedStyles.headerContainer}>
          <TouchableOpacity onPress={handleBackPress} style={cachedStyles.backButton}>
            <IconComponent name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={cachedStyles.header}>Transporters Quotations</Text>
        </View> */}

        <FlatList
          ref={flatListRef}
          data={shipments}
          keyExtractor={keyExtractor}
          renderItem={renderShipmentCard}
          contentContainerStyle={cachedStyles.listContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={1} // Extremely aggressive initial render
          maxToRenderPerBatch={2}
          updateCellsBatchingPeriod={30}
          windowSize={2}
          removeClippedSubviews={true}
          getItemLayout={getItemLayout}
          ItemSeparatorComponent={ItemSeparatorComponent}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
              title="Pull to refresh"
              titleColor="#64748B"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
    flex: 1,
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginVertical: 16,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  separator: {
    height: 16,
  }
});

export default ShipmentsQuotation;