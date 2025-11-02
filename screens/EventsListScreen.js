import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getUpcomingEvents } from "../services/events";

// Helper function to format timestamp
const formatEventDate = (timestamp) => {
  if (!timestamp) return "Chưa xác định";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Chưa xác định";
  }
};

export default function EventsListScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load events function
  const loadEvents = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const items = await getUpcomingEvents(50);
      console.log("📋 Loaded events:", items.length);

      setEvents(items);
    } catch (err) {
      console.error("❌ Error loading events:", err);
      setError(err.message || "Không thể tải danh sách sự kiện");
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents(false);
  }, [loadEvents]);

  // Navigate to map with event location
  const navigateToMap = useCallback(
    (item) => {
      if (!item.location?.lat || !item.location?.lng) {
        console.warn("Event missing location data");
        return;
      }

      console.log("📍 Navigating to map with event:", item.id);

      // Pass the full event data to ensure MapScreen has it immediately
      navigation.navigate("Map", {
        center: {
          latitude: item.location.lat,
          longitude: item.location.lng,
        },
        focusEventId: item.id,
        autoOpenDetail: true,
        // Pass the event data directly to avoid race condition
        eventData: {
          id: item.id,
          title: item.title,
          category: item.category,
          location: item.location,
          address: item.address,
          description: item.description,
        },
      });
    },
    [navigation]
  );

  // Navigate to event detail
  const navigateToDetail = useCallback(
    (eventId) => {
      navigation.navigate("EventDetail", { eventId });
    },
    [navigation]
  );

  // Render event item
  const renderEventItem = useCallback(
    ({ item }) => {
      const hasValidLocation = item.location?.lat && item.location?.lng;

      return (
        <View style={styles.eventCard}>
          {/* Title */}
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title || "Chưa có tiêu đề"}
          </Text>

          {/* Category & Address */}
          <View style={styles.metaRow}>
            <Text style={styles.categoryBadge}>{item.category}</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address || "Chưa có địa chỉ"}
            </Text>
          </View>

          {/* Time */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏰</Text>
            <Text style={styles.infoText} numberOfLines={1}>
              {formatEventDate(item.startAt)}
            </Text>
          </View>

          {/* Price */}
          {item.ticketPrice && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text style={styles.priceText}>{item.ticketPrice}</Text>
            </View>
          )}

          {/* Organizer */}
          {item.organizer && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👥</Text>
              <Text style={styles.infoText} numberOfLines={1}>
                {item.organizer}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {hasValidLocation && (
              <TouchableOpacity
                style={[styles.actionButton, styles.locationButton]}
                onPress={() => navigateToMap(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>📍 Định vị</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [navigateToMap, navigateToDetail]
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8E2DE2" />
        <Text style={styles.loadingText}>Đang tải sự kiện...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadEvents()}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách sự kiện</Text>
        <Text style={styles.headerSubtitle}>Tổng: {events.length} sự kiện</Text>
      </View>

      {/* Events list */}
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Chưa có sự kiện</Text>
          <Text style={styles.emptyMessage}>
            Hiện tại chưa có sự kiện nào sắp diễn ra.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>🔄 Làm mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#8E2DE2"]}
              tintColor="#8E2DE2"
            />
          }
        />
      )}
    </View>
  );
}

EventsListScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F7F7FB",
  },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },

  // Event card
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    lineHeight: 24,
  },

  // Meta row
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "#8E2DE2",
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
    width: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#3A3A3C",
    fontWeight: "500",
  },
  priceText: {
    flex: 1,
    fontSize: 14,
    color: "#8E2DE2",
    fontWeight: "700",
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  locationButton: {
    backgroundColor: "#F0F0F5",
  },
  detailButton: {
    backgroundColor: "#8E2DE2",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  // Loading
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },

  // Error
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF3B30",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#8E2DE2",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: "#F0F0F5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: "#8E2DE2",
    fontSize: 15,
    fontWeight: "600",
  },

  // Floating map button
  mapButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#8E2DE2",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
