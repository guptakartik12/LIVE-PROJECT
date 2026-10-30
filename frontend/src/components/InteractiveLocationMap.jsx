import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Car, Shield, ExternalLink } from 'lucide-react';

// Custom Marker Icon for Leaflet
const parkingMarkerIcon = new L.DivIcon({
  className: 'custom-parking-marker',
  html: `<div style="background-color: #142B4A; color: white; border: 2px solid #3B82F6; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">P</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

// Helper component to center map when selected location changes
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
};

export const InteractiveLocationMap = ({
  locations = [],
  selectedLocation,
  onSelectLocation
}) => {
  const defaultCenter = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : locations.length > 0
    ? [locations[0].lat, locations[0].lng]
    : [28.6139, 77.2090];

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
        <div>
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-secondary" />
            ParkEase Facility Network (OpenStreetMap)
          </h3>
          <p className="text-xs text-surface-muted">
            Live interactive GPS coordinates for demonstration parking garages in the metropolitan district.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-surface-muted bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          Leaflet Engine · OSM
        </span>
      </div>

      {/* Map View */}
      <div className="h-80 w-full rounded-xl overflow-hidden border border-surface-border shadow-inner relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={defaultCenter} />

          {locations.map((loc) => (
            <Marker
              key={loc.name}
              position={[loc.lat, loc.lng]}
              icon={parkingMarkerIcon}
              eventHandlers={{
                click: () => onSelectLocation && onSelectLocation(loc)
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-slate-900 font-sans">
                  <div className="font-bold text-sm text-primary">{loc.name}</div>
                  <div className="text-xs text-slate-600">{loc.address}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Distance: {loc.distance} · {loc.info}
                  </div>
                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-semibold">
                      {loc.totalBays || 84} Total Bays
                    </span>
                    <button
                      onClick={() => onSelectLocation && onSelectLocation(loc)}
                      className="px-2 py-1 bg-secondary text-white font-semibold text-[10px] rounded hover:bg-secondary-dark"
                    >
                      Select Garage
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Facilities Cards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {locations.map((loc) => {
          const isSelected = selectedLocation && selectedLocation.name === loc.name;
          return (
            <button
              key={loc.name}
              onClick={() => onSelectLocation && onSelectLocation(loc)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-2 border-secondary bg-blue-50/50 shadow-sm'
                  : 'border-surface-border bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary truncate">{loc.name}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded">
                    {loc.distance}
                  </span>
                </div>
                <p className="text-[11px] text-surface-muted mt-1 truncate">{loc.info}</p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-emerald-600 font-semibold">Available</span>
                <span className="text-secondary font-medium flex items-center gap-0.5">
                  Select <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
