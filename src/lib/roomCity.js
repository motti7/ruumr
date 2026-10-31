export const ROOM_CITIES = [
  { value: 'תל אביב', slug: 'tel-aviv', key: 'tel_aviv' },
  { value: 'ירושלים', slug: 'jerusalem', key: 'jerusalem' },
  { value: 'חיפה', slug: 'haifa', key: 'haifa' },
  { value: 'באר שבע', slug: 'beer-sheva', key: 'beer_sheva' },
];

export function parseRoomCity(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ROOM_CITIES.find(city => city.slug === normalized || city.value === normalized)?.value || 'all';
}

export function roomCityParams(params, city) {
  const next = new URLSearchParams(params);
  const match = ROOM_CITIES.find(item => item.value === city);
  if (match) next.set('city', match.slug);
  else next.delete('city');
  return next;
}
