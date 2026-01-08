export interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface Route {
  id: string;
  shortName: string;
  longName: string;
  stops: Stop[];
}

export interface JourneySegment {
  route: Route | null;
  fromStop: Stop;
  toStop: Stop;
  stops: Stop[];
  isWalking?: boolean;
  walkingDistance?: number;
}

export interface Journey {
  segments: JourneySegment[];
  totalStops: Stop[];
}

const CBD_TRANSFER_ZONES = [
  {
    name: 'CBD Central',
    stopNames: ['odeon', 'otc', 'koja', 'kencom', 'bus station', 'gpo', 'commercial', 'tusker', 'archives', 'ronald ngala', 'fire station', 'landhies'],
    center: { lat: -1.284, lon: 36.827 },
    radius: 800
  },
  {
    name: 'CBD East',
    stopNames: ['machakos', 'muthurwa', 'railway'],
    center: { lat: -1.290, lon: 36.835 },
    radius: 600
  },
  {
    name: 'Eastleigh',
    stopNames: ['eastleigh', 'pumwani', 'california'],
    center: { lat: -1.271, lon: 36.852 },
    radius: 800
  }
];

let stopsCache: Stop[] | null = null;
let routesCache: Route[] | null = null;

// Clear caches to force reload with new parsing logic
export function clearRouteCaches(): void {
  stopsCache = null;
  routesCache = null;
  console.log('Route caches cleared - will reload on next request');
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function loadStops(): Promise<Stop[]> {
  if (stopsCache) return stopsCache;

  const response = await fetch('/2019Stops.txt');
  const text = await response.text();
  const lines = text.trim().split('\n');
  
  stopsCache = lines.slice(1).map(line => {
    const [id, name, lat, lon] = line.split(',');
    return {
      id: id.trim(),
      name: name.trim(),
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };
  }).filter(s => !isNaN(s.lat) && !isNaN(s.lon));

  return stopsCache;
}

function findStopByName(routeName: string, stops: Stop[]): Stop | undefined {
  const routeNameLower = routeName.toLowerCase().trim();
  
  // Skip very short names that cause phantom matches
  if (routeNameLower.length <= 2) return undefined;
  
  // 1. Exact match
  let stop = stops.find(s => s.name.toLowerCase() === routeNameLower);
  if (stop) return stop;
  
  // 2. Starts-with match
  stop = stops.find(s => s.name.toLowerCase().startsWith(routeNameLower));
  if (stop) return stop;
  
  // 3. Contains match (for "T Mall" matching "Tmall")
  stop = stops.find(s => s.name.toLowerCase().includes(routeNameLower));
  if (stop) return stop;
  
  // 4. Normalized match (remove spaces/hyphens)
  const normalizedRoute = routeNameLower.replace(/[\s-]/g, '');
  stop = stops.find(s => s.name.toLowerCase().replace(/[\s-]/g, '') === normalizedRoute);
  if (stop) return stop;
  
  // DO NOT use word-based matching - it causes phantom stops like "K" and "M"
  return undefined;
}

// Smart split that handles compound names like "Westlands Bypass", "Methodist Guesthouse", etc.
function smartSplitRouteName(longName: string): string[] {
  const compoundNames = [
    'westlands bypass', 'methodist guesthouse', 'othaya road', 'aga khan',
    'red cross', 'kiambu road', 'kiambu institute', 'kiambu hospital',
    'drive in', 'baba dogo', 'lucky summer', 'high school', 'juja road',
    'jogoo road', 'mombasa road', 'ngong road', 'langata road',
    'valley road', 'outering road', 'thika road', 'kangundo road',
    'ongata rongai', 'muthaiga roundabout', 'city stadium', 'nyayo stadium',
    'wilson airport', 'kenyatta national hospital', 'mama lucy hospital',
    'graffins college', 'strathmore school', 'pangani flyover', 'pangani terminus',
    'pangani girls', 'guru nanak', 'fire station', 'landhies road', 'nation building',
    'museum hill', 'spring valley', 'peponi road', 'abc place', 'yaya centre',
    'karen hospital', 'dagoretti market', 'dagoretti corner', 'race course',
    'training institute', 'college of insurance', 'south b', 'south c',
    'nairobi west', 'industrial area', 'imara daima', 'taj mall', 'gate a',
    'gate b', 'umoja 2', 'kariobangi south', 'kariobangi north', 'ronald ngala',
    'accra road', 't mall', 'tmall', 'bus station'
  ];
  
  let processed = longName.toLowerCase();
  const placeholders: Map<string, string> = new Map();
  
  // Sort by length descending to match longer names first
  const sortedCompounds = [...compoundNames].sort((a, b) => b.length - a.length);
  
  sortedCompounds.forEach((compound, idx) => {
    const placeholder = `COMPOUND${idx}PLACEHOLDER`;
    if (processed.includes(compound)) {
      placeholders.set(placeholder, compound);
      processed = processed.split(compound).join(placeholder);
    }
  });
  
  // Split on hyphens
  const parts = processed.split('-').map(s => s.trim()).filter(s => s.length > 0);
  
  // Restore compound names
  const restored = parts.map(part => {
    let result = part;
    for (const [placeholder, original] of placeholders) {
      if (result.includes(placeholder.toLowerCase())) {
        result = result.replace(placeholder.toLowerCase(), original);
      }
    }
    return result.trim();
  });
  
  // Filter out short strings that could be phantom matches
  return restored.filter(s => s.length > 2);
}

export async function loadRoutes(): Promise<Route[]> {
  if (routesCache) return routesCache;

  const response = await fetch('/2019Routes.txt');
  const text = await response.text();
  const lines = text.trim().split('\n');
  const stops = await loadStops();
  
  routesCache = lines.slice(1).map(line => {
    const parts = line.split(',');
    const id = parts[0].trim();
    const shortName = parts[2].trim();
    const longName = parts[3].trim();
    
    // Use smart split to handle compound names like "Westlands Bypass"
    const routeStopNames = smartSplitRouteName(longName);
    const routeStops: Stop[] = [];
    const usedStopIds = new Set<string>();
    
    for (const name of routeStopNames) {
      // Skip short names that could cause phantom matches
      if (name.length <= 2) continue;
      
      const stop = findStopByName(name, stops);
      if (stop && !usedStopIds.has(stop.id)) {
        routeStops.push(stop);
        usedStopIds.add(stop.id);
      }
    }
    
    return {
      id,
      shortName,
      longName,
      stops: routeStops
    };
  }).filter(r => r.stops.length > 0);

  console.log('Routes loaded:', routesCache.length);
  return routesCache;
}

export async function searchStops(query: string): Promise<Stop[]> {
  const stops = await loadStops();
  const lowerQuery = query.toLowerCase();
  return stops.filter(stop => stop.name.toLowerCase().includes(lowerQuery));
}

function stopMatches(routeStop: Stop, userStop: Stop): boolean {
  // 1. Exact ID match
  if (routeStop.id === userStop.id) return true;
  
  const routeNameLower = routeStop.name.toLowerCase().trim();
  const userNameLower = userStop.name.toLowerCase().trim();
  
  // 2. Exact name match
  if (routeNameLower === userNameLower) return true;
  
  // 3. One contains the other (for "Bus Station" matching "Bus Station...")
  if (routeNameLower.includes(userNameLower) || userNameLower.includes(routeNameLower)) return true;
  
  // 4. Normalized match (remove spaces/hyphens)
  const routeNorm = routeNameLower.replace(/[\s-]/g, '');
  const userNorm = userNameLower.replace(/[\s-]/g, '');
  if (routeNorm === userNorm) return true;
  
  // 5. Geographic proximity (< 300m = same stop)
  const distance = haversineDistance(routeStop.lat, routeStop.lon, userStop.lat, userStop.lon);
  if (distance < 300) return true;
  
  // DO NOT use word-based matching - it causes false positives
  return false;
}

function areStopsInSameCBDZone(stop1: Stop, stop2: Stop): { inSameZone: boolean; zoneName?: string; walkDistance?: number } {
  const stop1NameLower = stop1.name.toLowerCase();
  const stop2NameLower = stop2.name.toLowerCase();
  
  for (const zone of CBD_TRANSFER_ZONES) {
    const stop1InZone = zone.stopNames.some(name => stop1NameLower.includes(name) || name.includes(stop1NameLower)) ||
      haversineDistance(stop1.lat, stop1.lon, zone.center.lat, zone.center.lon) < zone.radius;
    
    const stop2InZone = zone.stopNames.some(name => stop2NameLower.includes(name) || name.includes(stop2NameLower)) ||
      haversineDistance(stop2.lat, stop2.lon, zone.center.lat, zone.center.lon) < zone.radius;
    
    if (stop1InZone && stop2InZone) {
      return {
        inSameZone: true,
        zoneName: zone.name,
        walkDistance: haversineDistance(stop1.lat, stop1.lon, stop2.lat, stop2.lon)
      };
    }
  }
  
  const directDistance = haversineDistance(stop1.lat, stop1.lon, stop2.lat, stop2.lon);
  if (directDistance < 800) {
    return { inSameZone: true, zoneName: 'Walking Transfer', walkDistance: directDistance };
  }
  
  return { inSameZone: false };
}

function getRouteSegment(route: Route, fromStop: Stop, toStop: Stop): { stops: Stop[]; isValid: boolean; distance?: number } {
  const fromIdx = route.stops.findIndex(s => stopMatches(s, fromStop));
  const toIdx = route.stops.findIndex(s => stopMatches(s, toStop));
  
  if (fromIdx === -1 || toIdx === -1) return { stops: [], isValid: false };
  
  // Allow bidirectional traversal
  if (fromIdx < toIdx) {
    const stops = route.stops.slice(fromIdx, toIdx + 1);
    const distance = haversineDistance(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
    return { stops, isValid: true, distance };
  } else if (fromIdx > toIdx) {
    const stops = route.stops.slice(toIdx, fromIdx + 1).reverse();
    const distance = haversineDistance(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
    return { stops, isValid: true, distance };
  }
  
  return { stops: [], isValid: false };
}

function findNextCBDHub(route: Route, afterStop: Stop): Stop | null {
  const afterIdx = route.stops.findIndex(s => stopMatches(s, afterStop));
  if (afterIdx === -1) return null;
  
  for (let i = afterIdx + 1; i < route.stops.length; i++) {
    const stop = route.stops[i];
    const stopNameLower = stop.name.toLowerCase();
    
    for (const zone of CBD_TRANSFER_ZONES) {
      const isHub = zone.stopNames.some(name => stopNameLower.includes(name) || name.includes(stopNameLower));
      if (isHub) return stop;
    }
  }
  
  return null;
}

function findPreviousCBDHub(route: Route, beforeStop: Stop): Stop | null {
  const beforeIdx = route.stops.findIndex(s => stopMatches(s, beforeStop));
  if (beforeIdx === -1) return null;
  
  for (let i = beforeIdx - 1; i >= 0; i--) {
    const stop = route.stops[i];
    const stopNameLower = stop.name.toLowerCase();
    
    for (const zone of CBD_TRANSFER_ZONES) {
      const isHub = zone.stopNames.some(name => stopNameLower.includes(name) || name.includes(stopNameLower));
      if (isHub) return stop;
    }
  }
  
  return null;
}

function findAnyRouteHub(route: Route): Stop | null {
  for (const stop of route.stops) {
    const stopNameLower = stop.name.toLowerCase();
    for (const zone of CBD_TRANSFER_ZONES) {
      const isHub = zone.stopNames.some(name => stopNameLower.includes(name) || name.includes(stopNameLower));
      if (isHub) return stop;
    }
  }
  return null;
}

export async function findOptimalRoute(fromStop: Stop, toStop: Stop): Promise<Journey | null> {
  const routes = await loadRoutes();
  const directDistance = haversineDistance(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
  
  const fromRoutes = routes.filter(r => 
    r.stops.some(s => stopMatches(s, fromStop))
  );
  
  console.log(`Routes serving ${fromStop.name}:`, fromRoutes.map(r => r.shortName));
  if (fromRoutes.length === 0) return null;

  const toRoutes = routes.filter(r => 
    r.stops.some(s => stopMatches(s, toStop))
  );
  
  console.log(`Routes serving ${toStop.name}:`, toRoutes.map(r => r.shortName));
  if (toRoutes.length === 0) return null;

  let bestJourney: Journey | null = null;
  let bestScore = Infinity;

  // STRATEGY 1: Direct routes (only if distance > 5km)
  if (directDistance > 5000) {
    for (const route of fromRoutes) {
      if (!toRoutes.includes(route)) continue;
      
      const segment = getRouteSegment(route, fromStop, toStop);
      if (!segment.isValid) continue;
      
      const score = segment.stops.length;
      console.log(`✓ Direct route: ${route.shortName} with ${segment.stops.length} stops (${(segment.distance! / 1000).toFixed(1)}km)`);
      
      if (score < bestScore) {
        bestScore = score;
        bestJourney = {
          segments: [{
            route,
            fromStop,
            toStop,
            stops: segment.stops
          }],
          totalStops: segment.stops
        };
      }
    }
  }

  // STRATEGY 2: CBD Hub transfers - check route start as hub
  for (const fromRoute of fromRoutes) {
    let cbdHubFromRoute = findNextCBDHub(fromRoute, fromStop);
    if (!cbdHubFromRoute) cbdHubFromRoute = findAnyRouteHub(fromRoute);
    if (!cbdHubFromRoute) continue;
    
    const fromSegment = getRouteSegment(fromRoute, fromStop, cbdHubFromRoute);
    if (!fromSegment.isValid) continue;
    
  for (const toRoute of toRoutes) {
      let cbdHubToRoute = findPreviousCBDHub(toRoute, toStop);
      let toHubPenalty = 0;
      if (!cbdHubToRoute) {
        const firstStop = toRoute.stops[0];
        const stopNameLower = firstStop.name.toLowerCase();
        for (const zone of CBD_TRANSFER_ZONES) {
          const isHub = zone.stopNames.some(name => stopNameLower.includes(name) || name.includes(stopNameLower));
          if (isHub) {
            cbdHubToRoute = firstStop;
            break;
          }
        }
      }
      if (!cbdHubToRoute) {
        cbdHubToRoute = findAnyRouteHub(toRoute);
        toHubPenalty = 100;
      }
      if (!cbdHubToRoute) continue;
      
      const toSegment = getRouteSegment(toRoute, cbdHubToRoute, toStop);
      if (!toSegment.isValid) continue;
      
      const walkInfo = areStopsInSameCBDZone(cbdHubFromRoute, cbdHubToRoute);
      if (!walkInfo.inSameZone) continue;
      
      const transferPenalty = 50;
      const score = fromSegment.stops.length + toSegment.stops.length + transferPenalty + toHubPenalty;
      
      if (score < bestScore) {
        bestScore = score;
        
        const segments: JourneySegment[] = [
          {
            route: fromRoute,
            fromStop,
            toStop: cbdHubFromRoute,
            stops: fromSegment.stops
          },
          {
            route: null,
            fromStop: cbdHubFromRoute,
            toStop: cbdHubToRoute,
            stops: [cbdHubFromRoute, cbdHubToRoute],
            isWalking: true,
            walkingDistance: walkInfo.walkDistance
          },
          {
            route: toRoute,
            fromStop: cbdHubToRoute,
            toStop,
            stops: toSegment.stops
          }
        ];
        
        const allStops = [
          ...fromSegment.stops,
          ...toSegment.stops
        ];
        
        bestJourney = {
          segments,
          totalStops: allStops
        };
      }
    }
  }

  return bestJourney;
}
