import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
 
const DriverRewards = ({ route }) => {
  const { rewards } = route.params;
 
  const handleViewMore = (item) => {
    console.log('Viewing more details:', item);
    // Add navigation or actions for "View More" here
  };
 
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Rewards</Text>
      {rewards.map((item, index) => (
        // <View key={index} style={styles.card}>
        <View key={item.id || item.rewardId || index} style={styles.card}>

          <Text style={styles.detailText}>
            <Text style={styles.bold}>Reward Type:</Text> {item.rewardType}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Reward Amount:</Text> {item.rewardAmount}
          </Text>
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => handleViewMore(item)}
          >
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};
 
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4b0082',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  viewMoreButton: {
    marginTop: 10,
    backgroundColor: '#4b0082',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
 
export default DriverRewards;
 
 
 