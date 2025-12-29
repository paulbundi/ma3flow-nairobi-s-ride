export interface TrafficAdvice {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
}

type AdviceListener = (advice: TrafficAdvice) => void;

class AiAdvisorService {
  private intervalId: number | null = null;
  private listeners: AdviceListener[] = [];
  private apiUrl: string = 'https://placeholder-ai-advisor.example.com/api/traffic-advice';
  private lastAdviceId: string | null = null;

  // Mock advice for demo purposes
  private mockAdvice: TrafficAdvice[] = [
    { id: '1', message: 'Rain detected in Westlands. Consider increasing fare to 100 KES.', type: 'warning', timestamp: '' },
    { id: '2', message: 'Heavy traffic on Uhuru Highway. Suggest alternate route via Ngong Road.', type: 'alert', timestamp: '' },
    { id: '3', message: 'Rush hour ending soon. Normal fares can resume in 15 minutes.', type: 'info', timestamp: '' },
    { id: '4', message: 'High demand detected near CBD. Optimal pickup zone identified.', type: 'success', timestamp: '' },
    { id: '5', message: 'Accident reported on Mombasa Road. Expect 20 min delays.', type: 'alert', timestamp: '' },
  ];

  start() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.pollForAdvice();
    }, 30000);

    // Send initial advice after a short delay
    setTimeout(() => this.pollForAdvice(), 3000);
    console.log('AiAdvisorService started - polling every 30 seconds');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('AiAdvisorService stopped');
    }
  }

  setApiUrl(url: string) {
    this.apiUrl = url;
  }

  subscribe(listener: AdviceListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(advice: TrafficAdvice) {
    this.listeners.forEach(listener => listener(advice));
  }

  private async pollForAdvice() {
    try {
      const response = await fetch(this.apiUrl);
      
      if (response.ok) {
        const advice: TrafficAdvice = await response.json();
        if (advice.id !== this.lastAdviceId) {
          this.lastAdviceId = advice.id;
          this.notifyListeners(advice);
        }
      }
    } catch {
      // Use mock advice when API is not available
      this.useMockAdvice();
    }
  }

  private useMockAdvice() {
    const randomIndex = Math.floor(Math.random() * this.mockAdvice.length);
    const advice = {
      ...this.mockAdvice[randomIndex],
      id: `mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.notifyListeners(advice);
  }
}

export const aiAdvisorService = new AiAdvisorService();
