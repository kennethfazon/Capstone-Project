import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
const API_URL = 'http://192.168.1.18:3000/api'; // Adjust this to your backend API URL

const Seats = () => {
  const [seats, setSeats] = useState({}); // Stores seat data from backend
  const [selectedSeats, setSelectedSeats] = useState([]); // Track multiple selected seats
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Detect if the screen is focused

  const seatPrice = 100; // Price per seat
  // Load fonts
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });
  

  // Fetch seat data from the backend using axios
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await axios.get(`${API_URL}/seats`);
        setSeats(response.data);
      } catch (error) {
        console.error('Error fetching seats:', error);
        Alert.alert('Error', 'Failed to fetch seat data.');
      }
    };

    fetchSeats();
  }, []);

  // Handle seat click for selecting/deselecting seats
  const handleSeatClick = async (seat) => {
    if (seats[seat] === 'unavailable') {
      Alert.alert('Seat Unavailable', 'This seat is already reserved.');
      return;
    }

    let updatedSelectedSeats = [...selectedSeats];

    // Toggle seat selection
    if (updatedSelectedSeats.includes(seat)) {
      // Deselect seat
      updatedSelectedSeats = updatedSelectedSeats.filter((s) => s !== seat);
      setSeats((prevSeats) => ({
        ...prevSeats,
        [seat]: 'available',
      }));
    } else {
      // Select seat
      updatedSelectedSeats.push(seat);
      setSeats((prevSeats) => ({
        ...prevSeats,
        [seat]: 'selected',
      }));
    }

    setSelectedSeats(updatedSelectedSeats);

    try {
      // Update seat status in the database using axios
      await axios.post(`${API_URL}/reserve`, {
        seat,
        status: seats[seat] === 'selected' ? 'available' : 'selected',
      });
    } catch (error) {
      console.error('Error updating seat:', error);
      Alert.alert('Error', 'Failed to update seat status.');
    }
  };

  // Reset selected seats only when navigating away from the page
  useFocusEffect(
    useCallback(() => {
      // This runs when the screen is focused
      return () => {
        // Only reset seats if the screen is no longer focused
        if (!isFocused && selectedSeats.length > 0) {
          // Reset all selected seats to 'available' on navigation away
          Promise.all(
            selectedSeats.map((seat) =>
              axios.post(`${API_URL}/reserve`, {
                seat,
                status: 'available',
              })
            )
          )
            .then(() => {
              setSelectedSeats([]); // Clear selected seats
              setSeats((prevSeats) => {
                // Update seat statuses locally to 'available'
                const updatedSeats = { ...prevSeats };
                selectedSeats.forEach((seat) => {
                  updatedSeats[seat] = 'available';
                });
                return updatedSeats;
              });
            })
            .catch((error) => {
              console.error('Error resetting seat status:', error);
            });
        }
      };
    }, [isFocused, selectedSeats])
  );

  // Calculate total price based on the number of selected seats
  const totalPrice = selectedSeats.length * seatPrice;

  // Continue action to move to the next page
  const handleContinue = () => {
    // Navigate to the next page (e.g., PaymentPage or Welcome page)
    navigation.navigate('Welcome');
  };

  const lowerDeckSeats = [
    ['A1', 'A2', 'A3', 'A4'],
    ['B1', 'B2', 'B3', 'B4'],
    ['C1', 'C2', 'C3', 'C4'],
    ['D1', 'D2', 'D3', 'D4'],
    ['E1', 'E2', 'E3', 'E4'],
    ['F1', 'F2', 'F3', 'F4'],
  ];

  return (
    <View style={styles.container}>
      {/* Availability Legend */}
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
        {/* Seat Rows */}
        {lowerDeckSeats.map((row, index) => (
          <View key={`Row${index}`} style={styles.row}>
            {row.map((seat) => (
              <TouchableOpacity
                key={seat}
                style={[
                  styles.seat,
                  seats[seat] === 'unavailable' && styles.unavailableSeat,
                  seats[seat] === 'selected' && styles.selectedSeat,
                ]}
                onPress={() => handleSeatClick(seat)}
              >
                <Text style={styles.seatText}>{seat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {/* Your Seats: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'} */}
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>Your Seat:                      
            <Text style={styles.eyy}>                                             {selectedSeats.join(', ') || 'None'}
            </Text>           
            

          </Text>
          <Text style={styles.summaryText}>Total Price:
            <Text style={styles.eyy}>                                            ₱ {totalPrice}
            </Text>
           </Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9',
      padding: 40,
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
      marginBottom: 10,
      
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    seat: {
      
      width: 45,
      height: 43,
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
      width: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    paymentInfo: {
      marginBottom: 20,
    },
    paymentBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    payButton: {
      backgroundColor: '#007BFF',
      padding: 10,
      borderRadius: 25,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
  
  export default Seats;