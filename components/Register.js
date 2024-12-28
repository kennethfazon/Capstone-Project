import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Button,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';

const Register = () => {
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [cpNumber, setCpNumber] = useState('');
  const [typeofuser, setTypeofuser] = useState('driver');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      // Filter users to only include those where typeofuser is "driver"
      const driverUsers = response.data.filter(user => user.typeofuser === 'driver');
      setUsers(driverUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegisterOrUpdate = async () => {
    if (!username || !password || !fullname || !cpNumber) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      if (editMode) {
        await api.put(`/users/${selectedUser.id}`, { username, password, fullname, cp_number: cpNumber, typeofuser });
        setUsers(users.map(user => user.id === selectedUser.id ? { ...user, username, fullname, cp_number: cpNumber, typeofuser } : user));
        Alert.alert('Success', 'User updated successfully!');
      } else {
        await api.post('/register', { username, password, fullname, cp_number: cpNumber, typeofuser });
        fetchUsers(); // Ensure to fetch users after registration
        Alert.alert('Success', 'User registered successfully!');
      }
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Registration error: ' + error.message);
    }
  };

  const handleEdit = (user) => {
    setEditMode(true);
    setSelectedUser(user);
    setUsername(user.username);
    setPassword(''); // Password should not be pre-filled
    setFullname(user.fullname);
    setCpNumber(user.cp_number);
    setTypeofuser(user.typeofuser);
    setModalVisible(true);
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      Alert.alert('Success', 'User deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user: ' + error.message);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullname('');
    setCpNumber('');
    setTypeofuser('driver');
    setModalVisible(false);
    setEditMode(false);
    setSelectedUser(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.fullname}</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver List</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editMode ? 'Edit User' : 'Add New User'}</Text>
          <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Full Name" value={fullname} onChangeText={setFullname} />
          <TextInput style={styles.input} placeholder="CP Number" value={cpNumber} onChangeText={setCpNumber} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Type (admin/driver)" value={typeofuser} onChangeText={setTypeofuser} />
          <TouchableOpacity style={styles.saveButton} onPress={handleRegisterOrUpdate}>
            <Text style={styles.saveButtonText}>{editMode ? 'Update' : 'Register'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetForm}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
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
    backgroundColor: 'green',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    color: '#007bff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default Register;


// // src/components/Register.js
// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, TouchableOpacity } from 'react-native';
// import axios from 'axios';
// import api from '../services/api';
// const Register = ({ onBackToLogin }) => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullname, setFullname] = useState('');
//   const [cpNumber, setCpNumber] = useState('');
//   const [typeofuser, setTypeofuser] = useState('driver'); // default to driver

//   const register = () => {
//     api.post('/register', { username, password, fullname, cp_number: cpNumber, typeofuser })
//       .then(response => alert('Registered successfully'))
//       .catch(err => alert('Registration error: ' + err.message));
//   };

//   return (
//     <View>
//       <Text>Register:</Text>
//       <TextInput placeholder="Username" onChangeText={setUsername} />
//       <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
//       <TextInput placeholder="Full Name" onChangeText={setFullname} />
//       <TextInput placeholder="CP Number" onChangeText={setCpNumber} />
//       <TextInput placeholder="Type (admin/driver)" onChangeText={setTypeofuser} />
//       <Button title="Register" onPress={register} />
//       <TouchableOpacity onPress={onBackToLogin}>
//         <Text style={{ color: 'blue', marginTop: 10 }}>Back to Login</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default Register;
