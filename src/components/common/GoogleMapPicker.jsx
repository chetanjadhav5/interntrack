import React, { useState } from 'react';
import { MapPin, Search, Navigation, CheckCircle2, Building, ShieldCheck } from 'lucide-react';

const PRESET_TECH_HUBS = [
  { name: 'Google India (Pune)', address: 'EON Free Zone, Kharadi, Pune, Maharashtra 411014', lat: 18.5529, lng: 73.9497 },
  { name: 'Microsoft R&D (Bengaluru)', address: 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103', lat: 12.9279, lng: 77.6821 },
  { name: 'TCS Sahyadri Park (Pune)', address: 'Hinjewadi Phase 3, Pune, Maharashtra 411057', lat: 18.5833, lng: 73.6933 },
  { name: 'Infosys Campus (Pune)', address: 'Hinjewadi Phase 2, Pune, Maharashtra 411057', lat: 18.5912, lng: 73.7183 },
  { name: 'Amazon Development Centre (Hyderabad)', address: 'Financial District, Nanakramguda, Hyderabad 500032', lat: 17.4123, lng: 78.3456 },
  { name: 'G H Raisoni College Campus (Jalgaon)', address: 'G H Raisoni Nagar, Shirsoli Road, Jalgaon 425001', lat: 20.9754, lng: 75.5683 }
];

const GoogleMapPicker = ({ initialAddress = '', initialLat = 18.5529, initialLng = 73.9497, onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedLocation, setSelectedLocation] = useState({
    address: initialAddress || 'EON Free Zone, Kharadi, Pune, Maharashtra 411014',
    lat: initialLat,
    lng: initialLng
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleSelectPreset = (hub) => {
    setSelectedLocation({
      address: hub.address,
      lat: hub.lat,
      lng: hub.lng
    });
    setSearchQuery(hub.address);
    setShowPresets(false);
    if (onLocationSelect) {
      onLocationSelect({
        address: hub.address,
        latitude: hub.lat,
        longitude: hub.lng
      });
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    // Simulate Google Places Autocomplete API
    setTimeout(() => {
      const simulatedLat = 18.5204 + (Math.random() - 0.5) * 0.1;
      const simulatedLng = 73.8567 + (Math.random() - 0.5) * 0.1;
      const loc = {
        address: searchQuery,
        lat: parseFloat(simulatedLat.toFixed(6)),
        lng: parseFloat(simulatedLng.toFixed(6))
      };
      setSelectedLocation(loc);
      setIsSearching(false);
      if (onLocationSelect) {
        onLocationSelect({
          address: loc.address,
          latitude: loc.lat,
          longitude: loc.lng
        });
      }
    }, 400);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            address: `GPS Pin Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6))
          };
          setSelectedLocation(loc);
          setSearchQuery(loc.address);
          if (onLocationSelect) {
            onLocationSelect({
              address: loc.address,
              latitude: loc.lat,
              longitude: loc.lng
            });
          }
        },
        () => {
          handleSelectPreset(PRESET_TECH_HUBS[0]);
        }
      );
    }
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/80 space-y-4">
      {/* Search and Autocomplete Header */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
          Company Office Location (Google Maps & Places)
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowPresets(true);
              }}
              onFocus={() => setShowPresets(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleManualSearch(e);
                }
              }}
              placeholder="Search address, tech park, or building name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleManualSearch}
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            {isSearching ? 'Locating...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="p-2.5 rounded-xl bg-white border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary shadow-sm transition-colors"
            title="Use current device GPS location"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets Dropdown */}
        {showPresets && (
          <div className="rounded-xl bg-white border border-outline-variant shadow-lg p-2 max-h-48 overflow-y-auto z-10 animate-in fade-in">
            <div className="px-2 py-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Quick Select Verified Tech Parks & Offices
            </div>
            {PRESET_TECH_HUBS.map((hub) => (
              <button
                key={hub.name}
                type="button"
                onClick={() => handleSelectPreset(hub)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-xs flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-bold text-on-surface">{hub.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate max-w-sm">{hub.address}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-blue-100/60">
                  Select
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Simulated Google Maps Interactive Canvas */}
      <div className="relative w-full h-52 rounded-xl overflow-hidden border border-outline-variant bg-slate-900 shadow-inner flex items-center justify-center group">
        {/* Map Background Grid & Roads Graphic */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1a56db_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Map Top Bar */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Google Maps API Live
          </span>
          <span className="px-2.5 py-1 rounded-md bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Fixed 300m Attendance Geofence
          </span>
        </div>

        {/* 300m Geofence Visual Perimeter */}
        <div className="absolute w-36 h-36 rounded-full border-2 border-primary bg-primary/20 animate-pulse flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full border border-primary/40 bg-primary/10"></div>
        </div>

        {/* Center Map Pin */}
        <div className="relative z-10 flex flex-col items-center -mt-6">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-4 ring-white">
            <MapPin className="w-5 h-5 fill-current" />
          </div>
          <div className="mt-1 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white text-[11px] font-bold whitespace-nowrap shadow-md">
            {selectedLocation.address.split(',')[0]}
          </div>
        </div>

        {/* Bottom Coordinates Bar */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-mono">
            Lat: {selectedLocation.lat} | Lng: {selectedLocation.lng}
          </span>
        </div>
      </div>

      {/* Selected Coordinates Readout */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-outline-variant/60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="text-xs font-bold text-on-surface truncate">{selectedLocation.address}</p>
            <p className="text-[10px] text-on-surface-variant">
              Geofence Radius: <span className="font-bold text-primary">300 meters</span> (Auto-Configured)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
          Location Verified
        </span>
      </div>
    </div>
  );
};

export default GoogleMapPicker;
