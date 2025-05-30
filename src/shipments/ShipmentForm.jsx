import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, FlatList, Image,Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const Header = ({ currentStep, title }) => {
    const navigation = useNavigation();
    
    return (
      <View style={styles.header}>
        {currentStep === 1 ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#3498db" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpace} />
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.emptySpace} />
      </View>
    );
  };

const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 3;

let pickupDebounceTimeout = null;
let dropDebounceTimeout = null;

const ShipmentForm = () => {
    const navigation = useNavigation();
    const [currentStep, setCurrentStep] = useState(1);
    const [manufacturerId, setManufacturerId] = useState(null);

    // Form state variables
    const [cargoType, setCargoType] = useState('');
    const [weight, setWeight] = useState('');
    const [pickupDateTime, setPickupDateTime] = useState(null);
    const [deliveryDateTime, setDeliveryDateTime] = useState(null);
    const [contactName, setContactName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [receiverContactName, setreceiverContactName] = useState('');
    const [receiverContactNumber, setreceiverContactNumber] = useState('');

    // Address search state variables
    const [pickupQuery, setPickupQuery] = useState('');
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [pickupLoading, setPickupLoading] = useState(false);

    const [dropQuery, setDropQuery] = useState('');
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [dropLoading, setDropLoading] = useState(false);

    // Selected address states
    const [selectedPickupAddress, setSelectedPickupAddress] = useState(null);
    const [selectedDropAddress, setSelectedDropAddress] = useState(null);

    // Address component fields
    const [pickupPoint, setPickUpPoint] = useState('');
    const [pickupHouseNo, setPickUpHouseNo] = useState('');
    const [pickupStreetName, setPickUpStreetName] = useState('');
    const [pickupTown, setPickUpTown] = useState('');
    const [pickupState, setPickupState] = useState('');
    const [pickupPostalCode, setPickupPostalCode] = useState('');
    const [pickupCountry, setPickupCountry] = useState('');

    const [dropPoint, setDropPoint] = useState('');
    const [dropHouseNo, setDropHouseNo] = useState('');
    const [dropStreetName, setDropStreetName] = useState('');
    const [dropTown, setDropTown] = useState('');
    const [dropState, setDropState] = useState('');
    const [dropPostalCode, setDropPostalCode] = useState('');
    const [dropCountry, setDropCountry] = useState('');

    // DateTime picker states
    const [showPickupPicker, setShowPickupPicker] = useState(false);
    const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
    const [pickupPickerMode, setPickupPickerMode] = useState('date');
    const [deliveryPickerMode, setDeliveryPickerMode] = useState('date');

    // Add error state variables
    const [cargoTypeError, setCargoTypeError] = useState('');
    const [weightError, setWeightError] = useState('');
    const [contactNameError, setContactNameError] = useState('');
    const [contactNumberError, setContactNumberError] = useState('');
    const [receiverContactNameError, setReceiverContactNameError] = useState('');
    const [receiverContactNumberError, setReceiverContactNumberError] = useState('');


    // Add this to your state variables
    // First, make sure you've added this state variable
    const [showImageButtons, setShowImageButtons] = useState(false);
    const [liveImages, setLiveImages] = useState([]);
    const [aimlImages, setAimlImages] = useState([]);
    const [showLiveImages, setShowLiveImages] = useState(false);
    const [showAimlImages, setShowAimlImages] = useState(false);
    const [loadingImages, setLoadingImages] = useState(false);


//  const [selectedVehicle, setSelectedVehicle] = useState(null);
// const [showImages, setShowImages] = useState(false);

// const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(null);
// const [showVehicleImages, setShowVehicleImages] = useState(false);

const [showModal, setShowModal] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);
const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);


    // Modify validateCargoType to update button visibility
    const validateCargoType = (text) => {
        const alphabetRegex = /^[A-Za-z\s]*$/;
        if (!alphabetRegex.test(text)) {
            setCargoTypeError('Only alphabets are allowed');
            return false;
        }

        const textWithoutSpaces = text.replace(/\s/g, '');
        if (textWithoutSpaces.length > 0 && textWithoutSpaces.length < 3) {
            setCargoTypeError('Minimum 3 letters required');
            setCargoType(text);
            return false;
        }

        if (textWithoutSpaces.length > 20) {
            setCargoTypeError('Maximum 20 letters allowed');
            return false;
        }

        setCargoTypeError('');
        setCargoType(text);

        // Check immediately if both fields are valid
        setTimeout(() => {
            if (text && weight && !weightError) {
                setShowImageButtons(true);
            }
        }, 0);

        return true;
    };

    // Modify validateWeight to update button visibility
    const validateWeight = (text) => {
        const numberRegex = /^\d*\.?\d*$/;
        if (!numberRegex.test(text)) {
            setWeightError('Only numbers are allowed');
            return false;
        }

        const parts = text.split('.');
        const integerPart = parts[0];

        if (integerPart.length > 4) {
            setWeightError('Maximum 4 digits allowed');
            return false;
        }

        setWeightError('');
        setWeight(text);

        // Check immediately if both fields are valid
        setTimeout(() => {
            if (text && cargoType && !cargoTypeError) {
                setShowImageButtons(true);
            }
        }, 0);

        return true;
    };


    const validateContactName = (text) => {
        const alphabetRegex = /^[A-Za-z\s]*$/;
        if (!alphabetRegex.test(text)) {
            setContactNameError('Only alphabets are allowed');
            return false;
        }

        const textWithoutSpaces = text.replace(/\s/g, '');
        if (textWithoutSpaces.length > 0 && textWithoutSpaces.length < 3) {
            setContactNameError('Minimum 3 letters required');
            setContactName(text);
            return false;
        }

        if (textWithoutSpaces.length > 30) {
            setContactNameError('Maximum 30 letters allowed');
            return false;
        }

        setContactNameError('');
        setContactName(text);
        return true;
    };

    const validateContactNumber = (text) => {
        const numberRegex = /^\d{0,10}$/;
        if (!numberRegex.test(text)) {
            setContactNumberError('Only numbers are allowed');
            return false;
        }
        if (text.length === 10) {
            setContactNumberError('');
        } else if (text.length > 0) {
            setContactNumberError('Phone number must be 10 digits');
        }
        setContactNumber(text);
        return true;
    };
    const validateReceiverContactName = (text) => {
        const alphabetRegex = /^[A-Za-z\s]*$/;
        if (!alphabetRegex.test(text)) {
            setReceiverContactNameError('Only alphabets are allowed');
            return false;
        }

        const textWithoutSpaces = text.replace(/\s/g, '');
        if (textWithoutSpaces.length > 0 && textWithoutSpaces.length < 3) {
            setReceiverContactNameError('Minimum 3 letters required');
            setreceiverContactName(text);
            return false;
        }

        if (textWithoutSpaces.length > 30) {
            setReceiverContactNameError('Maximum 30 letters allowed');
            return false;
        }

        setReceiverContactNameError('');
        setreceiverContactName(text);
        return true;
    };

    const validateReceiverContactNumber = (text) => {
        const numberRegex = /^\d{0,10}$/;
        if (!numberRegex.test(text)) {
            setReceiverContactNumberError('Only numbers are allowed');
            return false;
        }
        if (text.length === 10) {
            setReceiverContactNumberError('');
        } else if (text.length > 0) {
            setReceiverContactNumberError('Phone number must be 10 digits');
        }
        setreceiverContactNumber(text);
        return true;
    };

    // Add these functions to fetch images
    const fetchLiveImages = async () => {
        setLoadingImages(true);
        try {
            const weightInGrams = parseFloat(weight) * 1000;
            const response = await fetch(`http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000/get-suggested-vehicles/images?cargo_type=${encodeURIComponent(cargoType)}&weight=${weightInGrams}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setLiveImages(data.suggested_vehicles);
            setShowLiveImages(true);
            setShowAimlImages(false);
        } catch (error) {
            console.error('Error fetching live images:', error);
            Alert.alert("Error", "Failed to load live images. Please try again.");
        } finally {
            setLoadingImages(false);
        }
    };

    const fetchAimlImages = async () => {
        setLoadingImages(true);
        try {
            const weightInGrams = parseFloat(weight) * 1000;
            const response = await fetch(`http://aiml-logistics-lb-2065232633.us-east-1.elb.amazonaws.com:8000/get-suggested-vehicles/ai-images?cargo_type=${encodeURIComponent(cargoType)}&weight=${weightInGrams}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setAimlImages(data.suggested_vehicles);
            setShowAimlImages(true);
            setShowLiveImages(false);
        } catch (error) {
            console.error('Error fetching AIML images:', error);
            Alert.alert("Error", "Failed to load AI/ML images. Please try again.");
        } finally {
            setLoadingImages(false);
        }
    };


    // Add this component for rendering images
   // Replace the existing renderVehicleImages function with this updated version
   // Update the renderVehicleImages function to handle base64 images for AIML section
   // Update the renderVehicleImages function to handle empty image arrays
const renderVehicleImages = () => {
    if (loadingImages) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loaderText}>Loading vehicles...</Text>
            </View>
        );
    }

    if (showLiveImages && liveImages.length > 0) {
        return (
            <View style={styles.imagesContainer}>
                <View style={styles.imagesHeader}>
                    <Text style={styles.imagesHeaderText}>Suggested Vehicles (Live)</Text>
                    <TouchableOpacity onPress={() => setShowLiveImages(false)}>
                        <MaterialIcons name="close" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.imageGallery}>
                    {liveImages.map((vehicle, index) => {
                        // Check if images array exists and has items
                        if (!vehicle.images || vehicle.images.length === 0) {
                            return (
                                <View key={index} style={styles.noImagesContainer}>
                                    <Text style={styles.noImagesText}>No images found for {vehicle.name}</Text>
                                </View>
                            );
                        }
                        
                        return vehicle.images.map((img, imgIndex) => (
                            <TouchableOpacity 
                                key={`${index}-${imgIndex}`}
                                style={styles.galleryImageContainer}
                                onPress={() => {
                                    setSelectedImage(img.s3Url);
                                    setSelectedVehicleDetails(vehicle);
                                    setShowModal(true);
                                }}
                            >
                                <Image
                                    source={{ uri: img.s3Url }}
                                    style={styles.galleryImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ));
                    })}
                </View>
            </View>
        );
    } else if (showAimlImages && aimlImages.length > 0) {
        return (
            <View style={styles.imagesContainer}>
                <View style={styles.imagesHeader}>
                    <Text style={styles.imagesHeaderText}>Suggested Vehicles (AI/ML)</Text>
                    <TouchableOpacity onPress={() => setShowAimlImages(false)}>
                        <MaterialIcons name="close" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.imageGallery}>
                    {aimlImages.map((vehicle, index) => {
                        // Check if image exists
                        if (!vehicle.image) {
                            return (
                                <View key={index} style={styles.noImagesContainer}>
                                    <Text style={styles.noImagesText}>No images found for {vehicle.name}</Text>
                                </View>
                            );
                        }
                        
                        return (
                            <TouchableOpacity 
                                key={index}
                                style={styles.galleryImageContainer}
                                onPress={() => {
                                    setSelectedImage(`data:image/jpeg;base64,${vehicle.image}`);
                                    setSelectedVehicleDetails(vehicle);
                                    setShowModal(true);
                                }}
                            >
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${vehicle.image}` }}
                                    style={styles.galleryImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    }
    return null;
};


const renderImageModal = () => {
    if (!showModal || !selectedImage || !selectedVehicleDetails) return null;
    
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={showModal}
            onRequestClose={() => {
                setShowModal(false);
                setSelectedImage(null);
                setSelectedVehicleDetails(null);
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderText}>{selectedVehicleDetails.name}</Text>
                        <TouchableOpacity 
                            onPress={() => {
                                setShowModal(false);
                                setSelectedImage(null);
                                setSelectedVehicleDetails(null);
                            }}
                        >
                            <MaterialIcons name="close" size={24} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView contentContainerStyle={{flexGrow: 1}}>
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                        
                        <View style={styles.modalVehicleInfo}>
                            <Text style={styles.modalVehicleDetail}>
                                <Text style={styles.modalVehicleLabel}>Refrigeration:</Text> {selectedVehicleDetails.refrigerator ? 'Yes' : 'No'}
                            </Text>
                            <Text style={styles.modalVehicleDetail}>
                                <Text style={styles.modalVehicleLabel}>Type:</Text> {selectedVehicleDetails.truck_type}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};


    React.useEffect(() => {
        const fetchManufacturerId = async () => {
            try {
                const id = await AsyncStorage.getItem('manufacturerId');
                if (id) {
                    setManufacturerId(id);
                } else {
                    Alert.alert("Error", "Manufacturer ID not found, please login again");
                    navigation.navigate('Login');
                }
            } catch (error) {
                console.error("Error fetching manufacturer ID:", error);
                Alert.alert("Error", "Failed to get manufacturer ID");
            }
        };

        fetchManufacturerId();
    }, []);

    // Add this new useEffect for managing the image buttons visibility
    React.useEffect(() => {
        // This will run whenever cargoType or weight changes
        if (cargoType && weight && !cargoTypeError && !weightError) {
            setShowImageButtons(true);
        } else {
            setShowImageButtons(false);
        }
    }, [cargoType, weight, cargoTypeError, weightError]);


    const searchAddress = async (text, setLoading, setSuggestions) => {
        if (text.length < MIN_SEARCH_LENGTH) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const searchQuery = encodeURIComponent(text);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json` +
                `&q=${searchQuery}` +
                `&limit=5` +
                `&addressdetails=1` +
                `&countrycodes=IN` +
                `&bounded=1` +
                `&viewbox=77.0,6.0,92.0,37.0` +
                `&dedupe=1`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'ShipmentApp/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Error searching addresses:', error);
            Alert.alert("Search Error", "There was an error searching for addresses. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePickupSearch = (text) => {
        setPickupQuery(text);
        if (pickupDebounceTimeout) clearTimeout(pickupDebounceTimeout);
        pickupDebounceTimeout = setTimeout(() => {
            searchAddress(text, setPickupLoading, setPickupSuggestions);
        }, DEBOUNCE_DELAY);
    };

    const handleDropSearch = (text) => {
        setDropQuery(text);
        if (dropDebounceTimeout) clearTimeout(dropDebounceTimeout);
        dropDebounceTimeout = setTimeout(() => {
            searchAddress(text, setDropLoading, setDropSuggestions);
        }, DEBOUNCE_DELAY);
    };

    const selectPickupAddress = (item) => {
        const address = parseOpenStreetMapAddress(item);

        setSelectedPickupAddress({
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        });

        setPickUpPoint(address.name || '');
        setPickUpHouseNo(address.house_number || '');
        setPickUpStreetName(address.road || '');
        setPickUpTown(address.city || address.town || address.village || '');
        setPickupState(address.state || '');
        setPickupPostalCode(address.postcode || '');
        setPickupCountry(address.country || '');

        setPickupSuggestions([]);
        setPickupQuery(item.display_name);
    };

    const selectDropAddress = (item) => {
        const address = parseOpenStreetMapAddress(item);

        setSelectedDropAddress({
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        });

        setDropPoint(address.name || '');
        setDropHouseNo(address.house_number || '');
        setDropStreetName(address.road || '');
        setDropTown(address.city || address.town || address.village || '');
        setDropState(address.state || '');
        setDropPostalCode(address.postcode || '');
        setDropCountry(address.country || '');

        setDropSuggestions([]);
        setDropQuery(item.display_name);
    };

    const clearPickupAddress = () => {
        setSelectedPickupAddress(null);
        setPickupQuery('');
        setPickUpPoint('');
        setPickUpHouseNo('');
        setPickUpStreetName('');
        setPickUpTown('');
        setPickupState('');
        setPickupPostalCode('');
        setPickupCountry('');
    };

    const clearDropAddress = () => {
        setSelectedDropAddress(null);
        setDropQuery('');
        setDropPoint('');
        setDropHouseNo('');
        setDropStreetName('');
        setDropTown('');
        setDropState('');
        setDropPostalCode('');
        setDropCountry('');
    };

    const parseOpenStreetMapAddress = (item) => {
        const address = item.address || {};
        return {
            name: address.building || address.amenity || address.shop || '',
            house_number: address.house_number || '',
            road: address.road || address.pedestrian || address.footway || '',
            city: address.city || '',
            town: address.town || '',
            village: address.village || '',
            state: address.state || '',
            postcode: address.postcode || '',
            country: address.country || '',
        };
    };

    const formatDateTime = (datetime) => {
        if (!datetime) return '';
        const date = datetime.toLocaleDateString();
        const time = datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${date} ${time}`;
    };

    const handlePickupDateTimeChange = (event, selectedDateTime) => {
        if (event.type === 'dismissed') {
            setShowPickupPicker(false);
            return;
        }

        const currentDateTime = new Date();

        if (selectedDateTime) {
            if (pickupPickerMode === 'date') {
                if (selectedDateTime.toDateString() === currentDateTime.toDateString()) {
                    const newDate = new Date(selectedDateTime);
                    if (pickupDateTime) {
                        newDate.setHours(pickupDateTime.getHours(), pickupDateTime.getMinutes());
                    } else {
                        newDate.setHours(currentDateTime.getHours(), currentDateTime.getMinutes());
                    }
                    setShowPickupPicker(false);
                    setPickupDateTime(newDate);
                    setPickupPickerMode('time');
                    setShowPickupPicker(true);
                } else if (selectedDateTime >= currentDateTime) {
                    const newDate = new Date(selectedDateTime);
                    if (pickupDateTime) {
                        newDate.setHours(pickupDateTime.getHours(), pickupDateTime.getMinutes());
                    }
                    setShowPickupPicker(false);
                    setPickupDateTime(newDate);
                    setPickupPickerMode('time');
                    setShowPickupPicker(true);
                } else {
                    Alert.alert("Invalid Date", "Please select today or a future date");
                    setShowPickupPicker(false);
                    return;
                }
            } else if (pickupPickerMode === 'time') {
                const newDateTime = new Date(pickupDateTime.toDateString());
                newDateTime.setHours(selectedDateTime.getHours(), selectedDateTime.getMinutes());

                if (pickupDateTime.toDateString() === currentDateTime.toDateString() &&
                    newDateTime < currentDateTime) {
                    Alert.alert("Invalid Time", "Please select current or future time");
                    setShowPickupPicker(false);
                    setPickupPickerMode('date');
                    return;
                }

                setPickupDateTime(newDateTime);
                setShowPickupPicker(false);
                setPickupPickerMode('date');
            }
        }
    };

    const handleDeliveryDateTimeChange = (event, selectedDateTime) => {
        if (event.type === 'dismissed') {
            setShowDeliveryPicker(false);
            return;
        }

        const currentDateTime = new Date();

        if (!pickupDateTime) {
            Alert.alert("Missing Information", "Please select pickup date and time first");
            setShowDeliveryPicker(false);
            return;
        }

        const minimumDeliveryTime = new Date(pickupDateTime.getTime());
        minimumDeliveryTime.setHours(minimumDeliveryTime.getHours() + 10);

        if (selectedDateTime) {
            if (deliveryPickerMode === 'date') {
                const selectedDateWithTime = new Date(selectedDateTime);
                if (deliveryDateTime) {
                    selectedDateWithTime.setHours(deliveryDateTime.getHours(), deliveryDateTime.getMinutes());
                } else {
                    selectedDateWithTime.setHours(0, 0, 0, 0);
                }

                const selectedDateMidnight = new Date(selectedDateTime);
                selectedDateMidnight.setHours(0, 0, 0, 0);

                const pickupDateMidnight = new Date(pickupDateTime);
                pickupDateMidnight.setHours(0, 0, 0, 0);

                const hourDifference = (selectedDateMidnight - pickupDateMidnight) / (1000 * 60 * 60);

                if (hourDifference > 24) {
                    setShowDeliveryPicker(false);
                    setDeliveryDateTime(selectedDateWithTime);
                    setDeliveryPickerMode('time');
                    setShowDeliveryPicker(true);
                } else if (hourDifference === 24) {
                    setShowDeliveryPicker(false);
                    setDeliveryDateTime(selectedDateWithTime);
                    setDeliveryPickerMode('time');
                    setShowDeliveryPicker(true);
                } else if (hourDifference === 0) {
                    const endOfDay = new Date(pickupDateTime);
                    endOfDay.setHours(23, 59, 59, 999);

                    if (minimumDeliveryTime > endOfDay) {
                        Alert.alert("Invalid Date", "Based on your pickup time, delivery must be scheduled for the next day or later (10 hour minimum)");
                        setShowDeliveryPicker(false);
                        return;
                    }

                    setShowDeliveryPicker(false);
                    setDeliveryDateTime(selectedDateWithTime);
                    setDeliveryPickerMode('time');
                    setShowDeliveryPicker(true);
                } else {
                    Alert.alert("Invalid Date", "Delivery date must be on or after pickup date");
                    setShowDeliveryPicker(false);
                    return;
                }
            } else if (deliveryPickerMode === 'time') {
                const newDateTime = new Date(deliveryDateTime);
                newDateTime.setHours(selectedDateTime.getHours(), selectedDateTime.getMinutes());

                if (newDateTime < minimumDeliveryTime) {
                    Alert.alert(
                        "Invalid Time",
                        `Delivery time must be at least 10 hours after pickup time (${minimumDeliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                    );
                    setShowDeliveryPicker(false);
                    setDeliveryPickerMode('date');
                    return;
                }

                setDeliveryDateTime(newDateTime);
                setShowDeliveryPicker(false);
                setDeliveryPickerMode('date');
            }
        }
    };

    const showPickupDateTimePicker = () => {
        setPickupPickerMode('date');
        setShowPickupPicker(true);
    };

    const showDeliveryDateTimePicker = () => {
        setDeliveryPickerMode('date');
        setShowDeliveryPicker(true);
    };


    // Add this function after validateWeight
    const checkShowImageButtons = () => {
        if (cargoType && cargoType.trim() !== '' && weight && weight.trim() !== '' && !cargoTypeError && !weightError) {
            setShowImageButtons(true);
        } else {
            setShowImageButtons(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep4()) {
            return;
        }

        if (!manufacturerId) {
            Alert.alert("Error", "Manufacturer ID not available. Please login again.");
            return;
        }

        if (!selectedPickupAddress || !selectedDropAddress) {
            Alert.alert("Error", "Please select both pickup and drop addresses using the search feature");
            return;
        }

        const weightInKg = parseFloat(weight) * 1000;

        const shipmentData = {
            manufacturerId,
            cargoType,
            weight: weightInKg,
            pickupDate: pickupDateTime ? pickupDateTime.toISOString() : null,
            deliveryDate: deliveryDateTime ? deliveryDateTime.toISOString() : null,
            contactName,
            contactNumber,
            receiverContactName,
            receiverContactNumber,
            pickupPoint,
            pickupHouseNo,
            pickupStreetName,
            pickupTown,
            pickupState,
            pickupPostalCode,
            pickupCountry,
            dropPoint,
            dropHouseNo,
            dropStreetName,
            dropTown,
            dropState,
            dropPostalCode,
            dropCountry,
            pickupLatitude: selectedPickupAddress.latitude,
            pickupLongitude: selectedPickupAddress.longitude,
            droppingLatitude: selectedDropAddress.latitude,
            droppingLongitude: selectedDropAddress.longitude,
            shipmentStatus: "PENDING",
        };

        console.log(shipmentData);
        navigation.navigate('SuggestedVehiclesScreen', { shipmentData });
    };

    const validateStep1 = () => {
        if (!cargoType || !weight || !pickupDateTime || !deliveryDateTime) {
            Alert.alert("Error", "Please fill all fields");
            return false;
        }
        if (cargoTypeError || weightError) {
            Alert.alert("Error", "Please correct the errors in the form");
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!selectedPickupAddress ) {
            Alert.alert("Error", "Please search and select both pickup addresses");
            return false;
        }
        return true;
    };

    const validateStep4 = () => {
        if (!contactName || !contactNumber || !receiverContactName || !receiverContactNumber) {
            Alert.alert("Error", "Please enter all contact details");
            return false;
        }
        if (contactNameError || contactNumberError || receiverContactNameError || receiverContactNumberError) {
            Alert.alert("Error", "Please correct the errors in the form");
            return false;
        }
        if (contactNumber.length !== 10) {
            setContactNumberError('Phone number must be 10 digits');
            Alert.alert("Error", "Phone number must be 10 digits");
            return false;
        }
        if (receiverContactNumber.length !== 10) {
            setReceiverContactNumberError('Phone number must be 10 digits');
            Alert.alert("Error", "Receiver phone number must be 10 digits");
            return false;
        }
        return true;
    };
    const validateStep3 = () => {
        if (!selectedDropAddress ) {
            Alert.alert("Error", "Please search and select both drop addresses");
            return false;
        }
        return true;
    };

    // const handleNext = () => {
    //     if (currentStep === 1 && validateStep1()) {
    //         setCurrentStep(2);
    //     } else if (currentStep === 2 && validateStep2()) {
    //         setCurrentStep(3);
    //     }
    // };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        } else if (currentStep === 3 && validateStep3()) {
            // For step 3, just move to step 4 without validation
            // since validation will happen in the final handleSubmit function
            setCurrentStep(4);

        }
    };

    const handlePrevious = () => {
        setCurrentStep(currentStep - 1);
    };

    // Now modify the renderStep1 function to include the image buttons
    const renderStep1 = () => (
        <View>
            {/* <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep === 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 2 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 3 && styles.stepDotActive]} />
            </View> */}

            <Text style={styles.label}>Cargo Type</Text>
            <TextInput
                style={[styles.input, cargoTypeError ? styles.inputError : null]}
                placeholder="Enter the Cargo Type"
                placeholderTextColor="black"
                value={cargoType}
                onChangeText={validateCargoType}
            />
            {cargoTypeError ? <Text style={styles.errorText}>{cargoTypeError}</Text> : null}

            <Text style={styles.label}>Cargo Weight (tons)</Text>
            <TextInput
                style={[styles.input, weightError ? styles.inputError : null]}
                placeholder="Enter the Cargo Weight in Tons"
                placeholderTextColor="black"
                keyboardType="numeric"
                value={weight}
                onChangeText={validateWeight}
            />
            {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}

            {/* After the cargo type and weight fields */}
            {showImageButtons && (
                <View style={styles.imageButtonsContainer}>
                    <TouchableOpacity
                        style={styles.imageButton}
                        onPress={fetchLiveImages}
                    >
                        <Text style={styles.imageButtonText}>Live Images</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.imageButton}
                        onPress={fetchAimlImages}
                    >
                        <Text style={styles.imageButtonText}>AIML Images</Text>
                    </TouchableOpacity>
                </View>
            )}

            {renderVehicleImages()}

            <Text style={styles.label}>Pickup Date and Time</Text>
            <TouchableOpacity onPress={showPickupDateTimePicker}>
                <Text style={styles.dateInput}>
                    {pickupDateTime ? formatDateTime(pickupDateTime) : 'Select Date & Time'}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Delivery Date and Time</Text>
            <TouchableOpacity onPress={showDeliveryDateTimePicker}>
                <Text style={styles.dateInput}>
                    {deliveryDateTime ? formatDateTime(deliveryDateTime) : 'Select Date & Time'}
                </Text>
            </TouchableOpacity>

            {showPickupPicker && (
                <DateTimePicker
                    value={pickupDateTime || new Date()}
                    mode={pickupPickerMode}
                    is24Hour={true}
                    display="default"
                    onChange={handlePickupDateTimeChange}
                    minimumDate={new Date()}
                />
            )}

            {showDeliveryPicker && (
                <DateTimePicker
                    value={deliveryDateTime || new Date()}
                    mode={deliveryPickerMode}
                    is24Hour={true}
                    display="default"
                    onChange={handleDeliveryDateTimeChange}
                    minimumDate={new Date()}
                />
            )}

            <View style={styles.buttonContainer1}>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View>
            {/* <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep === 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 2 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 3 && styles.stepDotActive]} />
            </View> */}
            <Text style={styles.heading}>Pickup Address Details</Text>

            <Text style={styles.subHeading}>Pickup Address</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={`Search for pickup address (min. ${MIN_SEARCH_LENGTH} characters)`}
                    placeholderTextColor="black"
                    value={pickupQuery}
                    onChangeText={handlePickupSearch}
                    onFocus={() => setDropSuggestions([])}
                />
                {pickupLoading && <ActivityIndicator style={styles.loader} />}

                {pickupSuggestions.length > 0 && (
                    <View style={styles.suggestionList}>
                        <FlatList
                            data={pickupSuggestions}
                            keyExtractor={(item) => item.place_id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => selectPickupAddress(item)}
                                >
                                    <Text style={styles.suggestionText}>{item.display_name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </View>

            {selectedPickupAddress && (
                <View style={styles.selectedAddressContainer}>
                    <Text style={styles.selectedAddressText}>{selectedPickupAddress.address}</Text>
                    <TouchableOpacity
                        style={styles.cancelIcon}
                        onPress={() => clearPickupAddress()}
                    >
                        <MaterialIcons name="cancel" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
            )}

           

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.prevButton]} onPress={handlePrevious}>
                    <Text style={[styles.buttonText, styles.prevButtonText]}>Previous</Text>
                </TouchableOpacity>
                <View style={styles.buttonSpacer} />
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
        </View>
    );


    // ===================================================================================

    const renderStep3 = () => (
        <View>
            {/* <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep === 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 2 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 3 && styles.stepDotActive]} />
            </View> */}
            <Text style={styles.heading}>Drop Address Details</Text>

            
            <Text style={styles.subHeading}>Drop Address</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={`Search for drop address (min. ${MIN_SEARCH_LENGTH} characters)`}
                    placeholderTextColor="black"
                    value={dropQuery}
                    onChangeText={handleDropSearch}
                    onFocus={() => setPickupSuggestions([])}
                />
                {dropLoading && <ActivityIndicator style={styles.loader} />}

                {dropSuggestions.length > 0 && (
                    <View style={styles.suggestionList}>
                        <FlatList
                            data={dropSuggestions}
                            keyExtractor={(item) => item.place_id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => selectDropAddress(item)}
                                >
                                    <Text style={styles.suggestionText}>{item.display_name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </View>

            {selectedDropAddress && (
                <View style={styles.selectedAddressContainer}>
                    <Text style={styles.selectedAddressText}>{selectedDropAddress.address}</Text>
                    <TouchableOpacity
                        style={styles.cancelIcon}
                        onPress={() => clearDropAddress()}
                    >
                        <MaterialIcons name="cancel" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.prevButton]} onPress={handlePrevious}>
                    <Text style={[styles.buttonText, styles.prevButtonText]}>Previous</Text>
                </TouchableOpacity>
                <View style={styles.buttonSpacer} />
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
        </View>
    );





    // ==========================================================================================

    const renderStep4 = () => (
        <View>
            {/* <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep === 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 2 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep === 3 && styles.stepDotActive]} />
            </View> */}
            <Text style={styles.heading}>Contact Details</Text>
            <Text style={styles.subHeading}>Pickup Person Contact Details</Text>

            <Text style={styles.label}>Contact Name</Text>
            <TextInput
                placeholder="Enter the Contact Name"
                placeholderTextColor="black"
                style={[styles.input, contactNameError ? styles.inputError : null]}
                value={contactName}
                onChangeText={validateContactName}
            />
            {contactNameError ? <Text style={styles.errorText}>{contactNameError}</Text> : null}

            <Text style={styles.label}>Contact Number</Text>
            <TextInput
                placeholder="Enter the Contact Number"
                placeholderTextColor="black"
                style={[styles.input, contactNumberError ? styles.inputError : null]}
                keyboardType="phone-pad"
                value={contactNumber}
                onChangeText={validateContactNumber}
                maxLength={10}
            />
            {contactNumberError ? <Text style={styles.errorText}>{contactNumberError}</Text> : null}

            <Text style={styles.subHeading}>Receiver Contact Details</Text>

            <Text style={styles.label}>Receiver Contact Name</Text>
            <TextInput
                placeholder="Enter the Receiver Contact Name"
                placeholderTextColor="black"
                style={[styles.input, receiverContactNameError ? styles.inputError : null]}
                value={receiverContactName}
                onChangeText={validateReceiverContactName}
            />
            {receiverContactNameError ? <Text style={styles.errorText}>{receiverContactNameError}</Text> : null}

            <Text style={styles.label}>Receiver Contact Number</Text>
            <TextInput
                placeholder="Enter the Receiver Contact Number"
                placeholderTextColor="black"
                style={[styles.input, receiverContactNumberError ? styles.inputError : null]}
                keyboardType="phone-pad"
                value={receiverContactNumber}
                onChangeText={validateReceiverContactNumber}
                maxLength={10}
            />
            {receiverContactNumberError ? <Text style={styles.errorText}>{receiverContactNumberError}</Text> : null}

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.prevButton]} onPress={handlePrevious}>
                    <Text style={[styles.buttonText, styles.prevButtonText]}>Previous</Text>
                </TouchableOpacity>
                <View style={styles.buttonSpacer} />
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Check Vehicles</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
          <Header currentStep={currentStep} title="Shipment Form" />
          <FlatList
            data={[{ key: 'step1' }, { key: 'step2' }, { key: 'step3' },{ key: 'step4' }]}
            renderItem={({ item }) => {
              if (item.key === 'step1' && currentStep === 1) return renderStep1();
              if (item.key === 'step2' && currentStep === 2) return renderStep2();
              if (item.key === 'step3' && currentStep === 3) return renderStep3();
              if (item.key === 'step4' && currentStep === 4) return renderStep4();

              return null;
            }}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.container}
          />
          {renderImageModal()}
        </View>
      );
};
// Add these new styles to your styles object
const additionalStyles = {
    vehicleInfo: {
        marginBottom: 10,
    },
    vehicleDetail: {
        fontSize: 14,color: '#7f8c8d',marginTop: 4,
    },
    viewImagesButton: {
        backgroundColor: '#3498db',padding: 8,borderRadius: 6,alignSelf: 'flex-start',marginTop: 8,
    },
    viewImagesButtonText: {
        color: '#fff',fontSize: 14,fontWeight: '500',
    },
    imageHeader: {
        flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',marginVertical: 8,paddingBottom: 4,borderBottomWidth: 1,borderBottomColor: '#ecf0f1',
    },
    imagesTitle: {
        fontSize: 14,fontWeight: '600',color: '#34495e',
    },
    imageContainer: {
        marginRight: 10,marginBottom: 10,
    },
    vehicleImage: {
        width: 150,height: 100,borderRadius: 4,
    },
    imageGallery: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    galleryImageContainer: {
        width: '32%',
        marginBottom: 10,
    },
    galleryImage: {
        width: '100%',
        height: 100,
        borderRadius: 6,
    },

    noImagesContainer: {
        width: '32%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f2f6',
        borderRadius: 6,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#dde1e5',
        borderStyle: 'dashed',
    },
    noImagesText: {
        fontSize: 12,
        textAlign: 'center',
        color: '#7f8c8d',
        paddingHorizontal: 4,
    },

};
// Add these styles to your StyleSheet
const modalStyles = {
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', // Centers content vertically
        alignItems: 'center',     // Centers content horizontally
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        width: '85%',             // Slightly narrower for better visual centering
        maxHeight: '60%',         // Smaller height to ensure it's visibly centered
        alignSelf: 'center',      // Additional horizontal centering
        justifyContent: 'center', // Center content vertically
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
        paddingBottom: 8,
    },
    modalHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    modalImage: {
        width: '100%',
        height: 200,             // Reduced height for better centering
        borderRadius: 8,
        marginBottom: 16,
    },
    modalVehicleInfo: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ecf0f1',
    },
    modalVehicleDetail: {
        fontSize: 16,
        color: '#34495e',
        marginBottom: 8,
    },
    modalVehicleLabel: {
        fontWeight: 'bold',
    },
};


const styles = StyleSheet.create({

    vehicleInfo: additionalStyles.vehicleInfo,
    vehicleDetail: additionalStyles.vehicleDetail,
    viewImagesButton: additionalStyles.viewImagesButton,
    viewImagesButtonText: additionalStyles.viewImagesButtonText,
    imageHeader: additionalStyles.imageHeader,
    imagesTitle: additionalStyles.imagesTitle,


    imageGallery: additionalStyles.imageGallery,
    galleryImageContainer: additionalStyles.galleryImageContainer,
    galleryImage: additionalStyles.galleryImage,


    noImagesContainer: additionalStyles.noImagesContainer,
    noImagesText: additionalStyles.noImagesText,


     // Add these modal styles to your existing styles object
     modalOverlay: modalStyles.modalOverlay,
     modalContainer: modalStyles.modalContainer,
     modalHeader: modalStyles.modalHeader,
     modalHeaderText: modalStyles.modalHeaderText,
     modalImage: modalStyles.modalImage,
     modalVehicleInfo: modalStyles.modalVehicleInfo,
     modalVehicleDetail: modalStyles.modalVehicleDetail,
     modalVehicleLabel: modalStyles.modalVehicleLabel,

    mainContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        padding: 24,flexGrow: 1,
    },
    heading: {
        fontSize: 26,fontWeight: 'bold',marginBottom: 24,color: '#2c3e50',textAlign: 'center',
    },
    subHeading: {
        fontSize: 20,fontWeight: 'bold',marginTop: 24,marginBottom: 12,color: '#34495e',borderBottomWidth: 1,borderBottomColor: '#ecf0f1',paddingBottom: 8,
    },
    label: {
        fontSize: 16,fontWeight: '600',marginBottom: 8,color: '#2c3e50',marginLeft: 4,
    },
    input: {
        fontSize: 16,borderWidth: 1,borderColor: '#dde1e5',borderRadius: 12,padding: 14,marginBottom: 5,backgroundColor: '#fff',
        color: '#333',shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,shadowRadius: 3,elevation: 2,
    },
    dateInput: {
        height: 50,borderColor: '#dde1e5',borderWidth: 1,borderRadius: 12,paddingHorizontal: 14,marginBottom: 18,backgroundColor: '#fff',textAlignVertical: 'center',paddingTop: 14,color: '#2c3e50',fontSize: 16,shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,shadowRadius: 3,elevation: 2,
    },
    buttonContainer1: {
        marginTop: 30,
    },
    buttonContainer: {
        flexDirection: 'row',justifyContent: 'space-between',marginTop: 30,
    },
    buttonSpacer: {
        width: 16,
    },
    button: {
        backgroundColor: '#3498db',paddingVertical: 12,paddingHorizontal: 20,borderRadius: 12,shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,shadowRadius: 3,elevation: 3,flex: 1,
    },
    buttonText: {
        color: '#fff',fontSize: 16,fontWeight: '600',textAlign: 'center',
    },
    prevButton: {
        backgroundColor: '#ecf0f1',
    },
    prevButtonText: {
        color: '#34495e',
    },
    loader: {
        marginVertical: 12
    },
    modalOverlay: {
        flex: 1,backgroundColor: 'rgba(0,0,0,0.1)',
    },
    suggestionContainer: {
        position: 'absolute',left: 24,right: 24,maxHeight: 200,zIndex: 1000,
    },
    searchContainer: {
        marginBottom: 10,position: 'relative',zIndex: 1,
    },
    suggestionList: {
        backgroundColor: '#fff',borderWidth: 1,borderColor: '#ecf0f1',borderRadius: 12,shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,shadowRadius: 4,elevation: 5,maxHeight: 200,marginTop: 5,zIndex: 2,
    },
    suggestionItem: {
        padding: 15,borderBottomWidth: 1,borderBottomColor: '#ecf0f1',backgroundColor: '#fff'
    },
    suggestionText: {
        fontSize: 14,color: '#34495e'
    },
    cancelIcon: {
        position: 'absolute',top: 10,right: 10,zIndex: 1,
    },
    selectedAddressContainer: {
        marginBottom: 20,padding: 15,paddingRight: 40,backgroundColor: '#e6f7ff',borderRadius: 8,borderWidth: 1,borderColor: '#bde0fe',zIndex: 0,position: 'relative',
    },
    selectedAddressText: {
        fontSize: 14,color: '#34495e',
    },
    inputError: {
        borderColor: '#e74c3c',
    },
    errorText: {
        color: '#e74c3c', fontSize: 12, marginTop: -10, marginBottom: 20,marginLeft: 6,
    },
    stepIndicator: {
        flexDirection: 'row', justifyContent: 'center',marginBottom: 24,
    },
    stepDot: {
        width: 12,height: 12,borderRadius: 6,backgroundColor: '#dde1e5',marginHorizontal: 8,
    },
    stepDotActive: {
        backgroundColor: '#3498db',
        width: 20,height: 12,
    },
    header: {
        flexDirection: 'row',alignItems: 'center',paddingHorizontal: 16,paddingTop: 16,paddingBottom: 8,backgroundColor: '#f8f9fa',borderBottomWidth: 1,borderBottomColor: '#ecf0f1',
    },
    headerTitle: {
        fontSize: 26,fontWeight: 'bold',color: '#3498db',flex: 1,textAlign: 'center',marginRight: 40,
    },

    // Add these to your styles object
    imageButtonsContainer: {
        flexDirection: 'row',justifyContent: 'space-between',marginVertical: 15,
    },
    imageButton: {
        backgroundColor: '#3498db',paddingVertical: 12,paddingHorizontal: 20,borderRadius: 8,flex: 0.48,alignItems: 'center',
    },
    imageButtonText: {
        color: '#fff',fontSize: 16,fontWeight: '600',
    },
    imagesContainer: {
        marginBottom: 20,borderWidth: 1,borderColor: '#dde1e5',borderRadius: 8,padding: 12,backgroundColor: '#f8f9fa',
    },
    imagesHeader: {
        flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',marginBottom: 12,borderBottomWidth: 1,borderBottomColor: '#dde1e5',paddingBottom: 8,
    },
    imagesHeaderText: {
        fontSize: 18,fontWeight: '600',color: '#2c3e50',
    },
    vehicleCard: {
        marginBottom: 16,padding: 12,backgroundColor: '#fff',borderRadius: 8,borderWidth: 1,borderColor: '#ecf0f1',shadowColor: '#000',shadowOffset: { width: 0, height: 1 },shadowOpacity: 0.1,shadowRadius: 2,elevation: 2,
    },
    vehicleName: {
        fontSize: 16,fontWeight: '600',color: '#34495e',marginBottom: 8,
    },
    imageScrollView: {
        flexDirection: 'row',marginBottom: 8,
    },
    imageContainer: {
        marginRight: 10,
    },
    vehicleImage: {
        width: 150,height: 100,borderRadius: 4,
    },
    noImagesText: {
        fontStyle: 'italic',color: '#7f8c8d',paddingVertical: 8,
    },
    loaderContainer: {
        alignItems: 'center',justifyContent: 'center',padding: 20,
    },
    loaderText: {
       marginTop: 10,color: '#3498db', fontSize: 16,},
// Add these to your styles object
backButton: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'center',
    flex: 1,
  },
  emptySpace: {
    width: 40,
    height: 40,
  },
    
});

export default ShipmentForm;
