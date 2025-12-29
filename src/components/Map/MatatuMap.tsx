import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { locationService, Coordinates, RouteStop } from '@/services/LocationService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Key } from 'lucide-react';

interface MatatuMapProps {
  mode: 'driver' | 'passenger';
  onStopReached?: (stop: RouteStop) => void;
}

const MatatuMap: React.FC<MatatuMapProps> = ({ mode, onStopReached }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(
    localStorage.getItem('mapbox_token') || ''
  );
  const [isTokenSet, setIsTokenSet] = useState<boolean>(
    !!localStorage.getItem('mapbox_token')
  );

  const handleSetToken = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken.trim());
      setIsTokenSet(true);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [36.8219, -1.2921], // Nairobi CBD
      zoom: 13,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Create matatu marker element
    const el = document.createElement('div');
    el.className = 'matatu-marker';
    el.innerHTML = `
      <div class="relative">
        <div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"></div>
        <div class="relative w-10 h-10 bg-gradient-to-br from-green-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <span class="text-lg">🚐</span>
        </div>
      </div>
    `;

    const { position } = locationService.getCurrentPosition();
    marker.current = new mapboxgl.Marker(el)
      .setLngLat([position.lng, position.lat])
      .addTo(map.current);

    // Add route stops markers
    const route = locationService.getRoute();
    route.forEach((stop, index) => {
      const stopEl = document.createElement('div');
      stopEl.className = 'stop-marker';
      stopEl.innerHTML = `
        <div class="w-4 h-4 ${stop.isStage ? 'bg-yellow-400' : 'bg-gray-400'} rounded-full border-2 border-white shadow-md"></div>
      `;

      new mapboxgl.Marker(stopEl)
        .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
        .addTo(map.current!);
    });

    // Draw route line
    map.current.on('load', () => {
      const routeCoordinates = route.map(stop => [
        stop.coordinates.lng,
        stop.coordinates.lat,
      ]);

      map.current!.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        },
      });

      map.current!.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#22c55e',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    });

    // Subscribe to location updates
    const unsubscribe = locationService.subscribe((pos, stop) => {
      if (marker.current) {
        marker.current.setLngLat([pos.lng, pos.lat]);
      }
      if (map.current) {
        map.current.easeTo({
          center: [pos.lng, pos.lat],
          duration: 1000,
        });
      }
      setCurrentStop(stop);
      if (onStopReached) {
        onStopReached(stop);
      }
    });

    return () => {
      unsubscribe();
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken, onStopReached]);

  if (!isTokenSet) {
    return (
      <div className="relative w-full h-full bg-card rounded-lg flex items-center justify-center">
        <div className="max-w-md w-full p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Key className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl">Mapbox API Key Required</h3>
            <p className="text-muted-foreground text-sm">
              To display the map, please enter your Mapbox public token. 
              Get one free at{' '}
              <a 
                href="https://mapbox.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="bg-muted border-border"
            />
            <Button 
              onClick={handleSetToken} 
              className="w-full"
              disabled={!mapboxToken.trim()}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Enable Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
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
