import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getLiveEventsNearby, getEventById } from '../services/events';

export default function MapScreen({ navigation, route }) {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('standard');
  const [events, setEvents] = useState([]);
  const [coordsText, setCoordsText] = useState(null);
  const [focusedEventId, setFocusedEventId] = useState(null);
  const mapRef = useRef(null);

  const fetchNearby = async (center) => {
    try {
      const nearby = await getLiveEventsNearby({ latitude: center.latitude, longitude: center.longitude }, 10);
      setEvents(nearby);
      setCoordsText(`${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`);
    } catch (err) {
      console.log('Error in fetchNearby', err);
    }
  };

  const handleLocateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Cần quyền vị trí để định vị bạn.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const r = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 };
      setRegion(r);
      try {
        mapRef.current?.animateToRegion?.(r, 600);
      } catch (error_) {
        // ignore animate errors on some Android map implementations
        console.log('animateToRegion error', error_);
      }
      await fetchNearby(r);
    } catch (error_) {
      console.log('Locate me error', error_);
    }
  };

  useEffect(() => {
    // initial mount behavior handled below — keep initial location/fallback logic

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
          } catch (error_) {
            console.log('Error fetching nearby events (fallback)', error_);
          }
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
  const r = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setRegion(r);
        try {
          await fetchNearby(r);
        } catch (error_) {
          console.log('Error fetching nearby events', error_);
          setCoordsText(`${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}`);
        }
        setLoading(false);
      } catch (e) {
        console.log('Location error', e);
        const fallback = { latitude: 21.0278, longitude: 105.8342, latitudeDelta: 0.1, longitudeDelta: 0.1 };
        setRegion(fallback);
        try {
          await fetchNearby(fallback);
        } catch (error_) {
          console.log('Error fetching nearby events (catch)', error_);
        }
        setLoading(false);
      }
    })();
  }, []);

  // respond to route param changes (e.g., navigating from EventsList -> Map while Map is mounted)
  useEffect(() => {
    const c = route?.params?.center;
    const focusId = route?.params?.focusEventId;
    if (!c) return;
    const intended = { latitude: c.latitude, longitude: c.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 };
    setRegion(intended);
    try {
      mapRef.current?.animateToRegion?.(intended, 600);
    } catch (err) {
      console.log('animateToRegion error (route update)', err);
    }
    // fetch nearby events and also ensure the focused event is present in the markers
    (async () => {
      try {
        const nearby = await fetchNearby(intended);
        if (focusId) {
          // if the focused event isn't in nearby, try fetching it directly and add it
          const found = nearby.find((ev) => ev.id === focusId);
          if (!found) {
            const ev = await getEventById(focusId);
            if (ev && ev.location?.lat != null && ev.location?.lng != null) {
              // attach a large distance to show it separately if needed
              ev.distanceMeters = ev.distanceMeters ?? 0;
              nearby.unshift(ev);
              setEvents((prev) => {
                // avoid duplicate ids
                const others = prev.filter((p) => p.id !== ev.id);
                return [ev, ...others];
              });
            }
          } else {
            setEvents(nearby);
          }
          setFocusedEventId(focusId);
        } else {
          setEvents(nearby);
        }
      } catch (error_) {
        console.log('fetchNearby (route update) error', error_);
      }
    })();
    // clear params so repeated navigations aren't ignored
    if (navigation && typeof navigation.setParams === 'function') {
      navigation.setParams({ center: undefined, focusEventId: undefined });
    }
  }, [route?.params?.center, route?.params?.focusEventId]);

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
              pinColor={e.id === focusedEventId ? '#FFA500' : undefined}
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
          <Text style={styles.pickerLabel}>Kiểu bản đồ:</Text>
          <View style={styles.segmentGroup}>
            <TouchableOpacity
              style={[styles.segmentButton, styles.segmentLeft, mapType === 'standard' && styles.segmentButtonActive]}
              onPress={() => setMapType('standard')}
            >
              <Text style={[styles.segmentText, mapType === 'standard' && styles.segmentTextActive]}>Standard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, styles.segmentMiddle, mapType === 'satellite' && styles.segmentButtonActive]}
              onPress={() => setMapType('satellite')}
            >
              <Text style={[styles.segmentText, mapType === 'satellite' && styles.segmentTextActive]}>Satellite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, styles.segmentRight, mapType === 'hybrid' && styles.segmentButtonActive]}
              onPress={() => setMapType('hybrid')}
            >
              <Text style={[styles.segmentText, mapType === 'hybrid' && styles.segmentTextActive]}>Hybrid</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff' }}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backBtn, { marginTop: 8 }]} onPress={() => region && fetchNearby(region)}>
          <Text style={{ color: '#fff' }}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.locateBtn, { marginTop: 8 }]} onPress={handleLocateMe}>
          <Text style={{ color: '#fff' }}>Định vị tôi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

MapScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    setParams: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      center: PropTypes.shape({ latitude: PropTypes.number, longitude: PropTypes.number }),
      focusEventId: PropTypes.string,
    }),
  }),
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FB' },
  map: { flex: 1 },
  controls: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'flex-start' },
  pickerRow: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  pickerLabel: { marginRight: 8, alignSelf: 'center', fontSize: 14 },
  picker: { height: 40, width: 140, alignSelf: 'center' },
  segmentRow: { flexDirection: 'row', alignItems: 'center' },
  segmentGroup: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  segmentButton: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'transparent' },
  segmentLeft: { borderRightWidth: 1, borderRightColor: '#eee' },
  segmentMiddle: { borderRightWidth: 1, borderRightColor: '#eee' },
  segmentRight: {},
  segmentButtonActive: { backgroundColor: '#8E2DE2' },
  segmentText: { color: '#333' },
  segmentTextActive: { color: '#fff', fontWeight: '700' },
  backBtn: { marginTop: 8, backgroundColor: '#8E2DE2', padding: 10, borderRadius: 8 },
  locateBtn: { marginTop: 8, backgroundColor: '#28A745', padding: 10, borderRadius: 8 },
  overlay: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8 },
  overlayText: { color: '#fff', fontSize: 12 },
});
