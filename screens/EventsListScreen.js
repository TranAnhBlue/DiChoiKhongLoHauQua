import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

const mockEvents = [
  { id: '1', title: 'Lễ hội ẩm thực', category: 'Food', location: 'Hà Nội' },
  { id: '2', title: 'Hội chợ sách', category: 'Books', location: 'Hồ Chí Minh' },
];

export default function EventsListScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách sự kiện</Text>

      <FlatList
        data={mockEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.category} • {item.location}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('Map')}>
        <Text style={{ color: '#fff' }}>Mở bản đồ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F7FB' },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 12 },
  item: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 12, color: '#666', marginTop: 6 },
  mapBtn: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#8E2DE2', padding: 12, borderRadius: 24 },
});
