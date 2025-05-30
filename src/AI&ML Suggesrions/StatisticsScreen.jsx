import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Animated, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Card } from 'react-native-paper';
import axios from 'axios';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

const StatisticsScreen = () => {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalShipments, setTotalShipments] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [manufacturerId, setManufacturerId] = useState(null);

    // Function to get manufacturerId from AsyncStorage
    const getManufacturerId = async () => {
      try {
        const id = await AsyncStorage.getItem('manufacturerId');
        if (id) {
          setManufacturerId(id);
        }
      } catch (error) {
        console.error('Error retrieving manufacturer ID:', error);
      }
    };

  const fetchShipmentStats = async (year) => {
    if (!manufacturerId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000/get-monthlyshipment-stats?manufacturer_id=${manufacturerId}&year=${year}`
      );
      const { shipment_counts } = response.data;

      const formattedData = Object.keys(shipment_counts).map((month) => ({
        label: month.substring(0, 3),
        value: shipment_counts[month],
      }));

      setChartData(formattedData);
      setTotalShipments(formattedData.reduce((sum, item) => sum + item.value, 0));
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching shipment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getManufacturerId();
  }, []);

  useEffect(() => {
    if (manufacturerId) {
      fetchShipmentStats(selectedYear);
    }
  }, [selectedYear, manufacturerId]);

  const renderSummaryCard = () => (
    <Card style={styles.summaryCard}>
      <Card.Content>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Icon name="package" size={30} color="#3498db" />
            <Text style={styles.summaryValue}>{totalShipments}</Text>
            <Text style={styles.summaryLabel}>Total Shipments</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="chart-bar" size={30} color="#2ecc71" />
            <Text style={styles.summaryValue}>
              {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0}
            </Text>
            <Text style={styles.summaryLabel}>Peak Shipments</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="chart-line" size={30} color="#e74c3c" />
            <Text style={styles.summaryValue}>
              {chartData.length > 0 ? Math.round(totalShipments / chartData.length) : 0}
            </Text>
            <Text style={styles.summaryLabel}>Monthly Average</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Icon name="truck-delivery" size={30} color="#3498db" />
        <Text style={styles.header}>Shipment Analytics</Text>
      </View>
      
      <Card style={styles.yearPickerCard}>
        <Card.Content>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Year</Text>
            <Picker
              selectedValue={selectedYear}
              style={styles.picker}
              onValueChange={setSelectedYear}
              mode="dropdown"
            >
              <Picker.Item label="2025" value="2025" />
              <Picker.Item label="2024" value="2024" />
              <Picker.Item label="2023" value="2023" />
            </Picker>
          </View>
        </Card.Content>
      </Card>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loaderText}>Loading statistics...</Text>
        </View>
      ) : (
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {renderSummaryCard()}
          
          {chartData.length > 0 && (
            <>
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text style={styles.chartTitle}>Monthly Shipment Distribution</Text>
                  <BarChart
                    data={{
                      labels: chartData.map((d) => d.label),
                      datasets: [{ data: chartData.map((d) => d.value) }],
                    }}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    chartConfig={{
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                      barPercentage: 0.7,
                      labelColor: () => '#2c3e50',
                      propsForLabels: {
                        fontSize: 12,
                      },
                    }}
                    verticalLabelRotation={30}
                    showValuesOnTopOfBars
                    fromZero
                  />
                </Card.Content>
              </Card>

              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text style={styles.chartTitle}>Trend Analysis</Text>
                  <LineChart
                    data={{
                      labels: chartData.map((d) => d.label),
                      datasets: [{ data: chartData.map((d) => d.value) }],
                    }}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={{
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
                      labelColor: () => '#2c3e50',
                      propsForLabels: {
                        fontSize: 12,
                      },
                    }}
                    bezier
                  />
                </Card.Content>
              </Card>
            </>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
  },
  yearPickerCard: {
    margin: 15,
    elevation: 4,
    borderRadius: 10,
  },
  pickerContainer: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 5,
  },
  picker: {
    width: 200,
    height: 50,
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 16,
  },
  contentContainer: {
    padding: 15,
  },
  summaryCard: {
    marginBottom: 15,
    elevation: 4,
    borderRadius: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 15,
    elevation: 4,
    borderRadius: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default StatisticsScreen;