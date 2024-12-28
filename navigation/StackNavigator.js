import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import GetStartedScreen from '../components/GetStartedScreen';
import WelcomeScreen from '../components/WelcomeScreen';
import LoginScreen from '../components/Login';
import Register from '../components/Register';
import AdminDashboard from '../components/AdminDashboard';
import DriverDashboard from '../components/DriverDashboard';
import Dashboard from '../components/Dashboard';
import NearestJeep from '../components/PassengerScreen/NearestJeep';
import Pamana from '../components/AdminScreen/Pamana';
import Sitex from '../components/AdminScreen/Sitex';
import ReserveSeats from '../components/PassengerScreen/ReserveSeats';
import Seats from '../components/seats';
import ManageSeats from '../components/DriverScreen/ManageSeats';
import ReceiptScreen from '../components/PassengerScreen/ReceiptScreen';
import Toast from 'react-native-toast-message';
import Map from '../components/PassengerScreen/Map';
import DetailedReportScreen from '../components/AdminScreen/DetailedReportScreen';
import Ticket from '../components/DriverScreen/Ticket';
import SeatsTwo from '../components/SeatsTwo';
import TicketHistory from '../components/PassengerScreen/TicketHistory';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <>
      <Stack.Navigator initialRouteName="GetStarted">
        <Stack.Screen name="ManageSeats" component={ManageSeats} />
        <Stack.Screen name="Map" component={Map} />
        <Stack.Screen name="TicketHistory" component={TicketHistory} options={{ headerShown: false }} />
        <Stack.Screen name="SeatsTwo" component={SeatsTwo} />
        <Stack.Screen name="Ticket" component={Ticket} options={{ headerShown: false }}/>
        <Stack.Screen name="ReceiptScreen" component={ReceiptScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Seats" component={Seats} />
        <Stack.Screen name="Pamana" component={Pamana} />
        <Stack.Screen name="ReserveSeats" component={ReserveSeats} />
        <Stack.Screen name="Sitex" component={Sitex} />
        <Stack.Screen name="NearestJeep" component={NearestJeep} options={{ headerShown: false }}/>
        <Stack.Screen name="GetStarted" component={GetStartedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="DetailedReport" component={DetailedReportScreen} />
        <Stack.Screen name="DriverDashboard" component={DriverDashboard} options={{ headerShown: false }} />
      </Stack.Navigator>
     
      <Toast/>
    </>
  );
};

export default StackNavigator;
