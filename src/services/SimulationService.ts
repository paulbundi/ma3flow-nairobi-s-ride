// SimulationService - Core simulation engine for fare calculation and traffic

export interface SimulationState {
  currentFare: number;
  baseFare: number;
  trafficHealth: number; // 0-100, 100 = free flowing
  isRaining: boolean;
  isRushHour: boolean;
  speed: number; // km/h
  passengers: number;
  maxPassengers: number;
  totalRevenue: number;
  lastBoardingEvent: BoardingEvent | null;
}

export interface BoardingEvent {
  id: string;
  passengersBoarded: number;
  revenue: number;
  timestamp: Date;
  stopName: string;
}

type SimulationListener = (state: SimulationState) => void;
type BoardingListener = (event: BoardingEvent) => void;

// Nairobi matatu stops for boarding events
const BOARDING_STOPS = [
  "Kencom", "Globe", "Ngara", "Pangani", "Roasters", 
  "Kasarani", "Roysambu", "Githurai 45", "Kahawa West"
];

class SimulationService {
  private state: SimulationState;
  private listeners: Set<SimulationListener> = new Set();
  private boardingListeners: Set<BoardingListener> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private boardingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.state = {
      currentFare: 50,
      baseFare: 50,
      trafficHealth: 85,
      isRaining: false,
      isRushHour: this.checkRushHour(),
      speed: 0,
      passengers: 0,
      maxPassengers: 14,
      totalRevenue: 0,
      lastBoardingEvent: null,
    };
  }

  private checkRushHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 19);
  }

  calculateFare(): number {
    let fare = this.state.baseFare;
    
    // Rain multiplier
    if (this.state.isRaining) {
      fare *= 1.5;
    }
    
    // Rush hour multiplier
    if (this.state.isRushHour) {
      fare *= 1.3;
    }
    
    // Traffic congestion slight increase
    if (this.state.trafficHealth < 50) {
      fare *= 1.1;
    }
    
    return Math.round(fare);
  }

  private generateBoardingEvent(): BoardingEvent | null {
    // Only board if there's space
    const availableSeats = this.state.maxPassengers - this.state.passengers;
    if (availableSeats <= 0) return null;

    // Random passengers 1-5, but not more than available seats
    const passengersBoarded = Math.min(
      Math.floor(Math.random() * 5) + 1,
      availableSeats
    );

    const currentFare = this.calculateFare();
    const revenue = passengersBoarded * currentFare;

    const event: BoardingEvent = {
      id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      passengersBoarded,
      revenue,
      timestamp: new Date(),
      stopName: BOARDING_STOPS[Math.floor(Math.random() * BOARDING_STOPS.length)],
    };

    this.state.passengers += passengersBoarded;
    this.state.totalRevenue += revenue;
    this.state.lastBoardingEvent = event;

    return event;
  }

  private scheduleNextBoarding() {
    if (!this.isRunning) return;

    // Random interval between 10-30 seconds (using 5-15 for demo)
    const nextInterval = Math.floor(Math.random() * 10000) + 5000;
    
    this.boardingInterval = setTimeout(() => {
      const event = this.generateBoardingEvent();
      if (event) {
        this.boardingListeners.forEach(listener => listener(event));
      }
      this.notifyListeners();
      this.scheduleNextBoarding();
    }, nextInterval);
  }

  private updateSimulation() {
    // Update rush hour status
    this.state.isRushHour = this.checkRushHour();
    
    // Recalculate fare
    this.state.currentFare = this.calculateFare();
    
    // Update traffic health with some randomness
    const trafficDelta = (Math.random() - 0.5) * 5;
    this.state.trafficHealth = Math.max(0, Math.min(100, 
      this.state.trafficHealth + trafficDelta
    ));
    
    // Update speed based on traffic and conditions
    let baseSpeed = (this.state.trafficHealth / 100) * 60; // Max 60 km/h in city
    if (this.state.isRaining) baseSpeed *= 0.7;
    this.state.speed = Math.round(baseSpeed + (Math.random() - 0.5) * 10);
    this.state.speed = Math.max(0, this.state.speed);
    
    // Random passenger alighting
    if (this.state.passengers > 0 && Math.random() < 0.05) {
      const alighting = Math.min(
        Math.floor(Math.random() * 3) + 1,
        this.state.passengers
      );
      this.state.passengers -= alighting;
    }
    
    this.notifyListeners();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => this.updateSimulation(), 1000);
    this.scheduleNextBoarding();
  }

  stop() {
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.boardingInterval) {
      clearTimeout(this.boardingInterval);
      this.boardingInterval = null;
    }
  }

  reset() {
    this.stop();
    this.state = {
      currentFare: 50,
      baseFare: 50,
      trafficHealth: 85,
      isRaining: false,
      isRushHour: this.checkRushHour(),
      speed: 0,
      passengers: 0,
      maxPassengers: 14,
      totalRevenue: 0,
      lastBoardingEvent: null,
    };
    this.notifyListeners();
  }

  // Setters for simulation controls
  setRaining(isRaining: boolean) {
    this.state.isRaining = isRaining;
    this.state.currentFare = this.calculateFare();
    this.notifyListeners();
  }

  setRushHour(isRushHour: boolean) {
    this.state.isRushHour = isRushHour;
    this.state.currentFare = this.calculateFare();
    this.notifyListeners();
  }

  setTrafficHealth(health: number) {
    this.state.trafficHealth = Math.max(0, Math.min(100, health));
    this.notifyListeners();
  }

  // Getters
  getState(): SimulationState {
    return { ...this.state };
  }

  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  // Subscription methods
  subscribe(listener: SimulationListener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  onBoarding(listener: BoardingListener) {
    this.boardingListeners.add(listener);
    return () => this.boardingListeners.delete(listener);
  }

  triggerBoarding() {
    const event = this.generateBoardingEvent();
    if (event) {
      this.boardingListeners.forEach(listener => listener(event));
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

// Singleton instance
export const simulationService = new SimulationService();
