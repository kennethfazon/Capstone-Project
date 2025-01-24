import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import Toast, { BaseToast } from 'react-native-toast-message';
import api from '../../services/api';
import { useFocusEffect } from '@react-navigation/core';
const toastConfig = {
  success: (internalState) => (
    <BaseToast
      {...internalState}
      style={styles.toastSuccess}
      contentContainerStyle={styles.toastContent}
      text1Style={styles.toastText}
      text2Style={styles.toastText}
      text1={internalState.text1}
      text2={internalState.text2}
      leadingIcon={<Icon name="checkmark-circle" size={20} color="#fff" />}
    />
  ),
  error: (internalState) => (
    <BaseToast
      {...internalState}
      style={styles.toastError}
      contentContainerStyle={styles.toastContent}
      text1Style={styles.toastText}
      text2Style={styles.toastText}
      text1={internalState.text1}
      text2={internalState.text2}
      leadingIcon={<Icon name="close-circle" size={20} color="#fff" />}
    />
  ),
};

const JeepList = () => {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [jeeps, setJeeps] = useState([]);
  const [selectedJeep, setSelectedJeep] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');

  const [dropdownValue, setDropdownValue] = useState(null);  // Stores selected image value
  const [modalVisible, setModalVisible] = useState(false);    // Controls the visibility of the bottom modal
  const [selectedImage, setSelectedImage] = useState(null);   // Stores the selected image's value

  // Function to handle the image selection
  const handleImageSelection = (imageValue) => {
    setSelectedImage(imageValue);  // Store the selected image's value
    setDropdownValue(imageValue);  // Update the dropdown value with the selected image value
    setModalVisible(false);        // Close the modal after selection
  };



  useEffect(() => {
    fetchJeeps();
    fetchDrivers();
  }, []);

  const fetchJeeps = () => {
    api.get('/api/jeeps')
      .then(response => {
        const formattedJeeps = response.data.map(jeep => ({
          id: jeep.jeep_id,
          name: `Jeep ${jeep.jeep_id}`,
          plate_number: jeep.plate_number,
          assigned_driver_id: jeep.user_id,
        }));
        setJeeps(formattedJeeps);
      })
      .catch(error => {
        console.error('Error fetching jeeps:', error);
        Toast.show({ type: 'error', text1: 'Error fetching jeeps', text2: error.message });
      });
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchJeeps();
      fetchDrivers();
    }, [])
  );

  const fetchDrivers = () => {
    api.get('/api/drivers')
      .then(response => {
        setDrivers(response.data);
      })
      .catch(error => {
        console.error('Error fetching drivers:', error);
        Toast.show({ type: 'error', text1: 'Error fetching drivers', text2: error.message });
      });
  };

  const handleAddJeep = () => {
    // Validation check for missing fields
    if (!plateNumber || !selectedDriver || !dropdownValue) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a plate number, select a driver, and select a template.' });
      return;
    }
  
    // Ensure that the plateNumber is the same as jeep_id (Primary Key)
    const jeepData = {
      jeep_id: plateNumber, // Assign the plate_number as the jeep_id
      plate_number: plateNumber,
      user_id: selectedDriver,
      destination: "Sorsogon",  // Replace this with your actual destination logic
      template: dropdownValue
    };
  
    // API request to add jeep, using plate_number as jeep_id
    api.post('/api/jeeps', jeepData)
      .then(response => {
        Toast.show({ type: 'success', text1: 'Jeep added successfully!' });
        setAddModalVisible(false);  // Close the modal after success
        fetchJeeps();  // Refresh the jeep list
      })
      .catch(error => {
        console.error('Error adding jeep:', error);
        Toast.show({ type: 'error', text1: 'Error adding jeep', text2: error.message });
      });
  };
  
  const handleEditJeep = () => {
    const jeepData = {
      plate_number: plateNumber,
      user_id: selectedDriver,
    };
    
    // Make API request to update the jeep's status
    api.put(`/api/jeeps/${selectedJeep.id}/status`, { status: dropdownValue })
      .then(response => {
        Toast.show({ type: 'success', text1: `Jeep status updated to ${dropdownValue}` });
        setEditModalVisible(false);
        fetchJeeps(); // Refresh the jeep list
      })
      .catch(error => {
        console.error('Error updating jeep status:', error);
        Toast.show({ type: 'error', text1: 'Error updating jeep status', text2: error.message });
      });
  
    // Also update the jeep details (plate number, driver, etc.)
    api.put(`/api/jeeps/${selectedJeep.id}`, jeepData)
      .then(response => {
        Toast.show({ type: 'success', text1: 'Jeep updated successfully!' });
        setEditModalVisible(false);
        fetchJeeps();
      })
      .catch(error => {
        console.error('Error updating jeep:', error);
        Toast.show({ type: 'error', text1: 'Error updating jeep', text2: error.message });
      });
  };
  

  const handleDeleteJeep = (jeepId) => {
    Alert.alert(
      'Delete Jeep',
      'Are you sure you want to delete this jeep?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          api.delete(`/api/jeeps/${jeepId}`)
            .then(response => {
              Toast.show({ type: 'success', text1: 'Jeep deleted successfully!' });
              fetchJeeps();
            })
            .catch(error => {
              console.error('Error deleting jeep:', error);
              Toast.show({ type: 'error', text1: 'Error deleting jeep', text2: error.message });
            });
        }} 
      ]
    );
  };

  const openEditModal = (jeep) => {
  // Set the selected jeep and set the dropdown to the jeep's current status
  setSelectedJeep(jeep);
  setPlateNumber(jeep.plate_number);
  setSelectedDriver(jeep.assigned_driver_id);
  setDropdownValue(jeep.status); // Set the status in the dropdown dynamically
  setEditModalVisible(true);
};


  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.plateNumber}>{item.plate_number}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteJeep(item.id)}>
          <Icon name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const assignedDrivers = new Set(jeeps.map(jeep => jeep.assigned_driver_id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jeeps</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setPlateNumber('');
            setSelectedDriver(null);
            setAddModalVisible(true);
          }}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={jeeps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />

      {/* Add Jeep Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Jeep</Text>
            <TextInput
              value={plateNumber}
              onChangeText={setPlateNumber}
              placeholder="Plate Number"
              style={styles.input}
            />
            <Picker
              selectedValue={selectedDriver}
              onValueChange={(itemValue) => setSelectedDriver(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Driver" value={null} />
        {drivers
          .sort((a, b) => a.lastname.localeCompare(b.lastname)) // Sort by lastname
          .map(driver => (
            <Picker.Item
              key={driver.id}
              label={driver.lastname + " " + driver.firstname}
              value={driver.id}
              style={styles.pickerItem}
              enabled={!assignedDrivers.has(driver.id)} 
            />
          ))}
      </Picker>
           
      {/* Dropdown Button */}
      <TouchableOpacity 
        style={styles.c} 
        onPress={() => setModalVisible(true)}  // Open modal on button press
      >
        <Text style={styles.dropdownText}>
          {dropdownValue ? `Select Template ${dropdownValue}` : "Select an Template"}
        </Text>
      </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddJeep}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.b}>
          <View style={styles.a}>
            <Text style={styles.modalTitle}>Choose a Template</Text>

            {/* Image Options - Horizontal Layout */}
            <ScrollView 
              contentContainerStyle={styles.imageOptionsContainer} 
              horizontal={true}  // Make the image options horizontal
              showsHorizontalScrollIndicator={false}  // Hide the horizontal scrollbar
            >
              <TouchableOpacity 
                onPress={() => handleImageSelection(1)} 
                style={styles.imageOption}
              >
                <Image source={require('./template1.jpg')} style={styles.image} />
                <Text style={styles.imageText}>Template 1</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleImageSelection(2)} 
                style={styles.imageOption}
              >
                <Image source={require('./template2.jpg')} style={styles.image} />
                <Text style={styles.imageText}>Template 2</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity 
              onPress={() => setModalVisible(false)} 
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


<Modal visible={editModalVisible} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Edit Jeep</Text>
      <TextInput
        value={plateNumber}
        onChangeText={setPlateNumber}
        placeholder="Plate Number"
        style={styles.input}
      />
      <Picker
        selectedValue={selectedDriver}
        onValueChange={(itemValue) => setSelectedDriver(itemValue)}
        style={styles.picker}
      >
        {drivers

         .sort((a, b) => a.lastname.localeCompare(b.lastname)) // Sort by lastname
          .map(driver => (
          <Picker.Item 
            key={driver.id} 
            label={driver.lastname + " " + driver.firstname} 
            value={driver.id} 
          />
        ))}
      </Picker>
      
      {/* Dropdown for Status */}
      <Picker
        selectedValue={dropdownValue}  // This will hold the selected status
        onValueChange={(itemValue) => setDropdownValue(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Active" value="active" />
        <Picker.Item label="Inactive" value="inactive" />
      </Picker>

      <TouchableOpacity style={styles.saveButton} onPress={handleEditJeep}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setEditModalVisible(false)}>
        <Text style={styles.cancelButton}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      <Toast config={toastConfig} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 12,
    backgroundColor: '#28a745',
    borderRadius: 50,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  plateNumber: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginRight: 10,
  },
  iconButton: {
    padding: 10,
    backgroundColor: '#dc3545',
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
  },
  picker: {
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    color: '#007bff',
    textAlign: 'center',
    fontSize: 16,
  },
  toastSuccess: {
    backgroundColor: '#28a745',
    borderColor: '#fff',
  },
  toastError: {
    backgroundColor: '#dc3545',
    borderColor: '#fff',
  },
  toastContent: {
    paddingHorizontal: 15,
  },
  toastText: {
    color: '#fff',
  },
  c: {
    backgroundColor: 'whitesmoke',  // Brighter button color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,  // Rounded corners
    shadowColor: '#000',  // Subtle shadow effect
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },

    shadowRadius: 6,
  },

  dropdownText: {
    color: 'black',
    fontSize: 13,
  },
  b: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',  // Darker overlay for contrast
  },
  a: {
    backgroundColor: 'white',
    paddingBottom: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  imageOptionsContainer: {
    flexDirection: 'row', // Arrange images horizontally
    paddingHorizontal: 10, // Add padding around the images
    marginBottom: 20,
  },
  imageOption: {
    alignItems: 'center',
    marginHorizontal: 15,  // Space between images
    borderRadius: 10,  // Rounded borders for image options
    overflow: 'hidden',
  },
  image: {
    width: 120,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#e74c3c',  // Red button for cancel
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginTop: 20,
  },
  closeText: {
    color: 'white',
    fontSize: 18,
  },
  dropdownButton: {
    backgroundColor: '#0066cc',  // Brighter button color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,  // Rounded corners
    shadowColor: '#000',  // Subtle shadow effect
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
});

export default JeepList;
