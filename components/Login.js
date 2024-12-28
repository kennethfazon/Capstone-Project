import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for password visibility

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in and fade-out
  const positionAnim = useRef(new Animated.Value(-100)).current; // For slide-in animation

  const login = () => {
    api
      .post('/login', { username, password })
      .then(async (response) => {
        if (response.data.auth) { // Check if auth is true
          const { token, typeofuser } = response.data;

          // Store the token in AsyncStorage
          await AsyncStorage.setItem('userToken', token);

          // Redirect based on the type of user
          if (typeofuser === 'admin') {
            navigation.navigate('AdminDashboard');
          } else if (typeofuser === 'driver') {
            navigation.navigate('DriverDashboard');
          } else {
            showToast('Unknown user type', 'error'); // You may want to handle this scenario differently
          }
        } else {
          // If auth is false, display a generic error message
          showToast('Invalid username or password.', 'error');
        }
      })
      .catch((err) => {
        // Show error toast if there's an error during login
        showToast('Login error: ' + "Invalid Username or Password", 'error');
      });
  };

  useEffect(() => {
    if (toastVisible) {
      // Animate toast when it becomes visible
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton}>
        <Ionicons name="chevron-back-outline" size={24} color="black" onPress={() => navigation.navigate('GetStarted')} />
      </TouchableOpacity>

      <Text style={styles.title}>Login to</Text>
      <Text style={styles.appName}>E-jeeney</Text>

      {/* Username Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Username"
          keyboardType="email-address"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      {/* Password Input with Eye Icon for Show/Hide */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry={!isPasswordVisible} // Toggle visibility based on isPasswordVisible state
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
          <Ionicons
            name={isPasswordVisible ? 'eye' : 'eye-off'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={login}>
        <Text style={styles.loginButtonText}>LOG IN</Text>
      </TouchableOpacity>

      {/* Toast Modal */}
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
}





const styles = StyleSheet.create({
  container: {
    marginTop: -160,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: 'white',
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#000',
    textAlign: 'left',
    marginBottom: 1,
    marginTop: 28,
    fontFamily: 'Poppins_400Regular', // Ensure correct fontFamily is applied
  },
  appName: {
    marginTop: -10,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
    marginBottom: 70,
    fontFamily: 'Poppins_700Bold', // Ensure correct fontFamily is applied
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 30,
    paddingHorizontal: 10,
    height: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular', // Ensure correct fontFamily is applied
  },
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold', // Ensure correct fontFamily is applied
  },
});


// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const LoginScreen = ({ navigation }) => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');

//   const login = () => {
//     axios.post('http://192.168.1.3:3000/login', { username, password })
//       .then(async (response) => {
//         const { token, typeofuser } = response.data;
//         await AsyncStorage.setItem('userToken', token);

//         // Instead of navigating directly to AdminDashboard or DriverDashboard,
//         // Navigate to the Dashboard component and pass typeofuser as a param
//         navigation.navigate('Dashboard', { typeofuser });
//       })
//       .catch(err => alert('Login error: ' + err.message));
//   };

//   return (
//     <View style={styles.container}>
//       <Text>Log In</Text>
//       <TextInput
//         placeholder="Username"
//         style={styles.input}
//         onChangeText={setUsername}
//         value={username}
//       />
//       <TextInput
//         placeholder="Password"
//         secureTextEntry
//         style={styles.input}
//         onChangeText={setPassword}
//         value={password}
//       />
//       <Button title="Log In" onPress={login} />
//       <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//         <Text style={styles.registerText}>Register</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   input: {
//     width: '80%',
//     height: 40,
//     borderColor: 'gray',
//     borderWidth: 1,
//     marginVertical: 10,
//     paddingHorizontal: 10,
//   },
//   registerText: {
//     marginTop: 20,
//     color: 'blue',
//   },
// });

// export default LoginScreen;
