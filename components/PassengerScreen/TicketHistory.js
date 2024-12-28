import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

const TicketHistory = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0)); // For fade-in animation

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await api.get(`/api/driverticket/${ticketId}`);
        setTicket(response.data);

        // Fade-in the loading screen after the data fetch
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loaderContainer, { opacity: fadeAnim }]}>
          {/* Custom animation - spinning loader */}
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
          <Text style={styles.loadingText}>Loading your ticket...</Text>
        </Animated.View>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load ticket details.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back-outline" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>BGSTRANSCO</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Ticket#:</Text>
          <Text style={styles.value}>{ticket.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Jeep#:</Text>
          <Text style={styles.value}>{ticket.jeep_id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(ticket.date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{ticket.time}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Route:</Text>
          <Text style={styles.value}>{ticket.route}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>{ticket.departure}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.value}>{ticket.arrival}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Seat:</Text>
          <Text style={styles.value}>{ticket.selected_seats}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>AMOUNT: ₱ {parseFloat(ticket.amount).toFixed(2)}</Text>
        </View>

        <Text style={styles.footer}>
          THIS SERVES AS AN OFFICIAL RECEIPT. KEEP YOUR TICKET FOR INSPECTION.
        </Text>
      </View>
    </View>
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
    fontFamily: 'Poppins_700Bold',
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
  footer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    width: '80%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // Soft background color
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    color: '#007bff',
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default TicketHistory;
