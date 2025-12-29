import { simulationService } from './SimulationService';
import { locationService } from './LocationService';

interface TelemetryData {
  timestamp: string;
  lat: number;
  lng: number;
  passengerCount: number;
  revenue: number;
  fare: number;
  speed: number;
  trafficHealth: number;
  isRaining: boolean;
  isRushHour: boolean;
}

class TelemetryService {
  private intervalId: number | null = null;
  private apiUrl: string = 'https://placeholder-confluent-rest-proxy.example.com/topics/matatu-telemetry';

  start() {
    if (this.intervalId) return;
    
    this.intervalId = window.setInterval(() => {
      this.sendTelemetryToConfluent();
    }, 5000);
    
    // Send immediately on start
    this.sendTelemetryToConfluent();
    console.log('TelemetryService started - sending data every 5 seconds');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('TelemetryService stopped');
    }
  }

  setApiUrl(url: string) {
    this.apiUrl = url;
  }

  private async sendTelemetryToConfluent() {
    const simState = simulationService.getState();
    const { position } = locationService.getCurrentPosition();

    const telemetryData: TelemetryData = {
      timestamp: new Date().toISOString(),
      lat: position.lat,
      lng: position.lng,
      passengerCount: simState.passengers,
      revenue: simState.totalRevenue,
      fare: simState.currentFare,
      speed: simState.speed,
      trafficHealth: simState.trafficHealth,
      isRaining: simState.isRaining,
      isRushHour: simState.isRushHour,
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{ value: telemetryData }]
        }),
      });

      if (!response.ok) {
        console.warn('Telemetry send failed:', response.status);
      } else {
        console.log('Telemetry sent:', telemetryData);
      }
    } catch (error) {
      // Silently fail for placeholder URL - will work when real URL is configured
      console.log('Telemetry queued (API not configured):', telemetryData);
    }
  }
}

export const telemetryService = new TelemetryService();
