import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
const Home = ({ navigation }) => {
  const [fullName, setFullName] = useState(''); // State to hold the full name

  // Function to fetch the logged-in user's full name
  const fetchUserName = async () => {
    const token = await AsyncStorage.getItem('userToken'); // Retrieve token

    if (!token) {
      Alert.alert('No token found. Please login.');
      return;
    }

    try {
      const response = await api.get('/dashboard', {
        headers: { 'x-access-token': token }, // Pass the token in the request
      });
      
      // Set the full name based on the response data
      setFullName(response.data.fullName || ""); 
    } catch (err) {
      Alert.alert('Error fetching user data: ' + err.message);
    }
  };

  const getTerminalType = async () => {
    const token = await AsyncStorage.getItem('userToken');
  
    if (!token) {
      Alert.alert('No token found. Please login.');
      return;
    }
  
    try {
      const response = await api.get('/terminal-type', {
        headers: { 'x-access-token': token }
      });
      const terminalType = response.data.terminal_type;
      if (terminalType === 'Pamana') {
        navigation.navigate('Pamana');
      } else if (terminalType === 'Sitex') {
        navigation.navigate('Sitex');
      } else {
        Alert.alert('Unknown terminal type');
      }
    } catch (err) {
      Alert.alert('Error fetching terminal type: ' + err.message);
    }
  };

  const logout = async () => {
    const token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      alert('No token found, you are already logged out.');
      return;
    }

    api.post('/logout', {}, { headers: { 'x-access-token': token } })
      .then(async () => {
        await AsyncStorage.removeItem('userToken');
        navigation.navigate('Welcome');  
      })
      .catch(err => alert('Logout error: ' + err.message));
  };

  // Fetch the username when the component mounts
  useEffect(() => {
    fetchUserName(); // Call the function to fetch the user's name
  }, []);

  return (
    <>
      <View>
        {/* Display the username here */}
        <Text style={styles.name}>Welcome, {fullName}</Text>  
        <Text>Admin Dashboard</Text>
        
      </View>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton}>
          <Icon name="home-outline" size={30} color="#007bff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.plusButton}
          onPress={getTerminalType} // Trigger the check and navigation here
        >
          <Icon name="add-outline" size={40} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton}>
          <Icon name="settings-outline" size={30} color="#748c94" />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  name: {
    marginTop:100,
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  navBar: {
    position: 'absolute',
    bottom: 10,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5EFFF',
    borderRadius: 20,
    height: 60,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
    marginBottom: 20,
    position: 'relative',
    top: -20,
  },
});

export default Home;
