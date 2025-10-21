import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getLiveEventsNearby } from '../services/events';

export default function MapScreen({ navigation }) {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('standard');
  const [events, setEvents] = useState([]);
  const [coordsText, setCoordsText] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          // fallback to default region (Hanoi)
          const fallback = { latitude: 21.0278, longitude: 105.8342, latitudeDelta: 0.1, longitudeDelta: 0.1 };
          setRegion(fallback);
          try {
            const nearby = await getLiveEventsNearby({ latitude: fallback.latitude, longitude: fallback.longitude }, 10);
            setEvents(nearby);
            setCoordsText(`${fallback.latitude.toFixed(6)}, ${fallback.longitude.toFixed(6)}`);
          } catch (ee) {
            console.log('Error fetching nearby events (fallback)', ee);
          }
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const r = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setRegion(r);
        try {
          const nearby = await getLiveEventsNearby({ latitude: r.latitude, longitude: r.longitude }, 10);
          setEvents(nearby);
          setCoordsText(`${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}`);
        } catch (e) {
          console.log('Error fetching nearby events', e);
          setCoordsText(`${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}`);
        }
        setLoading(false);
      } catch (e) {
        console.log('Location error', e);
        const fallback = { latitude: 21.0278, longitude: 105.8342, latitudeDelta: 0.1, longitudeDelta: 0.1 };
        setRegion(fallback);
        try {
          const nearby = await getLiveEventsNearby({ latitude: fallback.latitude, longitude: fallback.longitude }, 10);
          setEvents(nearby);
          setCoordsText(`${fallback.latitude.toFixed(6)}, ${fallback.longitude.toFixed(6)}`);
        } catch (ee) {
          console.log('Error fetching nearby events (catch)', ee);
        }
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !region) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8E2DE2" />
        <Text style={{ marginTop: 12 }}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        mapType={mapType}
      >
        {events.map((e) => (
          <Marker
            key={e.id}
            coordinate={{ latitude: e.location.lat, longitude: e.location.lng }}
            title={e.title}
            description={e.category}
            onPress={() => navigation.navigate('EventDetail', { eventId: e.id })}
          />
        ))}
      </MapView>

      {/* overlay showing coords and number of events */}
      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.overlayText}>Vị trí: {coordsText ?? '...'}</Text>
        <Text style={styles.overlayText}>Sự kiện tìm thấy: {events.length}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.pickerRow}>
          <Text style={{ marginRight: 8 }}>Kiểu bản đồ:</Text>
          {/* Picker has different import behavior on iOS/Android; using simple conditional UI */}
          <Picker
            selectedValue={mapType}
            style={styles.picker}
            onValueChange={(itemValue) => setMapType(itemValue)}
          >
            <Picker.Item label="Standard" value="standard" />
            <Picker.Item label="Satellite" value="satellite" />
            <Picker.Item label="Hybrid" value="hybrid" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FB' },
  map: { flex: 1 },
  controls: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'flex-start' },
  pickerRow: { backgroundColor: '#fff', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  picker: { height: 40, width: 180 },
  backBtn: { marginTop: 8, backgroundColor: '#8E2DE2', padding: 10, borderRadius: 8 },
  overlay: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8 },
  overlayText: { color: '#fff', fontSize: 12 },
});
