import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MatatuMap from '@/components/Map/MatatuMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { transitManager, Stop, Route, JourneyPlan } from '@/services/TransitManager';
import { 
  ArrowLeft, 
  MapPin,
  Clock,
  Navigation,
  Bell,
  CheckCircle2,
  Search,
  ArrowRight
} from 'lucide-react';

interface PassengerScreenProps {
  onBack: () => void;
}

const PassengerScreen: React.FC<PassengerScreenProps> = ({ onBack }) => {
  const [currentLocation, setCurrentLocation] = useState<Stop | null>(null);
  const [destination, setDestination] = useState<Stop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stop[]>([]);
  const [journeyPlan, setJourneyPlan] = useState<JourneyPlan | null>(null);
  const [isOnBoard, setIsOnBoard] = useState(false);
  const [journeyStops, setJourneyStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [arrivedAtDestination, setArrivedAtDestination] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize with simulated GPS location (Kencom)
  useEffect(() => {
    const nearbyStops = transitManager.getNearbyStops(-1.2864, 36.8172, 500);
    if (nearbyStops.length > 0) {
      setCurrentLocation(nearbyStops[0]);
      setUserPosition({ lat: nearbyStops[0].lat, lng: nearbyStops[0].lon });
    }
  }, []);

  // Search for destinations
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = transitManager.searchStops(query);
      setSearchResults(results.filter(s => s.id !== currentLocation?.id));
    } else {
      setSearchResults([]);
    }
  }, [currentLocation]);

  // Select destination and find route
  const handleSelectDestination = useCallback((stop: Stop) => {
    setDestination(stop);
    setSearchQuery(stop.name);
    setSearchResults([]);

    if (currentLocation) {
      const plan = transitManager.findRoute(currentLocation, stop);
      setJourneyPlan(plan || null);

      // Build journey stops list
      if (plan) {
        const stops: Stop[] = [];
        plan.segments.forEach(segment => {
          const fromIdx = segment.route.stops.findIndex(s => s.id === segment.fromStop.id);
          const toIdx = segment.route.stops.findIndex(s => s.id === segment.toStop.id);
          
          if (fromIdx !== -1 && toIdx !== -1) {
            const start = Math.min(fromIdx, toIdx);
            const end = Math.max(fromIdx, toIdx);
            for (let i = start; i <= end; i++) {
              if (!stops.find(s => s.id === segment.route.stops[i].id)) {
                stops.push(segment.route.stops[i]);
              }
            }
          }
        });
        setJourneyStops(stops);
      }
    }
  }, [currentLocation]);

  // Start journey simulation
  const handleBoard = useCallback(() => {
    if (!journeyPlan || journeyStops.length === 0) return;
    
    setIsOnBoard(true);
    setCurrentStopIndex(0);
    setUserPosition({ lat: journeyStops[0].lat, lng: journeyStops[0].lon });
  }, [journeyPlan, journeyStops]);

  // Animate journey
  useEffect(() => {
    if (!isOnBoard || journeyStops.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStopIndex(prev => {
        if (prev >= journeyStops.length - 1) {
          setArrivedAtDestination(true);
          setIsOnBoard(false);
          clearInterval(interval);
          return prev;
        }
        const nextIdx = prev + 1;
        setUserPosition({ lat: journeyStops[nextIdx].lat, lng: journeyStops[nextIdx].lon });
        return nextIdx;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isOnBoard, journeyStops]);

  const handleAlight = () => {
    setIsOnBoard(false);
    setDestination(null);
    setJourneyPlan(null);
    setJourneyStops([]);
    setArrivedAtDestination(false);
    setSearchQuery('');
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
            <p className="text-xs text-muted-foreground">Find your route</p>
          </div>
        </div>
        {isOnBoard && (
          <div className="flex items-center gap-2 text-matatu-green">
            <div className="w-2 h-2 rounded-full bg-matatu-green animate-pulse" />
            <span className="text-sm font-medium">On Board</span>
          </div>
        )}
      </header>

      {/* Search section */}
      <div className="bg-card/50 px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Navigation className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">From:</span>
          <span className="font-medium">{currentLocation?.name || 'Getting location...'}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search destination..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            disabled={isOnBoard}
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 max-h-48 overflow-y-auto z-50 shadow-lg">
              {searchResults.map(stop => (
                <button
                  key={stop.id}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                  onClick={() => handleSelectDestination(stop)}
                >
                  <MapPin className="w-4 h-4 inline mr-2 text-muted-foreground" />
                  {stop.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
              <p className="text-sm text-muted-foreground">Destination: {destination?.name}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Journey plan */}
      {journeyPlan && !isOnBoard && (
        <div className="bg-primary/10 px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1">
            {journeyPlan.type === 'direct' ? 'Direct Route' : 'Transfer Required'}
          </p>
          {journeyPlan.instructions.map((instruction, idx) => (
            <p key={idx} className="text-sm flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-primary" />
              {instruction}
            </p>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="h-64 relative">
        <MatatuMap 
          mode="passenger" 
          journeyStops={journeyStops}
          userPosition={userPosition}
          destinationStop={destination}
        />
      </div>

      {/* Journey progress */}
      {isOnBoard && journeyStops.length > 0 && (
        <div className="flex-1 overflow-auto px-4 py-4">
          <h3 className="font-display text-lg mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Journey Progress
          </h3>
          <div className="space-y-2">
            {journeyStops.map((stop, index) => (
              <div
                key={stop.id}
                className={`p-3 rounded-lg border transition-all ${
                  index === currentStopIndex 
                    ? 'bg-primary/20 border-primary' 
                    : index < currentStopIndex
                    ? 'bg-muted/50 border-transparent opacity-50'
                    : 'bg-card border-border'
                } ${stop.id === destination?.id ? 'ring-2 ring-matatu-yellow' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === currentStopIndex ? 'bg-primary animate-pulse' : 
                    index < currentStopIndex ? 'bg-muted-foreground' : 'bg-matatu-yellow'
                  }`} />
                  <span className={index === currentStopIndex ? 'text-primary font-medium' : ''}>
                    {stop.name}
                  </span>
                  {stop.id === destination?.id && <Bell className="w-4 h-4 text-matatu-yellow ml-auto" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-card border-t border-border px-4 py-4 mt-auto">
        {!isOnBoard ? (
          <Button
            variant="default"
            size="lg"
            className="w-full bg-primary"
            onClick={handleBoard}
            disabled={!journeyPlan}
          >
            <Clock className="w-5 h-5 mr-2" />
            {journeyPlan ? `Start Journey to ${destination?.name}` : 'Select a Destination'}
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
