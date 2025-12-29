import { useState, useEffect, useCallback } from 'react';
import { simulationService, SimulationState, BoardingEvent } from '@/services/SimulationService';

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(simulationService.getState());
  const [isRunning, setIsRunning] = useState(simulationService.isSimulationRunning());

  useEffect(() => {
    const unsubscribe = simulationService.subscribe((newState) => {
      setState(newState);
      setIsRunning(simulationService.isSimulationRunning());
    });

    return () => { unsubscribe(); };
  }, []);

  const start = useCallback(() => {
    simulationService.start();
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    simulationService.stop();
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    simulationService.reset();
    setIsRunning(false);
  }, []);

  const setRaining = useCallback((value: boolean) => {
    simulationService.setRaining(value);
  }, []);

  const setRushHour = useCallback((value: boolean) => {
    simulationService.setRushHour(value);
  }, []);

  const setTrafficHealth = useCallback((value: number) => {
    simulationService.setTrafficHealth(value);
  }, []);

  return {
    state,
    isRunning,
    start,
    stop,
    reset,
    setRaining,
    setRushHour,
    setTrafficHealth,
  };
}

export function useBoardingEvents(callback: (event: BoardingEvent) => void) {
  useEffect(() => {
    const unsubscribe = simulationService.onBoarding(callback);
    return () => { unsubscribe(); };
  }, [callback]);
}
