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
  route: Route;
  fromStop: Stop;
  toStop: Stop;
  stops: Stop[];
}

export interface Journey {
  segments: JourneySegment[];
  totalStops: Stop[];
}

let stopsCache: Stop[] | null = null;
let routesCache: Route[] | null = null;

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
  });

  return stopsCache;
}

function findStopByName(routeName: string, stops: Stop[]): Stop | undefined {
  const routeNameLower = routeName.toLowerCase().trim();
  
  let stop = stops.find(s => s.name.toLowerCase() === routeNameLower);
  if (stop) return stop;
  
  stop = stops.find(s => s.name.toLowerCase().startsWith(routeNameLower));
  if (stop) return stop;
  
  stop = stops.find(s => routeNameLower.startsWith(s.name.toLowerCase()));
  if (stop) return stop;
  
  stop = stops.find(s => s.name.toLowerCase().includes(routeNameLower));
  if (stop) return stop;
  
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

function stopMatches(routeStop: Stop, userStop: Stop): boolean {
  if (routeStop.id === userStop.id) return true;
  
  const routeNameLower = routeStop.name.toLowerCase();
  const userNameLower = userStop.name.toLowerCase();
  
  if (routeNameLower === userNameLower) return true;
  
  if (routeNameLower.startsWith(userNameLower) || userNameLower.startsWith(routeNameLower)) return true;
  
  const userWords = userNameLower.split(/\s+/).filter(w => w.length > 2);
  const routeWords = routeNameLower.split(/\s+/).filter(w => w.length > 2);
  
  for (const userWord of userWords) {
    for (const routeWord of routeWords) {
      if (userWord === routeWord) return true;
    }
  }
  
  return false;
}

export async function findOptimalRoute(fromStop: Stop, toStop: Stop): Promise<Journey | null> {
  const routes = await loadRoutes();
  
  const fromRoutes = routes.filter(r => 
    r.stops.some(s => stopMatches(s, fromStop))
  );
  
  console.log(`From routes for ${fromStop.name}:`, fromRoutes.map(r => ({ id: r.id, shortName: r.shortName, stops: r.stops.map(s => s.name) })));
  if (fromRoutes.length === 0) return null;

  const toRoutes = routes.filter(r => 
    r.stops.some(s => stopMatches(s, toStop))
  );
  
  console.log(`To routes for ${toStop.name}:`, toRoutes.map(r => ({ id: r.id, shortName: r.shortName, stops: r.stops.map(s => s.name) })));
  if (toRoutes.length === 0) return null;

  let bestJourney: Journey | null = null;
  let minStops = Infinity;

  // Try direct routes
  for (const route of fromRoutes) {
    const fromStopInRoute = route.stops.find(s => stopMatches(s, fromStop));
    const toStopInRoute = route.stops.find(s => stopMatches(s, toStop));
    
    if (!fromStopInRoute || !toStopInRoute) continue;
    
    const fromIdx = route.stops.indexOf(fromStopInRoute);
    const toIdx = route.stops.indexOf(toStopInRoute);
    
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
      const journey = {
        segments: [{
          route,
          fromStop,
          toStop,
          stops: route.stops.slice(fromIdx, toIdx + 1)
        }],
        totalStops: route.stops.slice(fromIdx, toIdx + 1)
      };
      console.log(`Direct route found: ${route.shortName} with ${journey.totalStops.length} stops`);
      if (journey.totalStops.length < minStops) {
        minStops = journey.totalStops.length;
        bestJourney = journey;
      }
    }
  }

  // Try routes with one transfer
  for (const fromRoute of fromRoutes) {
    const fromStopInRoute = fromRoute.stops.find(s => stopMatches(s, fromStop));
    if (!fromStopInRoute) continue;
    
    const fromIdx = fromRoute.stops.indexOf(fromStopInRoute);
    if (fromIdx === -1) continue;

    for (let i = fromIdx + 1; i < fromRoute.stops.length; i++) {
      const intermediateStop = fromRoute.stops[i];
      
      for (const toRoute of toRoutes) {
        // Check if toRoute has this intermediate stop
        const intermediateIdx = toRoute.stops.findIndex(s => stopMatches(s, intermediateStop));
        
        if (intermediateIdx === -1) {
          if (fromRoute.shortName === '30' && toRoute.shortName === '16/62') {
            console.log(`Route 30 stop "${intermediateStop.name}" not found in route 16/62`);
          }
          continue;
        }
        
        const toStopInRoute = toRoute.stops.find(s => stopMatches(s, toStop));
        if (!toStopInRoute) continue;
        
        const toIdx = toRoute.stops.indexOf(toStopInRoute);
        if (toIdx === -1 || intermediateIdx >= toIdx) continue;
        
        const segment1 = fromRoute.stops.slice(fromIdx, i + 1);
        const segment2 = toRoute.stops.slice(intermediateIdx, toIdx + 1);
        const totalStops = [...segment1, ...segment2.slice(1)];
        
        console.log(`Transfer route: ${fromRoute.shortName} -> ${toRoute.shortName} via ${intermediateStop.name} (${totalStops.length} stops)`);
        
        if (totalStops.length < minStops) {
          minStops = totalStops.length;
          bestJourney = {
            segments: [
              {
                route: fromRoute,
                fromStop,
                toStop: intermediateStop,
                stops: segment1
              },
              {
                route: toRoute,
                fromStop: intermediateStop,
                toStop,
                stops: segment2
              }
            ],
            totalStops
          };
        }
      }
    }
  }

  if (bestJourney) {
    console.log('Optimal route selected:', bestJourney.segments.map(s => ({
      routeId: s.route.id,
      routeShortName: s.route.shortName,
      from: s.fromStop.name,
      to: s.toStop.name,
      stops: s.stops.map(st => st.name)
    })));
  }

  return bestJourney;
}
