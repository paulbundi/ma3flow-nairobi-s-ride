import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MatatuMap from '@/components/Map/MatatuMap';
import { Button } from '@/components/ui/button';
import { locationService, RouteStop, RouteType } from '@/services/LocationService';
import { 
  ArrowLeft, 
  MapPin,
  Clock,
  Navigation,
  Bell,
  CheckCircle2
} from 'lucide-react';

interface PassengerScreenProps {
  onBack: () => void;
}

const PassengerScreen: React.FC<PassengerScreenProps> = ({ onBack }) => {
  const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteType>('thika');
  const [isOnBoard, setIsOnBoard] = useState(false);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [arrivedAtDestination, setArrivedAtDestination] = useState(false);

  useEffect(() => {
    setStops(locationService.getRoute());
  }, [selectedRoute]);

  const handleRouteChange = (route: RouteType) => {
    locationService.stopSimulation();
    setSelectedRoute(route);
    locationService.setRoute(route);
    setStops(locationService.getRoute());
    setDestination(null);
    setIsOnBoard(false);
    setArrivedAtDestination(false);
  };

  const handleSelectDestination = (stopName: string) => {
    setDestination(stopName);
  };

  const handleBoard = () => {
    setIsOnBoard(true);
    locationService.startSimulation();
  };

  const handleAlight = () => {
    setIsOnBoard(false);
    locationService.stopSimulation();
    setDestination(null);
    setArrivedAtDestination(false);
  };

  const handleStopReached = (stop: RouteStop) => {
    setCurrentStop(stop);
    
    if (destination && stop.name === destination) {
      setArrivedAtDestination(true);
      locationService.stopSimulation();
    }
  };

  const getStopStatus = (stop: RouteStop): 'passed' | 'current' | 'upcoming' => {
    if (!currentStop) return 'upcoming';
    
    const currentIndex = stops.findIndex(s => s.name === currentStop.name);
    const stopIndex = stops.findIndex(s => s.name === stop.name);
    
    if (stopIndex < currentIndex) return 'passed';
    if (stopIndex === currentIndex) return 'current';
    return 'upcoming';
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
            <h1 className="font-display text-xl text-matatu-yellow">Passenger Mode</h1>
            <p className="text-xs text-muted-foreground">Track your journey</p>
          </div>
        </div>
        {isOnBoard && (
          <div className="flex items-center gap-2 text-matatu-green">
            <div className="w-2 h-2 rounded-full bg-matatu-green animate-pulse" />
            <span className="text-sm font-medium">On Board</span>
          </div>
        )}
      </header>

      {/* Route selector */}
      <div className="bg-card/50 px-4 py-2 flex gap-2 border-b border-border">
        <Button
          variant={selectedRoute === 'thika' ? 'passenger' : 'outline'}
          size="sm"
          onClick={() => handleRouteChange('thika')}
          disabled={isOnBoard}
        >
          Thika Road
        </Button>
        <Button
          variant={selectedRoute === 'westlands' ? 'passenger' : 'outline'}
          size="sm"
          onClick={() => handleRouteChange('westlands')}
          disabled={isOnBoard}
        >
          Westlands
        </Button>
      </div>

      {/* Arrived notification */}
      {arrivedAtDestination && (
        <motion.div
          className="bg-matatu-green/20 border-b border-matatu-green/30 px-4 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-matatu-green" />
            <div>
              <p className="font-medium text-matatu-green">You've arrived!</p>
              <p className="text-sm text-muted-foreground">Destination: {destination}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Map */}
      <div className="h-48 md:h-64 relative">
        <MatatuMap mode="passenger" onStopReached={handleStopReached} />
      </div>

      {/* Journey info */}
      <div className="bg-card border-y border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Location</p>
              <p className="font-display text-lg">{currentStop?.name || 'Waiting...'}</p>
            </div>
          </div>
          {destination && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="font-display text-lg text-matatu-yellow">{destination}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stops list */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <h3 className="font-display text-lg mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {isOnBoard ? 'Journey Progress' : 'Select Destination'}
        </h3>
        <div className="space-y-2">
          {stops.map((stop, index) => {
            const status = getStopStatus(stop);
            const isDestination = stop.name === destination;
            
            return (
              <motion.button
                key={stop.name}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  status === 'current' 
                    ? 'bg-primary/20 border-primary' 
                    : status === 'passed'
                    ? 'bg-muted/50 border-transparent opacity-50'
                    : 'bg-card border-border hover:border-matatu-yellow'
                } ${isDestination ? 'ring-2 ring-matatu-yellow' : ''}`}
                onClick={() => !isOnBoard && handleSelectDestination(stop.name)}
                disabled={isOnBoard || status === 'passed' || status === 'current'}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${
                      stop.isStage 
                        ? status === 'current' ? 'bg-primary' : 'bg-matatu-yellow' 
                        : 'bg-muted-foreground'
                    }`} />
                    {index < stops.length - 1 && (
                      <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-6 ${
                        status === 'passed' ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${status === 'current' ? 'text-primary' : ''}`}>
                      {stop.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stop.isStage ? 'Major Stage' : 'Bus Stop'}
                    </p>
                  </div>
                  {isDestination && (
                    <Bell className="w-4 h-4 text-matatu-yellow" />
                  )}
                  {status === 'current' && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Here
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border-t border-border px-4 py-4">
        {!isOnBoard ? (
          <Button
            variant="passenger"
            size="lg"
            className="w-full"
            onClick={handleBoard}
            disabled={!destination}
          >
            <Clock className="w-5 h-5" />
            {destination ? `Board to ${destination}` : 'Select a Destination'}
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={handleAlight}
          >
            Alight / Exit
          </Button>
        )}
      </div>
    </div>
  );
};

export default PassengerScreen;
