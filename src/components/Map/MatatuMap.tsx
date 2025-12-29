import React, { useCallback, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { locationService, RouteStop } from '@/services/LocationService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDsDs-lucVY7kY4bAMoTjkMiEAD4fA492E';

interface MatatuMapProps {
  mode: 'driver' | 'passenger';
  onStopReached?: (stop: RouteStop) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: -1.2921,
  lng: 36.8219,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
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
  ],
};

const MatatuMap: React.FC<MatatuMapProps> = ({ mode, onStopReached }) => {
  const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
  const [matatuPosition, setMatatuPosition] = useState(center);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const route = locationService.getRoute();
  const routePath = route.map(stop => ({
    lat: stop.coordinates.lat,
    lng: stop.coordinates.lng,
  }));

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Subscribe to location updates
    locationService.subscribe((pos, stop) => {
      setMatatuPosition({ lat: pos.lat, lng: pos.lng });
      setCurrentStop(stop);
      if (onStopReached) {
        onStopReached(stop);
      }
      map.panTo({ lat: pos.lat, lng: pos.lng });
    });
  }, [onStopReached]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  return (
    <div className="relative w-full h-full">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Route line */}
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#22c55e',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />

          {/* Route stops */}
          {route.map((stop, index) => (
            <Marker
              key={index}
              position={{ lat: stop.coordinates.lat, lng: stop.coordinates.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: stop.isStage ? 8 : 5,
                fillColor: stop.isStage ? '#facc15' : '#6b7280',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
              title={stop.name}
            />
          ))}

          {/* Matatu marker */}
          <Marker
            position={matatuPosition}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                  <text x="20" y="26" text-anchor="middle" font-size="18">🚐</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20),
            }}
            zIndex={1000}
          />
        </GoogleMap>
      </LoadScript>

      {/* Current stop overlay */}
      {currentStop && (
        <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentStop.isStage ? 'bg-matatu-yellow' : 'bg-muted-foreground'}`} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {currentStop.isStage ? 'Major Stage' : 'Stop'}
              </p>
              <p className="font-display text-xl">{currentStop.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatatuMap;
