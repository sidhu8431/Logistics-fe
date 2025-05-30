import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { DataTable, ActivityIndicator, Card, Title } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ManufacturerAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manufacturerId, setManufacturerId] = useState(null);


  useEffect(() => {
    const fetchManufacturerId = async () => {
      try {
        const storedManufacturerId = await AsyncStorage.getItem('manufacturerId');
        if (storedManufacturerId) {
          setManufacturerId(storedManufacturerId);
        } else {
          console.error('No manufacturerId found in AsyncStorage');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching manufacturerId from AsyncStorage:', error);
        setLoading(false);
      }
    };

    fetchManufacturerId();
  }, []);

  useEffect(() => {
    if (manufacturerId) {
      fetchAnalyticsData(manufacturerId);
    }
  }, [manufacturerId]);

  const fetchAnalyticsData = async (id) => {
    try {
      const response = await fetch(`http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000/get-operational-analytics?manufacturer_id=${id}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Fetching Analytics...</Text>
      </View>
    );
  }

  if (!manufacturerId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Manufacturer ID not found</Text>
      </View>
    );
  }

  if (!analyticsData || !analyticsData.weekly_shipments || !analyticsData.monthly_shipments || !analyticsData.yearly_shipments) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No data available</Text>
      </View>
    );
  }


  const shipmentData = [
    { period: 'Weekly', ...analyticsData.weekly_shipments },
    { period: 'Monthly', ...analyticsData.monthly_shipments },
    { period: 'Yearly', ...analyticsData.yearly_shipments },
  ];

  const chartData = {
    labels: shipmentData.map(item => item.period),
    datasets: [{
      data: shipmentData.map(item => item.completed_shipments || 0),
    }]
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Shipment Analytics Overview</Title>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {analyticsData.yearly_shipments.completed_shipments || 0}
              </Text>
              <Text style={styles.statLabel}>Total Shipments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
              {analyticsData.yearly_shipments.savings_cost || 0}
              </Text>
              <Text style={styles.statLabel}>Total Savings</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Completed Shipments Trend</Title>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(98, 0, 234, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.tableCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Detailed Analytics</Title>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title><Text style={styles.headerText}>Period</Text></DataTable.Title>
              <DataTable.Title numeric><Text style={styles.headerText}>Pending</Text></DataTable.Title>
              <DataTable.Title numeric><Text style={styles.headerText}>Completed</Text></DataTable.Title>
              <DataTable.Title numeric><Text style={styles.headerText}>Savings (₹)</Text></DataTable.Title>
            </DataTable.Header>

            {shipmentData.map((item) => (
              <DataTable.Row key={item.period} style={styles.tableRow}>
                <DataTable.Cell><Text style={styles.cellText}>{item.period}</Text></DataTable.Cell>
                <DataTable.Cell numeric><Text style={styles.cellText}>{item.pending_shipments || 0}</Text></DataTable.Cell>
                <DataTable.Cell numeric><Text style={styles.cellText}>{item.completed_shipments || 0}</Text></DataTable.Cell>
                <DataTable.Cell numeric><Text style={styles.cellText}>{item.savings_cost || 0}</Text></DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6200ea',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff1744',
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  chartCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  tableCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#1a237e',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cellText: {
    color: '#333',
  },
});

export default ManufacturerAnalytics;