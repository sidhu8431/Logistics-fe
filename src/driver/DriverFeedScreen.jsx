

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ToastAndroid,
//   PermissionsAndroid,
//   Linking,
//   Image,
// } from "react-native";
// import * as ImagePicker from "react-native-image-picker";
// import DocumentPicker from "react-native-document-picker";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// const requestStoragePermission = async () => {
//   if (Platform.OS === 'android') {
//     try {
//       if (Platform.Version >= 33) {
//         const imagePermission = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
//           {
//             title: "Gallery Access",
//             message: "We need access to your photos to upload images",
//             buttonPositive: "OK",
//           }
//         );

//         const videoPermission = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
//           {
//             title: "Video Access",
//             message: "We need access to your videos",
//             buttonPositive: "OK",
//           }
//         );

//         if (imagePermission === 'never_ask_again' || videoPermission === 'never_ask_again') {
//           Alert.alert(
//             "Permission Required",
//             "Please enable gallery access in app settings.",
//             [
//               { text: "Cancel", style: "cancel" },
//               { text: "Open Settings", onPress: () => Linking.openSettings() }
//             ]
//           );
//           return false;
//         }

//         return (
//           imagePermission === PermissionsAndroid.RESULTS.GRANTED &&
//           videoPermission === PermissionsAndroid.RESULTS.GRANTED
//         );
//       } else {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
//           {
//             title: "Storage Permission Required",
//             message: "App needs access to your storage to pick files",
//             buttonPositive: "OK",
//           }
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       }
//     } catch (err) {
//       Alert.alert("Permission Error", err.message);
//       return false;
//     }
//   }
//   return true;
// };

// const organizeInRounds = (feeds) => {
//   const types = ["weather", "restaurant", "parking", "fuel", "feed"];
//   const grouped = { weather: [], restaurant: [], parking: [], fuel: [], feed: [] };

//   feeds.forEach((item) => {
//     const type = item.type || "feed";
//     if (grouped[type]) {
//       grouped[type].push(item);
//     }
//   });

//   const maxRounds = Math.max(...types.map((type) => grouped[type].length));
//   const rounds = [];

//   for (let i = 0; i < maxRounds; i++) {
//     const round = [];
//     types.forEach((type) => {
//       if (grouped[type][i]) {
//         round.push({ ...grouped[type][i], type });
//       }
//     });
//     rounds.push(round);
//   }

//   return rounds;
// };

// const DriverFeedScreen = () => {
//   const [feedData, setFeedData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [comment, setComment] = useState("");
//   const [file, setFile] = useState(null);
//   const driverId = 7;

//   const fetchFeed = async () => {
//     try {
//       const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8000/advanced-relevant-feeds/", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ driver_id: driverId, shipment_id: 13 }),
//       });

//       const data = await response.json();
//       const rounds = organizeInRounds(data);
//       setFeedData(rounds);
//     } catch (error) {
//       Alert.alert("Error", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchFeed();
//   }, []);

//   const pickFromFiles = async () => {
//     try {
//       const res = await DocumentPicker.pick({
//         type: [DocumentPicker.types.images, DocumentPicker.types.video],
//       });

//       setFile({
//         uri: res[0].uri,
//         type: res[0].type,
//         name: res[0].name,
//       });
//     } catch (err) {
//       if (!DocumentPicker.isCancel(err)) {
//         Alert.alert("Error", "Unable to select file");
//       }
//     }
//   };

//   const uploadFeed = async () => {
//     if (!comment && !file) return;

//     const formData = new FormData();
//     if (file) {
//       formData.append("file", {
//         uri: file.uri,
//         type: file.type,
//         name: file.name || "upload",
//       });
//       formData.append("contentType", file.type.includes("video") ? "VIDEO" : "IMAGE");
//     } else {
//       formData.append("contentType", "TEXT");
//     }

//     formData.append("description", comment);

//     try {
//       const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/feed/driver/${driverId}/upload`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//         body: formData,
//       });

//       const result = await response.json();
//       setComment("");
//       setFile(null);
//       ToastAndroid.show("✅ Feed posted successfully", ToastAndroid.SHORT);
//       fetchFeed();
//     } catch (err) {
//       console.error("Upload failed", err);
//       ToastAndroid.show("❌ Upload failed", ToastAndroid.SHORT);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#4B0082" />
//         <Text>Loading Feed...</Text>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
//       <View style={{ flex: 1 }}>
//         <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
//           <Text style={styles.header}>🚚 Live Driver Feed</Text>

//           {feedData.map((round, roundIndex) => (
//             <View key={roundIndex} style={styles.roundCard}>
//               <Text style={styles.roundTitle}>Nearby Highlights {roundIndex + 1}</Text>
//               <View style={styles.roundItemGroup}>
//                 {round.map((item, idx) => (
//                   <View key={idx} style={styles.itemBlock}>
//                     <Text style={styles.title}>📌 {item.title}</Text>
//                     <Text style={styles.desc}>{item.description}</Text>
//                     <Text style={styles.km}>📍 {item.distance_from_driver_km?.toFixed(2)} km</Text>

//                     {/* ✅ Show image if it's a feed type and has s3Url */}
//                     {item.type === "feed" && item.contentType === "IMAGE" && item.s3Url && (
//                       <Image source={{ uri: item.s3Url }} style={styles.imagePreview} />
//                     )}
//                   </View>
//                 ))}
//               </View>
//             </View>
//           ))}
//         </ScrollView>

//         {/* Footer input box */}
//         <View style={styles.footer}>
//           <View style={styles.inputRow}>
//             <TextInput
//               style={styles.input}
//               placeholder="Type a comment..."
//               placeholderTextColor="#1976d2"
//               value={comment}
//               onChangeText={setComment}
//             />
//             <TouchableOpacity onPress={pickFromFiles}>
//               <Icon name="folder" size={28} color="#888" style={styles.icon} />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={uploadFeed}>
//               <View style={styles.sendButton}>
//                 <Icon name="send" size={20} color="#fff" />
//               </View>
//             </TouchableOpacity>
//           </View>

//           {file && (
//             <View style={styles.preview}>
//               <Text style={{ color: "#fff" }}>
//                 {file.type?.startsWith("video/") ? "🎥 Video Selected" : "📁 File Selected"}
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F3EEFF", padding: 10 },
//   header: { fontSize: 20, fontWeight: "bold", color: "#4B0082", marginBottom: 15 },
//   roundCard: {
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 12,
//     elevation: 4,
//     marginBottom: 20,
//   },
//   roundTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#4B0082",
//     marginBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E0E0E0",
//     paddingBottom: 5,
//   },
//   roundItemGroup: {
//     marginTop: 10,
//   },
//   itemBlock: {
//     marginBottom: 14,
//   },
//   title: {
//     fontWeight: "bold",
//     color: "#3b0080",
//     fontSize: 16,
//     marginBottom: 2,
//   },
//   desc: { color: "#444", marginBottom: 4, fontSize: 14 },
//   km: { color: "#555", fontSize: 13 },
//   imagePreview: {
//     width: "100%",
//     height: 160,
//     borderRadius: 10,
//     marginTop: 6,
//     borderWidth: 1,
//     borderColor: "#ccc",
//   },
//   loader: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F3EEFF",
//   },
//   footer: {
//     backgroundColor: "#d1c4e9",
//     paddingHorizontal: 14,
//     paddingVertical: 14,
//     borderTopWidth: 1,
//     borderTopColor: "#b39ddb",
//     shadowColor: "#b39ddb",
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 5,
//     elevation: 8,
//   },
//   inputRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFFFFF",
//     borderRadius: 28,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: "#311b92",
//     paddingVertical: 6,
//   },
//   icon: {
//     marginLeft: 14,
//     color: "#888",
//     opacity: 0.8,
//     alignSelf: "center",
//   },
//   sendButton: {
//     backgroundColor: "#ff9800",
//     padding: 10,
//     borderRadius: 999,
//     justifyContent: "center",
//     alignItems: "center",
//     marginLeft: 10,
//   },
//   preview: {
//     marginTop: 10,
//     backgroundColor: "#e0e0ff",
//     borderRadius: 10,
//     padding: 8,
//     alignItems: "center",
//   },
// });

// export default DriverFeedScreen;



// =========================================



import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  PermissionsAndroid,
  Linking,
  Image,
} from "react-native";
import * as ImagePicker from "react-native-image-picker";
import DocumentPicker from "react-native-document-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// ✅ Helper function to group feeds into rounds
const organizeInRounds = (feeds) => {
  const types = ["weather", "restaurant", "parking", "fuel", "feed"];
  const grouped = { weather: [], restaurant: [], parking: [], fuel: [], feed: [] };

  feeds.forEach((item) => {
    const type = item.type || "feed";
    if (grouped[type]) {
      grouped[type].push(item);
    }
  });

  const maxRounds = Math.max(...types.map((type) => grouped[type].length));
  const rounds = [];

  for (let i = 0; i < maxRounds; i++) {
    const round = [];
    types.forEach((type) => {
      if (grouped[type][i]) {
        round.push({ ...grouped[type][i], type });
      }
    });
    rounds.push(round);
  }

  return rounds;
};

const DriverFeedScreen = () => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const driverId = 7;

  // const fetchFeed = async () => {
  //   try {
  //     const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8000/advanced-relevant-feeds/", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ driver_id: driverId, shipment_id: 13 }),
  //     });
  
  //     const data = await response.json();
  
  //     // ✅ Check if it's a valid array
  //     if (Array.isArray(data)) {
  //       const rounds = organizeInRounds(data);
  //       setFeedData(rounds);
  //     } else {
  //       console.warn("Unexpected API response:", data);
  //       Alert.alert("Error", "Unexpected response from server.");
  //       setFeedData([]); // fallback to avoid crashing
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  
  const fetchFeed = async () => {
    try {
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8000/advanced-relevant-feeds/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId, shipment_id: 13 }),
      });
  
      const data = await response.json();
      console.log("Driver feed response ===>", data); // 👈 add this
  
      if (Array.isArray(data)) {
        const rounds = organizeInRounds(data);
        setFeedData(rounds);
      } else {
        Alert.alert("No Feed", "AI did not return any feed.");
        setFeedData([]);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMyPosts = async () => {
    try {
      const response = await fetch("http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/feed/feeds");
      const data = await response.json();
      const filtered = data.filter(post => post.driver?.driverId === driverId);
      setMyPosts(filtered);
    } catch (error) {
      Alert.alert("Error", "Failed to load your posts.");
    }
  };

  const toggleMyPosts = () => {
    if (!showMyPosts) fetchMyPosts();
    setShowMyPosts(!showMyPosts);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const pickFromFiles = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.video],
      });

      setFile({
        uri: res[0].uri,
        type: res[0].type,
        name: res[0].name,
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert("Error", "Unable to select file");
      }
    }
  };

  const uploadFeed = async () => {
    if (!comment && !file) return;

    const formData = new FormData();
    if (file) {
      formData.append("file", {
        uri: file.uri,
        type: file.type,
        name: file.name || "upload",
      });
      formData.append("contentType", file.type.includes("video") ? "VIDEO" : "IMAGE");
    } else {
      formData.append("contentType", "TEXT");
    }

    formData.append("description", comment);

    try {
      const response = await fetch(`http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/feed/driver/${driverId}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      await response.json();
      setComment("");
      setFile(null);
      ToastAndroid.show("✅ Feed posted successfully", ToastAndroid.SHORT);
      fetchFeed();
    } catch (err) {
      console.error("Upload failed", err);
      ToastAndroid.show("❌ Upload failed", ToastAndroid.SHORT);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text>Loading Feed...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
  <Text style={styles.header}>🚚 Live Driver Feed</Text>
  <TouchableOpacity style={styles.myPostsLeftBtn} onPress={toggleMyPosts}>
    <Text style={styles.myPostsText}>📁 My Posts</Text>
  </TouchableOpacity>
</View>


          {/* Show My Posts Section */}
          {showMyPosts && (
            <View style={styles.roundCard}>
              <Text style={styles.roundTitle}>🧾 My Posts</Text>
              {myPosts.length === 0 ? (
                <Text style={{ color: "#888" }}>No posts uploaded yet.</Text>
              ) : (
                myPosts.map((post, index) => (
                  <View key={index} style={styles.itemBlock}>
                    <Text style={styles.title}>{post.description}</Text>
                    <Text style={styles.km}>🕒 {new Date(post.createdAt).toLocaleString()}</Text>
                    {post.contentType === "IMAGE" && post.s3Url && (
                      <Image source={{ uri: post.s3Url }} style={styles.imagePreview} />
                    )}
                    {post.contentType === "VIDEO" && (
                      <Text style={{ color: "#4B0082" }}>🎥 Video Uploaded</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* Live Feed Highlights */}
          {feedData.map((round, roundIndex) => (
            <View key={roundIndex} style={styles.roundCard}>
              <Text style={styles.roundTitle}>Nearby Highlights {roundIndex + 1}</Text>
              <View style={styles.roundItemGroup}>
                {round.map((item, idx) => (
                  <View key={idx} style={styles.itemBlock}>
                    <Text style={styles.title}>📌 {item.title}</Text>
                    <Text style={styles.desc}>{item.description}</Text>
                    <Text style={styles.km}>📍 {item.distance_from_driver_km?.toFixed(2)} km</Text>
                    {item.type === "feed" && item.contentType === "IMAGE" && item.s3Url && (
                      <Image source={{ uri: item.s3Url }} style={styles.imagePreview} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer input box */}
        <View style={styles.footer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a comment..."
              placeholderTextColor="#1976d2"
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity onPress={pickFromFiles}>
              <Icon name="folder" size={28} color="#888" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={uploadFeed}>
              <View style={styles.sendButton}>
                <Icon name="send" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {file && (
            <View style={styles.preview}>
              <Text style={{ color: "#fff" }}>
                {file.type?.startsWith("video/") ? "🎥 Video Selected" : "📁 File Selected"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3EEFF", padding: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  header: { fontSize: 20, fontWeight: "bold", color: "#4B0082", marginBottom: 15 },
  myPostsBtn: { backgroundColor: "#E0BBE4", padding: 8, borderRadius: 8 },
  myPostsText: { color: "#4B0082", fontWeight: "bold" },
  roundCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B0082",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 5,
  },
  roundItemGroup: { marginTop: 10 },
  itemBlock: { marginBottom: 14 },
  title: { fontWeight: "bold", color: "#3b0080", fontSize: 16, marginBottom: 2 },
  desc: { color: "#444", marginBottom: 4, fontSize: 14 },
  km: { color: "#555", fontSize: 13 },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
  footer: {
    backgroundColor: "#d1c4e9",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#b39ddb",
    shadowColor: "#b39ddb",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#311b92",
    paddingVertical: 6,
  },
  icon: {
    marginLeft: 14,
    color: "#888",
    opacity: 0.8,
    alignSelf: "center",
  },
  sendButton: {
    backgroundColor: "#ff9800",
    padding: 10,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  preview: {
    marginTop: 10,
    backgroundColor: "#e0e0ff",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  myPostsLeftBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#E0BBE4",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  
});

export default DriverFeedScreen;
