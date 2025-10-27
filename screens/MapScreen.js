import * as Location from "expo-location";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { EVENT_CATEGORIES, getLiveEventsNearby } from "../services/events";
import { getLocationsNearby, LOCATION_CATEGORIES } from "../services/locations";
// Cập nhật import này để trỏ đến file DetailModal đã chỉnh sửa
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DetailModal from "./DetailScreen";

export default function MapScreen({ navigation, route }) {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState("standard");
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [coordsText, setCoordsText] = useState(null);
  const [focusedItemId, setFocusedItemId] = useState(null);
  const mapRef = useRef(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({
    events: [],
    locations: [],
  });
  const [showEvents, setShowEvents] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);

  // Fetch both events and locations
  const fetchNearbyItems = async (center) => {
    try {
      setCoordsText(
        `${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`
      );

      // Fetch events
      if (showEvents) {
        const eventFilter =
          selectedCategories.events.length > 0
            ? selectedCategories.events[0]
            : null;
        const nearbyEvents = await getLiveEventsNearby(
          { latitude: center.latitude, longitude: center.longitude },
          radiusKm,
          eventFilter
        );
        setEvents(nearbyEvents);
      } else {
        setEvents([]);
      }

      // Fetch locations
      if (showLocations) {
        const locationFilter =
          selectedCategories.locations.length > 0
            ? selectedCategories.locations[0]
            : null;
        const nearbyLocations = await getLocationsNearby(
          { latitude: center.latitude, longitude: center.longitude },
          radiusKm,
          locationFilter
        );
        setLocations(nearbyLocations);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.log("Error in fetchNearbyItems", err);
    }
  };

  const handleLocateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần quyền vị trí để định vị bạn.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const r = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setRegion(r);
      try {
        mapRef.current?.animateToRegion?.(r, 600);
      } catch (error_) {
        console.log("animateToRegion error", error_);
      }
      await fetchNearbyItems(r);
    } catch (error_) {
      console.log("Locate me error", error_);
    }
  };
  const handleMarkerPress = (item) => {
    console.log("=== MARKER PRESSED ===");
    console.log("Item ID:", item.id);
    console.log("Item Type:", item.markerType);

    if (showDetailModal) {
      setShowDetailModal(false);
    }

    const newSelectedItem = {
      id: item.id,
      type: item.markerType,
    };

    setSelectedItem(newSelectedItem);

    setTimeout(() => {
      setShowDetailModal(true);
    }, 100);
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let initialRegion;

        if (status !== "granted") {
          console.log("Permission to access location was denied");
          initialRegion = {
            latitude: 21.0278,
            longitude: 105.8342,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          };
        } else {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });
          initialRegion = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
        }

        setRegion(initialRegion);
        await fetchNearbyItems(initialRegion);
        setLoading(false);
      } catch (e) {
        console.log("Location error", e);
        const fallback = {
          latitude: 21.0278,
          longitude: 105.8342,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        setRegion(fallback);
        await fetchNearbyItems(fallback);
        setLoading(false);
      }
    })();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (region && !loading) {
      fetchNearbyItems(region);
    }
  }, [selectedCategories, showEvents, showLocations, radiusKm]);

  // Handle category toggle
  const toggleCategory = (type, category) => {
    setSelectedCategories((prev) => {
      const current = prev[type];
      const newCategories = current.includes(category)
        ? current.filter((c) => c !== category)
        : [category]; // Only one category at a time for simplicity
      return { ...prev, [type]: newCategories };
    });
  };

  // Get all markers to display
  const allMarkers = [
    ...events.map((e) => ({ ...e, markerType: "event" })),
    ...locations.map((l) => ({ ...l, markerType: "location" })),
  ];

  if (loading || !region) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8E2DE2" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          mapType={mapType}
        >
          {allMarkers.map((item) => (
            <Marker
              key={`${item.markerType}-${item.id}`}
              pinColor={
                item.id === focusedItemId
                  ? "#FF0000"
                  : item.markerType === "event"
                  ? "#8E2DE2"
                  : "#28A745"
              }
              coordinate={{
                latitude: item.location.lat,
                longitude: item.location.lng,
              }}
              title={item.markerType === "event" ? item.title : item.name}
              description={item.category}
              onPress={() => handleMarkerPress(item)}
            />
          ))}
        </MapView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sự kiện, địa điểm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>🎯</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>

              {/* Show/Hide toggles */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Hiển thị:</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      showEvents && styles.toggleButtonActive,
                    ]}
                    onPress={() => setShowEvents(!showEvents)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        showEvents && styles.toggleTextActive,
                      ]}
                    >
                      🎉 Sự kiện
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      showLocations && styles.toggleButtonActive,
                    ]}
                    onPress={() => setShowLocations(!showLocations)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        showLocations && styles.toggleTextActive,
                      ]}
                    >
                      📌 Địa điểm
                    </Text>
                  </TouchableOpacity>
                </View>
                r
              </View>

              {/* Radius selector */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Bán kính tìm kiếm:
                </Text>
                <View style={styles.radiusRow}>
                  {[5, 10, 15, 20].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.radiusButton,
                        radiusKm === r && styles.radiusButtonActive,
                      ]}
                      onPress={() => setRadiusKm(r)}
                    >
                      <Text
                        style={[
                          styles.radiusText,
                          radiusKm === r && styles.radiusTextActive,
                        ]}
                      >
                        {r}km
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Event categories */}
              {showEvents && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Loại sự kiện:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryRow}>
                      <TouchableOpacity
                        style={[
                          styles.categoryChip,
                          selectedCategories.events.length === 0 &&
                            styles.categoryChipActive,
                        ]}
                        onPress={() =>
                          setSelectedCategories((prev) => ({
                            ...prev,
                            events: [],
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            selectedCategories.events.length === 0 &&
                              styles.categoryTextActive,
                          ]}
                        >
                          Tất cả
                        </Text>
                      </TouchableOpacity>
                      {Object.entries(EVENT_CATEGORIES).map(([key, value]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.categoryChip,
                            selectedCategories.events.includes(value) &&
                              styles.categoryChipActive,
                          ]}
                          onPress={() => toggleCategory("events", value)}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              selectedCategories.events.includes(value) &&
                                styles.categoryTextActive,
                            ]}
                          >
                            {value}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Location categories */}
              {showLocations && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Loại địa điểm:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryRow}>
                      <TouchableOpacity
                        style={[
                          styles.categoryChip,
                          selectedCategories.locations.length === 0 &&
                            styles.categoryChipActive,
                        ]}
                        onPress={() =>
                          setSelectedCategories((prev) => ({
                            ...prev,
                            locations: [],
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            selectedCategories.locations.length === 0 &&
                              styles.categoryTextActive,
                          ]}
                        >
                          Tất cả
                        </Text>
                      </TouchableOpacity>
                      {Object.entries(LOCATION_CATEGORIES).map(
                        ([key, value]) => (
                          <TouchableOpacity
                            key={key}
                            style={[
                              styles.categoryChip,
                              selectedCategories.locations.includes(value) &&
                                styles.categoryChipActive,
                            ]}
                            onPress={() => toggleCategory("locations", value)}
                          >
                            <Text
                              style={[
                                styles.categoryText,
                                selectedCategories.locations.includes(value) &&
                                  styles.categoryTextActive,
                              ]}
                            >
                              {value}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setSelectedCategories({ events: [], locations: [] });
                    setRadiusKm(10);
                    setShowEvents(true);
                    setShowLocations(true);
                  }}
                >
                  <Text style={styles.modalButtonText}>Đặt lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.modalButtonTextPrimary,
                    ]}
                  >
                    Áp dụng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <DetailModal
          isVisible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedItem(null); // Reset khi đóng
          }}
          eventId={selectedItem?.type === "event" ? selectedItem.id : null}
          locationId={
            selectedItem?.type === "location" ? selectedItem.id : null
          }
        />
      </View>
    </GestureHandlerRootView>
  );
}

MapScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FB" },
  map: { flex: 1 },

  // Search bar
  searchContainer: {
    position: "absolute",
    top: 30,
    left: 12,
    right: 12,
    flexDirection: "row",
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    marginLeft: 8,
    backgroundColor: "#8E2DE2",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: { fontSize: 20 },

  // Controls
  controls: {
    position: "absolute",
    top: 120,
    left: 12,
    alignItems: "flex-start",
    zIndex: 5,
  },
  pickerRow: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerLabel: { marginRight: 8, fontSize: 13, fontWeight: "600" },
  segmentGroup: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  segmentButton: { paddingVertical: 6, paddingHorizontal: 10 },
  segmentLeft: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  segmentMiddle: {},
  segmentRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  segmentButtonActive: { backgroundColor: "#8E2DE2" },
  segmentText: { color: "#666", fontSize: 12 },
  segmentTextActive: { color: "#fff", fontWeight: "700" },

  backBtn: {
    marginTop: 8,
    backgroundColor: "#8E2DE2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locateBtn: {
    backgroundColor: "#28A745",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Overlay
  overlay: {
    position: "absolute",
    bottom: 20,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  overlayText: {
    color: "#fff",
    fontSize: 13,
    marginVertical: 2,
    fontWeight: "500",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },

  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#555",
  },

  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#8E2DE2",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  toggleTextActive: {
    color: "#fff",
  },

  radiusRow: {
    flexDirection: "row",
    gap: 10,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  radiusButtonActive: {
    backgroundColor: "#28A745",
  },
  radiusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  radiusTextActive: {
    color: "#fff",
  },

  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryChipActive: {
    backgroundColor: "#8E2DE2",
    borderColor: "#8E2DE2",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  categoryTextActive: {
    color: "#fff",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#8E2DE2",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalButtonTextPrimary: {
    color: "#fff",
  },
});
