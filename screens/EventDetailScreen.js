import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chi tiết sự kiện</Text>
      <Text style={styles.meta}>ID: {eventId}</Text>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#fff' }}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F7FB' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#666', marginBottom: 12 },
  backBtn: { marginTop: 12, backgroundColor: '#8E2DE2', padding: 10, borderRadius: 8 },
});
