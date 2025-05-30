// import React from 'react';
// import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';

// const Header = ({ location, onSearch }) => {
//   const navigation = useNavigation(); // Hook for navigation

//   return (
//     <View style={styles.header}>
//       <View style={styles.headerContent}>
//         {/* User Image */}
//         <TouchableOpacity onPress={() => navigation.navigate('UserProfile')}>

//         <Image
//           source={require('../assets/user.png')}
//           style={styles.userImage}
//         />
//                 </TouchableOpacity>

//         {/* Location Section */}
//         <View style={styles.locationContainer}>
//               <Text style={styles.locationLabel}>Your location</Text>
//               <View style={styles.locationRow}>
//                 <Text style={styles.locationText}>Kukatpally, Hyderabad</Text>
//                 <Text style={styles.dropdownIcon}>▼</Text>
//               </View>
//             </View>
//         {/* Notification Icon */}
//         <TouchableOpacity style={styles.notificationIcon}>
//           <Text style={styles.notificationText}>🔔</Text>
//         </TouchableOpacity>
//       </View>
//       {/* Search Bar */}
//       <View style={styles.searchBar}>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Enter the receipt number ..."
//           placeholderTextColor="#aaa"
//           onChangeText={onSearch}
//         />
//         <TouchableOpacity style={styles.searchIconContainer}>
//           <Text style={styles.searchButtonText}>🔍</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   header: {
//     backgroundColor: '#6200ee',
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 20,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   userImage: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#ccc',
//   },
//   locationContainer: {
//     flex: 1,
//     marginLeft: 10,
//   },
//   locationLabel: {
//     color: '#ddd',
//     fontSize: 12,
//   },
//   locationRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 3,
//   },
//   locationText: {
//     color: 'white',
//     fontSize: 16,
//   },
//   dropdownIcon: {
//     color: 'white',
//     marginLeft: 5,
//     fontSize: 12,
//   },
//   notificationIcon: {
//     padding: 10,
//   },
//   notificationText: {
//     fontSize: 20,
//     color: 'white',
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     marginTop: 15,
//     borderRadius: 25,
//     paddingHorizontal: 10,
//   },
//   searchInput: {
//     flex: 1,
//     padding: 10,
//     color: '#000',
//   },
//   searchIconContainer: {
//     padding: 10,
//     backgroundColor: '#ffb74d',
//     borderRadius: 20,
//     alignItems: 'center',
//   },
//   searchButtonText: {
//     fontSize: 18,
//     color: 'white',
//   },
// });

// export default Header;



import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Header = ({ location, onSearch, notificationCount }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.navigate("UserProfile")}>
          <Image source={require("../assets/user.png")} style={styles.userImage} />
        </TouchableOpacity>

        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>Your location</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>{location || "Kukatpally, Hyderabad"}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </View>
        </View>

        {/* Bell Icon with Notification Count */}
        <TouchableOpacity style={styles.notificationIcon} onPress={() => navigation.navigate("NotificationsScreen")}>
          <Text style={styles.notificationText}>🔔</Text>
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter the receipt number ..."
          placeholderTextColor="#aaa"
          onChangeText={onSearch}
        />
        <TouchableOpacity style={styles.searchIconContainer}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  locationContainer: {
    flex: 1,
    marginLeft: 10,
  },
  locationLabel: {
    color: "#ddd",
    fontSize: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  locationText: {
    color: "white",
    fontSize: 16,
  },
  dropdownIcon: {
    color: "white",
    marginLeft: 5,
    fontSize: 12,
  },
  notificationIcon: {
    padding: 10,
    position: "relative",
  },
  notificationText: {
    fontSize: 20,
    color: "white",
  },
  notificationBadge: {
    position: "absolute",
    right: 5,
    top: 5,
    backgroundColor: "red",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 15,
    borderRadius: 25,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    color: "#000",
  },
  searchIconContainer: {
    padding: 10,
    backgroundColor: "#ffb74d",
    borderRadius: 20,
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 18,
    color: "white",
  },
});

export default Header;
