import * as Location from "expo-location";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker } from "react-native-maps";
import { EVENT_CATEGORIES, getAllEventsNearby } from "../services/events";
import { getLocationsNearby, LOCATION_CATEGORIES } from "../services/locations";
import DetailModal from "./DetailScreen";

// Constants
const DEFAULT_REGION = {
  latitude: 21.0124,
  longitude: 105.5258,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MARKER_COLORS = {
  event: "#8E2DE2",
  location: "#28A745",
  focused: "#FF3B30",
};

const MARKER_SCALE = {
  normal: 1.0,
  focused: 1.5,
};

const ANIMATION_DELAYS = {
  MAP_INITIAL: 300,
  CALLOUT: 400,
  MODAL: 500,
};

export default function MapScreen({ navigation, route }) {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [focusedItemId, setFocusedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({
    events: [],
    locations: [],
  });
  const [showEvents, setShowEvents] = useState(true);
  const [showLocations, setShowLocations] = useState(true);

  const mapRef = useRef(null);
  const hasAutoOpenedDetail = useRef(false);
  const markerRefs = useRef({});
  const animationTimeouts = useRef([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      animationTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  // Calculate radius from map zoom level
  const calculateRadius = useCallback((regionData) => {
    const radiusKm = (regionData.latitudeDelta * 111) / 2;
    return Math.max(1, Math.min(radiusKm, 50));
  }, []);

  // Fetch nearby items
  const fetchNearbyItems = useCallback(
    async (center, regionData = null) => {
      try {
        const dynamicRadius = regionData ? calculateRadius(regionData) : 10;
        const fetchPromises = [];

        if (showEvents) {
          const eventFilter = selectedCategories.events[0] || null;
          fetchPromises.push(
            getAllEventsNearby(
              { latitude: center.latitude, longitude: center.longitude },
              dynamicRadius,
              eventFilter
            )
          );
        } else {
          fetchPromises.push(Promise.resolve([]));
        }

        if (showLocations) {
          const locationFilter = selectedCategories.locations[0] || null;
          fetchPromises.push(
            getLocationsNearby(
              { latitude: center.latitude, longitude: center.longitude },
              dynamicRadius,
              locationFilter
            )
          );
        } else {
          fetchPromises.push(Promise.resolve([]));
        }

        const [nearbyEvents, nearbyLocations] = await Promise.all(
          fetchPromises
        );

        setEvents(nearbyEvents);
        setLocations(nearbyLocations);
      } catch (error) {
        console.error("Error fetching items:", error);
        setEvents([]);
        setLocations([]);
      }
    },
    [showEvents, showLocations, selectedCategories, calculateRadius]
  );

  // Get user location
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập vị trí",
          "Ứng dụng cần quyền truy cập vị trí để hiển thị các sự kiện gần bạn."
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  }, []);

  // Handle locate me button
  const handleLocateMe = useCallback(async () => {
    const userRegion = await getUserLocation();

    if (userRegion) {
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 600);
      await fetchNearbyItems(userRegion, userRegion);
    }
  }, [getUserLocation, fetchNearbyItems]);

  // Handle map region change
  const handleRegionChangeComplete = useCallback(
    async (newRegion) => {
      setRegion(newRegion);
      await fetchNearbyItems(newRegion, newRegion);
    },
    [fetchNearbyItems]
  );

  // Show marker callout
  const showMarkerCallout = useCallback((markerKey) => {
    if (markerRefs.current[markerKey]) {
      markerRefs.current[markerKey].showCallout();
    }
  }, []);

  // Handle marker press
  const handleMarkerPress = useCallback(
    (item) => {
      setFocusedItemId(item.id);
      setShowDetailModal(false);

      const newSelectedItem = {
        id: item.id,
        type: item.markerType,
      };

      setSelectedItem(newSelectedItem);

      const markerKey = `${item.markerType}-${item.id}`;

      // Show callout immediately
      showMarkerCallout(markerKey);

      // Open modal with minimal delay
      const timeout = setTimeout(() => setShowDetailModal(true), 50);
      animationTimeouts.current.push(timeout);
    },
    [showMarkerCallout]
  );

  // Handle search result item press
  const handleSearchResultPress = useCallback(
    (item) => {
      // Close search results
      setShowSearchResults(false);
      Keyboard.dismiss();

      // Animate to item location
      const targetRegion = {
        latitude: item.location.lat,
        longitude: item.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current?.animateToRegion(targetRegion, 800);
      setRegion(targetRegion);

      // Set focused item
      setFocusedItemId(item.id);
      setSelectedItem({
        id: item.id,
        type: item.markerType,
      });

      // Show marker callout and detail modal
      const markerKey = `${item.markerType}-${item.id}`;
      const timeout1 = setTimeout(() => {
        showMarkerCallout(markerKey);

        const timeout2 = setTimeout(() => {
          setShowDetailModal(true);
        }, 200);
        animationTimeouts.current.push(timeout2);
      }, 900);
      animationTimeouts.current.push(timeout1);
    },
    [showMarkerCallout]
  );

  // Handle close detail modal
  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedItem(null);

    if (hasAutoOpenedDetail.current) {
      setFocusedItemId(null);
      hasAutoOpenedDetail.current = false;

      if (route?.params?.autoOpenDetail) {
        navigation.setParams({
          autoOpenDetail: false,
          focusEventId: null,
        });
      }
    }
  }, [route?.params, navigation]);

  // Refocus on event
  const refocusOnEvent = useCallback(() => {
    if (focusedItemId && events.length > 0) {
      const focusedEvent = events.find((e) => e.id === focusedItemId);

      if (focusedEvent?.location?.lat && focusedEvent?.location?.lng) {
        const targetRegion = {
          latitude: focusedEvent.location.lat,
          longitude: focusedEvent.location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        mapRef.current?.animateToRegion(targetRegion, 1000);
        setRegion(targetRegion);

        const markerKey = `event-${focusedItemId}`;
        const timeout = setTimeout(() => {
          showMarkerCallout(markerKey);
        }, 1100);
        animationTimeouts.current.push(timeout);
      }
    }
  }, [focusedItemId, events, showMarkerCallout]);

  const filterBySearch = useCallback(
    (items, type) => {
      if (!searchQuery.trim()) return items;

      const query = searchQuery.toLowerCase().trim();

      return items.filter((item) => {
        const searchFields =
          type === "event"
            ? [item.title, item.description, item.category, item.address]
            : [item.name, item.description, item.category, item.address];

        return searchFields.some((field) =>
          field?.toLowerCase().includes(query)
        );
      });
    },
    [searchQuery]
  );

  // Toggle category filter
  const toggleCategory = useCallback((type, category) => {
    setSelectedCategories((prev) => {
      const current = prev[type];
      const newCategories = current.includes(category)
        ? current.filter((c) => c !== category)
        : [category];
      return { ...prev, [type]: newCategories };
    });
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedCategories({ events: [], locations: [] });
    setShowEvents(true);
    setShowLocations(true);
    setSearchQuery("");
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    setShowSearchResults(text.trim().length > 0);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setShowSearchResults(false);
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        let initialRegion;
        let targetEventId = null;
        let preloadedEventData = null;

        if (route?.params?.center) {
          const { latitude, longitude } = route.params.center;
          if (latitude && longitude) {
            initialRegion = {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };

            if (route?.params?.focusEventId) {
              targetEventId = route.params.focusEventId;
              preloadedEventData = route.params.eventData; // Get preloaded data

              if (isMounted) {
                setFocusedItemId(targetEventId);
                hasAutoOpenedDetail.current = false;
              }
            }
          }
        }

        if (!initialRegion) {
          initialRegion = await getUserLocation();
        }

        if (!initialRegion) {
          initialRegion = DEFAULT_REGION;
        }

        if (!isMounted) return;

        setRegion(initialRegion);
        await fetchNearbyItems(initialRegion, initialRegion);

        if (!isMounted) return;

        setLoading(false);

        if (targetEventId && mapRef.current) {
          const timeout1 = setTimeout(() => {
            if (!isMounted) return;
            mapRef.current?.animateToRegion(initialRegion, 800);

            const markerKey = `event-${targetEventId}`;
            const timeout2 = setTimeout(() => {
              if (!isMounted) return;
              showMarkerCallout(markerKey);
            }, ANIMATION_DELAYS.CALLOUT);
            animationTimeouts.current.push(timeout2);
          }, ANIMATION_DELAYS.MAP_INITIAL);
          animationTimeouts.current.push(timeout1);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (isMounted) {
          setRegion(DEFAULT_REGION);
          await fetchNearbyItems(DEFAULT_REGION, DEFAULT_REGION);
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [route?.params, getUserLocation, fetchNearbyItems, showMarkerCallout]);

  useEffect(() => {
    if (
      !loading &&
      focusedItemId &&
      !hasAutoOpenedDetail.current &&
      route?.params?.autoOpenDetail
    ) {
      // First check if we have preloaded event data
      const preloadedEventData = route.params.eventData;

      // Try to find the event in loaded events
      const focusedEvent = events.find((e) => e.id === focusedItemId);

      // Use either the found event or preloaded data
      if (focusedEvent || preloadedEventData) {
        hasAutoOpenedDetail.current = true;

        setSelectedItem({
          id: focusedItemId,
          type: "event",
        });

        const markerKey = `event-${focusedItemId}`;
        showMarkerCallout(markerKey);

        const timeout = setTimeout(() => {
          setShowDetailModal(true);
        }, ANIMATION_DELAYS.MODAL);
        animationTimeouts.current.push(timeout);
      }
    }
  }, [
    loading,
    events,
    focusedItemId,
    route?.params?.autoOpenDetail,
    route?.params?.eventData,
    showMarkerCallout,
  ]);

  // Auto-open detail modal
  useEffect(() => {
    if (
      !loading &&
      events.length > 0 &&
      focusedItemId &&
      !hasAutoOpenedDetail.current &&
      route?.params?.autoOpenDetail
    ) {
      const focusedEvent = events.find((e) => e.id === focusedItemId);

      if (focusedEvent) {
        hasAutoOpenedDetail.current = true;

        setSelectedItem({
          id: focusedItemId,
          type: "event",
        });

        const markerKey = `event-${focusedItemId}`;
        showMarkerCallout(markerKey);

        const timeout = setTimeout(() => {
          setShowDetailModal(true);
        }, ANIMATION_DELAYS.MODAL);
        animationTimeouts.current.push(timeout);
      }
    }
  }, [
    loading,
    events,
    focusedItemId,
    route?.params?.autoOpenDetail,
    showMarkerCallout,
  ]);

  // Fetch on filter change
  useEffect(() => {
    if (region && !loading) {
      fetchNearbyItems(region, region);
    }
  }, [
    selectedCategories,
    showEvents,
    showLocations,
    region,
    loading,
    fetchNearbyItems,
  ]);

  // Memoized filtered data
  const filteredEvents = filterBySearch(events, "event");
  const filteredLocations = filterBySearch(locations, "location");

  const allMarkers = [
    ...filteredEvents.map((e) => ({ ...e, markerType: "event" })),
    ...filteredLocations.map((l) => ({ ...l, markerType: "location" })),
  ].filter(
    (item) =>
      item.location &&
      typeof item.location.lat === "number" &&
      typeof item.location.lng === "number" &&
      !isNaN(item.location.lat) &&
      !isNaN(item.location.lng)
  );

  // Search results for display
  const searchResults = searchQuery.trim() ? allMarkers : [];

  // Render search result item
  const renderSearchResultItem = ({ item }) => {
    const isEvent = item.markerType === "event";
    const title = isEvent ? item.title : item.name;
    const icon = isEvent ? "🎉" : "📌";
    const color = isEvent ? MARKER_COLORS.event : MARKER_COLORS.location;

    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => handleSearchResultPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[styles.searchResultIcon, { backgroundColor: color + "20" }]}
        >
          <Text style={styles.searchResultEmoji}>{icon}</Text>
        </View>
        <View style={styles.searchResultContent}>
          <Text style={styles.searchResultTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.searchResultCategory} numberOfLines={1}>
            {item.category}
          </Text>
          {item.address && (
            <Text style={styles.searchResultAddress} numberOfLines={1}>
              📍 {item.address}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !region) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8E2DE2" />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            showsUserLocation
            showsMyLocationButton={false}
            onRegionChangeComplete={handleRegionChangeComplete}
          >
            {allMarkers.map((item) => {
              const isFocused = item.id === focusedItemId;
              const pinColor = isFocused
                ? MARKER_COLORS.focused
                : MARKER_COLORS[item.markerType];

              const markerKey = `${item.markerType}-${item.id}`;

              return (
                <Marker
                  key={markerKey}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[markerKey] = ref;
                    }
                  }}
                  pinColor={pinColor}
                  coordinate={{
                    latitude: item.location.lat,
                    longitude: item.location.lng,
                  }}
                  title={item.markerType === "event" ? item.title : item.name}
                  description={item.category}
                  onPress={() => handleMarkerPress(item)}
                  style={{
                    transform: [
                      {
                        scale: isFocused
                          ? MARKER_SCALE.focused
                          : MARKER_SCALE.normal,
                      },
                    ],
                  }}
                />
              );
            })}
          </MapView>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sự kiện, địa điểm..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor="#999"
              returnKeyType="search"
              onSubmitEditing={dismissKeyboard}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowSearchResults(true);
                }
              }}
            />
            {searchQuery.trim() ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearSearch}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterButtonText}>🎯</Text>
            </TouchableOpacity>
          </View>

          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsHeaderText}>
                  Tìm thấy {searchResults.length} kết quả
                </Text>
              </View>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => `${item.markerType}-${item.id}`}
                style={styles.searchResultsList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          <Modal
            visible={showFilterModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFilterModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Bộ lọc</Text>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>Hiển thị:</Text>
                      <View style={styles.toggleRow}>
                        <TouchableOpacity
                          style={[
                            styles.toggleButton,
                            showEvents && styles.toggleButtonActive,
                          ]}
                          onPress={() => setShowEvents(!showEvents)}
                          activeOpacity={0.7}
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
                          activeOpacity={0.7}
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
                    </View>

                    {showEvents && (
                      <View style={styles.filterSection}>
                        <Text style={styles.filterSectionTitle}>
                          Loại sự kiện:
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.categoryScrollContent}
                        >
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
                            activeOpacity={0.7}
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
                          {Object.values(EVENT_CATEGORIES).map((category) => (
                            <TouchableOpacity
                              key={category}
                              style={[
                                styles.categoryChip,
                                selectedCategories.events.includes(category) &&
                                  styles.categoryChipActive,
                              ]}
                              onPress={() => toggleCategory("events", category)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.categoryText,
                                  selectedCategories.events.includes(
                                    category
                                  ) && styles.categoryTextActive,
                                ]}
                              >
                                {category}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {showLocations && (
                      <View style={styles.filterSection}>
                        <Text style={styles.filterSectionTitle}>
                          Loại địa điểm:
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.categoryScrollContent}
                        >
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
                            activeOpacity={0.7}
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
                          {Object.values(LOCATION_CATEGORIES).map(
                            (category) => (
                              <TouchableOpacity
                                key={category}
                                style={[
                                  styles.categoryChip,
                                  selectedCategories.locations.includes(
                                    category
                                  ) && styles.categoryChipActive,
                                ]}
                                onPress={() =>
                                  toggleCategory("locations", category)
                                }
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.categoryText,
                                    selectedCategories.locations.includes(
                                      category
                                    ) && styles.categoryTextActive,
                                  ]}
                                >
                                  {category}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={resetFilters}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.modalButtonText}>Đặt lại</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonPrimary]}
                        onPress={() => setShowFilterModal(false)}
                        activeOpacity={0.7}
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
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          <DetailModal
            isVisible={showDetailModal}
            onClose={handleCloseDetailModal}
            eventId={selectedItem?.type === "event" ? selectedItem.id : null}
            locationId={
              selectedItem?.type === "location" ? selectedItem.id : null
            }
          />
        </View>
      </TouchableWithoutFeedback>
    </GestureHandlerRootView>
  );
}

MapScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    setParams: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.object,
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
    backgroundColor: "#F7F7FB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    zIndex: 10,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    fontSize: 15,
    fontWeight: "500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    paddingRight: 48,
  },
  clearButton: {
    position: "absolute",
    right: 80,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F5",
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  filterButton: {
    marginLeft: 12,
    backgroundColor: "#8E2DE2",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 24,
  },
  searchResultsContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    maxHeight: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 9,
    overflow: "hidden",
  },
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  searchResultsHeaderText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
  },
  searchResultsList: {
    maxHeight: 340,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  searchResultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchResultEmoji: {
    fontSize: 24,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 12,
    color: "#AEAEB2",
  },
  refocusButton: {
    position: "absolute",
    right: 16,
    bottom: 170,
    backgroundColor: "#FF3B30",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  refocusButtonText: {
    fontSize: 24,
  },
  locateButton: {
    position: "absolute",
    right: 16,
    bottom: 100,
    backgroundColor: "#fff",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  locateButtonText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#1C1C1E",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#3A3A3C",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F0F0F5",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#8E2DE2",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
  },
  toggleTextActive: {
    color: "#fff",
  },
  categoryScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F0F0F5",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#8E2DE2",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  categoryTextActive: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F0F0F5",
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#8E2DE2",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  modalButtonTextPrimary: {
    color: "#fff",
  },
});
