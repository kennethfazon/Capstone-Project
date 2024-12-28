import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image // Import ActivityIndicator for loading spinner
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import api from '../services/api'; // Adjust this to your backend API URL
import Modal from 'react-native-modal'; // For the bottom sheet modal
import RNPickerSelect from 'react-native-picker-select'; // For the dropdown
import UUID from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
const Seats = () => {
  const [seats, setSeats] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]); 
  const [isModalVisible, setModalVisible] = useState(false); 
  const [passengerType, setPassengerType] = useState('regular');
  const [totalPrice, setTotalPrice] = useState(0); 
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
  const navigation = useNavigation();
  const route = useRoute();
  const { jeep_id } = route.params;
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);




  const [coordinates, setCoordinates] = useState([
  { latitude: 12.925261716902215, longitude: 124.1216502331058, comment: "Padrique" },
  { latitude: 12.92892748513198, longitude: 124.11950993323921, comment: "Elmabuhay" },
  { latitude: 12.931887527332217, longitude: 124.11693493766177, comment: "San Ignacio" },
  { latitude: 12.936585118943817, longitude: 124.10083469879501, comment: "Carriedo" },
  { latitude: 12.93574813644375, longitude: 124.08334059011102, comment: "Natupasan" },
  { latitude: 12.939823621149616, longitude: 124.09641222821887, comment: "Manapao" },
  { latitude: 12.940185471400586, longitude: 124.08879350637075, comment: "Payawin" },
  { latitude: 12.934330426617603, longitude: 124.076220453784, comment: "Jupi" },
  { latitude: 12.936796144004688, longitude: 124.07284964058329, comment: "Casili" },
  { latitude: 12.93784414584751, longitude: 124.07167375975826, comment: "Marinas" },
  { latitude: 12.939915562179902, longitude: 124.06852828440663, comment: "Lapinig" },
  { latitude: 12.939836187433432, longitude: 124.0634398370161, comment: "Bagacay" },
  { latitude: 12.942244676789088, longitude: 124.05815519594879, comment: "Cogon" },
  { latitude: 12.946309471413375, longitude: 124.05209165950748, comment: "Abuyog" },
]);


  const seatPrice = 47; // Price per seat
  const discount = 10; // Discount amount for non-regular passengers
  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await api.get(`api/seats/${jeep_id}`); // Fetch seats based on jeep_id
        setSeats(response.data);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };

    if (jeep_id) {
      fetchSeats();
    }
  }, [jeep_id]);

  const handleSeatClick = (seat) => {
    if (seats[seat] === 'unavailable') {
      return;
    }

    let updatedSelectedSeats = [...selectedSeats];

    if (updatedSelectedSeats.includes(seat)) {
      updatedSelectedSeats = updatedSelectedSeats.filter((s) => s !== seat);
      setSeats((prevSeats) => ({
        ...prevSeats,
        [seat]: 'available',
      }));
    } else {
      updatedSelectedSeats.push(seat);
      setSeats((prevSeats) => ({
        ...prevSeats,
        [seat]: 'selected',
      }));
    }

    setSelectedSeats(updatedSelectedSeats);
    setTotalPrice(updatedSelectedSeats.length * seatPrice);
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat before proceeding.'); // Set error message
      Alert.alert('No Seats Selected', 'Please select at least one seat before proceeding.'); // Display alert
    } else {
      setErrorMessage('');
      toggleModal(); // Show the modal when continue button is pressed
    }
  };

  const lowerDeckSeats = [
    ['A1', 'A2', null, 'A3', 'A4'],
    ['B1', 'B2', null,'B3', 'B4'],
    ['C1', 'C2', null,'C3', 'C4'],
    ['D1', 'D2', null,'D3', 'D4'],
    ['E1', 'E2', null,'E3', 'E4'],
    ['F1', 'F2', null,'F3', 'F4'],
  ];

  const getDiscountedPrice = () => {
    if (passengerType !== 'regular') {
      return totalPrice - (selectedSeats.length * discount); // Apply discount for each selected seat
    }
    return totalPrice;
  };
  

  
  const handlePayNow = async () => {
    if (!selectedCoordinates) {
      Alert.alert('No Coordinates Selected', 'Please select a route before proceeding.');
      return;
    }
  
    const date = new Date().toISOString().split('T')[0]; // Get current date (YYYY-MM-DD)
    const time = new Date().toLocaleTimeString(); // Get current time
  
    // Check if a device ID already exists in AsyncStorage
    let deviceId = await AsyncStorage.getItem('device_id');
  
    // If device ID doesn't exist, generate a new one and store it
    if (!deviceId) {
      deviceId = UUID.v4(); // Generate new device ID
      await AsyncStorage.setItem('device_id', deviceId); // Save it in AsyncStorage
    }
  
    setIsLoading(true); // Show loading indicator
  
    try {
      // Send ticket data to backend with the device ID
      const ticketResponse = await api.post('/api/ticket', {
        jeep_id,
        date,
        time,
        route: 'Gubat | Sorsogon', // Customize route if needed
        departure: "GUBAT/PAMANA TERMINAL",
        arrival: "SORSOGON TERMINAL CENTRO",
        type_of_passenger: passengerType,
        selected_seats: selectedSeats.join(', '), // Join selected seats to string
        amount: getDiscountedPrice(),
        latitude: selectedCoordinates.latitude, // Pass selected latitude
        longitude: selectedCoordinates.longitude, // Pass selected longitude
        device_id: deviceId, // Include the device ID (either new or existing)
      });
  
      if (ticketResponse.status === 200) {
        const ticketId = ticketResponse.data.ticketId; // Get the inserted ticket ID
  
        // Now reserve the selected seats
        const resIdResponse = await api.get(`/api/seats/${jeep_id}`);
        const res_id = resIdResponse.data.res_id;
  
        if (res_id) {
          for (let seat of selectedSeats) {
            await api.post('/api/reserve', {
              seat,
              status: 'unavailable',
              res_id,
            });
          }
          console.log('Seats updated successfully');
          setIsLoading(false); // Stop loading
          navigation.navigate('ReceiptScreen', { ticketId }); // Pass the ticket ID to the ReceiptScreen
        } else {
          console.error('Reservation ID not found');
          setIsLoading(false); // Stop loading if error
        }
      } else {
        console.error('Error inserting ticket:', ticketResponse.data.message);
        setIsLoading(false); // Stop loading if error
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setIsLoading(false); // Stop loading if error
    }
  };
  
  
  return (
    <View style={styles.container}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.availableSeat]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedSeat]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.unavailableSeat]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>

      <View style={styles.seatLayoutContainer}>
      <Image 
          source={require('./drivers.png') }  // Use uploaded logo
          style={styles.drivers}
        />
        {lowerDeckSeats.map((row, index) => (
          <View key={`Row${index}`} style={styles.row}>
            {row.map((seat) => (
              <TouchableOpacity
                      key={seat}
                      style={[
                        styles.seat,
                        seats[seat] === 'unavailable' && styles.unavailableSeat,
                        seats[seat] === 'selected' && styles.selectedSeat,
                        seat === null && { borderWidth: 0 }, // No border for null seats
                        seat === " " && { borderWidth: 0 },
                      ]}
                      onPress={() => seat !== null && handleSeatClick(seat)} // Disable press for null seats
                      disabled={seats[seat] === 'unavailable' || seat === null || seat === " "} // Disable null seats and unavailable seats
                    >
                      <Text style={styles.seatText}>{seat !== null  ? seat : ''}</Text>
                    </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>Your Seat:                                    {selectedSeats.join(', ') || 'None'}</Text>
          <Text style={styles.summaryText}>Total Price:                                   ₱ {totalPrice}</Text>
        </View>

        {errorMessage ? ( // Show error message if it exists
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <Modal
  isVisible={isModalVisible}
  onBackdropPress={toggleModal}
  style={styles.modal}
>
  <View style={styles.modalContent}>
    {/* Modal Title */}
    <Text style={styles.modalTitle}>Payment Details</Text>

    {/* Payment Method Row */}
    <View style={styles.modalRow}>
      <Text style={styles.modalText}>Payment Method</Text>
      <Text style={styles.modalDetailText}>Gcash</Text>
    </View>

    {/* Passenger Type */}
    <View style={styles.modalSection}>
      <Text style={styles.modalText}>Passenger Type</Text>
      <RNPickerSelect
        onValueChange={(value) => setPassengerType(value)}
        items={[
          { label: 'Student', value: 'student' },
          { label: 'Senior Citizen', value: 'senior' },
          { label: 'Regular', value: 'regular' },
          { label: 'PWD', value: 'pwd' },
        ]}
        style={pickerSelectStyles}
        value={passengerType}
      />
    </View>

    {/* Amount Row */}
    <View style={styles.modalRow}>
      <Text style={styles.modalText}>Amount</Text>
      <Text style={styles.modalDetailText}>₱ {getDiscountedPrice()}</Text>
    </View>

    {/* Selected Seats */}
    <View style={styles.modalRow}>
      <Text style={styles.modalText}>Selected Seats</Text>
      <Text style={styles.modalDetailText}>{selectedSeats.join(', ')}</Text>
    </View>

    {/* Route (Coordinates) */}
    <View style={styles.modalSection}>
      <Text style={styles.modalText}>Route (Coordinates)</Text>
      <RNPickerSelect
        onValueChange={(value) => {
          setSelectedCoordinates(value); // Store selected coordinates (latitude and longitude)
          console.log("Selected Coordinates:", value); // Log the selected coordinates for debugging
        }}
        items={coordinates.map((coord) => ({
          label: coord.comment, // Use the comment as the label
          value: { latitude: coord.latitude, longitude: coord.longitude }, // Store latitude and longitude as value
        }))}
        style={pickerSelectStyles}
      />  
    </View>

    {/* Loading Indicator or Pay Button */}
    {isLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Generating E-ticket, Please wait...</Text>
      </View>
    ) : (
      <TouchableOpacity style={styles.paymentButton} onPress={handlePayNow}>
        <Text style={styles.paymentButtonText}>Pay Now</Text>
      </TouchableOpacity>
    )}
  </View>
</Modal>
    </View>
  );
};

const { height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 40,
  },
  legendContainer: {
    marginTop: -20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drivers: {
    width: 40,
    height: 40,
    top:-15,
    left: 30,
    bottom: 10
  },
  legendBox: {
    width: 16,
    height: 16,
    marginRight: 5,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
  },
  seatLayoutContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 32,
    elevation: 5,
    marginBottom: 10,
  },
  row: {
    top: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  seat: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  availableSeat: {
    backgroundColor: 'white',
    borderColor: '#D8D2C2',
  },
  selectedSeat: {
    backgroundColor: '#D4EDDA',
    borderColor: '#0056B3',
  },
  unavailableSeat: {
    backgroundColor: '#F8D7DA',
    borderColor: '#DC3545',
  },
  seatText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 20,
    shadowColor: '#000',
    position: 'absolute',
    bottom: 0,
    width: '128%',
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'gray',
    marginBottom: 5,
  },
  continueButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonText: {
    fontFamily: 'Poppins_700Bold',
    color: 'white',
    fontSize: 18,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
    maxHeight: height * 0.7, // Limit modal height to 70% of screen
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center', // Centers content vertically in the row
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    fontFamily: 'Poppins_700Bold',
  },
  modalDetailText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Poppins_400Regular',
  },
  modalSection: {
    marginBottom: 15,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
  },
  paymentButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
    elevation: 3, // Slight shadow for a raised effect
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#F9FAFB',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#F9FAFB',
  },
});

export default Seats;
