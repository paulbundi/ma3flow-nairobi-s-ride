// LocationService - Simulates GPS movement along predefined Nairobi routes

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteStop {
  name: string;
  coordinates: Coordinates;
  isStage: boolean; // Major matatu stage
}

// Thika Road route - One of Nairobi's busiest matatu routes
export const THIKA_ROAD_ROUTE: RouteStop[] = [
  { name: "Kencom", coordinates: { lat: -1.2864, lng: 36.8172 }, isStage: true },
  { name: "Fire Station", coordinates: { lat: -1.2831, lng: 36.8200 }, isStage: false },
  { name: "Globe Cinema", coordinates: { lat: -1.2798, lng: 36.8230 }, isStage: true },
  { name: "Ngara", coordinates: { lat: -1.2745, lng: 36.8285 }, isStage: true },
  { name: "Pangani", coordinates: { lat: -1.2680, lng: 36.8350 }, isStage: true },
  { name: "Muthaiga", coordinates: { lat: -1.2580, lng: 36.8380 }, isStage: false },
  { name: "Roasters", coordinates: { lat: -1.2450, lng: 36.8485 }, isStage: true },
  { name: "Survey", coordinates: { lat: -1.2380, lng: 36.8550 }, isStage: false },
  { name: "Kasarani", coordinates: { lat: -1.2250, lng: 36.8650 }, isStage: true },
  { name: "Roysambu", coordinates: { lat: -1.2100, lng: 36.8750 }, isStage: true },
  { name: "Githurai 45", coordinates: { lat: -1.1980, lng: 36.8900 }, isStage: true },
  { name: "Kahawa West", coordinates: { lat: -1.1850, lng: 36.9050 }, isStage: true },
];

// CBD to Westlands route
export const WESTLANDS_ROUTE: RouteStop[] = [
  { name: "Kencom", coordinates: { lat: -1.2864, lng: 36.8172 }, isStage: true },
  { name: "University Way", coordinates: { lat: -1.2810, lng: 36.8150 }, isStage: false },
  { name: "Kenyatta Avenue", coordinates: { lat: -1.2830, lng: 36.8100 }, isStage: false },
  { name: "Uhuru Highway", coordinates: { lat: -1.2850, lng: 36.8050 }, isStage: false },
  { name: "Museum Hill", coordinates: { lat: -1.2750, lng: 36.8050 }, isStage: false },
  { name: "Westlands", coordinates: { lat: -1.2650, lng: 36.8030 }, isStage: true },
  { name: "Sarit Centre", coordinates: { lat: -1.2580, lng: 36.7980 }, isStage: true },
];

export type RouteType = 'thika' | 'westlands';

class LocationService {
  private currentIndex: number = 0;
  private route: RouteStop[] = THIKA_ROAD_ROUTE;
  private isMoving: boolean = false;
  private subscribers: Set<(position: Coordinates, stop: RouteStop) => void> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private direction: 'forward' | 'backward' = 'forward';
  private speed: number = 2000; // ms between stops

  setRoute(routeType: RouteType) {
    this.route = routeType === 'thika' ? THIKA_ROAD_ROUTE : WESTLANDS_ROUTE;
    this.currentIndex = 0;
    this.notifySubscribers();
  }

  getRoute(): RouteStop[] {
    return this.route;
  }

  getCurrentPosition(): { position: Coordinates; stop: RouteStop } {
    const stop = this.route[this.currentIndex];
    return { position: stop.coordinates, stop };
  }

  setSpeed(speedMs: number) {
    this.speed = speedMs;
    if (this.isMoving) {
      this.stopSimulation();
      this.startSimulation();
    }
  }

  subscribe(callback: (position: Coordinates, stop: RouteStop) => void) {
    this.subscribers.add(callback);
    // Immediately notify new subscriber of current position
    const { position, stop } = this.getCurrentPosition();
    callback(position, stop);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const { position, stop } = this.getCurrentPosition();
    this.subscribers.forEach(callback => callback(position, stop));
  }

  startSimulation() {
    if (this.isMoving) return;
    
    this.isMoving = true;
    this.intervalId = setInterval(() => {
      this.moveNext();
    }, this.speed);
  }

  stopSimulation() {
    this.isMoving = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private moveNext() {
    if (this.direction === 'forward') {
      if (this.currentIndex < this.route.length - 1) {
        this.currentIndex++;
      } else {
        this.direction = 'backward';
        this.currentIndex--;
      }
    } else {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.direction = 'forward';
        this.currentIndex++;
      }
    }
    
    this.notifySubscribers();
  }

  jumpToStop(index: number) {
    if (index >= 0 && index < this.route.length) {
      this.currentIndex = index;
      this.notifySubscribers();
    }
  }

  isSimulationRunning(): boolean {
    return this.isMoving;
  }
}

// Singleton instance
export const locationService = new LocationService();
