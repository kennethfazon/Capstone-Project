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
  const [fullName, setFullName] = useState(''); 
  const [resId, setResId] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [passengerLocations, setPassengerLocations] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [moving, setMoving] = useState(false);
  const [token, setToken] = useState(null);
  const [loggedOut, setLoggedOut] = useState(false);  // New state for tracking logout
  
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
      setFullName(response.data.fullName || ''); // Ensure it's a valid string
    } catch (err) {
      Alert.alert('Error fetching user data: ' + err.message);
    }
  };

  useEffect(() => {
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
  
    if (token) {
      fetchReservationId();
    }
  }, [token]); // This effect runs when the token changes
  

  const fetchPassengerLocations = async () => {
    if (!token) return;
    try {
      const response = await api.get('/api/getJeepAndPassengerLocations', {
        headers: { 'x-access-token': token },
      });
      setPassengerLocations(response.data.passengerLocations);
    } catch (err) {
      console.error('Error fetching passenger locations:', err.message);
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
    if (!route || route.length === 0 || loggedOut || !token) return;  // Stop if logged out or no token
  
    setMoving(true);
    const busSpeed = 40; // Set bus speed in km/h (natural bus speed)
    const updateInterval = 1000; // Update every 1000 ms (1 second)
  
    const token = await AsyncStorage.getItem('userToken');
    
    let currentStep = 0;
    let totalSteps = 0;
    
    // Calculate total number of steps for the entire route
    for (let i = 0; i < route.length - 1; i++) {
      const [startLng, startLat] = route[i];
      const [endLng, endLat] = route[i + 1];
  
      const distance = haversineDistance(startLat, startLng, endLat, endLng); // in km
      const timeToTravel = (distance / busSpeed) * 3600 * 1000; // time to travel this segment in ms (distance/speed)
  
      const numSteps = Math.floor(timeToTravel / updateInterval); // Number of updates for this segment
      totalSteps += numSteps; // Sum total steps across all segments
    }
  
    let intervalId = setInterval(async () => {
      if (!token || loggedOut) {
        clearInterval(intervalId);  // Stop updating if logged out or no token
        setMoving(false);
        return;
      }

      if (currentStep < totalSteps) {
        let accumulatedDistance = 0;
        let currentSegmentIndex = 0;
        let remainingSteps = currentStep;
  
        // Traverse the route segments to calculate the next position
        while (remainingSteps >= 0) {
          const [startLng, startLat] = route[currentSegmentIndex];
          const [endLng, endLat] = route[currentSegmentIndex + 1];
  
          const distance = haversineDistance(startLat, startLng, endLat, endLng); // in km
          const segmentSteps = Math.floor((distance / busSpeed) * 3600 * 1000 / updateInterval);
  
          if (remainingSteps < segmentSteps) {
            const latStep = (endLat - startLat) / segmentSteps;
            const lngStep = (endLng - startLng) / segmentSteps;
  
            const newLat = startLat + latStep * remainingSteps;
            const newLng = startLng + lngStep * remainingSteps;
  
            setDriverLocation({ latitude: newLat, longitude: newLng });
  
            // Update camera position dynamically
            setCameraPosition({
              latitude: newLat,
              longitude: newLng,
              zoomLevel: 11.5,  // You can adjust zoom level based on your needs
            });
  
            // Send driver location to the server every second
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
  
            break; // Break out once we have updated the current position
          }
  
          remainingSteps -= segmentSteps;
          currentSegmentIndex++;
        }
  
        currentStep++;
      } else {
        clearInterval(intervalId); // Stop updating when all steps are completed
        setMoving(false);
      }
    }, updateInterval);
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
      if (!token) return;  // Skip if no token

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
  }, [token]);

  useEffect(() => {
    if (driverLocation && !moving && passengerLocations.length > 0 && !loggedOut && token) {
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
  }, [driverLocation, passengerLocations, loggedOut, token]);

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


  const handlePlusButtonClick = () => {
    if (resId) {
      navigation.navigate('ManageSeats', { res_id: resId });
    } else {
      Alert.alert('Error', 'No reservation ID found');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {fullName}</Text>
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
            animationDuration={2000}
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
