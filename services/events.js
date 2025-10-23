import { collection, addDoc, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

/**
 * createEvent - save an event with geohash and timestamps
 * event: { title, description, category, latitude, longitude, startAt: Date|string, endAt: Date|string|null }
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
  };

  const col = collection(db, 'events');
  const ref = await addDoc(col, doc);
  return ref.id;
}

/**
 * getLiveEventsNearby - return events where startAt <= now <= endAt (or no endAt) within radiusKm
 * center: { latitude, longitude }
 */
export async function getLiveEventsNearby(center, radiusKm = 5) {
  const centerLoc = [center.latitude, center.longitude];
  const bounds = geohashQueryBounds(centerLoc, radiusKm * 1000);
  const col = collection(db, 'events');

  const now = Timestamp.now();

  const promises = bounds.map(b => {
    const q = query(col, where('geohash', '>=', b[0]), where('geohash', '<=', b[1]));
    return getDocs(q);
  });

  const snapshots = await Promise.all(promises);
  const matching = [];

  for (const sn of snapshots) {
    for (const doc of sn.docs) {
      const data = doc.data();
      const startAt = data.startAt;
      const endAt = data.endAt;
      const started = startAt && startAt.seconds <= now.seconds;
      const notEnded = !endAt || endAt.seconds >= now.seconds;
      if (!started || !notEnded) continue;

      const lat = data.location?.lat ?? null;
      const lng = data.location?.lng ?? null;
      if (lat == null || lng == null) continue;

      const d = distanceBetween([lat, lng], centerLoc); // meters
      if (d <= radiusKm * 1000) {
        matching.push({ id: doc.id, distanceMeters: d, ...data });
      }
    }
  }

  matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matching;
}

/**
 * getEventById - fetch a single event document by id (returns null if missing)
 */
export async function getEventById(id) {
  if (!id) return null;
  const dref = doc(db, 'events', id);
  const snap = await getDoc(dref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * getUpcomingEvents - return upcoming events ordered by startAt (next N)
 * limit: number of events to return (default 20)
 */
export async function getUpcomingEvents(limit = 20) {
  const col = collection(db, 'events');
  const now = Timestamp.now();
  const q = query(col, where('startAt', '>=', now), );
  // Firestore doesn't allow ordering without index here if needed; we'll fetch and sort client-side
  const snap = await getDocs(q);
  const items = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    items.push({ id: doc.id, ...data });
  }
  items.sort((a, b) => (a.startAt?.seconds || 0) - (b.startAt?.seconds || 0));
  return items.slice(0, limit);
}

/**
 * getAllEvents - fetch all documents from the events collection
 * If limit is provided, returns up to that many documents.
 */
export async function getAllEvents(limit = 0) {
  const col = collection(db, 'events');
  const snap = await getDocs(col);
  const items = [];
  for (const d of snap.docs) {
    items.push({ id: d.id, ...d.data() });
    if (limit > 0 && items.length >= limit) break;
  }
  return items;
}
