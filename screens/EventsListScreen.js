import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getUpcomingEvents } from '../services/events';

export default function EventsListScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const items = await getUpcomingEvents(50);
        console.log('Loaded events:', items.length);
        if (mounted) setEvents(items);
      } catch (err) {
        console.log('Error loading events list', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8E2DE2" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách sự kiện</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ marginRight: 12 }}>Tổng: {events.length}</Text>
        <TouchableOpacity onPress={async () => {
          setLoading(true);
          try {
            const items = await getUpcomingEvents(50);
            console.log('Manual reload events:', items.length);
            setEvents(items);
          } catch (err) {
            console.log('Reload error', err);
          } finally {
            setLoading(false);
          }
        }}>
          <Text style={{ color: '#8E2DE2' }}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }}>
          <Text>Không tìm thấy sự kiện. Thử nhấn Refresh hoặc tạo event demo trong Profile.</Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Debug: kiểm tra dữ liệu raw dưới đây</Text>
          <Text style={{ marginTop: 8, fontFamily: 'monospace' }}>{JSON.stringify(events, null, 2)}</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.category} • {item.location?.address || (item.location?.lat && item.location?.lng ? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}` : '')}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Map', { center: { latitude: item.location?.lat, longitude: item.location?.lng }, focusEventId: item.id })}>
                  <Text style={{ color: '#8E2DE2' }}>📍 Định vị</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
                  <Text style={{ color: '#8E2DE2' }}>🔍 Xem chi tiết</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('Map')}>
        <Text style={{ color: '#fff' }}>Mở bản đồ</Text>
      </TouchableOpacity>
    </View>
  );
}

EventsListScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F7FB' },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 12 },
  item: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 12, color: '#666', marginTop: 6 },
  mapBtn: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#8E2DE2', padding: 12, borderRadius: 24 },
});
