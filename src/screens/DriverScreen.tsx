import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MatatuMap from '@/components/Map/MatatuMap';
import DriverHUD from '@/components/HUD/DriverHUD';
import SimulationControls from '@/components/HUD/SimulationControls';
import BoardingToast from '@/components/HUD/BoardingToast';
import { AiAssistantBubble } from '@/components/HUD/AiAssistantBubble';
import { Button } from '@/components/ui/button';
import { locationService, RouteStop, RouteType } from '@/services/LocationService';
import { useSimulation, useBoardingEvents } from '@/hooks/useSimulation';
import { BoardingEvent } from '@/services/SimulationService';
import { telemetryService } from '@/services/TelemetryService';
import { aiAdvisorService } from '@/services/AiAdvisorService';
import { ArrowLeft, Route } from 'lucide-react';

interface DriverScreenProps {
  onBack: () => void;
}

const DriverScreen: React.FC<DriverScreenProps> = ({ onBack }) => {
  const {
    state: simState,
    isRunning,
    start,
    stop,
    reset,
    setRaining,
    setTrafficHealth,
  } = useSimulation();

  const [selectedRoute, setSelectedRoute] = useState<RouteType>('thika');
  const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  
  // Boarding toast state
  const [currentBoardingEvent, setCurrentBoardingEvent] = useState<BoardingEvent | null>(null);
  const [showBoardingToast, setShowBoardingToast] = useState(false);

  // Handle boarding events
  const handleBoardingEvent = useCallback((event: BoardingEvent) => {
    setCurrentBoardingEvent(event);
    setShowBoardingToast(true);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowBoardingToast(false);
    }, 3000);
  }, []);

  useBoardingEvents(handleBoardingEvent);

  // Sync services with simulation
  useEffect(() => {
    if (isRunning) {
      locationService.startSimulation();
      telemetryService.start();
      aiAdvisorService.start();
    } else {
      locationService.stopSimulation();
      telemetryService.stop();
      aiAdvisorService.stop();
    }
  }, [isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      telemetryService.stop();
      aiAdvisorService.stop();
    };
  }, []);

  const handleRouteChange = (route: RouteType) => {
    stop();
    reset();
    setSelectedRoute(route);
    locationService.setRoute(route);
    setShowRouteSelector(false);
  };

  const handleStopReached = (stop: RouteStop) => {
    setCurrentStop(stop);
  };

  const handleBack = () => {
    stop();
    reset();
    locationService.stopSimulation();
    onBack();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Back button - floating */}
      <motion.div 
        className="absolute top-4 left-4 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleBack}
          className="bg-card/90 backdrop-blur-sm border-border"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Route selector button */}
      <motion.div 
        className="absolute top-4 right-4 z-30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowRouteSelector(!showRouteSelector)}
          className="bg-card/90 backdrop-blur-sm border-border"
        >
          <Route className="w-4 h-4 mr-2" />
          {selectedRoute === 'thika' ? 'Thika Rd' : 'Westlands'}
        </Button>
      </motion.div>

      {/* Route selector dropdown */}
      {showRouteSelector && (
        <motion.div 
          className="absolute top-16 right-4 z-30 bg-card rounded-lg border border-border shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${selectedRoute === 'thika' ? 'bg-primary/10 text-primary' : ''}`}
            onClick={() => handleRouteChange('thika')}
          >
            Thika Road
          </button>
          <button
            className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${selectedRoute === 'westlands' ? 'bg-primary/10 text-primary' : ''}`}
            onClick={() => handleRouteChange('westlands')}
          >
            Westlands
          </button>
        </motion.div>
      )}

      {/* Full screen map */}
      <div className="absolute inset-0">
        <MatatuMap mode="driver" onStopReached={handleStopReached} />
      </div>

      {/* HUD Overlay */}
      <DriverHUD state={simState} />

      {/* Boarding Toast */}
      <BoardingToast 
        event={currentBoardingEvent} 
        isVisible={showBoardingToast} 
      />

      {/* AI Assistant Bubble */}
      <AiAssistantBubble />

      {/* Current stop indicator */}
      {currentStop && (
        <motion.div 
          className="absolute bottom-36 left-4 right-4 z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border inline-flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentStop.isStage ? 'bg-matatu-yellow' : 'bg-muted-foreground'} ${isRunning ? 'animate-pulse' : ''}`} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {currentStop.isStage ? 'Stage' : 'Stop'}
              </p>
              <p className="font-display text-lg">{currentStop.name}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Simulation Controls */}
      <SimulationControls
        state={simState}
        isRunning={isRunning}
        onStart={start}
        onStop={stop}
        onReset={reset}
        onSetRaining={setRaining}
        onSetTrafficHealth={setTrafficHealth}
        onBack={handleBack}
      />
    </div>
  );
};

export default DriverScreen;
