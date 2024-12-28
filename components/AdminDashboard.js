import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import api from '../services/api';
import Home from './AdminScreen/Home';
import Driverlist from './AdminScreen/DriversList';
import JeepList from './AdminScreen/Jeeps';
import Reports from './AdminScreen/Reports';
import Customize from './AdminScreen/Customize';

// Import Ionicons from the correct version
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

// Custom Drawer Content with Logout button
const CustomDrawerContent = (props) => {
  const [username, setUsername] = React.useState('');

  // Fetch the username when the component mounts
  useEffect(() => {
    fetchUserName();
  }, []);

  // Function to fetch username from the API or AsyncStorage
  const fetchUserName = async () => {
    try {
      const userName = await AsyncStorage.getItem('username');
      setUsername(userName || 'Admin'); // Default to 'Admin' if no username is found
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  // Logout function
  const logout = async () => {
    const token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      alert('No token found, you are already logged out.');
      return;
    }

    api.post('/logout', {}, { headers: { 'x-access-token': token } })
      .then(async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('username'); // Optionally remove username
        props.navigation.navigate('Welcome');  // Navigate to Welcome or Login screen
      })
      .catch(err => alert('Logout error: ' + err.message));
  };

  return (
    <View style={styles.drawerContainer}>
      {/* Profile Section with Gradient Background */}
      <View style={styles.profileSection}>
        <Image source={require('./logo.png')} style={styles.logo} />
        <Text style={styles.profileText}>Hello, {username}</Text>
      </View>
      
      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        {props.state.routes.map((route, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => props.navigation.navigate(route.name)}
            style={[
              styles.drawerItem,
              props.state.index === index && styles.selectedDrawerItem, // Highlight selected item
            ]}
          >
            <Ionicons
              name={
                route.name === 'Home' ? 'home-outline' :
                route.name === 'Customize' ? 'settings-outline' :
                route.name === 'Driverlist' ? 'person-outline' :
                route.name === 'JeepList' ? 'car-outline' :
                'document-outline' // Default for Reports
              }
              size={26}
              color={props.state.index === index ? '#fff' : '#333'}
              style={styles.drawerIcon}
            />
            <Text
              style={[
                styles.drawerLabel,
                { color: props.state.index === index ? '#fff' : '#333' },
              ]}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="exit-outline" size={26} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function AdminDashboard() {
  return (
   
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          drawerStyle: styles.drawerStyle,
          drawerLabelStyle: styles.drawerLabelStyle,
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="Home"
          component={Home}
          options={{
            headerTitle: () => <Text style={styles.headerText}>Home</Text>,
          }}
        />
        <Drawer.Screen
          name="Customize"
          component={Customize}
          options={{
            headerTitle: () => <Text style={styles.headerText}>Customize</Text>,
          }}
        />
        <Drawer.Screen
          name="Driverlist"
          component={Driverlist}
          options={{
            headerTitle: () => <Text style={styles.headerText}>Drivers</Text>,
          }}
        />
        <Drawer.Screen
          name="JeepList"
          component={JeepList}
          options={{
            headerTitle: () => <Text style={styles.headerText}>Jeeps</Text>,
          }}
        />
        <Drawer.Screen
          name="Reports"
          component={Reports}
          options={{
            headerTitle: () => <Text style={styles.headerText}>Reports</Text>,
          }}
        />
      </Drawer.Navigator>
    
  );
}

// StyleSheet for improved UI
const styles = StyleSheet.create({
  // Main Container for Drawer
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Profile Section with Gradient Background
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#007bff', // Gradient Background will be applied to this container
    marginBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5, // Add shadow for a 3D effect
  },

  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff', // Adding a white border to make the logo pop
  },

  profileText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },

  // Drawer Item List
  drawerItems: {
    flex: 1,
    paddingTop: 20,
  },

  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingLeft: 20,
    borderRadius: 10, // Rounded corners
    marginVertical: 5,
    marginHorizontal: 15,
    transition: 'all 0.3s ease', // Smooth hover/active effect
  },

  selectedDrawerItem: {
    backgroundColor: '#007bff', // Highlight selected item with a blue background
    borderRadius: 10,
  },

  drawerIcon: {
    marginRight: 20,
  },

  drawerLabel: {
    fontSize: 18,
    fontFamily: 'Roboto',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Drawer Style and Animation
  drawerStyle: {
    width: 270,
    backgroundColor: '#f4f4f4',
  },

  drawerLabelStyle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  // Header Style
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.8,
  },

  // Logout Button Styling
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: 'whitesmoke', // Red background for logout
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
    elevation: 5, // Add shadow for 3D effect
  },

  logoutIcon: {
    marginRight: 20,
    color: 'black'
  },

  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
  },
});
