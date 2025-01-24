import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';


const NearestJeep = ({ route, navigation }) => {
  const { trips } = route.params;
  const [updatedTrips, setUpdatedTrips] = useState([]);
  const [standbyJeeps, setStandbyJeeps] = useState([]);
  const [isStandbyVisible, setStandbyVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  // Load fonts
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  // Sidebar state
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useState(new Animated.Value(300))[0];
  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const historyAnimation = useState(new Animated.Value(300))[0];
  const [history, setHistory] = useState([]);
  // Example notifications
  const exampleNotifications = [
    { id: 1, text: 'Jeepney #101 is nearby with 5 seats available.' },
    { id: 2, text: 'Jeepney #202 has departed. Track its location now!' },
    { id: 3, text: 'Jeepney #303 is on standby at Station A.' },
  ];


  

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Get the device_id from AsyncStorage
        const deviceId = await AsyncStorage.getItem('device_id');
        
        if (deviceId) {
          // Make an API call to fetch ticket history
          const response = await api.get(`/api/tickets/history?device_id=${deviceId}`);
          
          if (response.status === 200) {
            setHistory(response.data); // Set the ticket history
          } else {
            Alert.alert('Error', 'Failed to fetch ticket history');
          }
        } else {
          Alert.alert('Error', 'No device ID found');
        }
      } catch (error) {
        
      }
    };

    fetchHistory();
  }, []); // Only fetch when the component mounts


  // Sidebar toggle animation
  const toggleSidebar = () => {
    if (isSidebarVisible) {
      Animated.timing(sidebarAnimation, {
        toValue: 300,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };



  // Helper function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    // If the dateString looks like just a time (e.g., "03:24:21"), prepend the current date
    if (dateString && dateString.match(/^(\d{2}):(\d{2}):(\d{2})$/)) {
      const currentDate = new Date();
      const fullDateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}T${dateString}`;
      dateString = fullDateString;
    }
  
    const date = new Date(dateString);
  
    if (isNaN(date)) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid time';
    }
  
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    // Convert hours from 24-hour to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
  
    return `${hours}:${minutesFormatted} ${ampm}`;
  };
  
  


 
  const toggleHistory = () => {
    if (isHistoryVisible) {
      Animated.timing(historyAnimation, {
        toValue: 300,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setHistoryVisible(false));
    } else {
      setHistoryVisible(true);
      Animated.timing(historyAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // Add a function to navigate to TicketHistory screen
const handleHistoryItemPress = (ticketId) => {
  // Navigate to TicketHistory and pass ticketId as a parameter
  navigation.navigate('TicketHistory', { ticketId });
};

  // Fetch available seats for each trip in the trips array
  const fetchTripsWithSeats = async () => {
    try {
      const updatedTripsData = await Promise.all(
        trips.map(async (trip) => {
          const seatsResponse = await api.get(`/api/seats/${trip.jeep_id}`);
          const availableSeats = seatsResponse.data.availableSeatsCount;

          return { 
            ...trip, 
            available_seats: availableSeats,
            template: seatsResponse.data.template, 
          };
        })
      );
      setUpdatedTrips(updatedTripsData);
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch available seats');
    }
  };

  // Function to fetch standby jeeps based on the selected destination
  const fetchStandbyJeeps = async () => {
    try {
      const response = await api.get(`/standby-jeeps?destination=${route.params.selectedDestination}`);
      if (response.status === 200) {
        const updatedJeeps = await Promise.all(
          response.data.map(async (jeep) => {
            const seatsResponse = await api.get(`/api/seats/${jeep.jeep_id}`);
            const availableSeats = Object.values(seatsResponse.data).filter((seat) => seat === 'available').length;
            return { ...jeep, available_seats: availableSeats };
          })
        );
        setStandbyJeeps(updatedJeeps);
        setStandbyVisible(true);
      } else {
        Alert.alert('Error', 'Failed to fetch standby jeeps');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to server');
    }
  };

  const handleLocationPress = async (jeep_id) => {
    try {
      const response = await api.get(`/api/driver_location/${jeep_id}`);
      const { latitude, longitude } = response.data;

      if (latitude && longitude) {
        navigation.navigate('Map', { latitude, longitude });
      } else {
        Alert.alert('Error', 'Location data is missing for this jeep.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch the location');
    }
  };

  const handleViewSeatsPress = (jeep_id, template) => {
    if (template === 1) {
      navigation.navigate('Seats', { jeep_id });
    } else if (template === 2) {
      navigation.navigate('SeatsTwo', { jeep_id });
    } else {
      Alert.alert('Error', 'Unknown jeep template.');
    }
  };

  useEffect(() => {
    fetchTripsWithSeats();
  }, [trips]);

  if (isStandbyVisible) {
    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Standby Jeeps</Text>

          
        </View>
        <View style={styles.container}>
          <FlatList
            data={standbyJeeps}
            keyExtractor={(item) => item.jeep_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="location-outline" size={24} color="#007bff" />
                    <Text style={styles.cardTitle}>Standby</Text>
                  </View>
                  <Text style={styles.cardInfo}>Plate Number: {item.plate_number || 'Unknown'}</Text>
                  <Text style={styles.cardInfo}>Available Seats: {item.available_seats}</Text>
                </View>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleViewSeatsPress(item.jeep_id, item.template)}
                >
                  <Text style={styles.detailsButtonText}>View Seats</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => setStandbyVisible(false)}>
            <Text style={styles.detailsButtonText}>Back to Trips</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: sidebarAnimation }] },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Notifications</Text>
          <TouchableOpacity onPress={toggleSidebar}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidebarContent}>
          {exampleNotifications.map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <Ionicons name="notifications-outline" size={24} color="black" />
              <Text style={styles.notificationText}>{notification.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

     
<Animated.View
  style={[styles.sidebar, { transform: [{ translateX: historyAnimation }] }]}
>
  <View style={styles.sidebarHeader}>
    <Text style={styles.sidebarTitle}>History</Text>
    <TouchableOpacity onPress={toggleHistory}>
      <Ionicons name="close" size={24} color="black" />
    </TouchableOpacity>
  </View>
  <View style={styles.sidebarContent}>
    {history.length > 0 ? (
      history.map((ticket) => (
        <TouchableOpacity
          key={ticket.id}
          onPress={() => handleHistoryItemPress(ticket.id)} // Navigate to TicketHistory
          style={styles.notificationItem}
        >
          <Ionicons name="time" size={24} color="black" />
          <View style={styles.notificationTextContainer}>
            {/* Date and Time formatting */}
            <Text style={styles.timeText}>{formatDate(ticket.date)}</Text>
            <Text style={styles.timeText}>{formatTime(ticket.time)}</Text>
            <Text style={styles.detailsText}>
              Jeep#: {ticket.jeep_id} - Ticket#: {ticket.id}
            </Text>
          </View>
        </TouchableOpacity>
      ))
    ) : (
      <Text style={styles.notificationText}>No history available</Text>
    )}
  </View>
</Animated.View>

      {/* Main Content */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Nearest Jeep</Text>
        

        <Ionicons name="notifications" size={24} color="#000" onPress={toggleSidebar} style={styles.notif} />
        <Feather name="more-horizontal" size={24} color="black" onPress={toggleDropdown} />
        {showDropdown && (
        <View style={styles.dropdown} >
          <View style={styles.dropdownItem} >
            <Feather name="clock" size={20} color="black" style={styles.icon}  onPress={toggleHistory}/>
            <Text style={styles.dropdownText} >History</Text>
          </View>
        </View>
      )}
      </View>

      <View style={styles.container}>
        <TouchableOpacity style={styles.standbyButton} onPress={fetchStandbyJeeps}>
          <Text style={styles.standbyButtonText}> View Standby Jeeps</Text>
        </TouchableOpacity>

        {(!updatedTrips || updatedTrips.length === 0) ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No trips available</Text>
          </View>
        ) : (
          <FlatList
            data={updatedTrips}
            keyExtractor={(item) => item.trip_id ? item.trip_id.toString() : Math.random().toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => handleLocationPress(item.jeep_id)}
                >
                  <Ionicons name="location-sharp" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="location-outline" size={24} color="#007bff" />
                    <Text style={styles.cardTitle}>{item.status || 'Unknown Destination'}</Text>
                  </View>
                  <Text style={styles.cardInfo}>Jeep Number: {item.plate_number || 'Unknown Jeep'}</Text>
                  
                  <Text style={styles.cardInfo}>Available Seats: {item.available_seats}</Text>
                </View>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleViewSeatsPress(item.jeep_id, item.template)}
                >
                  <Text style={styles.detailsButtonText}>View Seats</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    
    flex: 1,
    padding: 24,
    backgroundColor: '#f4f7fa',
    top:20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    elevation: 5,
    marginTop: 25,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  notif:{
    right: 7
  },
  standbyButton: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  standbyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
    zIndex: 100,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdown: {
    position: "absolute",
    top: 50, // Adjust based on icon position
    right: 20, // Align with the icon
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 150,
    zIndex: 10, // Keeps it on top
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 16,
    color: "black",
  },
  sidebarTitle: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  sidebarContent: {
    marginTop: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardContent: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  cardInfo: {
    fontSize: 14,
    color: '#777',
    marginBottom: 6,
  },
  detailsButton: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 50,
    elevation: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#777',
    marginTop: 10,
  },
});

export default NearestJeep;
