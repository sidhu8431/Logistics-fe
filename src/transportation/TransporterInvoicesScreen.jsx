import React from 'react';
import { View, Text, FlatList,ScrollView, StyleSheet } from 'react-native';

const TransporterInvoicesScreen = ({ route }) => {
  const { invoices } = route.params || { invoices: [] };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.heading}>Invoices</Text>
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.label}>Invoice: {item.invoiceNumber}</Text>
              <Text style={styles.label}>Amount: {item.amount}</Text>
              <Text style={styles.label}>Status: {item.status}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.noDataText}>No invoices available.</Text>
          }
        />
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 3 },
  label: { fontSize: 16, marginBottom: 5 },
});

export default TransporterInvoicesScreen;
