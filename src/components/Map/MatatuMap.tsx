import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { Route, Stop } from '@/services/TransitManager';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDsDs-lucVY7kY4bAMoTjkMiEAD4fA492E';

interface JourneySegmentDisplay {
  stops: Stop[];
  isWalking?: boolean;
  walkingDistance?: number;
}

interface MatatuMapProps {
  mode: 'driver' | 'passenger';
  activeRoute?: Route | null;
  currentPosition?: { lat: number; lng: number };
  currentStopIndex?: number;
  journeyStops?: Stop[];
  journeySegments?: JourneySegmentDisplay[];
  userPosition?: { lat: number; lng: number } | null;
  destinationStop?: Stop | null;
  onStopReached?: (stop: Stop) => void;
  onLegacyStopReached?: (stop: { name: string; coordinates: { lat: number; lng: number }; isStage: boolean }) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219,
};

const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b8b' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d44' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3d3d5c' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e0e1a' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1a3320' }],
  },
];

const MatatuMap: React.FC<MatatuMapProps> = ({ 
  mode, 
  activeRoute,
  currentPosition,
  currentStopIndex = 0,
  journeyStops,
  journeySegments,
  userPosition,
  destinationStop,
  onStopReached
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [mapCenter, setMapCenter] = useState(currentPosition || defaultCenter);

  // Update center when position changes
  useEffect(() => {
    if (currentPosition) {
      setMapCenter(currentPosition);
    } else if (userPosition) {
      setMapCenter(userPosition);
    }
  }, [currentPosition, userPosition]);

  // Notify when stop is reached
  useEffect(() => {
    if (activeRoute && activeRoute.stops[currentStopIndex] && onStopReached) {
      onStopReached(activeRoute.stops[currentStopIndex]);
    }
  }, [currentStopIndex, activeRoute, onStopReached]);

  const onLoad = useCallback((map: google.maps.Map) => {
    map.panTo(mapCenter);
  }, [mapCenter]);

  if (loadError) {
    return (
      <div className="relative w-full h-full bg-card rounded-lg flex items-center justify-center">
        <p className="text-destructive">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-full bg-card rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Build route path for polyline
  const routePath = activeRoute?.stops.map(stop => ({
    lat: stop.lat,
    lng: stop.lon,
  })) || [];

  // Build journey path for passenger mode
  const journeyPath = journeyStops?.map(stop => ({
    lat: stop.lat,
    lng: stop.lon,
  })) || [];

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={14}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: darkMapStyles,
        }}
        onLoad={onLoad}
      >
        {/* Driver mode: Route line */}
        {mode === 'driver' && routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#22c55e',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}

        {/* Passenger mode: Journey segments with walking paths */}
        {mode === 'passenger' && journeySegments?.map((segment, idx) => {
          const segmentPath = segment.stops.map(stop => ({
            lat: stop.lat,
            lng: stop.lon,
          }));
          
          // Walking segments use dotted orange line
          if (segment.isWalking) {
            return (
              <Polyline
                key={`walking-${idx}`}
                path={segmentPath}
                options={{
                  strokeColor: '#f97316',
                  strokeOpacity: 0,
                  strokeWeight: 4,
                  icons: [{
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      strokeColor: '#f97316',
                      scale: 3,
                    },
                    offset: '0',
                    repeat: '15px',
                  }],
                }}
              />
            );
          }
          
          // Matatu segments use solid colored lines
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
          return (
            <Polyline
              key={`segment-${idx}`}
              path={segmentPath}
              options={{
                strokeColor: colors[idx % colors.length],
                strokeOpacity: 0.9,
                strokeWeight: 5,
              }}
            />
          );
        })}

        {/* Walking distance labels */}
        {mode === 'passenger' && journeySegments?.filter(s => s.isWalking).map((segment, idx) => {
          const midLat = (segment.stops[0].lat + segment.stops[1].lat) / 2;
          const midLng = (segment.stops[0].lon + segment.stops[1].lon) / 2;
          return (
            <InfoWindow
              key={`walk-label-${idx}`}
              position={{ lat: midLat, lng: midLng }}
              options={{
                disableAutoPan: true,
                pixelOffset: new window.google.maps.Size(0, -10),
              }}
            >
              <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                🚶 {Math.round(segment.walkingDistance || 0)}m walk
              </div>
            </InfoWindow>
          );
        })}

        {/* Route stops (driver mode - only active route) */}
        {mode === 'driver' && activeRoute?.stops.map((stop, index) => (
          <Marker
            key={`route-${stop.id}`}
            position={{ lat: stop.lat, lng: stop.lon }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: index === currentStopIndex ? 10 : 6,
              fillColor: index === currentStopIndex ? '#22c55e' : index < currentStopIndex ? '#6b7280' : '#facc15',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title={stop.name}
          />
        ))}

        {/* Journey stops (passenger mode) */}
        {mode === 'passenger' && journeyStops?.map((stop, index) => (
          <Marker
            key={`journey-${stop.id}`}
            position={{ lat: stop.lat, lng: stop.lon }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: stop.id === destinationStop?.id ? 12 : 7,
              fillColor: stop.id === destinationStop?.id ? '#facc15' : '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title={stop.name}
          />
        ))}

        {/* User position marker (passenger mode) */}
        {mode === 'passenger' && userPosition && (
          <Marker
            position={userPosition}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
            title="Your Location"
            zIndex={1000}
          />
        )}

        {/* Matatu marker (driver mode) */}
        {mode === 'driver' && currentPosition && (
          <Marker
            position={currentPosition}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                  <text x="20" y="26" text-anchor="middle" font-size="18">🚐</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20),
            }}
            zIndex={1000}
          />
        )}
      </GoogleMap>

      {/* Current stop overlay (driver mode) */}
      {mode === 'driver' && activeRoute?.stops[currentStopIndex] && (
        <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-matatu-green animate-pulse" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Stop {currentStopIndex + 1} of {activeRoute.stops.length}
              </p>
              <p className="font-display text-xl">{activeRoute.stops[currentStopIndex].name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatatuMap;
