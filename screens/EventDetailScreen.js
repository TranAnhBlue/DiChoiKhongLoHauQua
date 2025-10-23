import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'events', eventId));
        if (snap.exists() && mounted) setEvent({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.log('Error loading event detail', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [eventId]);

  if (loading) return (
    <View style={styles.container}><ActivityIndicator size="large" color="#8E2DE2" /></View>
  );

  if (!event) return (
    <View style={styles.container}><Text>Không tìm thấy sự kiện.</Text></View>
  );

  const lat = event.location?.lat;
  const lng = event.location?.lng;

  const openDirections = () => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(err => console.log('Linking error', err));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>{event.category} • {event.description}</Text>

      {lat && lng ? (
        <MapView style={{ height: 200, marginTop: 12 }} initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
          <Marker coordinate={{ latitude: lat, longitude: lng }} title={event.title} />
        </MapView>
      ) : null}

      <TouchableOpacity style={styles.backBtn} onPress={openDirections}>
        <Text style={{ color: '#fff' }}>🧭 Chỉ đường</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.backBtn, { marginTop: 8 }]} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#fff' }}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

EventDetailScreen.propTypes = {
  route: PropTypes.shape({ params: PropTypes.object }),
  navigation: PropTypes.shape({ goBack: PropTypes.func.isRequired }).isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F7FB' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#666', marginBottom: 12 },
  backBtn: { marginTop: 12, backgroundColor: '#8E2DE2', padding: 10, borderRadius: 8 },
});
