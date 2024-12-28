import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import Icon from 'react-native-vector-icons/Ionicons';
import Mapbox from '@rnmapbox/maps';
import axios from 'axios';
import * as Location from 'expo-location';

Mapbox.setAccessToken('pk.eyJ1IjoicmljYXJkb2pyIiwiYSI6ImNtMjAwN2hubzBjdTUyanNmZDNobjlwdnMifQ.dByj0fl6cgi8yoYTbx9VfA');

const DriverDashboard = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [resId, setResId] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [passengerLocations, setPassengerLocations] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [moving, setMoving] = useState(false);
  const [token, setToken] = useState(null);
  
  // State to manage the camera view dynamically
  const [cameraPosition, setCameraPosition] = useState({
    latitude: 0,
    longitude: 0,
    zoomLevel: 11.5,  // Default zoom level
  });

  // Haversine formula to calculate the distance between two points (in kilometers)
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Returns distance in km
  };

  const fetchUserName = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      alert('No token found, please login again.');
      return;
    }
    setToken(token);
    try {
      const response = await api.get('/dashboard', { headers: { 'x-access-token': token } });
      setUsername(response.data.fullname);
    } catch (err) {
      alert('Error fetching user data: ' + err.message);
    }
  };

  const fetchReservationId = async () => { 
    if (!token) return;
    try {
      const response = await api.get('/api/getReservationId', {
        headers: { 'x-access-token': token },
      });
      setResId(response.data.res_id);
    } catch (err) {
      Alert.alert('Error fetching reservation ID', err.message);
    }
  };

  const fetchPassengerLocations = async () => {
    if (!token) return;
    try {
      const response = await api.get('/api/getJeepAndPassengerLocations', {
        headers: { 'x-access-token': token },
      });
      setPassengerLocations(response.data.passengerLocations);
    } catch (err) {
      
    }
  };

  const fetchRouteToPassenger = async (driverLocation, passengerLocation) => {
    try {
      const { latitude: driverLat, longitude: driverLng } = driverLocation;
      const { latitude: passengerLat, longitude: passengerLng } = passengerLocation;

      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLng},${driverLat};${passengerLng},${passengerLat}`,
        {
          params: {
            geometries: 'geojson',
            access_token: 'sk.eyJ1IjoicmljYXJkb2pyIiwiYSI6ImNtNDQ5ZG51bjBsY3oya3Npejd0NDNiMzQifQ.wvg5PRoD-ed6k2swJduO0A',
          },
        }
      );

      const routeGeoJSON = response.data.routes[0].geometry;
      setRouteCoordinates(routeGeoJSON.coordinates);
    } catch (error) {
      console.error('Error fetching route:', error.message);
      Alert.alert('Error', 'Unable to fetch route.');
    }
  };

  const findNearestPassenger = () => {
    if (!driverLocation || passengerLocations.length === 0) return null;

    let nearestPassenger = null;
    let minDistance = Infinity;

    passengerLocations.forEach((passenger) => {
      const distance = haversineDistance(driverLocation.latitude, driverLocation.longitude, passenger.latitude, passenger.longitude);

      if (distance < minDistance) {
        minDistance = distance;
        nearestPassenger = passenger;
      }
    });

    return nearestPassenger;
  };

  const simulateDriverMovement = async (route) => {
    if (!route || route.length === 0) return;
  
    setMoving(true);
    const busSpeed = 40; // Set bus speed in km/h (natural bus speed)
    const updateInterval = 50; // Update every 50 ms (smoother updates)
  
    const token = await AsyncStorage.getItem('userToken');
    
    let currentSegmentIndex = 0;
    const totalSegments = route.length - 1;
  
    // Interpolate function
    const interpolate = (start, end, t) => {
      return start + (end - start) * t;
    };
  
    const moveToNextPoint = async () => {
      if (currentSegmentIndex >= totalSegments) {
        setMoving(false);
        return;
      }
  
      const [startLng, startLat] = route[currentSegmentIndex];
      const [endLng, endLat] = route[currentSegmentIndex + 1];
  
      const distance = haversineDistance(startLat, startLng, endLat, endLng); // in km
      const timeToTravel = (distance / busSpeed) * 3600 * 1000; // time to travel this segment in ms
      const steps = Math.floor(timeToTravel / updateInterval); // Steps for smooth transition
  
      for (let i = 0; i < steps; i++) {
        const t = i / steps; // Progress ratio from 0 to 1
        const newLat = interpolate(startLat, endLat, t);
        const newLng = interpolate(startLng, endLng, t);
  
        setDriverLocation({ latitude: newLat, longitude: newLng });
  
        // Update camera position smoothly
        setCameraPosition((prevState) => ({
          latitude: newLat,
          longitude: newLng,
          zoomLevel: prevState.zoomLevel, // Keep zoom level constant or modify if necessary
        }));
  
        // Send the updated location to the server (if necessary)
        try {
          await api.post('/updatedriverLocation', {
            latitude: newLat,
            longitude: newLng,
          }, {
            headers: {
              'x-access-token': token,
            },
          });
        } catch (error) {
          console.error('Error sending location:', error);
        }
  
        // Wait before updating the next position
        await new Promise((resolve) => setTimeout(resolve, updateInterval));
      }
  
      currentSegmentIndex++; // Move to the next segment
      moveToNextPoint(); // Move to the next point
    };
  
    moveToNextPoint(); // Start the movement from the first segment
  };
  

  useEffect(() => {
    fetchUserName();
  }, []);

  useEffect(() => {
    if (token) {
      fetchReservationId();
      fetchPassengerLocations();
    }
  }, [token]);

  useEffect(() => {
    const fetchDriverInitialLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to proceed.');
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = userLocation.coords;
      setDriverLocation({ latitude, longitude });
      setCameraPosition({
        latitude,
        longitude,
        zoomLevel: 11.5,
      });
    };

    fetchDriverInitialLocation();
  }, []);

  useEffect(() => {
    // Trigger driver movement if there are any passengers and driverLocation is set
    if (driverLocation && !moving && passengerLocations.length > 0) {
      const nearestPassenger = findNearestPassenger();
      if (nearestPassenger) {
        fetchRouteToPassenger(driverLocation, nearestPassenger).then(() => {
          simulateDriverMovement(routeCoordinates).then(() => {
            setPassengerLocations((prev) =>
              prev.filter(
                (passenger) =>
                  passenger.latitude !== nearestPassenger.latitude &&
                  passenger.longitude !== nearestPassenger.longitude
              )
            );
          });
        });
      }
    }
  }, [driverLocation, passengerLocations]);

  const logout = async () => {
    if (!token) {
      alert('No token found, you are already logged out.');
      return;
    }
    try {
      await api.post('/logout', {}, { headers: { 'x-access-token': token } });
      await AsyncStorage.removeItem('userToken');
      navigation.navigate('Welcome');
    } catch (err) {
      alert('Logout error: ' + err.message);
    }
  };

  const handlePlusButtonClick = () => {
    if (resId) {
      navigation.navigate('ManageSeats', { res_id: resId });
    } else {
      Alert.alert('Error', 'No reservation ID found');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {username}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {driverLocation ? (
        <Mapbox.MapView
          styleURL="mapbox://styles/mapbox/streets-v11"
          style={styles.map}
          camera={{
            centerCoordinate: [cameraPosition.longitude, cameraPosition.latitude],
            zoomLevel: cameraPosition.zoomLevel,
          }}
        >
          <Mapbox.Camera
  centerCoordinate={[cameraPosition.longitude, cameraPosition.latitude]}
  zoomLevel={cameraPosition.zoomLevel}
  animationMode="flyTo"
  animationDuration={1000}  // Smooth animation over 1 second
/>

          <Mapbox.MarkerView
            id="driver-location"
            coordinate={[driverLocation.longitude, driverLocation.latitude]}
          >
            <View style={styles.vehicleMarker}>
              <Icon name="car-sport" size={30} color="blue" />
            </View>
          </Mapbox.MarkerView>

          {passengerLocations.map((location, index) => (
            <Mapbox.MarkerView
              key={index}
              id={`passenger-location-${index}`}
              coordinate={[location.longitude, location.latitude]}
            >
              <View style={styles.redMarker}>
                <Icon name="location-sharp" size={30} color="red" />
              </View>
            </Mapbox.MarkerView>
          ))}

          {/* Route LineLayer */}
          {routeCoordinates.length > 0 && (
            <Mapbox.ShapeSource
              id="routeSource"
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates,
                },
              }}
            >
              <Mapbox.LineLayer
                id="routeLine"
                style={{
                  lineColor: '#007bff',
                  lineWidth: 4,
                }}
              />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>
      ) : (
        <Text>Loading map...</Text>
      )}

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton}>
          <Icon name="home-outline" size={30} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton} onPress={handlePlusButtonClick}>
          <Icon name="add-outline" size={40} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Icon name="settings-outline" size={30} color="#748c94" />
        </TouchableOpacity>
      </View>
    </View>
  );
};


 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
    paddingBottom: 20,
  },
  marker: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff6347',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '60%',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  markerImage: {
    width: 30,
    height: 30,
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

export default DriverDashboard;
