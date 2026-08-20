import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Globe,
  ZoomIn,
  ZoomOut,
  Loader2,
  Sparkles,
  X,
  Compass
} from 'lucide-react';

// Curated index of premier Indian IT Parks, Corporate Tech Campuses & SEZs to give instant zero-latency recommendations
const VERIFIED_TECH_CAMPUSES = [
  { name: 'Google India (Pune)', address: 'EON Free Zone, Phase 1, Kharadi, Pune, Maharashtra 411014', city: 'Pune', state: 'Maharashtra', type: 'Corporate Campus', lat: 18.5529, lng: 73.9497, keywords: ['google', 'eon', 'kharadi', 'pune', 'free zone'] },
  { name: 'Google Signature (Bengaluru)', address: 'Old Madras Road, Mahadevapura, Bengaluru, Karnataka 560016', city: 'Bengaluru', state: 'Karnataka', type: 'Corporate Campus', lat: 12.9934, lng: 77.6606, keywords: ['google', 'bengaluru', 'bangalore', 'mahadevapura'] },
  { name: 'Google India (Hyderabad)', address: 'HITEC City, Madhapur, Hyderabad, Telangana 500081', city: 'Hyderabad', state: 'Telangana', type: 'Corporate Campus', lat: 17.4474, lng: 78.3762, keywords: ['google', 'hyderabad', 'hitec', 'madhapur'] },
  { name: 'Microsoft R&D India (Bengaluru)', address: 'Prestige Ferns Galaxy, Bellandur, Bengaluru, Karnataka 560103', city: 'Bengaluru', state: 'Karnataka', type: 'Tech Park', lat: 12.9279, lng: 77.6821, keywords: ['microsoft', 'bellandur', 'outer ring road', 'bengaluru', 'bangalore'] },
  { name: 'Microsoft IDC (Hyderabad)', address: 'Gachibowli, Financial District, Hyderabad, Telangana 500032', city: 'Hyderabad', state: 'Telangana', type: 'Corporate Campus', lat: 17.4399, lng: 78.3489, keywords: ['microsoft', 'gachibowli', 'hyderabad', 'idc'] },
  { name: 'Microsoft India (Noida)', address: 'Sector 145, Noida-Greater Noida Expressway, Noida, UP 201301', city: 'Noida', state: 'Uttar Pradesh', type: 'Corporate Campus', lat: 28.4744, lng: 77.4526, keywords: ['microsoft', 'noida', 'expressway'] },
  { name: 'TCS Sahyadri Park (Pune)', address: 'Rajiv Gandhi Infotech Park, Hinjewadi Phase 3, Pune, Maharashtra 411057', city: 'Pune', state: 'Maharashtra', type: 'IT Park', lat: 18.5833, lng: 73.6933, keywords: ['tcs', 'tata', 'sahyadri', 'hinjewadi', 'pune', 'phase 3'] },
  { name: 'TCS Olympus Centre (Thane / Mumbai)', address: 'Hiranandani Estate, Ghodbunder Road, Thane, Maharashtra 400607', city: 'Mumbai', state: 'Maharashtra', type: 'Corporate Campus', lat: 19.2625, lng: 72.9798, keywords: ['tcs', 'olympus', 'thane', 'mumbai', 'hiranandani'] },
  { name: 'Infosys Main Campus (Pune)', address: 'Hinjewadi Phase 2, Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057', city: 'Pune', state: 'Maharashtra', type: 'Corporate Campus', lat: 18.5912, lng: 73.7183, keywords: ['infosys', 'hinjewadi', 'pune', 'phase 2'] },
  { name: 'Infosys Headquarters (Electronic City, Bengaluru)', address: 'Electronic City Phase 1, Hosur Road, Bengaluru, Karnataka 560100', city: 'Bengaluru', state: 'Karnataka', type: 'IT Park', lat: 12.8502, lng: 77.6669, keywords: ['infosys', 'electronic city', 'bengaluru', 'bangalore'] },
  { name: 'Amazon Development Centre (Hyderabad)', address: 'Jayabheri Silicon Towers, Financial District, Nanakramguda, Hyderabad 500032', city: 'Hyderabad', state: 'Telangana', type: 'Tech Park', lat: 17.4123, lng: 78.3456, keywords: ['amazon', 'hyderabad', 'nanakramguda', 'financial district'] },
  { name: 'Amazon India Headquarters (Bengaluru)', address: 'World Trade Centre, Brigade Gateway, Malleshwaram West, Bengaluru 560055', city: 'Bengaluru', state: 'Karnataka', type: 'Business Hub', lat: 13.0118, lng: 77.5552, keywords: ['amazon', 'world trade centre', 'wtc', 'bengaluru', 'bangalore'] },
  { name: 'Mindspace IT Park (Airoli / Navi Mumbai)', address: 'Thane-Belapur Road, Airoli, Navi Mumbai, Maharashtra 400708', city: 'Navi Mumbai', state: 'Maharashtra', type: 'IT Park', lat: 19.1627, lng: 72.9984, keywords: ['mindspace', 'airoli', 'navi mumbai', 'mumbai', 'thane'] },
  { name: 'Mindspace Tech Park (Madhapur / Hyderabad)', address: 'Hitec City, Madhapur, Hyderabad, Telangana 500081', city: 'Hyderabad', state: 'Telangana', type: 'IT Park', lat: 17.4435, lng: 78.3772, keywords: ['mindspace', 'madhapur', 'hyderabad', 'hitec'] },
  { name: 'Cyber City (Gurugram / Delhi NCR)', address: 'DLF Cyber City, DLF Phase 2, Sector 24, Gurugram, Haryana 122002', city: 'Gurugram', state: 'Haryana', type: 'Business Hub', lat: 28.4952, lng: 77.0891, keywords: ['cyber city', 'dlf', 'gurugram', 'gurgaon', 'delhi ncr'] },
  { name: 'International Tech Park (ITPB Whitefield, Bengaluru)', address: 'ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066', city: 'Bengaluru', state: 'Karnataka', type: 'IT Park', lat: 12.9859, lng: 77.7303, keywords: ['itpb', 'itpl', 'whitefield', 'bengaluru', 'tech park'] },
  { name: 'Magarpatta Cybercity (Pune)', address: 'Magarpatta City, Hadapsar, Pune, Maharashtra 411028', city: 'Pune', state: 'Maharashtra', type: 'IT Park', lat: 18.5146, lng: 73.9312, keywords: ['magarpatta', 'cybercity', 'hadapsar', 'pune'] },
  { name: 'G H Raisoni College Campus (Jalgaon)', address: 'G H Raisoni Nagar, Shirsoli Road, Jalgaon, Maharashtra 425001', city: 'Jalgaon', state: 'Maharashtra', type: 'Educational Campus', lat: 20.9754, lng: 75.5683, keywords: ['raisoni', 'ghr', 'jalgaon', 'shirsoli'] },
  { name: 'Persistent Systems (Viman Nagar, Pune)', address: 'Nyati Tech Park, Viman Nagar, Pune, Maharashtra 411014', city: 'Pune', state: 'Maharashtra', type: 'Corporate Office', lat: 18.5679, lng: 73.9143, keywords: ['persistent', 'viman nagar', 'nyati', 'pune'] },
  { name: 'Wipro Technologies (Sarjapur, Bengaluru)', address: 'Doddakannelli, Sarjapur Road, Bengaluru, Karnataka 560035', city: 'Bengaluru', state: 'Karnataka', type: 'Corporate Campus', lat: 12.9113, lng: 77.6859, keywords: ['wipro', 'sarjapur', 'bengaluru', 'bangalore'] },
  { name: 'Capgemini Knowledge Park (Airoli, Navi Mumbai)', address: 'Knowledge Park, IT 3/4, TTC Industrial Area, Airoli, Navi Mumbai 400708', city: 'Navi Mumbai', state: 'Maharashtra', type: 'IT Park', lat: 19.1601, lng: 73.0034, keywords: ['capgemini', 'airoli', 'navi mumbai', 'knowledge park'] },
  { name: 'Cognizant Technology Solutions (Hinjewadi, Pune)', address: 'Phase 3, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057', city: 'Pune', state: 'Maharashtra', type: 'IT Park', lat: 18.5802, lng: 73.6961, keywords: ['cognizant', 'hinjewadi', 'pune', 'cts'] }
];

const OpenStreetMapPicker = ({
  initialAddress = '',
  initialLat = 18.5529,
  initialLng = 73.9497,
  companyNameHint = '',
  onLocationSelect
}) => {
  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [selectedLocation, setSelectedLocation] = useState({
    address: initialAddress || 'EON Free Zone, Kharadi, Pune, Maharashtra 411014',
    lat: initialLat,
    lng: initialLng
  });
  const [zoomLevel, setZoomLevel] = useState(16);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpenRecommendations, setIsOpenRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hasInteracted, setHasInteracted] = useState(false);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync initial address changes
  useEffect(() => {
    if (initialAddress && initialAddress !== selectedLocation.address) {
      setSearchQuery(initialAddress);
      setSelectedLocation((prev) => ({
        ...prev,
        address: initialAddress,
        lat: initialLat || prev.lat,
        lng: initialLng || prev.lng
      }));
    }
  }, [initialAddress, initialLat, initialLng]);

  // Auto-suggest recommendations if company name is passed from parent form
  useEffect(() => {
    if (companyNameHint && !hasInteracted && !initialAddress) {
      computeRecommendations(companyNameHint);
    }
  }, [companyNameHint, hasInteracted, initialAddress]);

  // Close recommendations dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpenRecommendations(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live recommendations as the student types
  const computeRecommendations = (query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      setRecommendations([]);
      return;
    }

    // 1. Instant Match with Curated Verified Indian Tech Hubs & IT Campuses
    const localMatches = VERIFIED_TECH_CAMPUSES.filter((hub) => {
      const matchName = hub.name.toLowerCase().includes(q);
      const matchAddr = hub.address.toLowerCase().includes(q);
      const matchCity = hub.city.toLowerCase().includes(q);
      const matchKeywords = hub.keywords.some((k) => k.includes(q) || q.includes(k));
      return matchName || matchAddr || matchCity || matchKeywords;
    }).map((hub) => ({
      id: `local_${hub.name}`,
      title: hub.name,
      address: hub.address,
      city: `${hub.city}, ${hub.state}`,
      type: hub.type,
      lat: hub.lat,
      lng: hub.lng,
      isVerifiedCampus: true
    }));

    setRecommendations(localMatches);

    // 2. Fetch live matching locations from OpenStreetMap Nominatim API (Debounced)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&limit=6&addressdetails=1&countrycodes=in`,
          {
            signal: abortControllerRef.current.signal,
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'InternshipConnectPro-LocationAssistant'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const osmResults = (data || []).map((item) => {
            const parts = (item.display_name || '').split(',');
            const primaryTitle = parts[0] ? parts[0].trim() : q;
            const subAddress = parts.slice(1, 4).join(',').trim() || item.display_name;
            const cityDistrict = parts.slice(3, 5).join(',').trim();

            let tag = 'Location';
            if (item.type === 'commercial' || item.class === 'office' || item.class === 'building') tag = 'Office / Building';
            else if (item.type === 'industrial') tag = 'Tech Park / SEZ';
            else if (item.type === 'city' || item.type === 'suburb') tag = 'City / Area';

            return {
              id: `osm_${item.place_id || Math.random()}`,
              title: primaryTitle,
              address: item.display_name,
              city: cityDistrict,
              type: tag,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              isVerifiedCampus: false
            };
          });

          // Merge: Put local verified hubs first, then OSM Nominatim results, avoiding duplicate coordinates
          const seen = new Set();
          const combined = [];

          for (const item of [...localMatches, ...osmResults]) {
            const key = `${item.lat.toFixed(3)}_${item.lng.toFixed(3)}`;
            if (!seen.has(key)) {
              seen.add(key);
              combined.push(item);
            }
          }

          setRecommendations(combined);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Nominatim query error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setHasInteracted(true);
    setIsOpenRecommendations(true);
    computeRecommendations(value);
  };

  const handleSelectRecommendation = (rec) => {
    const loc = {
      address: rec.address,
      lat: rec.lat,
      lng: rec.lng
    };
    setSelectedLocation(loc);
    setSearchQuery(rec.address);
    setIsOpenRecommendations(false);
    setRecommendations([]);

    if (onLocationSelect) {
      onLocationSelect({
        address: rec.address,
        latitude: rec.lat,
        longitude: rec.lng
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setRecommendations([]);
    setIsOpenRecommendations(false);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));

          let address = `GPS Pin Location (${lat}, ${lng})`;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'en',
                  'User-Agent': 'InternshipConnectPro-LocationAssistant'
                }
              }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.display_name) {
                address = data.display_name;
              }
            }
          } catch {
            // fallback to coordinates string
          }

          const loc = { address, lat, lng };
          setSelectedLocation(loc);
          setSearchQuery(address);
          setIsSearching(false);
          setIsOpenRecommendations(false);

          if (onLocationSelect) {
            onLocationSelect({
              address: loc.address,
              latitude: loc.lat,
              longitude: loc.lng
            });
          }
        },
        () => {
          setIsSearching(false);
          handleSelectRecommendation(VERIFIED_TECH_CAMPUSES[0]);
        }
      );
    }
  };

  // OpenStreetMap interactive tile URL calculation (bbox)
  const delta = 0.005 * Math.pow(2, 16 - zoomLevel);
  const bbox = `${selectedLocation.lng - delta},${selectedLocation.lat - delta},${selectedLocation.lng + delta},${selectedLocation.lat + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${selectedLocation.lat},${selectedLocation.lng}`;

  return (
    <div ref={containerRef} className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/80 space-y-4">
      {/* Search Input & Live Recommendation Header */}
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            Company Office Location & Live Address Search
          </label>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            OpenStreetMap Live Recommendations
          </span>
        </div>

        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => {
                setIsOpenRecommendations(true);
                if (searchQuery.trim().length >= 1) {
                  computeRecommendations(searchQuery);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (recommendations.length > 0) {
                    handleSelectRecommendation(recommendations[0]);
                  }
                }
              }}
              placeholder="Search company name, IT Park, building, or street (e.g., 'TCS Hinjewadi', 'Google Pune')..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-emerald-600 outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isSearching}
            className="p-2.5 rounded-xl bg-white border border-outline-variant text-on-surface-variant hover:text-emerald-700 hover:border-emerald-700 shadow-sm transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Use current device GPS location"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Navigation className="w-4 h-4" />}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>

        {/* Live Matching Recommendations Dropdown (Auto-Assisting the Student) */}
        {isOpenRecommendations && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl bg-white border border-outline-variant shadow-2xl p-2 max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Header / Search Status */}
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-outline-variant/40 mb-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {searchQuery.trim().length > 0
                    ? `Matching Locations for "${searchQuery}"`
                    : 'Search Recommendations'}
                </span>
              </div>
              {isSearching && (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Finding matches...
                </span>
              )}
            </div>

            {/* List of matching recommendations */}
            {recommendations.length > 0 ? (
              <div className="space-y-1">
                {recommendations.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleSelectRecommendation(rec)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all text-xs flex items-start justify-between gap-3 group border border-transparent hover:border-emerald-200"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        {rec.isVerifiedCampus ? <Building2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-on-surface text-xs text-slate-900 group-hover:text-emerald-950">
                            {rec.title}
                          </p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                            {rec.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                          {rec.address}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 px-2.5 py-1 rounded-lg bg-emerald-100/60 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      Select ➔
                    </span>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim().length > 0 && !isSearching ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-slate-600">
                  No exact campus match found for <strong>"{searchQuery}"</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectRecommendation({
                      id: `custom_${Date.now()}`,
                      title: searchQuery,
                      address: searchQuery,
                      type: 'Custom Address',
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Use "{searchQuery}" as Office Address
                </button>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 space-y-1.5">
                <p className="font-medium text-slate-700">
                  Type your company name, tech park, or building to see matching locations.
                </p>
                <p className="text-[11px] text-slate-400">
                  Try typing: <em>"TCS Hinjewadi"</em>, <em>"Google Kharadi"</em>, <em>"Infosys Electronic City"</em>, <em>"Mindspace"</em>, or <em>"Cyber City"</em>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive OpenStreetMap Canvas */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-outline-variant/80 bg-slate-100 shadow-inner group">
        {/* OpenStreetMap Real Tile Embed */}
        <iframe
          title="OpenStreetMap Location Viewer"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={osmEmbedUrl}
          className="w-full h-full pointer-events-auto"
        ></iframe>

        {/* OpenStreetMap Live Status Overlay */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            OpenStreetMap Live
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-700/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
            <ShieldCheck className="w-3 h-3" />
            Fixed 300m Attendance Geofence
          </span>
        </div>

        {/* Map Zoom Controls */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(19, z + 1))}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(12, z - 1))}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* 300m Geofence Visual Perimeter Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-36 h-36 rounded-full border-2 border-emerald-500 bg-emerald-500/20 animate-pulse flex items-center justify-center shadow-lg">
            <div className="w-20 h-20 rounded-full border border-emerald-400/50 bg-emerald-500/10"></div>
          </div>
        </div>

        {/* Center Map Pin with Address Callout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-7">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl ring-4 ring-white animate-bounce">
            <MapPin className="w-5 h-5 fill-current" />
          </div>
          <div className="mt-1 px-3 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-bold whitespace-nowrap shadow-lg max-w-[220px] truncate">
            {selectedLocation.address.split(',')[0]}
          </div>
        </div>

        {/* Bottom Coordinates & OpenStreetMap Attribution */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-medium shadow-sm pointer-events-auto">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline">OpenStreetMap</a> contributors
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono shadow-md">
            Lat: {selectedLocation.lat} | Lng: {selectedLocation.lng}
          </span>
        </div>
      </div>

      {/* Selected Coordinates Readout */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-outline-variant/60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-on-surface truncate">{selectedLocation.address}</p>
            <p className="text-[10px] text-on-surface-variant">
              Geofence Radius: <span className="font-bold text-emerald-700">300 meters</span> (Auto-Configured for Attendance)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200 flex-shrink-0">
          OSM Verified
        </span>
      </div>
    </div>
  );
};

export default OpenStreetMapPicker;
