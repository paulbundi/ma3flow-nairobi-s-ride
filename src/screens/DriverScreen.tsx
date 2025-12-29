import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import MatatuMap from '@/components/Map/MatatuMap';
import DriverHUD from '@/components/HUD/DriverHUD';
import SimulationControls from '@/components/HUD/SimulationControls';
import BoardingToast from '@/components/HUD/BoardingToast';
import { AiAssistantBubble } from '@/components/HUD/AiAssistantBubble';
import { Button } from '@/components/ui/button';
import { locationService, RouteStop } from '@/services/LocationService';
import { useSimulation, useBoardingEvents } from '@/hooks/useSimulation';
import { BoardingEvent, simulationService } from '@/services/SimulationService';
import { telemetryService } from '@/services/TelemetryService';
import { aiAdvisorService } from '@/services/AiAdvisorService';
import { transitManager, Route, Stop } from '@/services/TransitManager';
import { ArrowLeft, Route as RouteIcon, Navigation } from 'lucide-react';

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

  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [nextStop, setNextStop] = useState<Stop | null>(null);
  const [distanceToNextStop, setDistanceToNextStop] = useState(0);
  const [currentPosition, setCurrentPosition] = useState({ lat: -1.2864, lng: 36.8172 });
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  
  // Boarding toast state
  const [currentBoardingEvent, setCurrentBoardingEvent] = useState<BoardingEvent | null>(null);
  const [showBoardingToast, setShowBoardingToast] = useState(false);

  // Movement simulation
  const movementRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef<'forward' | 'backward'>('forward');

  // Initialize with nearest route based on simulated GPS
  useEffect(() => {
    const routes = transitManager.getAllRoutes();
    setAvailableRoutes(routes);
    
    // Find nearest route to current position
    const nearestRoute = transitManager.findNearestRoute(currentPosition.lat, currentPosition.lng);
    if (nearestRoute) {
      setActiveRoute(nearestRoute);
      setCurrentStopIndex(0);
      updateNextStop(nearestRoute, 0);
    }
  }, []);

  // Update next stop info
  const updateNextStop = useCallback((route: Route, currentIdx: number) => {
    const next = transitManager.getNextStop(route, currentIdx, directionRef.current);
    setNextStop(next || null);
    
    if (next && route.stops[currentIdx]) {
      const current = route.stops[currentIdx];
      const distance = transitManager.haversineDistance(
        current.lat, current.lon,
        next.lat, next.lon
      );
      setDistanceToNextStop(Math.round(distance));
    }
  }, []);

  // Handle boarding events
  const handleBoardingEvent = useCallback((event: BoardingEvent) => {
    setCurrentBoardingEvent(event);
    setShowBoardingToast(true);
    
    setTimeout(() => {
      setShowBoardingToast(false);
    }, 3000);
  }, []);

  useBoardingEvents(handleBoardingEvent);

  // Simulate movement along route
  useEffect(() => {
    if (isRunning && activeRoute) {
      movementRef.current = setInterval(() => {
        setCurrentStopIndex(prev => {
          let newIndex = prev;
          
          if (directionRef.current === 'forward') {
            if (prev < activeRoute.stops.length - 1) {
              newIndex = prev + 1;
            } else {
              directionRef.current = 'backward';
              newIndex = prev - 1;
            }
          } else {
            if (prev > 0) {
              newIndex = prev - 1;
            } else {
              directionRef.current = 'forward';
              newIndex = prev + 1;
            }
          }
          
          // Update position
          const stop = activeRoute.stops[newIndex];
          if (stop) {
            setCurrentPosition({ lat: stop.lat, lng: stop.lon });
            
            // Trigger boarding at each stop
            simulationService.triggerBoarding();
          }
          
          updateNextStop(activeRoute, newIndex);
          return newIndex;
        });
      }, 2000);

      telemetryService.start();
      aiAdvisorService.start();
    } else {
      if (movementRef.current) {
        clearInterval(movementRef.current);
        movementRef.current = null;
      }
      telemetryService.stop();
      aiAdvisorService.stop();
    }

    return () => {
      if (movementRef.current) {
        clearInterval(movementRef.current);
      }
    };
  }, [isRunning, activeRoute, updateNextStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      telemetryService.stop();
      aiAdvisorService.stop();
    };
  }, []);

  const handleRouteChange = (route: Route) => {
    stop();
    reset();
    setActiveRoute(route);
    setCurrentStopIndex(0);
    directionRef.current = 'forward';
    updateNextStop(route, 0);
    
    if (route.stops[0]) {
      setCurrentPosition({ lat: route.stops[0].lat, lng: route.stops[0].lon });
    }
    setShowRouteSelector(false);
  };

  const handleBack = () => {
    stop();
    reset();
    locationService.stopSimulation();
    onBack();
  };

  const currentStop = activeRoute?.stops[currentStopIndex];

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
          <RouteIcon className="w-4 h-4 mr-2" />
          {activeRoute ? `Route ${activeRoute.shortName}` : 'Select Route'}
        </Button>
      </motion.div>

      {/* Route selector dropdown */}
      {showRouteSelector && (
        <motion.div 
          className="absolute top-16 right-4 z-30 bg-card rounded-lg border border-border shadow-lg overflow-hidden max-h-80 overflow-y-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {availableRoutes.map(route => (
            <button
              key={route.id}
              className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${activeRoute?.id === route.id ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => handleRouteChange(route)}
            >
              <div className="font-medium">Route {route.shortName}</div>
              <div className="text-xs text-muted-foreground">{route.longName}</div>
            </button>
          ))}
        </motion.div>
      )}

      {/* Full screen map */}
      <div className="absolute inset-0">
        <MatatuMap 
          mode="driver" 
          activeRoute={activeRoute}
          currentPosition={currentPosition}
          currentStopIndex={currentStopIndex}
        />
      </div>

      {/* HUD Overlay */}
      <DriverHUD 
        state={simState} 
        nextStop={nextStop}
        distanceToNextStop={distanceToNextStop}
        currentRoute={activeRoute}
      />

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
            <Navigation className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Current Stop
              </p>
              <p className="font-display text-lg">{currentStop.name}</p>
            </div>
            {nextStop && (
              <div className="ml-4 pl-4 border-l border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Next Stop ({distanceToNextStop}m)
                </p>
                <p className="font-display text-lg text-matatu-yellow">{nextStop.name}</p>
              </div>
            )}
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
