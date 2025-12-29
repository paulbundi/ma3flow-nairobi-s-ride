// MatatuService - Manages matatu state, passengers, and fare calculation

export interface Passenger {
  id: string;
  boardingStop: string;
  destination: string;
  fare: number;
}

export interface MatatuState {
  id: string;
  name: string;
  route: string;
  capacity: number;
  passengers: Passenger[];
  fare: number; // Current fare per section
  isOnDuty: boolean;
}

// Common matatu names/slogans in Nairobi
const MATATU_NAMES = [
  "Speed Governor",
  "No Limits",
  "Bahati Bila Sababu",
  "Sheng Master",
  "Thika Road Express",
  "City Hoppa",
  "KBS Classic",
  "Double M",
];

class MatatuService {
  private state: MatatuState;
  private subscribers: Set<(state: MatatuState) => void> = new Set();
  private totalEarnings: number = 0;

  constructor() {
    this.state = {
      id: `MAT-${Math.floor(Math.random() * 9000) + 1000}`,
      name: MATATU_NAMES[Math.floor(Math.random() * MATATU_NAMES.length)],
      route: "Thika Road",
      capacity: 14,
      passengers: [],
      fare: 50, // KSh 50 base fare
      isOnDuty: false,
    };
  }

  getState(): MatatuState {
    return { ...this.state };
  }

  getTotalEarnings(): number {
    return this.totalEarnings;
  }

  subscribe(callback: (state: MatatuState) => void) {
    this.subscribers.add(callback);
    callback(this.getState());
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const state = this.getState();
    this.subscribers.forEach(callback => callback(state));
  }

  startDuty() {
    this.state.isOnDuty = true;
    this.notifySubscribers();
  }

  endDuty() {
    this.state.isOnDuty = false;
    this.notifySubscribers();
  }

  setFare(fare: number) {
    this.state.fare = fare;
    this.notifySubscribers();
  }

  boardPassenger(boardingStop: string, destination: string): Passenger | null {
    if (this.state.passengers.length >= this.state.capacity) {
      return null; // Matatu is full
    }

    const passenger: Passenger = {
      id: `PAX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      boardingStop,
      destination,
      fare: this.state.fare,
    };

    this.state.passengers.push(passenger);
    this.totalEarnings += passenger.fare;
    this.notifySubscribers();
    
    return passenger;
  }

  alightPassenger(passengerId: string): Passenger | null {
    const index = this.state.passengers.findIndex(p => p.id === passengerId);
    if (index === -1) return null;

    const [passenger] = this.state.passengers.splice(index, 1);
    this.notifySubscribers();
    
    return passenger;
  }

  alightPassengersAtStop(stopName: string): Passenger[] {
    const alighting = this.state.passengers.filter(p => p.destination === stopName);
    this.state.passengers = this.state.passengers.filter(p => p.destination !== stopName);
    this.notifySubscribers();
    
    return alighting;
  }

  getPassengerCount(): number {
    return this.state.passengers.length;
  }

  getAvailableSeats(): number {
    return this.state.capacity - this.state.passengers.length;
  }

  resetDay() {
    this.state.passengers = [];
    this.totalEarnings = 0;
    this.state.isOnDuty = false;
    this.notifySubscribers();
  }
}

// Singleton instance
export const matatuService = new MatatuService();
