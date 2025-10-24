// services/locations.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from "geofire-common";
import { db } from "../firebaseConfig";

/**
 * LOCATION CATEGORIES cho GenZ
 */
export const LOCATION_CATEGORIES = {
  CAFE: "Quán Cafe",
  WORKSHOP: "Workshop/Coworking",
  ENTERTAINMENT: "Khu vui chơi",
  BILLIARDS: "Quán Bida",
  INTERNET_CAFE: "Quán Net",
  GAMING: "Quán Game/PES",
  RESTAURANT: "Nhà hàng",
  BAR: "Bar/Pub",
  SHOPPING: "Shopping",
  SPORTS: "Thể thao",
  STUDY: "Học tập",
  OTHER: "Khác",
};

/**
 * createLocation - Tạo địa điểm mới (cố định, không có thời gian)
 * location: {
 *   name, description, category, latitude, longitude,
 *   address, phone, website, imageUrl, amenities: [],
 *   openingHours: { monday: '8:00-22:00', ... },
 *   rating: 4.5, priceRange: '$$'
 * }
 */
export async function createLocation(location) {
  const { latitude, longitude, ...rest } = location;
  const geohash = geohashForLocation([latitude, longitude]);

  const doc = {
    ...rest,
    location: { lat: latitude, lng: longitude },
    geohash,
    createdAt: new Date(),
    type: "location", // Phân biệt với events
  };

  const col = collection(db, "locations");
  const ref = await addDoc(col, doc);
  return ref.id;
}

/**
 * getLocationsNearby - Lấy địa điểm trong bán kính
 */
export async function getLocationsNearby(
  center,
  radiusKm = 5,
  categoryFilter = null
) {
  const centerLoc = [center.latitude, center.longitude];
  const bounds = geohashQueryBounds(centerLoc, radiusKm * 1000);
  const col = collection(db, "locations");

  const promises = bounds.map((b) => {
    let q = query(
      col,
      where("geohash", ">=", b[0]),
      where("geohash", "<=", b[1])
    );
    return getDocs(q);
  });

  const snapshots = await Promise.all(promises);
  const matching = [];

  for (const sn of snapshots) {
    for (const docSnap of sn.docs) {
      const data = docSnap.data();

      // Filter by category if provided
      if (categoryFilter && data.category !== categoryFilter) continue;

      const lat = data.location?.lat ?? null;
      const lng = data.location?.lng ?? null;
      if (lat == null || lng == null) continue;

      const d = distanceBetween([lat, lng], centerLoc);
      if (d <= radiusKm * 1000) {
        matching.push({
          id: docSnap.id,
          distanceMeters: d,
          type: "location",
          ...data,
        });
      }
    }
  }

  matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matching;
}

/**
 * getLocationById - Lấy 1 địa điểm theo ID
 */
export async function getLocationById(id) {
  if (!id) return null;
  const dref = doc(db, "locations", id);
  const snap = await getDoc(dref);
  if (!snap.exists()) return null;
  return { id: snap.id, type: "location", ...snap.data() };
}

/**
 * searchLocations - Tìm kiếm địa điểm theo tên
 */
export async function searchLocations(searchTerm, categoryFilter = null) {
  const col = collection(db, "locations");
  const snap = await getDocs(col);
  const items = [];

  const term = searchTerm.toLowerCase();

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const name = (data.name || "").toLowerCase();
    const description = (data.description || "").toLowerCase();

    // Filter by search term
    if (!name.includes(term) && !description.includes(term)) continue;

    // Filter by category
    if (categoryFilter && data.category !== categoryFilter) continue;

    items.push({ id: docSnap.id, type: "location", ...data });
  }

  return items;
}
