import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
import { Timestamp } from 'firebase/firestore';

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

  snapshots.forEach(sn => {
    sn.forEach(doc => {
      const data = doc.data();
      const startAt = data.startAt;
      const endAt = data.endAt;
      const started = startAt && startAt.seconds <= now.seconds;
      const notEnded = !endAt || endAt.seconds >= now.seconds;
      if (!started || !notEnded) return;

      const lat = data.location?.lat ?? null;
      const lng = data.location?.lng ?? null;
      if (lat == null || lng == null) return;

      const d = distanceBetween([lat, lng], centerLoc); // meters
      if (d <= radiusKm * 1000) {
        matching.push({ id: doc.id, distanceMeters: d, ...data });
      }
    });
  });

  matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matching;
}
