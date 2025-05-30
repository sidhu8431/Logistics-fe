import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

// Helper functions moved outside the component
const cargoRequiresRefrigeration = (cargoType) => {
    const refrigeratedTypes = ['milk', 'dairy', 'food', 'meat', 'fish', 'ice'];
    return refrigeratedTypes.some(type => cargoType.toLowerCase().includes(type));
};

const buildApiUrl = (shipmentData) => {
    return `http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000/get-suggested-vehicles?cargo_type=${encodeURIComponent(shipmentData.cargoType)}&weight=${shipmentData.weight}&pickup_longitude=${shipmentData.pickupLongitude}&pickup_latitude=${shipmentData.pickupLatitude}&dropping_longitude=${shipmentData.droppingLongitude}&dropping_latitude=${shipmentData.droppingLatitude}`;
};

// Function to provide fallback vehicles when API fails
const getFallbackVehicles = (needsRefrigeration) => {
    // Basic set of vehicles that will always be available
    const baseVehicles = [
        { 
            name: "Pickup truck (Normal)", 
            image: "", 
            refrigerator: false, 
            truck_type: "Pickup truck",
            min_mileage: 8.0,
            max_mileage: 15.0,
            estimated_price: "35000 - 70000" 
        },
        { 
            name: "Light-weight truck (Normal)", 
            image: "", 
            refrigerator: false, 
            truck_type: "Light-weight truck",
            min_mileage: 6.0,
            max_mileage: 12.0,
            estimated_price: "50000 - 90000" 
        },
        {
            name: "Heavy-duty truck (Normal)",
            image: "",
            refrigerator: false,
            truck_type: "Heavy-duty truck",
            min_mileage: 4.0,
            max_mileage: 8.0,
            estimated_price: "75000 - 120000"
        }
    ];
    
    // Add refrigerated options if needed
    if (needsRefrigeration) {
        const refrigeratedOptions = [
            { 
                name: "Pickup truck (Refrigerated)", 
                image: "", 
                refrigerator: true, 
                truck_type: "Pickup truck (Refrigerated)",
                min_mileage: 6.0,
                max_mileage: 12.0,
                estimated_price: "45000 - 85000" 
            },
            { 
                name: "Light-weight truck (Refrigerated)", 
                image: "", 
                refrigerator: true, 
                truck_type: "Light-weight truck (Refrigerated)",
                min_mileage: 5.0,
                max_mileage: 10.0,
                estimated_price: "60000 - 110000" 
            },
            {
                name: "Heavy-duty truck (Refrigerated)",
                image: "",
                refrigerator: true,
                truck_type: "Heavy-duty truck (Refrigerated)",
                min_mileage: 3.5,
                max_mileage: 7.0,
                estimated_price: "85000 - 140000"
            }
        ];
        
        // Put refrigerated options first
        return [...refrigeratedOptions, ...baseVehicles];
    }
    
    return baseVehicles;
};

const SuggestedVehiclesScreen = ({ route }) => {
    const navigation = useNavigation();
    const { shipmentData } = route.params;
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [requiresRefrigeration, setRequiresRefrigeration] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [errorDetails, setErrorDetails] = useState('');

    // Add helper function for refrigeration status text
    const getRefrigerationStatusText = (vehicle) => {
        if (vehicle.refrigerator === undefined) {
            return 'Not specified';
        }
        return vehicle.refrigerator ? 'Yes' : 'No';
    };

    useEffect(() => {
        fetchSuggestedVehicles();
    }, [shipmentData]);

    // Helper function to handle API response
    const handleApiResponse = (data) => {
        if (data && Array.isArray(data.suggested_vehicles)) {
            console.log("Found suggested vehicles:", data.suggested_vehicles.length);
            setVehicles(data.suggested_vehicles);
            
            if (data.refrigerator_required === "YES") {
                setRequiresRefrigeration(true);
            }
            return true;
        } 
        
        console.warn("Invalid response format:", data);
        Alert.alert("Notice", "Using default vehicle suggestions due to incomplete data from server.");
        return false;
    };

    // Helper function for fetch API request
    const fetchWithTimeout = async (url, timeoutMs = 30000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
            const response = await fetch(
                url, 
                { 
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log("Response status:", response.status);
            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // Helper function for axios API request
    const axiosWithTimeout = async (shipmentData, timeoutMs = 30000) => {
        const source = axios.CancelToken.source();
        const timeoutId = setTimeout(() => {
            source.cancel('Request took too long');
        }, timeoutMs);
        
        try {
            const response = await axios.get(`http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000/get-suggested-vehicles`, {
                params: {
                    cargo_type: shipmentData.cargoType,
                    weight: shipmentData.weight,
                    pickup_longitude: shipmentData.pickupLongitude,
                    pickup_latitude: shipmentData.pickupLatitude,
                    dropping_longitude: shipmentData.droppingLongitude,
                    dropping_latitude: shipmentData.droppingLatitude,
                },
                cancelToken: source.token,
                timeout: timeoutMs,
                maxContentLength: 5000000, // 5MB
            });
            
            console.log("Axios response received:", response.status);
            return response.data;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // Helper function to handle request failure
    const handleRequestFailure = (error) => {
        console.error("Request error details:", 
            error.response || error.request || error.message);
        
        setErrorDetails(prevDetails => 
            `${prevDetails}\nError: ${error.message || 'Unknown error'}`);
        setNetworkError(true);
        
        // // Use fallback vehicles
        // const needsRefrigeration = cargoRequiresRefrigeration(shipmentData.cargoType);
        // setVehicles(getFallbackVehicles(needsRefrigeration));
        
        // User-friendly alert
        Alert.alert(
            "Connection Issue", 
            "We're having trouble connecting to the server. Showing default vehicle options instead.",
            [{ text: "OK" }]
        );
    };

    // The main refactored function with reduced complexity
    const fetchSuggestedVehicles = async (retryCount = 0, maxRetries = 2) => {
        setLoading(true);
        setNetworkError(false);
        setErrorDetails('');
        
        // Check if refrigeration is needed
        if (cargoRequiresRefrigeration(shipmentData.cargoType)) {
            setRequiresRefrigeration(true);
        }
        
        // Build the API URL
        const apiUrl = buildApiUrl(shipmentData);
        console.log(`Attempt ${retryCount + 1}/${maxRetries + 1}: Making fetch request to:`, apiUrl);
        
        try {
            // Try fetch API first
            const data = await fetchWithTimeout(apiUrl);
            handleApiResponse(data);
        } catch (fetchError) {
            console.error("Fetch error:", fetchError);
            setErrorDetails(`Fetch error: ${fetchError.message || 'Unknown error'}`);
            
            // Implement retry logic
            if (retryCount < maxRetries) {
                console.log(`Retrying (${retryCount + 1}/${maxRetries})...`);
                // Exponential backoff
                setTimeout(() => fetchSuggestedVehicles(retryCount + 1, maxRetries), 
                          1000 * Math.pow(2, retryCount));
                return;
            }
            
            // Fall back to axios
            try {
                console.log("Falling back to axios request");
                const data = await axiosWithTimeout(shipmentData);
                handleApiResponse(data);
            } catch (axiosError) {
                handleRequestFailure(axiosError);
            }
        } finally {
            setLoading(false);
        }
    };

    // Filter vehicles based on refrigeration requirement if needed
    const filteredVehicles = useMemo(() => {
        if (requiresRefrigeration) {
            // Show both refrigerated and non-refrigerated options, but prioritize refrigerated
            return [
                ...vehicles.filter(v => v.refrigerator === true),
                ...vehicles.filter(v => v.refrigerator !== true)
            ];
        }
        return vehicles;
    }, [vehicles, requiresRefrigeration]);

    const handleViewDetails = (vehicle) => {
        setSelectedVehicle(vehicle);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!selectedVehicle) {
            Alert.alert("Error", "No vehicle selected.");
            return;
        }
    
        // Check if refrigeration is required but selected vehicle doesn't support it
        if (requiresRefrigeration && !selectedVehicle.refrigerator) {
            Alert.alert(
                "Warning", 
                "This cargo typically requires refrigeration, but you've selected a non-refrigerated vehicle. Do you want to continue?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Continue Anyway",
                        onPress: () => submitShipment()
                    }
                ]
            );
        } else {
            submitShipment();
        }
    };
    
    const submitShipment = async () => {
        // Combine shipment data with vehicle details
        const completeShipmentData = {
            ...shipmentData,
            estimatedPrice: selectedVehicle.estimated_price,
            vehicleTypeRequired: selectedVehicle.truck_type,
            refrigeratorRequired: selectedVehicle.refrigerator
        };
    
        try {
            setLoading(true);
            const response = await axios.post(
                `http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api/shipments/manufacturer/${shipmentData.manufacturerId}`,
                completeShipmentData,
                { timeout: 15000 } // 15 second timeout
            );
    
            if (response.status === 200 || response.status === 201) {
                Alert.alert(
                    "Success", 
                    "Shipment created successfully!",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                setModalVisible(false);
                                navigation.navigate('TrackingApp');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Error", "Failed to create shipment.");
            }
        } catch (error) {
            console.error("Error creating shipment:", error);
            Alert.alert(
                "Error", 
                "Unable to create shipment. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setLoading(false);
        }
    };

    const retryConnection = () => {
        setNetworkError(false);
        setErrorDetails('');
        fetchSuggestedVehicles();
    };

    const renderVehicleCard = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.card,
                // Highlight refrigerated vehicles when refrigeration is required
                requiresRefrigeration && item.refrigerator && styles.refrigeratedCard
            ]}
            onPress={() => handleViewDetails(item)}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image
                        source={{ uri: `data:image/png;base64,${item.image}` }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.noImageContainer}>
                        <Text style={styles.noImageText}>No Image</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.detailsRow}>
                    <Text style={styles.details}>{item.truck_type}</Text>
                </View>
                {/* Show refrigeration status if present */}
                {item.refrigerator !== undefined && (
                    <View style={styles.detailsRow}>
                        <Text style={[
                            styles.details, 
                            requiresRefrigeration && item.refrigerator && styles.highlightedText
                        ]}>
                            {item.refrigerator ? 'Refrigerated' : 'Non-Refrigerated'}
                        </Text>
                    </View>
                )}
                <View style={styles.detailsRow}>
                    <Text style={styles.priceText}>
                        ₹ {item.estimated_price && item.estimated_price !== "None - None" 
                            ? item.estimated_price 
                            : "Price unavailable"}
                    </Text>
                </View>
                <View style={styles.buttonContainer}>
                    <Text style={styles.buttonText}>View Details →</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Function to render the content based on state
    const renderScreenContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Finding the best vehicles for you...</Text>
                </View>
            );
        }
        
        if (vehicles.length === 0) {
            return (
                <View style={styles.noVehiclesContainer}>
                    <Text style={styles.noVehiclesText}>No suggested vehicles found for this shipment type.</Text>
                </View>
            );
        }
        
        return (
            <>
                {networkError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            Connection issue detected. Showing default vehicle options.
                            {__DEV__ && errorDetails ? `\n${errorDetails}` : ''}
                        </Text>
                        <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={retryConnection}
                        >
                            <Text style={styles.retryButtonText}>Retry Connection</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {requiresRefrigeration && (
                    <View style={styles.warningContainer}>
                        <Text style={styles.warningText}>This cargo type typically requires refrigeration</Text>
                    </View>
                )}
                   {/* AI/ML Suggestion Note */}
            <View style={styles.aiSuggestionContainer}>
                <Text style={styles.aiSuggestionTitle}>Smart Vehicle Recommendations</Text>
                <Text style={styles.aiSuggestionText}>
                    Based on your cargo details, route information, and historical data, our AI has 
                    analyzed the optimal vehicle options for your shipment. These suggestions consider 
                    cargo weight, distance, temperature requirements, and fuel efficiency to provide 
                    the most cost-effective transportation solution.
                </Text>
            </View>
                
                <FlatList
                    data={filteredVehicles}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderVehicleCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            </>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />

            {renderScreenContent()}

            {selectedVehicle && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Vehicle Details</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Text style={styles.closeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>
                           
                            <ScrollView style={styles.modalScroll}>
                                {/* Refrigeration Warning if necessary */}
                                {requiresRefrigeration && !selectedVehicle.refrigerator && (
                                    <View style={styles.warningBox}>
                                        <Text style={styles.warningBoxText}>
                                            Warning: This cargo typically requires refrigeration, but this vehicle is not refrigerated.
                                        </Text>
                                    </View>
                                )}
                                
                                {/* Vehicle Section */}
                                <View style={styles.sectionContainer}>
                                    <Text style={styles.sectionTitle}>Vehicle Information</Text>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Truck Type:</Text>
                                        <Text style={styles.detailValue}>{selectedVehicle.truck_type || 'Not specified'}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Refrigeration:</Text>
                                        <Text style={[
                                            styles.detailValue,
                                            requiresRefrigeration && !selectedVehicle.refrigerator && styles.warningText
                                        ]}>
                                            {getRefrigerationStatusText(selectedVehicle)}
                                        </Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Estimated Price:</Text>
                                        <Text style={styles.detailValue}>
                                            {selectedVehicle.estimated_price && selectedVehicle.estimated_price !== "None - None"
                                                ? `₹ ${selectedVehicle.estimated_price}`
                                                : 'Price unavailable'}
                                        </Text>
                                    </View>
                                    {selectedVehicle.min_mileage && selectedVehicle.max_mileage && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Mileage Range:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedVehicle.min_mileage} - {selectedVehicle.max_mileage} km/L
                                            </Text>
                                        </View>
                                    )}
                                </View>
                               
                                {/* Shipment Section */}
                                <View style={styles.sectionContainer}>
                                    <Text style={styles.sectionTitle}>Shipment Details</Text>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Cargo Type:</Text>
                                        <Text style={styles.detailValue}>{shipmentData.cargoType}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Contact:</Text>
                                        <Text style={styles.detailValue}>{shipmentData.contactName}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Phone:</Text>
                                        <Text style={styles.detailValue}>{shipmentData.contactNumber}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Pickup:</Text>
                                        <Text style={styles.detailValue}>{shipmentData.pickupPoint}, {shipmentData.pickupTown}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Dropoff:</Text>
                                        <Text style={styles.detailValue}>{shipmentData.dropPoint}, {shipmentData.dropTown}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Weight:</Text>
                                        <Text style={styles.detailValue}>{shipmentData.weight} kg</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Pickup Date:</Text>
                                        <Text style={styles.detailValue}>{new Date(shipmentData.pickupDate).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Delivery Date:</Text>
                                        <Text style={styles.detailValue}>{new Date(shipmentData.deliveryDate).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            </ScrollView>
                           
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.submitButton]}
                                    onPress={handleSubmit}
                                >
                                    <Text style={styles.submitButtonText}>Confirm Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    listContainer: {
        padding: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
    },
    refrigeratedCard: {
        borderWidth: 2,
        borderColor: '#28a745',
    },
    imageContainer: {
        width: 120,
        height: 120,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    noImageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#aaa',
        fontWeight: '500',
    },
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    details: {
        fontSize: 14,
        color: '#666',
    },
    highlightedText: {
        color: '#28a745',
        fontWeight: 'bold',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#28a745',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    buttonText: {
        fontSize: 14,
        color: '#007bff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#007bff',
        textAlign: 'center',
    },
    noVehiclesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    noVehiclesText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
    },
    warningContainer: {
        backgroundColor: '#fff3cd',
        padding: 12,
        margin: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    errorContainer: {
        backgroundColor: '#f8d7da',
        padding: 12,
        margin: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#dc3545',
    },
    retryButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    warningText: {
        color: '#856404',
        fontWeight: '500',
    },
    errorText: {
        color: '#721c24',
        fontWeight: '500',
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        padding: 12,
        margin: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    warningBoxText: {
        color: '#856404',
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        margin: 24,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        fontSize: 20,
        color: '#888',
        padding: 4,
    },
    modalScroll: {
        maxHeight: 400,
    },
    sectionContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        width: 120,
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    actionButton: {
        padding: 12,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f1f1f1',
    },
    submitButton: {
        backgroundColor: '#007bff',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
    },

    aiSuggestionContainer: {
        backgroundColor: '#e8f4fd',
        padding: 16,
        margin: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    aiSuggestionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0056b3',
        marginBottom: 6,
    },
    aiSuggestionText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
});

export default SuggestedVehiclesScreen;