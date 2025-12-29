import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MatatuMap from '@/components/Map/MatatuMap';
import { Button } from '@/components/ui/button';
import { locationService, RouteStop, RouteType } from '@/services/LocationService';
import { matatuService, MatatuState } from '@/services/MatatuService';
import { 
  Play, 
  Pause, 
  ArrowLeft, 
  Users, 
  Banknote, 
  MapPin,
  Gauge,
  RotateCcw
} from 'lucide-react';

interface DriverScreenProps {
  onBack: () => void;
}

const DriverScreen: React.FC<DriverScreenProps> = ({ onBack }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [matatuState, setMatatuState] = useState<MatatuState>(matatuService.getState());
  const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteType>('thika');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showPassengerAlert, setShowPassengerAlert] = useState(false);

  useEffect(() => {
    const unsubscribe = matatuService.subscribe((state) => {
      setMatatuState(state);
      setTotalEarnings(matatuService.getTotalEarnings());
    });

    return () => unsubscribe();
  }, []);

  const handleToggleSimulation = () => {
    if (isSimulating) {
      locationService.stopSimulation();
      matatuService.endDuty();
    } else {
      locationService.startSimulation();
      matatuService.startDuty();
    }
    setIsSimulating(!isSimulating);
  };

  const handleRouteChange = (route: RouteType) => {
    locationService.stopSimulation();
    setIsSimulating(false);
    setSelectedRoute(route);
    locationService.setRoute(route);
  };

  const handleStopReached = (stop: RouteStop) => {
    setCurrentStop(stop);
    
    // Simulate passengers alighting
    if (stop.isStage && matatuState.passengers.length > 0) {
      const alighting = matatuService.alightPassengersAtStop(stop.name);
      if (alighting.length > 0) {
        setShowPassengerAlert(true);
        setTimeout(() => setShowPassengerAlert(false), 2000);
      }
    }
    
    // Simulate passengers boarding at stages
    if (stop.isStage && Math.random() > 0.5) {
      const destinations = locationService.getRoute()
        .filter(s => s.name !== stop.name)
        .map(s => s.name);
      
      if (destinations.length > 0) {
        const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];
        matatuService.boardPassenger(stop.name, randomDestination);
      }
    }
  };

  const handleReset = () => {
    locationService.stopSimulation();
    setIsSimulating(false);
    matatuService.resetDay();
    locationService.jumpToStop(0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl text-matatu-green">Driver Mode</h1>
            <p className="text-xs text-muted-foreground">{matatuState.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {matatuState.id}
          </span>
          <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-matatu-green animate-pulse' : 'bg-muted-foreground'}`} />
        </div>
      </header>

      {/* Route selector */}
      <div className="bg-card/50 px-4 py-2 flex gap-2 border-b border-border">
        <Button
          variant={selectedRoute === 'thika' ? 'driver' : 'outline'}
          size="sm"
          onClick={() => handleRouteChange('thika')}
        >
          Thika Road
        </Button>
        <Button
          variant={selectedRoute === 'westlands' ? 'driver' : 'outline'}
          size="sm"
          onClick={() => handleRouteChange('westlands')}
        >
          Westlands
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MatatuMap mode="driver" onStopReached={handleStopReached} />
        
        {/* Passenger alert */}
        <AnimatePresence>
          {showPassengerAlert && (
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-matatu-yellow text-primary-foreground px-4 py-2 rounded-lg font-medium"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              Passengers alighting!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats bar */}
      <div className="bg-card border-t border-border px-4 py-3">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="font-display text-2xl">{matatuState.passengers.length}</p>
            <p className="text-xs text-muted-foreground">/{matatuState.capacity}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Banknote className="w-4 h-4" />
            </div>
            <p className="font-display text-2xl text-matatu-green">
              {totalEarnings}
            </p>
            <p className="text-xs text-muted-foreground">KSh</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="font-display text-lg truncate">
              {currentStop?.name || '-'}
            </p>
            <p className="text-xs text-muted-foreground">Stop</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Gauge className="w-4 h-4" />
            </div>
            <p className="font-display text-2xl">50</p>
            <p className="text-xs text-muted-foreground">KSh/fare</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border-t border-border px-4 py-4 flex gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button
          variant="driver"
          size="lg"
          className="flex-1"
          onClick={handleToggleSimulation}
        >
          {isSimulating ? (
            <>
              <Pause className="w-5 h-5" />
              Stop Route
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Route
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DriverScreen;
