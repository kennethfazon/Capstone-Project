import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

const GetStartedScreen = ({navigation}) => {
  // Load fonts
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  // Show a loading indicator while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Upper half with logo and buses */}
      <View style={styles.upperContainer}>
        <Image 
          source={require('./logo.png')}  // Use uploaded logo
          style={styles.logo}
        />
        <Text style={styles.title}>BGS</Text>
        <Text style={styles.eyy}>TRANSCO</Text>

        <View style={styles.busesContainer}>
          <Image 
            source={require('./jeep.png')}  // Use uploaded bus image
            style={styles.busImage}
          />
        </View>
      </View>

      {/* Lower section with text and button */}
      <View style={styles.lowerContainer}>
        <Text style={styles.subTitle}>E-Jeepney</Text>
        <Text style={styles.description}>
          Start using E-Jeepney for convenient and fast journeys.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.buttonText} >Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  container: {
    marginTop: -85,
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upperContainer: {
    backgroundColor: '#85AFFF',
    width: '100%',
    height: '39%',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logo: {
    marginTop: 5,
    width: 40,
    height: 40,
    marginBottom: 15,
    left: -45
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    right:-2,
    marginTop: -58,
    fontSize: 18,
    
    color: '#fff',
    textAlign: 'left',
  },
  eyy: {
    fontFamily: 'Poppins_700Bold',
    right:-26,
    marginTop: -13,
    fontSize: 18,
    color: '#fff',
    textAlign: 'left',
  },
  busesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  busImage: {
    marginTop: 10,
    width: 280,
    height: 180,
    resizeMode: 'contain',
  },
  lowerContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  subTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    marginTop: 40,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontFamily: 'Poppins_400Regular',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GetStartedScreen;

// import React from 'react';
// import { View, Text, Button } from 'react-native';

// const GetStartedScreen = ({ navigation }) => {
//   return (
//     <View>
//       <Text>Get Started Screen</Text>
//       <Button 
//         title="Get Started" 
//         onPress={() => navigation.navigate('Login')} // Navigate to the Login screen
//       />
//     </View>
//   );
// };

// export default GetStartedScreen;
