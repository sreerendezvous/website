import React, { useEffect, useRef, useState } from 'react';
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

interface LocationPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
  className?: string;
}

const defaultLocation: Location = {
  name: '',
  address: '',
  city: '',
  country: '',
  coordinates: {
    latitude: 40.7128,
    longitude: -74.0060
  }
};

export function LocationPicker({ value = defaultLocation, onChange, className }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [searchValue, setSearchValue] = useState('');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const initialLocation = value.coordinates ? 
      new google.maps.LatLng(value.coordinates.latitude, value.coordinates.longitude) :
      new google.maps.LatLng(defaultLocation.coordinates!.latitude, defaultLocation.coordinates!.longitude);

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: 15,
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

    const markerInstance = new google.maps.Marker({
      map: mapInstance,
      position: initialLocation,
      draggable: true
    });

    // Handle marker drag
    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      if (!position) return;

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          const city = addressComponents.find(c => 
            c.types.includes('locality'))?.long_name || '';
          const country = addressComponents.find(c => 
            c.types.includes('country'))?.long_name || '';

          onChange({
            name: value.name || result.name || '',
            address: result.formatted_address || '',
            city,
            country,
            coordinates: {
              latitude: position.lat(),
              longitude: position.lng()
            }
          });
        }
      });
    });

    setMap(mapInstance);
    setMarker(markerInstance);

    // Initialize Places Autocomplete
    if (searchInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
      autocomplete.bindTo('bounds', mapInstance);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        mapInstance.setCenter(place.geometry.location);
        markerInstance.setPosition(place.geometry.location);

        const city = place.address_components?.find(c => 
          c.types.includes('locality'))?.long_name || '';
        const country = place.address_components?.find(c => 
          c.types.includes('country'))?.long_name || '';

        setSearchValue(place.formatted_address || '');
        
        onChange({
          name: place.name || '',
          address: place.formatted_address || '',
          city,
          country,
          coordinates: {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          }
        });
      });
    }
  }, [mapRef.current]);

  // Update marker position when value changes
  useEffect(() => {
    if (!map || !marker || !value.coordinates) return;
    
    const position = new google.maps.LatLng(
      value.coordinates.latitude,
      value.coordinates.longitude
    );
    
    marker.setPosition(position);
    map.setCenter(position);
  }, [value.coordinates]);

  return (
    <div className={className}>
      <div className="relative mb-4">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search for a location..."
          className="w-full pl-10 pr-4 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
        />
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-[300px] rounded-lg overflow-hidden"
      />

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-sand-300 mb-1">
            Location Name
          </label>
          <input
            type="text"
            value={value.name || ''}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            placeholder="e.g., Central Park, My Studio"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sand-300 mb-1">
            Address
          </label>
          <input
            type="text"
            value={value.address || ''}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={value.city || ''}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-1">
              Country
            </label>
            <input
              type="text"
              value={value.country || ''}
              onChange={(e) => onChange({ ...value, country: e.target.value })}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}