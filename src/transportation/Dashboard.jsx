import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const Dashboard = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [transporterId, setTransporterId] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [progressAnim] = useState(new Animated.Value(0));
  const [greeting, setGreeting] = useState('');
  const [name, setName] = useState('John Doe');
  const [releasedAmount, setReleasedAmount] = useState('0.00');
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);

  const truckImage = require('../assets/NewTruck.png');

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedTransporterId = await AsyncStorage.getItem('transporterId');
      if (storedUserId) setUserId(storedUserId);
      if (storedTransporterId) setTransporterId(storedTransporterId);

      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      try {
        const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/user/getUser/${storedUserId}`);
        const data = await response.json();
        if (data && data.name) {
          setName(data.name);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      try {
        if (storedTransporterId) {
          const amountResponse = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/payments/released-amount/${storedTransporterId}`);
          const amount = await amountResponse.text();
          setReleasedAmount(parseFloat(amount).toFixed(2));
        }
      } catch (err) {
        console.error('Error fetching released amount:', err);
      }

      try {
        if (storedTransporterId) {
          const feedbackRes = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/feedback/get/transporter/${storedTransporterId}`);
          const feedbackData = await feedbackRes.json();
          if (Array.isArray(feedbackData)) {
            setFeedbackList(feedbackData);
          }
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
      } finally {
        setFeedbackLoaded(true);
      }
    };

    fetchUserData();
  }, []);

  const sections = [
    { key: 'shipments', title: 'Shipments', image: require('../assets/TShipments.png'), navigateTo: 'TransporterShipmentScreen' },
    { key: 'quotations', title: 'Quotations', image: require('../assets/TQuotations.jpg'), navigateTo: 'TransporterQuotations' },
  ];

  const imageCards = [
    { key: 'completedTrips', title: 'Completed Trips', image: require('../assets/Tcom.jpg'), navigateTo: 'ShipmentCompletedScreen' },
    { key: 'payments', title: 'Payments', image: require('../assets/Tpay.jpg'), navigateTo: 'TransporterPaymentsScreen' },
    { key: 'invoices', title: 'Invoices', image: require('../assets/Tinv.jpg'), navigateTo: 'PaymentRecords' },
    { key: 'myVehicles', title: 'My Vehicles', image: require('../assets/Tvehicles.jpg'), navigateTo: 'TransporterVehiclesScreen' }, // ✅ new
    { key: 'myDrivers', title: 'My Drivers', image: require('../assets/Tdriver.jpg'), navigateTo: 'TransporterDriversScreen' },     // ✅ new
  ];

  const handlePress = (section) => {
    setActiveCard(section.key);
    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setActiveCard(null);
      if (section.navigateTo) {
        navigation.navigate(section.navigateTo);
      }
    });
  };

  const animatedFill = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const truckPosition = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, SCREEN_WIDTH * 0.9 - 60],
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.greeting}>{greeting}, <Text style={styles.name}>{name} 👋</Text></Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your balance</Text>
          <Text style={styles.balanceAmount}>₹{releasedAmount}</Text>
          <View style={styles.separator} />
        </View>

        {sections.map((section) => {
          const isActive = activeCard === section.key;
          return (
            <TouchableOpacity
              key={section.key}
              style={styles.cardWrapper}
              onPress={() => handlePress(section)}
              activeOpacity={0.9}
            >
              {isActive && (
                <Animated.View style={[styles.fillBackground, { width: animatedFill }]} />
              )}
              {isActive && (
                <Animated.Image
                  source={truckImage}
                  style={[styles.truck, { transform: [{ translateX: truckPosition }] }]}
                />
              )}
              <View style={styles.cardContent}>
                <Image source={section.image} style={styles.cardIcon} />
                <Text style={styles.cardText}>{section.title}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

<View style={styles.imageCardGrid}>
  {imageCards.map((item) => (
    <View key={item.key} style={styles.imageCardItem}>
      <TouchableOpacity style={styles.imageCard} onPress={() => handlePress(item)}>
        <Image source={item.image} style={styles.imageCardFullImg} />
      </TouchableOpacity>
      <Text style={styles.imageCardTitle}>{item.title}</Text>
    </View>
  ))}
</View>



        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackHeading}>Feedback</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransporterFeedbackScreen')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feedbackWrapper}>
          {feedbackLoaded && feedbackList.length === 0 ? (
            <Text style={{ paddingLeft: 20, fontStyle: 'italic', color: '#64748b' }}>
              No feedback available.
            </Text>
          ) : (
            <FlatList
              contentContainerStyle={{ paddingLeft: 12 }}
              data={feedbackList}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={({ item }) => (
                <View style={styles.feedbackCard}>
                  <Text style={styles.feedbackFrom}>From: {item.from}</Text>
                  <Text style={styles.feedbackRating}>Rating: {item.rating} ⭐</Text>
                  <Text style={styles.feedbackText}>{item.text}</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 20 },
  container: { paddingVertical: 20, backgroundColor: '#eef2f7', alignItems: 'center' },
  greeting: { fontSize: 22, color: '#334155', marginBottom: 4 },
  name: { fontWeight: 'bold', color: '#1e293b' },

  balanceCard: {
    backgroundColor: '#ef4444', borderRadius: 20, padding: 20,
    marginVertical: 20, width: '90%', elevation: 4,
  },
  balanceLabel: { fontSize: 14, color: '#fff', marginBottom: 4 },
  balanceAmount: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#fca5a5', marginVertical: 10 },

  cardWrapper: {
    width: '90%', height: 80, borderRadius: 20, backgroundColor: '#fff',
    marginVertical: 12, overflow: 'hidden', justifyContent: 'center',
    elevation: 5, position: 'relative',
  },
  fillBackground: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    backgroundColor: '#ed4f37', zIndex: 1, borderRadius: 20,
  },
  cardContent: {
    zIndex: 2, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, justifyContent: 'space-between',
  },
  cardIcon: { width: 42, height: 42, resizeMode: 'contain' },
  cardText: {
    flex: 1, fontSize: 18, fontWeight: '600', marginLeft: 20, color: '#1f2937',
  },
  arrow: { fontSize: 22, color: '#9ca3af' },
  truck: {
    position: 'absolute', width: 100, height: 80, resizeMode: 'contain',
    top: 20, left: -100, zIndex: 3,
  },

  // imageCardRow: {
  //   width: '100%', flexDirection: 'row', justifyContent: 'space-evenly',
  //   flexWrap: 'wrap', marginTop: 20, paddingHorizontal: 10,
  // },
  // imageCard: {
  //   borderRadius: 20, width: 110, height: 110, backgroundColor: '#fff',
  //   padding: 10, elevation: 3, justifyContent: 'center', alignItems: 'center',
  // },
  // imageCardFullImg: {
  //   width: '100%', height: '100%', borderRadius: 20, resizeMode: 'cover',
  // },
  // imageCardTitle: {
  //   fontWeight: '600', marginTop: 6, fontSize: 13, color: '#1e293b',
  // },

  imageCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  
  imageCardItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  imageCard: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  
  imageCardFullImg: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: 15,
  },
  
  imageCardTitle: {
    marginTop: 6,
    fontWeight: '600',
    fontSize: 12,
    color: '#1e293b',
    textAlign: 'center',
  },
  
  

  feedbackHeader: {
    width: '90%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 30,
  },
  feedbackHeading: {
    fontSize: 18, fontWeight: 'bold', color: '#1f2937',
  },
  seeAll: {
    fontSize: 14, fontWeight: '600', color: '#3b82f6',
  },
  feedbackWrapper: {
    width: '100%', paddingLeft: 20, marginTop: 12, marginBottom: 40,
  },
  feedbackCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginRight: 12, elevation: 3, width: 220,
  },
  feedbackFrom: {
    fontWeight: 'bold', marginBottom: 4,
  },
  feedbackRating: {
    color: '#f59e0b', marginBottom: 4,
  },
  feedbackText: {
    color: '#334155', fontSize: 14,
  },
});

export default Dashboard;
