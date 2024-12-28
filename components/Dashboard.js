import React from 'react';
import { useState } from 'react';

import { View } from 'react-native';
import AdminDashboard from './AdminDashboard';
import DriverDashboard from './DriverDashboard';

const Dashboard = ({ route, navigation }) => {
  const { typeofuser } = route.params;

  const [loggedInUser, setLoggedInUser] = useState(null);

  return (
    <View>
      {typeofuser === 'admin' ? (
        <AdminDashboard navigation={navigation} setLoggedInUser={setLoggedInUser} />
      ) : (
        <DriverDashboard navigation={navigation} setLoggedInUser={setLoggedInUser} />
      )}
    </View>
  );
};


export default Dashboard;
