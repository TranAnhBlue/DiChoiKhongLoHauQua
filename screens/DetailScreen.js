import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { getEventById } from "../services/events";
import { getLocationById } from "../services/locations";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function DetailModal({
  isVisible,
  onClose,
  eventId,
  locationId,
}) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemType, setItemType] = useState(null);
  const bottomSheetRef = useRef(null);
  const lastEventIdRef = useRef(null); // Track last loaded eventId để tránh reload không cần thiết
  const lastLocationIdRef = useRef(null); // Track last loaded locationId

  // Các mức độ cao của bottom sheet
  const snapPoints = useMemo(() => ["10%", "30%", "75%"], []);

  const isEvent = itemType === "event";

  useEffect(() => {
    if (!isVisible) {
      setItem(null);
      setLoading(true);
      setItemType(null);
      // Clear refs khi đóng modal
      lastEventIdRef.current = null;
      lastLocationIdRef.current = null;
      return;
    }

    // Nếu modal đã visible nhưng chưa có eventId/locationId, đợi một chút
    // (có thể eventId đang được set từ MapScreen)
    // useEffect sẽ chạy lại khi eventId/locationId được set
    if (!eventId && !locationId) {
      console.log("⚠️ [DetailScreen] Modal visible but no eventId/locationId yet, keeping loading state");
      setLoading(true);
      // Không cần timeout, useEffect sẽ chạy lại khi eventId/locationId được set
      return;
    }

    if (eventId || locationId) {
      // Nếu đã load event/location này rồi và đang có data, không cần load lại
      if (
        item &&
        ((eventId && eventId === lastEventIdRef.current) ||
          (locationId && locationId === lastLocationIdRef.current))
      ) {
        console.log("ℹ️ [DetailScreen] Already loaded, skipping reload");
        return;
      }

      let mounted = true;
      setLoading(true);
      setItemType(null);

      // Log chỉ các giá trị có ý nghĩa (không log null để tránh nhầm lẫn)
      const logData = { isVisible };
      if (eventId) logData.eventId = eventId;
      if (locationId) logData.locationId = locationId;
      console.log(`📥 [DetailScreen] Loading detail:`, logData);

      (async () => {
        try {
          if (eventId && !locationId) {
            console.log(`📥 [DetailScreen] Fetching event: ${eventId}`);
            const data = await getEventById(eventId);
            if (mounted) {
              console.log(`✅ [DetailScreen] Event loaded:`, data?.id || data?.title || "unknown");
              setItem(data);
              setItemType("event");
              lastEventIdRef.current = eventId; // Track loaded eventId
              lastLocationIdRef.current = null; // Clear locationId ref
            }
          } else if (locationId && !eventId) {
            console.log(`📥 [DetailScreen] Fetching location: ${locationId}`);
            const data = await getLocationById(locationId);
            if (mounted) {
              console.log(`✅ [DetailScreen] Location loaded:`, data?.id || data?.name || "unknown");
              setItem(data);
              setItemType("location");
              lastLocationIdRef.current = locationId; // Track loaded locationId
              lastEventIdRef.current = null; // Clear eventId ref
            }
          }
        } catch (err) {
          console.error("❌ [DetailScreen] Error loading detail:", err);
          if (mounted) {
            setItem(null);
            setItemType(null);
            lastEventIdRef.current = null;
            lastLocationIdRef.current = null;
          }
        } finally {
          if (mounted) {
            setLoading(false);
            console.log(`✅ [DetailScreen] Loading complete`);
          }
        }
      })();

      return () => {
        mounted = false;
      };
    }
  }, [isVisible, eventId, locationId]);

  // Mở/đóng sheet theo isVisible
  useEffect(() => {
    if (!bottomSheetRef.current) return;

    if (isVisible) {
      // Đợi một chút để đảm bảo BottomSheet đã mount và data đã sẵn sàng
      const timeout = setTimeout(() => {
        if (bottomSheetRef.current) {
          console.log("📱 [DetailScreen] Expanding bottom sheet, isVisible:", isVisible, "item:", !!item);
          // Dùng snapToIndex(1) để mở đến mức 30% trước, sau đó expand lên 75%
          bottomSheetRef.current.snapToIndex(1);
          // Sau đó expand lên mức cao nhất
          setTimeout(() => {
            bottomSheetRef.current?.expand();
          }, 200);
        }
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      bottomSheetRef.current.close();
    }
  }, [isVisible, item]);

  // Các hàm xử lý
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDirections = () => {
    const lat = item?.location?.lat;
    const lng = item?.location?.lng;
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch((err) => console.log("Linking error", err));
  };

  const openPhone = () => {
    if (!item?.phone) return;
    Linking.openURL(`tel:${item.phone}`).catch((err) =>
      console.log("Phone error", err)
    );
  };

  const openWebsite = () => {
    if (!item?.website) return;
    Linking.openURL(item.website).catch((err) =>
      console.log("Website error", err)
    );
  };

  const shareItem = async () => {
    try {
      const title = isEvent ? item.title : item.name;
      const message = `${title}\n${item.description}\n${item.address || ""}`;
      await Share.share({ message, title });
    } catch (err) {
      console.log("Share error", err);
    }
  };

  const getTodayHours = () => {
    if (!item?.openingHours) return null;
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const today = days[new Date().getDay()];
    return item.openingHours[today];
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: "#fff" }}
      handleIndicatorStyle={{ backgroundColor: "#ccc" }}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E2DE2" />
        </View>
      ) : !item ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Không tìm thấy thông tin</Text>
        </View>
      ) : (
        <BottomSheetScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.placeholderImage]}>
                <Text style={styles.placeholderEmoji}>
                  {isEvent ? "🎉" : "📌"}
                </Text>
              </View>
            )}

            <View style={styles.headerInfo}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    isEvent ? styles.eventBadge : styles.locationBadge,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {isEvent ? "🎉 Event" : "📌 Place"}
                  </Text>
                </View>
                {!isEvent && item.rating && (
                  <Text style={styles.rating}>⭐ {item.rating}</Text>
                )}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {isEvent ? item.title : item.name}
              </Text>
              <Text style={styles.category}>{item.category}</Text>
            </View>
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            {isEvent && item.startAt && (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipIcon}>⏰</Text>
                <Text style={styles.infoChipText} numberOfLines={1}>
                  {formatDate(item.startAt)}
                </Text>
              </View>
            )}

            {!isEvent && getTodayHours() && (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipIcon}>🕐</Text>
                <Text style={styles.infoChipText} numberOfLines={1}>
                  {getTodayHours()}
                </Text>
              </View>
            )}

            {isEvent && item.ticketPrice && (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipIcon}>💰</Text>
                <Text style={styles.infoChipText} numberOfLines={1}>
                  {item.ticketPrice}
                </Text>
              </View>
            )}

            {!isEvent && item.priceRange && (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipIcon}>💵</Text>
                <Text style={styles.infoChipText}>{item.priceRange}</Text>
              </View>
            )}

            {item.distanceMeters != null && (
              <View style={styles.infoChip}>
                <Text style={styles.infoChipIcon}>📏</Text>
                <Text style={styles.infoChipText}>
                  {(item.distanceMeters / 1000).toFixed(1)}km
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {item.description && (
            <View style={styles.section}>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {/* Address */}
          {item.address && (
            <View style={styles.addressSection}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.address} numberOfLines={2}>
                {item.address}
              </Text>
            </View>
          )}

          {/* Amenities */}
          {!isEvent && item.amenities && item.amenities.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.amenitiesScroll}
            >
              {item.amenities.slice(0, 5).map((amenity, idx) => (
                <View key={idx} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Detail section */}
          {item.detail && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiết sự kiện</Text>
              <Text style={styles.description}>{item.detail}</Text>
            </View>
          )}

          {/* Social links */}
          {item.socialLinks && (
            <View style={styles.socialLinks}>
              {item.socialLinks.facebook && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(item.socialLinks.facebook)}
                >
                  <Text style={styles.socialIcon}>📘</Text>
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              )}
              {item.socialLinks.tiktok && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(item.socialLinks.tiktok)}
                >
                  <Text style={styles.socialIcon}>🎵</Text>
                  <Text style={styles.socialText}>TikTok</Text>
                </TouchableOpacity>
              )}
              {item.socialLinks.instagram && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(item.socialLinks.instagram)}
                >
                  <Text style={styles.socialIcon}>📸</Text>
                  <Text style={styles.socialText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {item.socialLinks.website && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(item.socialLinks.website)}
                >
                  <Text style={styles.socialIcon}>🌐</Text>
                  <Text style={styles.socialText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
          )}


          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={openDirections}
            >
              <Text style={styles.actionIcon}>🧭</Text>
              <Text style={styles.actionText}>Chỉ đường</Text>
            </TouchableOpacity>

            {!isEvent && item.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={openPhone}>
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionTextSecondary}>Gọi</Text>
              </TouchableOpacity>
            )}

            {!isEvent && item.website && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openWebsite}
              >
                <Text style={styles.actionIcon}>🌐</Text>
                <Text style={styles.actionTextSecondary}>Web</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={shareItem}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionTextSecondary}>Chia sẻ</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}

DetailModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  eventId: PropTypes.string,
  locationId: PropTypes.string,
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  socialLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  socialText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },

  closeButton: {
    position: "absolute",
    top: 12,
    right: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 22,
    color: "#888",
    fontWeight: "bold",
    lineHeight: 22,
    marginTop: -2,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    marginBottom: 16,
    paddingTop: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventBadge: {
    backgroundColor: "#E8D4F8",
  },
  locationBadge: {
    backgroundColor: "#D4F8E8",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
  rating: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFA500",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: "#8E2DE2",
    fontWeight: "600",
  },
  quickInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  infoChipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  section: {
    marginBottom: 16,
  },
  // Bỏ numberOfLines
  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  addressSection: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#8E2DE2",
  },
  addressIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  amenitiesScroll: {
    marginBottom: 16,
  },
  amenityTag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  amenityText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
  },
  primaryAction: {
    backgroundColor: "#8E2DE2",
    borderColor: "#8E2DE2",
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  actionTextSecondary: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
});
