import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
const ReceiptScreen = ({ route, navigation }) => {
  const { ticketId } = route.params; // Retrieve the ticket ID passed from the previous screen
  const [ticketData, setTicketData] = useState(null); // State to hold ticket data
  const [isLoading, setIsLoading] = useState(true); // State for loading indicator


  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  // Date formatting function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with 0 if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month and pad with 0
    const year = date.getFullYear(); // Get the full year

    return `${day}/${month}/${year}`; // Format as DD-MM-YYYY
  };

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await api.get(`/api/ticket/${ticketId}`); // Fetch ticket details based on ticket ID
        setTicketData(response.data); // Set ticket data to state
      } catch (error) {
        console.error('Error fetching ticket data:', error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (!ticketData) {
    return <Text style={styles.errorText}>Error loading ticket data.</Text>; // Handle error if no data is found
  }

  return (<>
  
    <View style={styles.container}>
    <TouchableOpacity style={styles.backButton}>
        <Ionicons name="chevron-back-outline" size={24} color="black" onPress={() => navigation.navigate('Welcome')} />
      </TouchableOpacity>
      <Text style={styles.title}>BGSTRANSCO</Text>

      {/* Details Section */}
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Jeep#:</Text>
          <Text style={styles.value}>{ticketData.jeep_id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(ticketData.date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{ticketData.time}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Route:</Text>
          <Text style={styles.value}>{ticketData.route}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>{ticketData.departure}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.value}>{ticketData.arrival}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{ticketData.type_of_passenger}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Seat:</Text>
          <Text style={styles.value}>{ticketData.selected_seats}</Text>
        </View>
      </View>

      {/* Centered Amount Section */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>AMOUNT: ₱ {ticketData.amount}</Text>
      </View>

      {/* Footer Section */}
      <Text style={styles.footer}>
        THIS SERVES AS AN OFFICIAL RECEIPT. KEEP YOUR TICKET FOR INSPECTION.
      </Text>
    </View>
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
   
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    width: '80%',
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 100,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333',
  },
  amountContainer: {
    alignItems: 'center',
    
    
    width: '80%',
    marginBottom: 20,
  },
  amountLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
   
    color: '#000',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  footer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    width: '80%',
  },
});

export default ReceiptScreen;