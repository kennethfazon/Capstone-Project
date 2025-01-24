import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

const Driverlist = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [cpNumber, setCpNumber] = useState('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const positionAnim = useRef(new Animated.Value(-100)).current;

  // Fetch users when the component loads
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const driverUsers = response.data.filter(user => user.typeofuser === 'driver');
      setUsers(driverUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
    }, 300);
  };

  useEffect(() => {
    if (toastVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(positionAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  const getBackgroundColor = () => {
    switch (toastType) {
      case 'success':
        return '#28a745'; // Green for success
      case 'error':
        return '#dc3545'; // Red for error
      case 'info':
        return '#17a2b8'; // Blue for info
      default:
        return '#6c757d'; // Grey for default
    }
  };

  const handleRegisterOrUpdate = async () => {
    if (!username || !password || !lastname || !firstname || !middlename || !cpNumber) {
      showToast('All fields are required.', 'error');
      return;
    }

    try {
      if (editMode) {
        await api.put(`/users/${selectedUser.id}`, { username, password, lastname, firstname, middlename, cp_number: cpNumber, typeofuser: 'driver' });
        setUsers(users.map(user => user.id === selectedUser.id ? { ...user, username, lastname, firstname, middlename, cp_number: cpNumber } : user));
        showToast('User updated successfully!', 'success');
      } else {
        await api.post('/register', { username, password, lastname, firstname, middlename, cp_number: cpNumber, typeofuser: 'driver' });
        fetchUsers(); // Refresh users list
        showToast('User registered successfully!', 'success');
      }
      resetForm();
    } catch (error) {
      showToast('Registration error: ' + error.message, 'error');
    }
  };

  const handleEdit = (user) => {
    setEditMode(true);
    setSelectedUser(user);
    setUsername(user.username);
    setPassword(''); // Do not pre-fill password
    setLastname(user.lastname);
    setFirstname(user.firstname);
    setMiddlename(user.middlename);
    setCpNumber(user.cp_number);
    setModalVisible(true);
  };

  const handleDelete = async (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await api.delete(`/users/${userId}`);
              setUsers(users.filter(user => user.id !== userId));
              showToast('User deleted successfully!', 'success');
            } catch (error) {
              showToast('Failed to delete user: ' + error.message, 'error');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setLastname('');
    setFirstname('');
    setMiddlename('');
    setCpNumber('');
    setModalVisible(false);
    setEditMode(false);
    setSelectedUser(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.lastname} {item.firstname}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
          <Icon name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Drivers</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <FlatList
  data={users.sort((a, b) => a.lastname.localeCompare(b.lastname))} // Sort by last name
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
/>


        {/* Modal for Add/Edit User */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit User' : 'Add New User'}</Text>

              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastname}
                onChangeText={setLastname}
              />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstname}
                onChangeText={setFirstname}
              />
              <TextInput
                style={styles.input}
                placeholder="Middle Name"
                value={middlename}
                onChangeText={setMiddlename}
              />
              <TextInput
                style={styles.input}
                placeholder="CP Number"
                value={cpNumber}
                onChangeText={setCpNumber}
                keyboardType="phone-pad"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleRegisterOrUpdate}>
                <Text style={styles.saveButtonText}>{editMode ? 'Update' : 'Register'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* Toast */}
      {toastVisible && (
        <Animated.View
          style={[styles.toast, { backgroundColor: getBackgroundColor(), opacity: fadeAnim, transform: [{ translateY: positionAnim }] }]}
        >
          <Icon
            name={toastType === 'success' ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color="white"
            style={styles.toastIcon}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  item: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  name: {
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    color: '#007bff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  toast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  toastIcon: {
    marginLeft: 10,
  },
});

export default Driverlist;
