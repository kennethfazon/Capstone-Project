import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  
  Button,
  Pressable
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import Modal from 'react-native-modal'; 

const standbyImage = require('./standby.png');
const inprocessImage = require('./inprocess.png');
const ongoingImage = require('./ongoing.png');

const Sitex = ({ navigation }) => {
  const [jeepStatuses, setJeepStatuses] = useState({});
  const [jeepIds, setJeepIds] = useState([]);
  const [selectedJeep, setSelectedJeep] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inProcessJeep, setInProcessJeep] = useState(null);
  const [disableAllExceptInProcess, setDisableAllExceptInProcess] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    fetchAllJeeps();
    fetchJeepStatuses();
    getSelectedJeepFromStorage();
  }, []);
  useEffect(() => {
    if (modalVisible) {
      const timer = setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setCurrentTime(timeString);
      }, 1000); 

      // Clear the interval when modal is closed or unmounted
      return () => clearInterval(timer);
    }
  }, [modalVisible]);


  const fetchAllJeeps = () => {
    api.get('/getAllSitexJeeps')
      .then((response) => {
        if (response.data.success) {
          const jeepsWithGubat = response.data.jeeps;
          setJeepIds(jeepsWithGubat.map((jeep) => jeep.jeep_id));

          const updatedStatuses = {};
          jeepsWithGubat.forEach((jeep) => {
            updatedStatuses[jeep.jeep_id] = 'standby';
          });
          setJeepStatuses(updatedStatuses);
        } else {
          console.error('Error fetching jeeps:', response.data.message);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const fetchJeepStatuses = () => {
    api.get('/getJeepStatuses')
      .then((response) => {
        if (response.data.success) {
          setJeepStatuses(response.data.jeepStatuses);
  
          // Check if the selected jeep is inTransit
          if (selectedJeep && response.data.jeepStatuses[selectedJeep] === 'inTransit') {
            setSelectedJeep(null);
            AsyncStorage.removeItem('SelectedSitexJeep') // Clear from storage
              .catch((error) => console.error('Error clearing selected jeep:', error));
          }
        } else {
          console.error('Error fetching statuses:', response.data.message);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
  

  const getSelectedJeepFromStorage = async () => {
    try {
      const storedJeep = await AsyncStorage.getItem('SelectedSitexJeep');
      if (storedJeep) {
        setSelectedJeep(parseInt(storedJeep, 10));
      }
    } catch (error) {
      console.error('Error retrieving selected jeep:', error);
    }
  };

  const handleJeepPress = (jeepId) => {
    if (selectedJeep === jeepId) {
      fetchTripDetails(jeepId);
      setModalVisible(true);
    } else {
      Alert.alert(
        'Select Jeep',
        `Are you sure you want to select Jeep ${jeepId}?`,
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Selection Cancelled'),
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: async () => {
              api.post('/insertTripScheduleSitex', { jeepId })
                .then(async (response) => {
                  if (response.data.success) {
                    setSelectedJeep(jeepId);
                    await AsyncStorage.setItem('SelectedSitexJeep', jeepId.toString());
                    fetchJeepStatuses();
                  } else {
                    console.error('Error scheduling trip:', response.data.message);
                  }
                })
                .catch((error) => {
                  console.error('Error:', error);
                });
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const fetchTripDetails = (jeepId) => {
    api.get(`/getTripDetails/${jeepId}`)
      .then((response) => {
        if (response.data.success) {
          setTripDetails(response.data.tripDetails);
        } else {
          console.error('Error fetching trip details:', response.data.message);
        }
      })
      .catch((error) => {
        console.error('Error fetching trip details:', error);
      });
  };
  

  const handleSaveClick = async (jeepId) => {
    api.post('/updateJeepStatus', { jeepId, status: 'inTransit' })
      .then(async (response) => {
        if (response.data.success) {
          await AsyncStorage.removeItem('SelectedSitexJeep');
          fetchJeepStatuses();
          setModalVisible(false);
        } else {
          console.error('Error updating status:', response.data.message);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.availableSeat]} />
          <Text style={styles.legendText}>Standby</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedSeat]} />
          <Text style={styles.legendText}>In Queue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.unavailableSeat]} />
          <Text style={styles.legendText}>In Transit</Text>
        </View>
      </View>
      <Text style={styles.headerTitle}>Sitex Terminal</Text>

      <View style={styles.body}>
      <TouchableOpacity style={styles.assignButton}>
  <Text style={styles.assignButtonText}>
    {selectedJeep ? `Jeep ${selectedJeep}` : 'No Jeep Assigned'}
  </Text>
</TouchableOpacity>


        <Text style={styles.assignButtonLabel}>Assigned Jeep</Text>

        <ScrollView contentContainerStyle={styles.jeepGrid}>
          {jeepIds.map((jeepId) => {
            const jeepStatus = jeepStatuses[jeepId];
            let jeepImage;

            if (jeepStatus === 'inTransit') {
              jeepImage = ongoingImage;
            } else if (jeepStatus === 'inQueue') {
              jeepImage = inprocessImage;
            } else if (jeepStatus === 'standby') {
              jeepImage = standbyImage;
            }

            if (!jeepImage) {
              jeepImage = standbyImage;
            }

            const isDisabled = jeepStatus === 'inTransit';

            return (
              <TouchableOpacity
                key={jeepId}
                onPress={() => handleJeepPress(jeepId)}
                style={[styles.activeJeep, isDisabled && styles.disabledJeep]}
                disabled={isDisabled}
              >
                <Image source={jeepImage} style={styles.jeepImage} />
                <Text style={styles.jeepLabel}>
                  {jeepStatus === 'inTransit'
                    ? `InTransit\nJeep Number: ${jeepId}`
                    : jeepStatus === 'inQueue'
                    ? `InQueue\nJeep Number: ${jeepId}`
                    : `Standby\nJeep Number: ${jeepId}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Modal
          isVisible={modalVisible}
          swipeDirection="down"
          onBackdropPress={() => setModalVisible(false)}
          onSwipeComplete={() => setModalVisible(false)}
          style={styles.bottomModal}
        >
          <View style={styles.modalContent}>
            <View style={styles.handleStyle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {tripDetails ? (
              <>
                <View style={styles.tripInfoContainer}>
                  <View style={styles.tripInfoRow}>
                    <Text style={styles.tripInfoLabel}>Jeep Number:</Text>
                    <Text style={styles.tripInfoValue}>{tripDetails.jeep_id}</Text>
                  </View>
                  <View style={styles.tripInfoRow}>
                    <Text style={styles.tripInfoLabel}>Driver:</Text>
                    <Text style={styles.tripInfoValue}>{tripDetails.driver_name}</Text>
                  </View>
                  <View style={styles.tripInfoRow}>
                    <Text style={styles.tripInfoLabel}>Date:</Text>
                    <Text style={styles.tripInfoValue}>{tripDetails.date}</Text>
                  </View>
                  <View style={styles.tripInfoRow}>
                    <Text style={styles.tripInfoLabel}>Destination:</Text>
                    <Text style={styles.tripInfoValue}>{tripDetails.destination}</Text>
                  </View>
                  <View style={styles.tripInfoRow}>
                    <Text style={styles.tripInfoLabel}>Time:</Text>
                    <Text style={styles.tripInfoValue}>{currentTime}</Text>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <Pressable style={styles.saveButton} onPress={() => handleSaveClick(tripDetails.jeep_id)}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </Pressable>
                  <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={styles.modalText}>Loading Trip Details...</Text>
            )}
          </View>
        </Modal>

      </View>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminDashboard')}>
          <Icon name="home-outline" size={30} color="#007bff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.plusButton} onPress={() => navigation.navigate('Sitex')}>
          <Icon name="add-outline" size={40} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings-outline" size={30} color="#748c94" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
// Add styles...

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb', 
    padding: 30 
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
  availableSeat: {
    backgroundColor: 'black',
    borderColor: '#D8D2C2',
  },
  selectedSeat: {
    backgroundColor: '#007bff',
    borderColor: '#0056B3',
  },
  unavailableSeat: {
    backgroundColor: 'white',
    borderColor: 'black',
  },
  headerTitle: { 
    fontSize: 28, 
    textAlign: 'left', 
    fontFamily: 'Poppins_700Bold',
    marginBottom: 20 
  },
  body: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 5, 
    elevation: 10 
  },
  assignButton: { 
    padding: 15, 
    backgroundColor: '#007bff', 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 15, 
    shadowColor: '#007bff', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6, 
    elevation: 8 
  },
  assignButtonText: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: 'white' 
  },
  assignButtonLabel: { 
    fontSize: 16, 
    color: '#4a4a4a', 
    textAlign: 'center', 
    marginBottom: 20 
  },
jeepGrid: {
  flexDirection: 'column', // Stack items vertically
  paddingVertical: 20,
  gap: 15, // Add spacing between jeeps
},
activeJeep: {
  flexDirection: 'row', // Optional: align image and text horizontally
  alignItems: 'center',
  justifyContent: 'space-between', // Space items inside
  marginBottom: 15,
  width: '100%',
  backgroundColor: '#ffffff',
  borderRadius: 10,
  padding: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 5,
},
disabledJeep: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 15,
  width: '100%',
  backgroundColor: '#f0f0f0',
  borderRadius: 10,
  padding: 10,
  opacity: 0.6,
},
jeepImage: {
  width: 80,
  height: 60,
  marginRight: 10, // Add spacing between the image and text
},
jeepLabel: {
  flex: 1,
  textAlign: 'left',
  fontSize: 16,
  color: '#333',
  fontFamily: 'Poppins_400Regular',
},

  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 400,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  handleStyle: {
    backgroundColor: '#ddd',
    height: 5,
    width: 60,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  tripInfoContainer: {
    marginBottom: 20,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tripInfoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  tripInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  modalText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
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
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
    position: 'relative',
    top: -20,
  },
});


export default Sitex;