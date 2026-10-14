export const cafeLocation = { latitude: -5.126339, longitude: 105.307036, radiusMetres: 100 };

export function distanceMetres(latitude: number, longitude: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(latitude - cafeLocation.latitude);
  const lonDelta = radians(longitude - cafeLocation.longitude);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(latitude)) * Math.cos(radians(cafeLocation.latitude)) * Math.sin(lonDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}

export function validateCheckInLocation(form: FormData, now = Date.now()) {
  const read = (key: string) => {
    const value = form.get(key);
    if (typeof value !== 'string' || !value.trim()) throw Error('Allow phone location access to check in at the café.');
    const number = Number(value);
    if (!Number.isFinite(number)) throw Error('Your location could not be verified. Please try again.');
    return number;
  };
  const latitude = read('latitude'), longitude = read('longitude'), accuracy = read('locationAccuracy'), capturedAt = read('locationTimestamp');
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy < 0) throw Error('Your location could not be verified. Please try again.');
  if (capturedAt < now - 60000 || capturedAt > now + 15000) throw Error('Your location is out of date. Please try checking in again.');
  if (accuracy > 50) throw Error('Your GPS location is not accurate enough. Enable precise location, move near the café entrance and try again.');
  const distance = distanceMetres(latitude, longitude);
  if (distance > cafeLocation.radiusMetres) throw Error('Check-in is only available within 100 metres of the café. Please arrive at the café and try again.');
  return { latitude, longitude, accuracy, distanceMetres: Math.round(distance), verifiedAt: new Date(now).toISOString() };
}

export async function addPhoneLocation(form: FormData): Promise<void> {
  if (!navigator.geolocation) throw Error('This browser does not support location access. Please use your phone’s Chrome or Safari browser.');
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, error => reject(Error(error.code === 1
      ? 'Location permission is required to check in. Allow precise location for this site in your phone settings.'
      : 'Your location could not be found. Turn on phone location services and try again.')),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  });
  form.set('latitude', String(position.coords.latitude));
  form.set('longitude', String(position.coords.longitude));
  form.set('locationAccuracy', String(position.coords.accuracy));
  form.set('locationTimestamp', String(position.timestamp));
}
