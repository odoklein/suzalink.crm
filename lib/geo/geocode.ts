export type GeocodeResult = {
  latitude: number;
  longitude: number;
  postalCode: string;
  city?: string;
  address?: string;
};

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!MAPBOX_API_KEY) {
    throw new Error('MAPBOX_API_KEY not set');
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_API_KEY}&country=fr&limit=1&types=address,place,postcode`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to geocode address');
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) throw new Error('No results from geocoding');

  const [longitude, latitude] = feature.center;
  let postalCode = '';
  let city = feature.text;
  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id?.startsWith('postcode')) postalCode = ctx.text;
      if (ctx.id?.startsWith('place')) city = ctx.text;
    }
  }
  if (!postalCode && feature.place_type?.includes('postcode')) {
    postalCode = feature.text;
  }

  return {
    latitude,
    longitude,
    postalCode,
    city,
    address: feature.place_name,
  };
}
