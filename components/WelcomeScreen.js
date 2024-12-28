import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Make sure to install this package
import api from '../services/api';

const WelcomeScreen = ({ navigation }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const saveSelection = async () => {
    if (selectedDestination) {
      try {
        const response = await api.post('/trips', {
          destination: selectedDestination,
        });

        if (response.status === 200) {
          navigation.navigate('NearestJeep', { trips: response.data, selectedDestination });
          toggleModal();
        } else {
          Alert.alert('Error', response.data.message || 'Failed to fetch trips');
        }
      } catch (error) {
        Alert.alert('Error', 'Unable to connect to server');
      }
    } else {
      alert('Please select a destination!');
    }
  };

  const handleSelection = (destination) => {
    setSelectedDestination(destination);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Icon name="arrow-back" size={24} color="#000" onPress={() => navigation.goBack()} />
        <Text style={styles.brandText}>BGS TRANSCO</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* New Attractive Grid Section */}
      <View style={styles.gridContainer}>
        {[...Array(6)].map((_, index) => (
          <View key={index} style={styles.card}>
            <Icon name="event-seat" size={40} color="#fff" />
            <Text style={styles.cardText}>Seat {index + 1}</Text>
          </View>
        ))}
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Easy way to Book your Seat with us!</Text>
        <TouchableOpacity style={styles.bookNowButton} onPress={toggleModal}>
          <Text style={styles.bookNowText}>BOOK NOW</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal} style={styles.modal}>
        <View style={styles.modalContent}>
          <Text style={styles.questionText}>Where would you like to go?</Text>

          {/* Destination Options */}
          {['Gubat', 'Sorsogon'].map((destination) => (
            <TouchableOpacity
              key={destination}
              style={[
                styles.optionButton,
                selectedDestination === destination && styles.selectedOption,
              ]}
              onPress={() => handleSelection(destination)}
            >
              <Icon
                name="location-on"
                size={20}
                color={selectedDestination === destination ? '#fff' : '#007bff'}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedDestination === destination && styles.selectedOptionText,
                ]}
              >
                {destination}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Modal Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButtonClose} onPress={toggleModal}>
              <Text style={styles.buttonTextSecondary}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButtonSave} onPress={saveSelection}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    marginTop: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  brandText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  loginButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  card: {
    width: '48%',
    height: 120,
    backgroundColor: 'linear-gradient(145deg, #6ab7ff, #3a8cff)', // Gradient effect
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardText: {
    marginTop: 8,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  bookNowButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  bookNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  selectedOption: {
    backgroundColor: '#007bff',
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007bff',
  },
  selectedOptionText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButtonClose: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSave: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;
