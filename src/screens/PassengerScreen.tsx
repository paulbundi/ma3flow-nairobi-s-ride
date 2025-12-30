import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MatatuMap from '@/components/Map/MatatuMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchStops, loadStops, findOptimalRoute, Journey, Stop, JourneySegment } from '@/services/StopsRoutesLoader';
import { 
  ArrowLeft, 
  MapPin,
  Clock,
  Bell,
  CheckCircle2,
  Search,
  ArrowRight,
  Footprints
} from 'lucide-react';

interface PassengerScreenProps {
  onBack: () => void;
}

const PassengerScreen: React.FC<PassengerScreenProps> = ({ onBack }) => {
  const [currentLocation, setCurrentLocation] = useState<Stop | null>(null);
  const [destination, setDestination] = useState<Stop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stop[]>([]);
  const [fromSearchResults, setFromSearchResults] = useState<Stop[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isOnBoard, setIsOnBoard] = useState(false);
  const [journeyStops, setJourneyStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [arrivedAtDestination, setArrivedAtDestination] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize with stops from CSV
  useEffect(() => {
    const initializePassenger = async () => {
      const stops = await loadStops();
      if (stops.length > 0) {
        setCurrentLocation(stops[0]);
        setUserPosition({ lat: stops[0].lat, lng: stops[0].lon });
      }
    };
    
    initializePassenger();
  }, []);

  // Search for from location
  const handleFromSearch = useCallback(async (query: string) => {
    setFromSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchStops(query);
      setFromSearchResults(results.filter(s => s.id !== destination?.id));
    } else {
      setFromSearchResults([]);
    }
  }, [destination]);

  // Select from location
  const handleSelectFrom = useCallback((stop: Stop) => {
    setCurrentLocation(stop);
    setFromSearchQuery(stop.name);
    setFromSearchResults([]);
    setUserPosition({ lat: stop.lat, lng: stop.lon });
  }, []);

  // Search for destinations
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchStops(query);
      setSearchResults(results.filter(s => s.id !== currentLocation?.id && s.id !== destination?.id));
    } else {
      setSearchResults([]);
    }
  }, [currentLocation, destination]);

  // Select destination and find route
  const handleSelectDestination = useCallback(async (stop: Stop) => {
    setDestination(stop);
    setSearchQuery(stop.name);
    setSearchResults([]);

    if (currentLocation) {
      const optimalRoute = await findOptimalRoute(currentLocation, stop);
      setJourney(optimalRoute);
      
      if (optimalRoute?.totalStops) {
        setJourneyStops(optimalRoute.totalStops);
      } else {
        setJourneyStops([currentLocation, stop]);
      }
    }
  }, [currentLocation]);

  // Start journey simulation
  const handleBoard = useCallback(() => {
    if (journeyStops.length === 0) return;
    
    setIsOnBoard(true);
    setCurrentStopIndex(0);
    setUserPosition({ lat: journeyStops[0].lat, lng: journeyStops[0].lon });
  }, [journeyStops]);

  // Animate journey with matatu transfers
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
        const nextStop = journeyStops[nextIdx];
        setUserPosition({ lat: nextStop.lat, lng: nextStop.lon });
        
        // Check for transfer point
        if (journey?.segments) {
          for (let i = 0; i < journey.segments.length; i++) {
            const seg = journey.segments[i];
            if (seg.toStop.id === nextStop.id && i < journey.segments.length - 1) {
              const nextSeg = journey.segments[i + 1];
              if (nextSeg.isWalking) {
                console.log(`🚶 Walking from ${nextStop.name} to ${nextSeg.toStop.name} (~${Math.round(nextSeg.walkingDistance || 0)}m)`);
              } else {
                console.log(`🔄 Transfer at ${nextStop.name} - Change to Route ${nextSeg.route?.shortName}`);
              }
              break;
            }
          }
        }
        
        return nextIdx;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOnBoard, journeyStops, journey]);

  const handleAlight = () => {
    setIsOnBoard(false);
    setDestination(null);
    setJourney(null);
    setJourneyStops([]);
    setArrivedAtDestination(false);
    setSearchQuery('');
  };

  // Helper to get the segment a stop belongs to
  const getStopSegmentInfo = (stop: Stop, journey: Journey | null): { segment: JourneySegment | null; isTransfer: boolean; isWalkStart: boolean } => {
    if (!journey) return { segment: null, isTransfer: false, isWalkStart: false };
    
    for (let i = 0; i < journey.segments.length; i++) {
      const seg = journey.segments[i];
      const isLastSegment = i === journey.segments.length - 1;
      
      if (seg.toStop.id === stop.id && !isLastSegment) {
        const nextSeg = journey.segments[i + 1];
        return { 
          segment: seg, 
          isTransfer: !nextSeg.isWalking, 
          isWalkStart: !!nextSeg.isWalking 
        };
      }
    }
    
    return { segment: null, isTransfer: false, isWalkStart: false };
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search from location..."
            value={fromSearchQuery}
            onChange={(e) => handleFromSearch(e.target.value)}
            className="pl-10"
            disabled={isOnBoard}
          />
          {fromSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 max-h-48 overflow-y-auto z-50 shadow-lg">
              {fromSearchResults.map(stop => (
                <button
                  key={stop.id}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectFrom(stop);
                  }}
                >
                  <MapPin className="w-4 h-4 inline mr-2 text-muted-foreground" />
                  {stop.name}
                </button>
              ))}
            </div>
          )}
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
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectDestination(stop);
                  }}
                >
                  <MapPin className="w-4 h-4 inline mr-2 text-muted-foreground" />
                  {stop.name}
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 p-3 z-50 shadow-lg">
              <p className="text-sm text-muted-foreground">No destinations found. Try a different search.</p>
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
      {journey && !isOnBoard && (
        <div className="bg-primary/10 px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">
            {journey.segments.filter(s => !s.isWalking).length === 1 
              ? 'Direct Route' 
              : `${journey.segments.filter(s => !s.isWalking).length} Matatu(s)`}
            {journey.segments.some(s => s.isWalking) && ' + Walking Transfer'}
          </p>
          {journey.segments.map((seg, idx) => (
            <div key={idx} className="text-sm flex items-center gap-2 mb-1">
              {seg.isWalking ? (
                <>
                  <Footprints className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400">
                    Walk from {seg.fromStop.name} to {seg.toStop.name} (~{Math.round(seg.walkingDistance || 0)}m)
                  </span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span>Route {seg.route?.shortName}: {seg.fromStop.name} → {seg.toStop.name}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="h-64 relative">
        <MatatuMap 
          mode="passenger" 
          journeyStops={journeyStops}
          journeySegments={journey?.segments.map(seg => ({ 
            stops: seg.stops,
            isWalking: seg.isWalking,
            walkingDistance: seg.walkingDistance
          }))}
          userPosition={userPosition}
          destinationStop={destination}
        />
      </div>

      {/* Journey progress with transfer indicators */}
      {isOnBoard && journeyStops.length > 0 && (
        <div className="flex-1 overflow-auto px-4 py-4">
          <h3 className="font-display text-lg mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Journey Progress
            {journey && journey.segments.filter(s => !s.isWalking).length > 1 && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                {journey.segments.filter(s => !s.isWalking).length - 1} Transfer(s)
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {journeyStops.map((stop, index) => {
              const { isTransfer, isWalkStart } = getStopSegmentInfo(stop, journey);
              
              return (
                <div
                  key={`${stop.id}-${index}`}
                  className={`p-3 rounded-lg border transition-all ${
                    index === currentStopIndex 
                      ? 'bg-primary/20 border-primary' 
                      : index < currentStopIndex
                      ? 'bg-muted/50 border-transparent opacity-50'
                      : 'bg-card border-border'
                  } ${
                    stop.id === destination?.id ? 'ring-2 ring-matatu-yellow' : ''
                  } ${
                    isTransfer ? 'ring-2 ring-orange-400' : ''
                  } ${
                    isWalkStart ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === currentStopIndex ? 'bg-primary animate-pulse' : 
                      index < currentStopIndex ? 'bg-muted-foreground' : 'bg-matatu-yellow'
                    }`} />
                    <div className="flex-1">
                      <span className={index === currentStopIndex ? 'text-primary font-medium' : ''}>
                        {stop.name}
                      </span>
                      {isTransfer && (
                        <div className="text-xs text-orange-400 mt-1">
                          🔄 Transfer Point - Change Matatu
                        </div>
                      )}
                      {isWalkStart && (
                        <div className="text-xs text-blue-400 mt-1">
                          🚶 Walking Transfer Required
                        </div>
                      )}
                    </div>
                    {stop.id === destination?.id && <Bell className="w-4 h-4 text-matatu-yellow" />}
                  </div>
                </div>
              );
            })}
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
            disabled={!destination}
          >
            <Clock className="w-5 h-5 mr-2" />
            {destination ? `Start Journey to ${destination.name}` : 'Select a Destination'}
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
