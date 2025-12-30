// TransitManager - GTFS data parsing, spatial indexing, and route-finding
import { fetchStopsData, fetchRoutesData } from '@/data/raw_assets';

// Interfaces
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

export interface RouteSegment {
  route: Route;
  fromStop: Stop;
  toStop: Stop;
  direction: 'forward' | 'backward';
}

export interface JourneyPlan {
  type: 'direct' | 'transfer';
  segments: RouteSegment[];
  totalDistance: number;
  instructions: string[];
  journeyStops?: Stop[];
}

// CBD hub stops for transfers
const CBD_HUBS = ['Kencom', 'Koja', 'Odeon', 'Bus Station', 'GPO', 'Hilton', 'Fire Station'];

class TransitManager {
  private stops: Map<string, Stop> = new Map();
  private stopsByName: Map<string, Stop> = new Map();
  private routes: Map<string, Route> = new Map();
  private spatialGrid: Map<string, Stop[]> = new Map();
  private routesByStop: Map<string, Route[]> = new Map();
  private initialized = false;

  // Grid size in degrees (~1km at Nairobi's latitude)
  private readonly GRID_SIZE = 0.009; // ~1km

  constructor() {
    // Initialize asynchronously
    this.initializeAsync();
  }

  private async initializeAsync() {
    if (this.initialized) return;
    
    await this.parseStops();
    await this.parseRoutes();
    this.buildSpatialGrid();
    this.buildRoutesByStopIndex();
    this.initialized = true;
  }

  private async parseStops() {
    const stopsData = await fetchStopsData();
    const lines = stopsData.trim().split('\n');
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 4) {
        const stop: Stop = {
          id: parts[0].trim(),
          name: parts[1].trim(),
          lat: parseFloat(parts[2].trim()),
          lon: parseFloat(parts[3].trim()),
        };
        this.stops.set(stop.id, stop);
        this.stopsByName.set(stop.name.toLowerCase(), stop);
      }
    }
  }

  private async parseRoutes() {
    const routesData = await fetchRoutesData();
    const lines = routesData.trim().split('\n');
    const routeMap: Map<string, { shortName: string; longName: string }> = new Map();

    // Parse route definitions
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 4) {
        const routeId = parts[0].trim();
        const shortName = parts[2].trim();
        const longName = parts[3].trim();
        
        if (!routeMap.has(routeId)) {
          routeMap.set(routeId, { shortName, longName });
        }
      }
    }

    // Create routes with stops from major hubs
    const hubStops = this.getHubStops();
    routeMap.forEach((data, routeId) => {
      const route: Route = {
        id: routeId,
        shortName: data.shortName,
        longName: data.longName,
        stops: this.generateRouteStops(data.longName, hubStops),
      };
      this.routes.set(routeId, route);
    });
  }

  private getHubStops(): Stop[] {
    const hubs = ['Kencom', 'Koja', 'Ngara', 'Odeon', 'Bus Station', 'Westlands', 'Eastleigh', 'Roysambu'];
    return hubs.map(name => this.getStopByName(name)).filter(s => s) as Stop[];
  }

  private generateRouteStops(routeName: string, hubStops: Stop[]): Stop[] {
    const allStops = Array.from(this.stops.values());
    const routeStops: Stop[] = [];
    
    // Add relevant stops based on route name
    const nameParts = routeName.toLowerCase().split('-');
    
    for (const part of nameParts) {
      const matchingStops = allStops.filter(stop => 
        stop.name.toLowerCase().includes(part.trim()) ||
        part.trim().includes(stop.name.toLowerCase().split(' ')[0])
      );
      routeStops.push(...matchingStops.slice(0, 2));
    }
    
    // Add some hub stops for connectivity
    routeStops.push(...hubStops.slice(0, 3));
    
    // Remove duplicates and limit
    const uniqueStops = routeStops.filter((stop, index, arr) => 
      arr.findIndex(s => s.id === stop.id) === index
    );
    
    return uniqueStops.slice(0, 8);
  }

  private buildSpatialGrid() {
    this.stops.forEach(stop => {
      const key = this.getGridKey(stop.lat, stop.lon);
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, []);
      }
      this.spatialGrid.get(key)!.push(stop);
    });
  }

  private buildRoutesByStopIndex() {
    this.routes.forEach(route => {
      route.stops.forEach(stop => {
        if (!this.routesByStop.has(stop.id)) {
          this.routesByStop.set(stop.id, []);
        }
        const routes = this.routesByStop.get(stop.id)!;
        if (!routes.find(r => r.id === route.id)) {
          routes.push(route);
        }
      });
    });
  }

  private getGridKey(lat: number, lon: number): string {
    const latIndex = Math.floor(lat / this.GRID_SIZE);
    const lonIndex = Math.floor(lon / this.GRID_SIZE);
    return `${latIndex},${lonIndex}`;
  }

  // Haversine formula for distance in meters
  public haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Public API methods

  /**
   * Get stops near a given location (checks neighboring grid cells)
   */
  getNearbyStops(lat: number, lon: number, radiusMeters: number = 1000): Stop[] {
    const nearbyStops: Stop[] = [];
    
    // Check center cell and 8 surrounding cells
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLon = -1; dLon <= 1; dLon++) {
        const key = this.getGridKey(lat + dLat * this.GRID_SIZE, lon + dLon * this.GRID_SIZE);
        const cellStops = this.spatialGrid.get(key) || [];
        
        for (const stop of cellStops) {
          const distance = this.haversineDistance(lat, lon, stop.lat, stop.lon);
          if (distance <= radiusMeters) {
            nearbyStops.push(stop);
          }
        }
      }
    }

    return nearbyStops.sort((a, b) => 
      this.haversineDistance(lat, lon, a.lat, a.lon) - 
      this.haversineDistance(lat, lon, b.lat, b.lon)
    );
  }

  /**
   * Get a stop by name (case-insensitive)
   */
  getStopByName(name: string): Stop | undefined {
    return this.stopsByName.get(name.toLowerCase());
  }

  /**
   * Search stops by partial name match
   */
  searchStops(query: string): Stop[] {
    if (!this.initialized) {
      console.log('TransitManager not yet initialized');
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    const results: Stop[] = [];
    
    this.stopsByName.forEach((stop, name) => {
      if (name.includes(lowerQuery)) {
        results.push(stop);
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }

  /**
   * Find all routes that pass through a given stop
   */
  findRoutesForStop(stopId: string): Route[] {
    return this.routesByStop.get(stopId) || [];
  }

  /**
   * Get a route by ID
   */
  getRouteById(routeId: string): Route | undefined {
    return this.routes.get(routeId);
  }

  /**
   * Get all routes
   */
  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get all stops
   */
  getAllStops(): Stop[] {
    return Array.from(this.stops.values());
  }

  /**
   * Find the nearest route to a given position
   */
  findNearestRoute(lat: number, lon: number): Route | undefined {
    const nearbyStops = this.getNearbyStops(lat, lon, 2000);
    
    for (const stop of nearbyStops) {
      const routes = this.findRoutesForStop(stop.id);
      if (routes.length > 0) {
        return routes[0];
      }
    }

    // Fallback to first route
    return this.getAllRoutes()[0];
  }

  /**
   * Get the nearest stop to a position on a specific route
   */
  getNearestStopOnRoute(route: Route, lat: number, lon: number): { stop: Stop; index: number; distance: number } | undefined {
    let nearestStop: Stop | undefined;
    let nearestIndex = -1;
    let minDistance = Infinity;

    route.stops.forEach((stop, index) => {
      const distance = this.haversineDistance(lat, lon, stop.lat, stop.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStop = stop;
        nearestIndex = index;
      }
    });

    if (nearestStop) {
      return { stop: nearestStop, index: nearestIndex, distance: minDistance };
    }
    return undefined;
  }

  /**
   * Find route(s) between two stops with proper transfers
   */
  findRoute(fromStop: Stop, toStop: Stop): JourneyPlan | undefined {
    // Try direct route first
    const directRoute = this.findDirectRoute(fromStop, toStop);
    if (directRoute) {
      return directRoute;
    }

    // Try transfer route via hubs
    return this.findTransferRoute(fromStop, toStop);
  }

  private findDirectRoute(fromStop: Stop, toStop: Stop): JourneyPlan | undefined {
    const fromRoutes = this.findRoutesForStop(fromStop.id);

    for (const route of fromRoutes) {
      const fromIndex = route.stops.findIndex(s => s.id === fromStop.id);
      const toIndex = route.stops.findIndex(s => s.id === toStop.id);

      if (fromIndex !== -1 && toIndex !== -1) {
        const direction = toIndex > fromIndex ? 'forward' : 'backward';
        const distance = this.calculateRouteDistance(route, fromIndex, toIndex);
        const journeyStops = this.getJourneyStops(route, fromIndex, toIndex);

        return {
          type: 'direct',
          segments: [{
            route,
            fromStop,
            toStop,
            direction,
          }],
          totalDistance: distance,
          instructions: [`Take Route ${route.shortName} direct from ${fromStop.name} to ${toStop.name}`],
          journeyStops
        };
      }
    }

    return undefined;
  }

  private findTransferRoute(fromStop: Stop, toStop: Stop): JourneyPlan | undefined {
    const hubs = ['Kencom', 'Koja', 'Ngara', 'Odeon', 'Bus Station', 'Westlands'];
    
    for (const hubName of hubs) {
      const hubStop = this.getStopByName(hubName);
      if (!hubStop) continue;

      const route1 = this.findDirectRoute(fromStop, hubStop);
      const route2 = this.findDirectRoute(hubStop, toStop);

      if (route1 && route2) {
        const journeyStops = [
          ...route1.journeyStops || [fromStop, hubStop],
          ...route2.journeyStops?.slice(1) || [toStop]
        ];

        return {
          type: 'transfer',
          segments: [...route1.segments, ...route2.segments],
          totalDistance: route1.totalDistance + route2.totalDistance,
          instructions: [
            `Take Route ${route1.segments[0].route.shortName} from ${fromStop.name} to ${hubStop.name}`,
            `Transfer at ${hubStop.name}`,
            `Take Route ${route2.segments[0].route.shortName} from ${hubStop.name} to ${toStop.name}`
          ],
          journeyStops
        };
      }
    }

    return undefined;
  }

  private getJourneyStops(route: Route, fromIndex: number, toIndex: number): Stop[] {
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    return route.stops.slice(start, end + 1);
  }

  private calculateRouteDistance(route: Route, fromIndex: number, toIndex: number): number {
    let distance = 0;
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    for (let i = start; i < end; i++) {
      distance += this.haversineDistance(
        route.stops[i].lat,
        route.stops[i].lon,
        route.stops[i + 1].lat,
        route.stops[i + 1].lon
      );
    }

    return distance;
  }

  /**
   * Get the next stop on a route given current position
   */
  getNextStop(route: Route, currentStopIndex: number, direction: 'forward' | 'backward'): Stop | undefined {
    if (direction === 'forward') {
      return currentStopIndex < route.stops.length - 1 ? route.stops[currentStopIndex + 1] : undefined;
    } else {
      return currentStopIndex > 0 ? route.stops[currentStopIndex - 1] : undefined;
    }
  }
}

// Singleton instance
export const transitManager = new TransitManager();