// services/events.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from "geofire-common";
import { db } from "../firebaseConfig";

/**
 * EVENT CATEGORIES
 */
export const EVENT_CATEGORIES = {
  MUSIC: "Âm nhạc",
  WORKSHOP: "Workshop",
  FOOD: "Ẩm thực",
  SPORTS: "Thể thao",
  GAMING: "Gaming/Esports",
  MEETUP: "Meetup",
  PARTY: "Party",
  CULTURAL: "Văn hóa",
  STUDY: "Học tập",
  CHARITY: "Từ thiện",
  OTHER: "Khác",
};

/**
 * createEvent - Tạo sự kiện mới
 */
export async function createEvent(event) {
  const { latitude, longitude, startAt, endAt, ...rest } = event;
  const geohash = geohashForLocation([latitude, longitude]);

  const doc = {
    ...rest,
    location: { lat: latitude, lng: longitude },
    geohash,
    startAt: Timestamp.fromDate(new Date(startAt)),
    endAt: endAt ? Timestamp.fromDate(new Date(endAt)) : null,
    createdAt: Timestamp.now(),
    type: "event",
  };

  const col = collection(db, "events");
  const ref = await addDoc(col, doc);
  return ref.id;
}

/**
 * getLiveEventsNearby - Lấy sự kiện đang diễn ra
 */
export async function getLiveEventsNearby(
  center,
  radiusKm = 5,
  categoryFilter = null
) {
  const centerLoc = [center.latitude, center.longitude];
  const bounds = geohashQueryBounds(centerLoc, radiusKm * 1000);
  const col = collection(db, "events");
  const now = Timestamp.now();

  const promises = bounds.map((b) => {
    const q = query(
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

      // Filter by category
      if (categoryFilter && data.category !== categoryFilter) continue;

      const startAt = data.startAt;
      const endAt = data.endAt;
      const started = startAt && startAt.seconds <= now.seconds;
      const notEnded = !endAt || endAt.seconds >= now.seconds;
      if (!started || !notEnded) continue;

      const lat = data.location?.lat ?? null;
      const lng = data.location?.lng ?? null;
      if (lat == null || lng == null) continue;

      const d = distanceBetween([lat, lng], centerLoc);
      if (d <= radiusKm * 1000) {
        matching.push({
          id: docSnap.id,
          distanceMeters: d,
          type: "event",
          ...data,
        });
      }
    }
  }

  matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matching;
}

/**
 * getAllEventsNearby - Lấy TẤT CẢ sự kiện (đang diễn ra + sắp diễn ra)
 * Dùng cho MapScreen để hiển thị đầy đủ
 */
export async function getAllEventsNearby(
  center,
  radiusKm = 5,
  categoryFilter = null
) {
  const centerLoc = [center.latitude, center.longitude];
  const bounds = geohashQueryBounds(centerLoc, radiusKm * 1000);
  const col = collection(db, "events");
  const now = Timestamp.now();

  const promises = bounds.map((b) => {
    const q = query(
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

      // Filter by category
      if (categoryFilter && data.category !== categoryFilter) continue;

      const endAt = data.endAt;
      // Chỉ loại bỏ events đã kết thúc
      const notEnded = !endAt || endAt.seconds >= now.seconds;
      if (!notEnded) continue;

      const lat = data.location?.lat ?? null;
      const lng = data.location?.lng ?? null;
      if (lat == null || lng == null) continue;

      const d = distanceBetween([lat, lng], centerLoc);
      if (d <= radiusKm * 1000) {
        matching.push({
          id: docSnap.id,
          distanceMeters: d,
          type: "event",
          ...data,
        });
      }
    }
  }

  matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matching;
}

/**
 * getEventById
 */
export async function getEventById(id) {
  if (!id) return null;
  const dref = doc(db, "events", id);
  const snap = await getDoc(dref);
  if (!snap.exists()) return null;
  return { id: snap.id, type: "event", ...snap.data() };
}

/**
 * searchEvents - Tìm kiếm sự kiện
 */
export async function searchEvents(searchTerm, categoryFilter = null) {
  const col = collection(db, "events");
  const snap = await getDocs(col);
  const items = [];
  const now = Timestamp.now();
  const term = searchTerm.toLowerCase();

  for (const docSnap of snap.docs) {
    const data = docSnap.data();

    // Only show live or upcoming events
    const startAt = data.startAt;
    const endAt = data.endAt;
    const notEnded = !endAt || endAt.seconds >= now.seconds;
    if (!notEnded) continue;

    const title = (data.title || "").toLowerCase();
    const description = (data.description || "").toLowerCase();

    if (!title.includes(term) && !description.includes(term)) continue;

    if (categoryFilter && data.category !== categoryFilter) continue;

    items.push({ id: docSnap.id, type: "event", ...data });
  }

  return items;
}

/**
 * getUpcomingEvents
 */
export async function getUpcomingEvents(limit = 20, categoryFilter = null) {
  const col = collection(db, "events");
  const now = Timestamp.now();
  const q = query(col, where("startAt", ">=", now));
  const snap = await getDocs(q);
  const items = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (categoryFilter && data.category !== categoryFilter) continue;
    items.push({ id: docSnap.id, type: "event", ...data });
  }

  items.sort((a, b) => (a.startAt?.seconds || 0) - (b.startAt?.seconds || 0));
  return items.slice(0, limit);
}
