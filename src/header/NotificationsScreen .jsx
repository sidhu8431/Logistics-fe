
// working
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Alert,
//   StyleSheet
// } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import SockJS from "sockjs-client";
// import { Client } from "@stomp/stompjs";

// const NotificationsScreen = ({ updateNotificationCount = () => {} }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [userId, setUserId] = useState(null);
//   const navigation = useNavigation();
//   let stompClient = null;

//   useEffect(() => {
//     const fetchUserId = async () => {
//       try {
//         const storedUserId = await AsyncStorage.getItem("userId");
//         if (storedUserId) {
//           setUserId(storedUserId);
//           fetchNotifications(storedUserId); // Fetch notifications
//         } else {
//           console.warn("No userId found in AsyncStorage.");
//         }
//       } catch (error) {
//         console.error("Error retrieving userId:", error);
//       }
//     };

//     fetchUserId();
//   }, []);

//   useEffect(() => {
//     if (!userId) return;

//     const socket = new SockJS("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/ws");
//     stompClient = new Client({
//       webSocketFactory: () => socket,
//       debug: (str) => console.log(str),
//       reconnectDelay: 5000,
//     });

//     stompClient.onConnect = () => {
//       stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
//         try {
//           const newNotification = JSON.parse(message.body);
//           setNotifications((prev) => [newNotification, ...prev]);
//           updateNotificationCount((prev) => prev + 1);
//           Alert.alert("New Notification", newNotification.message);
//         } catch (error) {
//           console.error("Error parsing notification:", error);
//         }
//       });
//     };

//     stompClient.activate();

//     return () => {
//       if (stompClient) stompClient.deactivate();
//     };
//   }, [userId]);

//   const fetchNotifications = async (userId) => {
//     try {
//       const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/notification/notifications/${userId}`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const fetchedData = await response.json();
//       console.log("Fetched Notifications:", fetchedData);

//       // Ensure fetchedData is an array
//       const notificationsArray = Array.isArray(fetchedData) ? fetchedData : [fetchedData];

//       setNotifications(notificationsArray);

//       // Count unread notifications safely
//       updateNotificationCount(notificationsArray.filter((n) => !n.read).length);
//     } catch (error) {
//       console.error("Error fetching notifications:", error);
//     }
//   };

//   const renderNotificationItem = ({ item }) => (
//     <TouchableOpacity
//       style={[styles.notificationCard, !item.read && styles.unreadNotification]}
//       onPress={() => Alert.alert("Notification", item.message)}
//     >
//       <Text style={styles.notificationMessage}>{item.message}</Text>
//       <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Notifications</Text>
//       {notifications.length === 0 ? (
//         <Text style={styles.noNotifications}>No notifications available</Text>
//       ) : (
//         <FlatList
//           data={notifications}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderNotificationItem}
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "#f8f9fa",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//     textAlign: "center",
//     color: "#333",
//   },
//   noNotifications: {
//     textAlign: "center",
//     marginTop: 20,
//     fontSize: 16,
//     color: "#777",
//   },
//   notificationCard: {
//     backgroundColor: "#ffffff",
//     padding: 15,
//     marginVertical: 8,
//     borderRadius: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   unreadNotification: {
//     borderLeftWidth: 4,
//     borderLeftColor: "#FF5733",
//   },
//   notificationMessage: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   timestamp: {
//     fontSize: 12,
//     color: "#888",
//     marginTop: 5,
//   },
// });

// export default NotificationsScreen;



import React, { useEffect, useState } from "react"; 
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const NotificationsScreen = ({ updateNotificationCount = () => {} }) => {
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  let stompClient = null;

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
          fetchNotifications(storedUserId);
        } else {
          console.warn("No userId found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error retrieving userId:", error);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const socket = new SockJS("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/ws");
    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
        try {
          const newNotification = JSON.parse(message.body);
          setNotifications((prev) => [newNotification, ...prev]);
          updateNotificationCount((prev) => prev + 1);
          Alert.alert("New Notification", newNotification.message);
        } catch (error) {
          console.error("Error parsing notification:", error);
        }
      });
    };

    stompClient.activate();

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, [userId]);

  const fetchNotifications = async (userId) => {
    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/notification/notifications/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const fetchedData = await response.json();
      console.log("Fetched Notifications:", fetchedData);

      const notificationsArray = Array.isArray(fetchedData) ? fetchedData : [fetchedData];

      setNotifications(notificationsArray);

      updateNotificationCount(notificationsArray.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Function to handle notification click
  const handleNotificationPress = (notification) => {
    if (notification.type === 'PAYMENT_RELEASED' || 
      notification.type === 'PAYMENT_RECEIVED' || 
      notification.type === 'PAYMENT_HELD' || 
      notification.type === 'PAYMENT_FAILED') {
    navigation.navigate('PaymentDetails', { paymentId: notification.contentId });
  } 
    else {
      Alert.alert("Notification", notification.message);
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.noNotifications}>No notifications available</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  noNotifications: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#777",
  },
  notificationCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF5733",
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
});

export default NotificationsScreen;
