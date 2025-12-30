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
  route: Route | null; // null for walking segments
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

// CBD Transfer Zones - stops in the same zone can be walked between
const CBD_TRANSFER_ZONES = [
  {
    name: 'CBD Central',
    stopNames: ['odeon', 'otc', 'koja', 'kencom', 'bus station', 'gpo', 'commercial', 'tusker', 'archives', 'ronald ngala', 'fire station', 'landhies'],
    center: { lat: -1.284, lon: 36.827 },
    radius: 800 // meters
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

// Haversine distance calculation in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
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
  
  // Try exact match first
  let stop = stops.find(s => s.name.toLowerCase() === routeNameLower);
  if (stop) return stop;
  
  // Try starts with
  stop = stops.find(s => s.name.toLowerCase().startsWith(routeNameLower));
  if (stop) return stop;
  
  // Try reverse starts with
  stop = stops.find(s => routeNameLower.startsWith(s.name.toLowerCase()));
  if (stop) return stop;
  
  // Try contains
  stop = stops.find(s => s.name.toLowerCase().includes(routeNameLower));
  if (stop) return stop;
  
  // Try word matching for compound names
  const routeWords = routeNameLower.split(/[\s-]+/).filter(w => w.length > 2);
  for (const word of routeWords) {
    stop = stops.find(s => s.name.toLowerCase().includes(word));
    if (stop) return stop;
  }
  
  return undefined;
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
    
    const routeStopNames = longName.split('-').map(s => s.trim());
    const routeStops: Stop[] = [];
    const usedStopIds = new Set<string>();
    
    for (const name of routeStopNames) {
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

  return routesCache;
}

export async function searchStops(query: string): Promise<Stop[]> {
  const stops = await loadStops();
  const lowerQuery = query.toLowerCase();
  return stops.filter(stop => stop.name.toLowerCase().includes(lowerQuery));
}

// Check if a route stop matches a user-selected stop (with fuzzy matching)
function stopMatches(routeStop: Stop, userStop: Stop): boolean {
  // Exact ID match
  if (routeStop.id === userStop.id) return true;
  
  // Name-based matching
  const routeNameLower = routeStop.name.toLowerCase();
  const userNameLower = userStop.name.toLowerCase();
  
  if (routeNameLower === userNameLower) return true;
  if (routeNameLower.includes(userNameLower) || userNameLower.includes(routeNameLower)) return true;
  
  return false;
}

// Check if two stops are in the same CBD transfer zone
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
  
  // Also check direct proximity (< 800m walking distance)
  const directDistance = haversineDistance(stop1.lat, stop1.lon, stop2.lat, stop2.lon);
  if (directDistance < 800) {
    return { inSameZone: true, zoneName: 'Walking Transfer', walkDistance: directDistance };
  }
  
  return { inSameZone: false };
}

// Find CBD hub stops for a route
function findCBDHubsOnRoute(route: Route): Stop[] {
  const hubs: Stop[] = [];
  
  for (const stop of route.stops) {
    const stopNameLower = stop.name.toLowerCase();
    for (const zone of CBD_TRANSFER_ZONES) {
      const isHub = zone.stopNames.some(name => stopNameLower.includes(name) || name.includes(stopNameLower));
      if (isHub && !hubs.find(h => h.id === stop.id)) {
        hubs.push(stop);
      }
    }
  }
  
  return hubs;
}

export async function findOptimalRoute(fromStop: Stop, toStop: Stop): Promise<Journey | null> {
  const routes = await loadRoutes();
  
  // Find routes that serve fromStop
  const fromRoutes = routes.filter(r => 
    r.stops.some(s => stopMatches(s, fromStop))
  );
  
  console.log(`Routes serving ${fromStop.name}:`, fromRoutes.map(r => r.shortName));
  if (fromRoutes.length === 0) return null;

  // Find routes that serve toStop
  const toRoutes = routes.filter(r => 
    r.stops.some(s => stopMatches(s, toStop))
  );
  
  console.log(`Routes serving ${toStop.name}:`, toRoutes.map(r => r.shortName));
  if (toRoutes.length === 0) return null;

  let bestJourney: Journey | null = null;
  let bestScore = Infinity;

  // === Strategy 1: Try direct routes ===
  for (const route of fromRoutes) {
    const fromStopInRoute = route.stops.find(s => stopMatches(s, fromStop));
    const toStopInRoute = route.stops.find(s => stopMatches(s, toStop));
    
    if (!fromStopInRoute || !toStopInRoute) continue;
    
    const fromIdx = route.stops.indexOf(fromStopInRoute);
    const toIdx = route.stops.indexOf(toStopInRoute);
    
    // Check both directions
    const directIdx = fromIdx < toIdx ? { from: fromIdx, to: toIdx } : null;
    const reverseIdx = fromIdx > toIdx ? { from: toIdx, to: fromIdx } : null;
    
    const validIdx = directIdx || reverseIdx;
    if (!validIdx) continue;
    
    const segmentStops = route.stops.slice(validIdx.from, validIdx.to + 1);
    const score = segmentStops.length; // Direct routes get a bonus
    
    console.log(`Direct route: ${route.shortName} with ${segmentStops.length} stops`);
    
    if (score < bestScore) {
      bestScore = score;
      bestJourney = {
        segments: [{
          route,
          fromStop,
          toStop,
          stops: directIdx ? segmentStops : segmentStops.reverse()
        }],
        totalStops: directIdx ? segmentStops : segmentStops.reverse()
      };
    }
  }

  // === Strategy 2: CBD Zone-based transfers (supports bidirectional routes) ===
  for (const fromRoute of fromRoutes) {
    const fromStopInRoute = fromRoute.stops.find(s => stopMatches(s, fromStop));
    if (!fromStopInRoute) continue;
    
    const fromIdx = fromRoute.stops.indexOf(fromStopInRoute);
    
    // Find CBD hubs this route goes to
    const fromRouteHubs = findCBDHubsOnRoute(fromRoute);
    
    for (const toRoute of toRoutes) {
      // Skip if same route (already handled above)
      if (fromRoute.id === toRoute.id) continue;
      
      const toStopInRoute = toRoute.stops.find(s => stopMatches(s, toStop));
      if (!toStopInRoute) continue;
      
      const toIdx = toRoute.stops.indexOf(toStopInRoute);
      
      // Find CBD hubs on toRoute
      const toRouteHubs = findCBDHubsOnRoute(toRoute);
      
      // Check for zone-based transfer opportunities
      for (const fromHub of fromRouteHubs) {
        const fromHubIdx = fromRoute.stops.indexOf(fromHub);
        
        // Route 1 can go in either direction to the hub
        const fromSegmentStops = fromHubIdx > fromIdx 
          ? fromRoute.stops.slice(fromIdx, fromHubIdx + 1)
          : fromRoute.stops.slice(fromHubIdx, fromIdx + 1).reverse();
        
        if (fromSegmentStops.length === 0) continue;
        
        for (const toHub of toRouteHubs) {
          const toHubIdx = toRoute.stops.indexOf(toHub);
          
          // Route 2 can go in either direction from the hub
          const toSegmentStops = toIdx > toHubIdx
            ? toRoute.stops.slice(toHubIdx, toIdx + 1)
            : toRoute.stops.slice(toIdx, toHubIdx + 1).reverse();
          
          if (toSegmentStops.length === 0) continue;
          
          // Check if these hubs are in the same CBD zone
          const zoneMatch = areStopsInSameCBDZone(fromHub, toHub);
          if (!zoneMatch.inSameZone) continue;
          
          // Score: total stops + transfer penalty + walking distance penalty
          const walkPenalty = (zoneMatch.walkDistance || 0) / 200; // 200m = 1 stop equivalent
          let score = fromSegmentStops.length + toSegmentStops.length + 2 + walkPenalty;

          // Bonus for CBD zone transfers
          if (zoneMatch.inSameZone) score -= 5;

          console.log(`Transfer route: ${fromRoute.shortName} → ${toRoute.shortName} via ${fromHub.name}↔${toHub.name} (${zoneMatch.zoneName}, ${Math.round(zoneMatch.walkDistance || 0)}m walk) - Score: ${score.toFixed(1)}`);
          
          if (score < bestScore) {
            bestScore = score;
            
            const segments: JourneySegment[] = [
              {
                route: fromRoute,
                fromStop,
                toStop: fromHub,
                stops: fromSegmentStops
              }
            ];
            
            // Add walking segment if different stops
            if (fromHub.id !== toHub.id) {
              segments.push({
                route: null,
                fromStop: fromHub,
                toStop: toHub,
                stops: [fromHub, toHub],
                isWalking: true,
                walkingDistance: zoneMatch.walkDistance
              });
            }
            
            segments.push({
              route: toRoute,
              fromStop: toHub,
              toStop,
              stops: toSegmentStops
            });
            
            bestJourney = {
              segments,
              totalStops: [...fromSegmentStops, ...toSegmentStops.slice(1)]
            };
          }
        }
      }
      
      // === Strategy 3: Any overlapping stop transfer (bidirectional) ===
      for (let i = 0; i < fromRoute.stops.length; i++) {
        if (i === fromIdx) continue; // Skip the boarding stop
        
        const intermediateStop = fromRoute.stops[i];
        
        for (let j = 0; j < toRoute.stops.length; j++) {
          if (j === toIdx) continue; // Skip the alighting stop
          
          const toRouteStop = toRoute.stops[j];
          
          // Check direct match or zone match
          const directMatch = stopMatches(intermediateStop, toRouteStop);
          const zoneMatch = !directMatch ? areStopsInSameCBDZone(intermediateStop, toRouteStop) : { inSameZone: false };
          
          if (!directMatch && !zoneMatch.inSameZone) continue;
          
          // Build segments in correct direction
          const segment1Stops = i > fromIdx
            ? fromRoute.stops.slice(fromIdx, i + 1)
            : fromRoute.stops.slice(i, fromIdx + 1).reverse();
          
          const segment2Stops = toIdx > j
            ? toRoute.stops.slice(j, toIdx + 1)
            : toRoute.stops.slice(toIdx, j + 1).reverse();
          
          if (segment1Stops.length === 0 || segment2Stops.length === 0) continue;
          
          const walkPenalty = zoneMatch.inSameZone ? (zoneMatch.walkDistance || 0) / 200 : 0;
          let score = segment1Stops.length + segment2Stops.length + 2 + walkPenalty;

          // Bonus for zone-based transfers
          if (zoneMatch.inSameZone) score -= 5;

          if (score < bestScore) {
            bestScore = score;
            
            const segments: JourneySegment[] = [
              {
                route: fromRoute,
                fromStop,
                toStop: intermediateStop,
                stops: segment1Stops
              }
            ];
            
            // Add walking segment if zone transfer
            if (zoneMatch.inSameZone && intermediateStop.id !== toRouteStop.id) {
              segments.push({
                route: null,
                fromStop: intermediateStop,
                toStop: toRouteStop,
                stops: [intermediateStop, toRouteStop],
                isWalking: true,
                walkingDistance: zoneMatch.walkDistance
              });
            }
            
            segments.push({
              route: toRoute,
              fromStop: directMatch ? intermediateStop : toRouteStop,
              toStop,
              stops: segment2Stops
            });
            
            bestJourney = {
              segments,
              totalStops: [...segment1Stops, ...segment2Stops.slice(1)]
            };
          }
        }
      }
    }
  }

  if (bestJourney) {
    console.log('=== Optimal Journey ===');
    bestJourney.segments.forEach((seg, idx) => {
      if (seg.isWalking) {
        console.log(`  ${idx + 1}. WALK from ${seg.fromStop.name} to ${seg.toStop.name} (${Math.round(seg.walkingDistance || 0)}m)`);
      } else {
        console.log(`  ${idx + 1}. Route ${seg.route?.shortName}: ${seg.fromStop.name} → ${seg.toStop.name} (${seg.stops.length} stops)`);
      }
    });
  }

  return bestJourney;
}
