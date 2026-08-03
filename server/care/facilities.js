/**
 * Care routing — curated regional directory + optional OpenStreetMap Overpass.
 * No paid Maps API required.
 */

const CURATED = [
  {
    id: 'aiims-delhi',
    name: 'AIIMS New Delhi',
    type: 'hospital',
    phone: '112',
    address: 'Ansari Nagar, New Delhi',
    lat: 28.5672,
    lng: 77.2100,
    open24h: true,
  },
  {
    id: 'safdarjung',
    name: 'Safdarjung Hospital',
    type: 'hospital',
    phone: '011-26165060',
    address: 'Ansari Nagar West, New Delhi',
    lat: 28.5678,
    lng: 77.2065,
    open24h: true,
  },
  {
    id: 'apollo-delhi',
    name: 'Indraprastha Apollo Hospital',
    type: 'hospital',
    phone: '011-26925858',
    address: 'Sarita Vihar, New Delhi',
    lat: 28.5418,
    lng: 77.2834,
    open24h: true,
  },
  {
    id: 'max-saket',
    name: 'Max Smart Super Specialty (Saket)',
    type: 'hospital',
    phone: '011-26515050',
    address: 'Saket, New Delhi',
    lat: 28.5273,
    lng: 77.2191,
    open24h: true,
  },
  {
    id: 'fortis-gurugram',
    name: 'Fortis Memorial Research Institute',
    type: 'hospital',
    phone: '0124-4962200',
    address: 'Sector 44, Gurugram',
    lat: 28.4507,
    lng: 77.0720,
    open24h: true,
  },
  {
    id: 'lilavati-mumbai',
    name: 'Lilavati Hospital',
    type: 'hospital',
    phone: '022-26751000',
    address: 'Bandra West, Mumbai',
    lat: 19.0510,
    lng: 72.8290,
    open24h: true,
  },
  {
    id: 'kem-mumbai',
    name: 'KEM Hospital',
    type: 'hospital',
    phone: '022-24136051',
    address: 'Parel, Mumbai',
    lat: 19.0010,
    lng: 72.8410,
    open24h: true,
  },
  {
    id: 'manipal-bengaluru',
    name: 'Manipal Hospital Old Airport Road',
    type: 'hospital',
    phone: '080-25024444',
    address: 'Bengaluru',
    lat: 12.9582,
    lng: 77.6481,
    open24h: true,
  },
  {
    id: 'apollo-chennai',
    name: 'Apollo Hospitals Greams Road',
    type: 'hospital',
    phone: '044-28290200',
    address: 'Chennai',
    lat: 13.0604,
    lng: 80.2518,
    open24h: true,
  },
  {
    id: 'demo-clinic-gp',
    name: 'Demo Family Clinic',
    type: 'clinic',
    phone: '011-40000000',
    address: 'Partner clinic — book within 48 hours',
    lat: 28.6139,
    lng: 77.2090,
    open24h: false,
  },
  {
    id: 'demo-urgent',
    name: 'City Urgent Care Walk-in',
    type: 'urgent_care',
    phone: '011-40000001',
    address: 'Same-day urgent care desk',
    lat: 28.5355,
    lng: 77.3910,
    open24h: false,
  },
]

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function urgencyNeeds(urgency) {
  switch (urgency) {
    case 'CALL_EMERGENCY':
      return { types: ['hospital'], prefer24h: true, radiusKm: 25, action: 'Call emergency services / go to ER now', emergencyNumber: '112' }
    case 'HOSPITAL_NOW':
      return { types: ['hospital', 'urgent_care'], prefer24h: true, radiusKm: 30, action: 'Seek urgent / ER care soon', emergencyNumber: '112' }
    case 'CLINIC_48H':
      return { types: ['clinic', 'urgent_care', 'hospital'], prefer24h: false, radiusKm: 40, action: 'See a clinician within 24–48 hours', emergencyNumber: null }
    default:
      return { types: ['clinic'], prefer24h: false, radiusKm: 50, action: 'Monitor at home; contact a clinic if symptoms worsen', emergencyNumber: null }
  }
}

function scoreFacility(facility, needs, origin) {
  let score = 0
  if (needs.types.includes(facility.type)) score += 40
  if (needs.prefer24h && facility.open24h) score += 20
  if (origin) {
    const km = haversineKm(origin.lat, origin.lng, facility.lat, facility.lng)
    facility.distanceKm = Math.round(km * 10) / 10
    score += Math.max(0, 40 - km)
  } else {
    facility.distanceKm = null
  }
  return score
}

async function fetchOverpass(lat, lng, radiusMeters = 8000) {
  const query = `
    [out:json][timeout:8];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out body 12;
  `
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 9000)
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.elements || [])
      .filter((el) => el.lat && el.lon && el.tags?.name)
      .map((el) => ({
        id: `osm-${el.id}`,
        name: el.tags.name,
        type: el.tags.amenity === 'clinic' ? 'clinic' : 'hospital',
        phone: el.tags.phone || el.tags['contact:phone'] || null,
        address: el.tags['addr:full'] || el.tags['addr:street'] || 'Nearby (OpenStreetMap)',
        lat: el.lat,
        lng: el.lon,
        open24h: el.tags.opening_hours === '24/7',
        source: 'openstreetmap',
      }))
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

/**
 * @param {{ lat?: number, lng?: number, urgency?: string }} opts
 */
export async function findNearbyCare(opts = {}) {
  const urgency = opts.urgency || 'CLINIC_48H'
  const needs = urgencyNeeds(urgency)
  const origin =
    Number.isFinite(opts.lat) && Number.isFinite(opts.lng)
      ? { lat: Number(opts.lat), lng: Number(opts.lng) }
      : null

  let live = []
  if (origin) {
    live = await fetchOverpass(origin.lat, origin.lng)
  }

  const pool = [...live, ...CURATED.map((f) => ({ ...f, source: f.source || 'directory' }))]
  const ranked = pool
    .map((facility) => {
      const copy = { ...facility }
      copy._score = scoreFacility(copy, needs, origin)
      return copy
    })
    .filter((f) => needs.types.includes(f.type) || f.source === 'openstreetmap')
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)
    .map(({ _score, ...rest }) => rest)

  return {
    urgency,
    action: needs.action,
    emergencyNumber: needs.emergencyNumber,
    origin,
    facilities: ranked,
    source: live.length ? 'directory+openstreetmap' : 'directory',
  }
}
