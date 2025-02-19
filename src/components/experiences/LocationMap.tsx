import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface Location {
  name: string;
  address: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface LocationMapProps {
  location: Location;
  className?: string;
}

export function LocationMap({ location, className }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    // Use default coordinates if none provided
    const coordinates = location.coordinates || {
      latitude: 40.7128,
      longitude: -74.0060
    };

    const position = new google.maps.LatLng(
      coordinates.latitude,
      coordinates.longitude
    );

    const map = new google.maps.Map(mapRef.current, {
      center: position,
      zoom: 15,
      disableDefaultUI: true,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242f3e" }]
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#242f3e" }]
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#746855" }]
        }
      ]
    });

    new google.maps.Marker({
      map,
      position,
      title: location.name
    });
  }, [location, mapRef.current]);

  return (
    <div className={className}>
      <div className="flex items-start gap-4 mb-4">
        <MapPin className="h-5 w-5 text-sand-400 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-medium text-sand-100 mb-1">{location.name || 'Location'}</h3>
          {location.address && <p className="text-sm text-sand-400">{location.address}</p>}
          {(location.city || location.country) && (
            <p className="text-sm text-sand-400">
              {[location.city, location.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-[200px] rounded-lg overflow-hidden"
      />
    </div>
  );
}