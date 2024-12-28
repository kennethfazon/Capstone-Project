import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import Mapbox from '@rnmapbox/maps';

// Set your Mapbox access token
Mapbox.setAccessToken('pk.eyJ1IjoicmljYXJkb2pyIiwiYSI6ImNtMjAwN2hubzBjdTUyanNmZDNobjlwdnMifQ.dByj0fl6cgi8yoYTbx9VfA');

const Map = ({ route }) => {
  const { latitude, longitude } = route.params;

  if (!latitude || !longitude) {
    return (
      <SafeAreaView style={styles.page}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Invalid coordinates</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <Mapbox.MapView 
        styleURL="mapbox://styles/mapbox/streets-v11"
        style={styles.map}
      >
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={[longitude, latitude]} // Center the map on the coordinates
        />
        <Mapbox.PointAnnotation
          id="jeepLocation"
          coordinate={[longitude, latitude]} // Mark the jeep's location
        />
      </Mapbox.MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    flex: 1,
  },
});
export default Map;


