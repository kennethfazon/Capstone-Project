import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Button, TextInput, Animated, Image } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import api from '../../services/api';

const ManageSeats = () => {
  const [seats, setSeats] = useState({});
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showFromToModal, setShowFromToModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showFareModal, setShowFareModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [fromBarangay, setFromBarangay] = useState(null);
  const [toBarangay, setToBarangay] = useState(null);
  const [fare, setFare] = useState(0);
  const [cash, setCash] = useState('');
  const [change, setChange] = useState(0);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [passengerType, setPassengerType] = useState('Regular');
  const [passengerTypeOpen, setPassengerTypeOpen] = useState(false);
  const [showMarkAvailableModal, setShowMarkAvailableModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { res_id } = route.params;

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in and fade-out
  const positionAnim = useRef(new Animated.Value(-100)).current; // For slide-in animation


  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });

  const barangays = [
    { label: 'GUBAT/PAMANA TERMINAL', value: 'GUBAT/PAMANA TERMINAL' },
    { label: 'COTA NA DAKO (ROPALI)', value: 'COTA NA DAKO (ROPALI)' },
    { label: 'SAN IGNACIO (CROSSING)', value: 'SAN IGNACIO (CROSSING)' },
    { label: 'CARRIEDO (BOUNDARY)', value: 'CARRIEDO (BOUNDARY)' },
    { label: 'CARRIEDO (WAITING SHED)', value: 'CARRIEDO (WAITING SHED)' },
    { label: 'PAYAWIN TULAY', value: 'PAYAWIN TULAY' },
    { label: 'PAYAWIN CENTRO', value: 'PAYAWIN CENTRO' },
    { label: 'PAYAWIN 13', value: 'PAYAWIN 13' },
    { label: 'KM 12/CASILI', value: 'KM 12/CASILI' },
    { label: 'KM 11/CABIGUHAN', value: 'KM 11/CABIGUHAN' },
    { label: 'KM 10/ DALAN PA GUBAT', value: 'KM 10/ DALAN PA GUBAT' },
    { label: 'KM 9/ABUYOG INC', value: 'KM 9/ABUYOG INC' },
    { label: 'KILOMETRO 8', value: 'KILOMETRO 8' },
    { label: 'BUHATAN MACAPAGAL', value: 'BUHATAN MACAPAGAL' },
    { label: 'BUHATAN E.S', value: 'BUHATAN E.S' },
    { label: 'BUHATAN/FARM', value: 'BUHATAN/FARM' },
    { label: 'CABID-AN EL RETIRO', value: 'CABID-AN EL RETIRO' },
    { label: 'BALOGO (DUKA)', value: 'BALOGO (DUKA)' },
    { label: 'BALOGO COMPLEX', value: 'BALOGO COMPLEX' },
    { label: 'SORSOGON TERMINAL/CENTRO', value: 'SORSOGON TERMINAL/CENTRO' },
  ];

  const lowerDeckSeats = [
    ['A1', 'A2', null, 'A3', 'A4'],
    ['B1', 'B2', null,'B3', 'B4'],
    ['C1', 'C2', null,'C3', 'C4'],
    ['D1', 'D2', null,'D3', 'D4'],
    ['E1', 'E2', null,'E3', 'E4'],
    ['F1', 'F2', null,'F3', 'F4'],
  ];

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await api.get(`/api/seats/${res_id}`);
        setSeats(response.data);
      } catch (error) {
        console.error('Error fetching seats:', error);
        Alert.alert('Error', 'Failed to fetch seat data.');
      }
    };
    fetchSeats();
  }, [res_id]);

  const handleMarkSeatAsAvailable = async () => {
    if (selectedSeat) {
      try {
        // Mark the seat as available in the backend
        await api.post('/api/reserve', {
          seat: selectedSeat,
          status: 'available',
          res_id: res_id,
        });

        // Update the seat state to available
        setSeats((prevSeats) => ({
          ...prevSeats,
          [selectedSeat]: 'available',
        }));

        // Show success message
        showToast(`Seat ${selectedSeat} is now available.`, 'success');
      } catch (error) {
        console.error('Error marking seat as available:', error);
        Alert.alert('Error', 'Failed to mark seat as available.');
      }
    }

    setShowMarkAvailableModal(false);  // Close the modal
  };

  const handleSeatClick = (seat) => {
    if (seats[seat] === 'unavailable') {
      setSelectedSeat(seat);
      setShowMarkAvailableModal(true);  // Show confirmation to mark as available
    } else if (seats[seat] === 'available') {
      setSelectedSeat(seat);
      setShowFromToModal(true);
      setFromBarangay(null);
      setToBarangay(null);
      setFare(0);
    }
  };

  const handleBarangayChange = (from, to) => {
    if (from && to) {
      const fromIndex = barangays.findIndex((item) => item.value === from);
      const toIndex = barangays.findIndex((item) => item.value === to);
      const distance = Math.abs(toIndex - fromIndex);
  
      let baseFare = passengerType === 'Regular' ? 14 : 11.25; // Initial fare for the first 4 kilometers
      let additionalRate = passengerType === 'Regular' ? 2.2 : 1.76; // Rate for succeeding kilometers
  
      const totalFare =
        distance <= 4
          ? baseFare
          : baseFare + (distance - 4) * additionalRate;
  
      setFare(totalFare.toFixed(2)); // Format to 2 decimal places
    }
  };

  useEffect(() => {
    if (toastVisible) {
      // Animate toast when it becomes visible
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      Animated.timing(positionAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Hide toast after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [toastVisible]);

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(positionAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setToastVisible(false);
    }, 300); // Wait for the animation to finish before hiding toast
  };

  const getBackgroundColor = () => {
    switch (toastType) {
      case 'success':
        return 'rgba(6, 208, 1, 0.9)'; // Green for success with transparency
      case 'error':
        return 'rgba(220, 53, 69, 0.9)'; // Red for error with transparency
      case 'info':
        return 'rgba(23, 162, 184, 0.9)'; // Blue for info with transparency
      default:
        return 'rgba(52, 58, 64, 0.9)'; // Default dark color
    }
  };

  const getIcon = () => {
    switch (toastType) {
      case 'success':
        return <Ionicons name="checkmark-circle-outline" size={24} color="white" />;
      case 'error':
        return <Ionicons name="close-circle-outline" size={24} color="white" />;
      case 'info':
        return <Ionicons name="information-circle-outline" size={24} color="white" />;
      default:
        return null;
    }
  };

  const handleSaveSelection = () => {
    if (!fromBarangay || !toBarangay) {
      Alert.alert('Error', 'Please select both From and To Barangays.');
      return;
    }
    setShowFromToModal(false);
    setShowConfirmationModal(true);
  };
  

  const handleConfirmSeatUnavailable = async () => {
    if (selectedSeat) {
      const departure = fromBarangay;
      const arrival = toBarangay;
      const route = 'Gubat | Sorsogon';
      const date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      const time = new Date().toLocaleTimeString(); // Current time
      const type_of_passenger = passengerType;
      const selected_seats = selectedSeat;
      const amount = fare;
  
      const ticketData = {
        jeep_id: res_id, // Assuming res_id is equivalent to jeep_id
        date,
        time,
        departure,
        arrival,
        route,
        type_of_passenger,
        selected_seats,
        amount,
      };
  
      try {
        // Save ticket data
        const response = await api.post('/api/drivertickets', ticketData); // Send ticket data to backend
        const ticketId = response.data.ticketId; // Extract ticketId from backend response
  
        if (ticketId) {
          showToast('Success: Ticket issued and seat reserved.', 'success');
  
          // Update seat status to unavailable
          await api.post('/api/reserve', {
            seat: selectedSeat,
            status: 'unavailable',
            res_id: res_id,
          });
  
          // Update the seats state to reflect the change
          setSeats((prevSeats) => ({
            ...prevSeats,
            [selectedSeat]: 'unavailable',
          }));
  
          // Navigate to the Ticket details page with the ticketId
          navigation.navigate('Ticket', { ticketId: ticketId });
        } else {
          Alert.alert('Error', 'Failed to retrieve ticket ID.');
        }
      } catch (error) {
        console.error('Error saving ticket or updating seat:', error);
        Alert.alert('Error', 'Failed to save ticket data.');
      }
    }
  
    setShowConfirmationModal(false);
  };
  
  



  const handleCashInput = (input) => {
    setCash('');
    setCash(input);
  };

  const handleOk = () => {
    const cashAmount = parseFloat(cash);
    if (isNaN(cashAmount) || cashAmount < fare) {
      Alert.alert('Error', 'Please enter an amount greater than or equal to the fare.');
      return;
    }
    setChange(cashAmount - fare);
    setShowFareModal(false);
    setShowChangeModal(true);
    setCash('');
  };

  const handleClearAllSeats = async () => {
    try {
    await api.post('/api/clear-seats', { res_id: res_id });
    const updatedSeats = {};
    Object.keys(seats).forEach((seat) => {
    updatedSeats[seat] = 'available';
    });
    setSeats(updatedSeats);
    } catch (error) {
    console.error('Error clearing all seats:', error);
    Alert.alert('Error', 'Failed to clear all seats.');
    }
    setShowClearModal(false); // Close the confirmation modal
    };

  const closeFromToModal = () => {
    setShowFromToModal(false);
    setFromBarangay(null); // Reset From Barangay
    setToBarangay(null);   // Reset To Barangay
    setFare(0);            // Reset Fare
  };

  const handleCancelFareModal = () => {
    setShowFareModal(false);
    setCash(''); // Reset cash input
  };

  return (
    <View style={styles.container}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.availableSeat]} />
          <Text style={styles.legendText}>Available</Text>
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
                  seat === null && { borderWidth: 0 },
                ]}
                onPress={() => seat !== null && handleSeatClick(seat)} // Disable press for null seats
                            disabled={seat === null} // Disable null seats and unavailable seats
                          >
                            <Text style={styles.seatText}>{seat !== null  ? seat : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* <TouchableOpacity
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
                          </TouchableOpacity> */}

      <Button title="Clear all seats" onPress={() => setShowClearModal(true)} />


         {/* Confirmation modal to mark seat as available */}
      <Modal visible={showMarkAvailableModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text>Do you want to mark seat {selectedSeat} as available?</Text>
            <View style={styles.modalButtons}>
              <Button title="Yes" onPress={handleMarkSeatAsAvailable} />
              <Button title="No" onPress={() => setShowMarkAvailableModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showFromToModal} transparent={true} animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select From and To Barangays</Text>

      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Passenger Type</Text>
        <DropDownPicker
          open={passengerTypeOpen}
          value={passengerType}
          items={[
            { label: 'Regular', value: 'Regular' },
            { label: 'Discounted (Student/Elderly/Disabled)', value: 'Discounted' },
          ]}
          setOpen={setPassengerTypeOpen}
          setValue={setPassengerType}
          placeholder="Select Passenger Type"
        />
      </View>

      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>From</Text>
        <DropDownPicker
          open={fromOpen}
          value={fromBarangay}
          items={barangays}
          setOpen={setFromOpen}
          setValue={setFromBarangay}
          onChangeValue={(value) => handleBarangayChange(value, toBarangay)}
          placeholder="Select From"
        />
      </View>

      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>To</Text>
        <DropDownPicker
          open={toOpen}
          value={toBarangay}
          items={barangays}
          setOpen={setToOpen}
          setValue={setToBarangay}
          onChangeValue={(value) => handleBarangayChange(fromBarangay, value)}
          placeholder="Select To"
        />
      </View>

      <View style={styles.modalButtons}>
        <Button title="Save" onPress={handleSaveSelection} color="#28a745" />
        <Button title="Cancel" onPress={closeFromToModal} color="#dc3545" />
      </View>
    </View>
  </View>
</Modal>

      {/* Confirmation modal to mark seat unavailable */}
      <Modal visible={showConfirmationModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text>Mark seat {selectedSeat} as unavailable?</Text>
            <View style={styles.modalButtons}>
              <Button title="Yes" onPress={handleConfirmSeatUnavailable} />
              <Button title="No" onPress={() => setShowConfirmationModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Fare and Cash input modal */}
      <Modal visible={showFareModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Amount: ₱{fare} </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter cash amount"
              keyboardType="numeric"
              value={cash}
              onChangeText={handleCashInput}
            />
            <View style={styles.modalButtons}>
              <Button title="OK" onPress={handleOk} />
              <Button title="Cancel" onPress={() => setShowFareModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change display modal */}
      <Modal visible={showChangeModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change: ₱{change}</Text>
            <Button title="OK" onPress={() => setShowChangeModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Clear all seats confirmation modal */}
      <Modal visible={showClearModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear All Seats?</Text>
            <View style={styles.modalButtons}>
              <Button title="Yes" onPress={handleClearAllSeats} />
              <Button title="No" onPress={() => setShowClearModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={toastVisible} animationType="fade" onRequestClose={hideToast}>
        <Animated.View
          style={[styles.toast, {
            backgroundColor: getBackgroundColor(),
            opacity: fadeAnim,
            transform: [{ translateY: positionAnim }],
          }]}
        >
          {getIcon()}
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      </Modal>
    </View>
  );
};




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        padding: 40,
      },
      fareText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
      },
      bottomModal: {
        justifyContent: 'flex-end', // Aligns modal to the bottom
        margin: 0, // Removes default margins for full-width modal
      },
      modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
      drivers: {
        width: 40,
        height: 40,
        top: -10,
        left: 30,
        bottom: 10
      },
      dropdown: {
        marginBottom: 15,
        zIndex: 1000,  // Ensure dropdowns are clickable
      },
      fareText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
      },
      modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
    
      swipeIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 10,
      },
      modalText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
      },
      modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
      },
    eyy: {
      fontFamily: 'Poppins_700Bold',
      marginRight: 0,
      color: "black"
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1E3A8A',
      marginBottom: 10,
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
      marginBottom: 5,
      
    },
    deckButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    deckButton: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 5,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 10,
    },
    deckButtonText: {
      fontFamily: 'Poppins_700Bold',
      color: '#1E3A8A',
    },
    steeringIcon: {
      width: 30,
      height: 30,
    },
    row: {
      top: 20,
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
    unavailableSeatText: {
      color: '#DC3545',
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
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark background to focus on modal
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 30,
      borderRadius: 15,
      width: '80%',
      elevation: 5, // Adds a subtle shadow to make it stand out
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 22,
      fontFamily: 'Poppins_700Bold',
      color: '#333',
      marginBottom: 20,
      textAlign: 'center',
    },
    dropdownContainer: {
      width: '100%',
      marginBottom: 15,
    },
    dropdownLabel: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 16,
      color: '#555',
      marginBottom: 8,
    },
    dropdown: {
      backgroundColor: '#f8f9fa',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      height: 40,
    },
    fareText: {
      fontSize: 18,
      fontFamily: 'Poppins_700Bold',
      color: '#1E3A8A',
      marginVertical: 15,
    },
    input: {
      width: '100%',
      padding: 10,
      fontSize: 16,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      backgroundColor: '#f8f9fa',
      marginBottom: 15,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 15,
    },
    button: {
      width: '45%',
      paddingVertical: 12,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontFamily: 'Poppins_700Bold',
    },
    toast: {
      position: 'absolute',
      top: 50, // Positioning toast from the top
      left: '10%',
      right: '10%',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 25,
      zIndex: 1000,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    toastText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
      marginLeft: 10,
      fontFamily: 'Poppins_400Regular', // Font for the toast message
    },
    toastIcon: {
      width: 22,
      height: 22,
      marginRight: 10,
      tintColor: 'white',
    },
  });
  
  export default ManageSeats;