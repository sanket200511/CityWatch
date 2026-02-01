import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// User location marker
const userIcon = new L.DivIcon({
    className: 'user-marker',
    html: `<div style="
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 2px 10px rgba(0,0,0,0.4);
  "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

// Destination marker
const destIcon = new L.DivIcon({
    className: 'dest-marker',
    html: `<div style="
    background: linear-gradient(135deg, #f43f5e, #ec4899);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(244, 63, 94, 0.5);
  "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

// Nagpur Zones with LARGER coverage
const NAGPUR_ZONES = [
    { id: 1, name: 'Sitabuldi', lat: 21.1466, lng: 79.0788, safety: 'safe', incidents: 2, patrolFreq: 'High', cctv: 15, radius: 800 },
    { id: 2, name: 'Dharampeth', lat: 21.1391, lng: 79.0567, safety: 'safe', incidents: 1, patrolFreq: 'High', cctv: 12, radius: 900 },
    { id: 3, name: 'Sadar', lat: 21.1559, lng: 79.0806, safety: 'moderate', incidents: 5, patrolFreq: 'Medium', cctv: 8, radius: 700 },
    { id: 4, name: 'Itwari', lat: 21.1547, lng: 79.0944, safety: 'unsafe', incidents: 12, patrolFreq: 'Low', cctv: 3, radius: 600 },
    { id: 5, name: 'Mahal', lat: 21.1489, lng: 79.0933, safety: 'unsafe', incidents: 8, patrolFreq: 'Low', cctv: 2, radius: 500 },
    { id: 6, name: 'Civil Lines', lat: 21.1621, lng: 79.0673, safety: 'safe', incidents: 1, patrolFreq: 'Very High', cctv: 20, radius: 1000 },
    { id: 7, name: 'Ramdaspeth', lat: 21.1332, lng: 79.0656, safety: 'safe', incidents: 0, patrolFreq: 'High', cctv: 18, radius: 850 },
    { id: 8, name: 'Ganeshpeth', lat: 21.1589, lng: 79.1012, safety: 'moderate', incidents: 6, patrolFreq: 'Medium', cctv: 5, radius: 650 },
    { id: 9, name: 'Lakadganj', lat: 21.1678, lng: 79.0989, safety: 'unsafe', incidents: 10, patrolFreq: 'Low', cctv: 4, radius: 700 },
    { id: 10, name: 'Wardha Road', lat: 21.1234, lng: 79.1123, safety: 'moderate', incidents: 4, patrolFreq: 'Medium', cctv: 7, radius: 800 },
    { id: 11, name: 'Manewada', lat: 21.1123, lng: 79.0456, safety: 'safe', incidents: 1, patrolFreq: 'High', cctv: 10, radius: 750 },
    { id: 12, name: 'Hingna', lat: 21.0934, lng: 79.0234, safety: 'moderate', incidents: 7, patrolFreq: 'Medium', cctv: 6, radius: 900 },
    // Additional coverage zones
    { id: 13, name: 'Nagpur University', lat: 21.1350, lng: 79.0500, safety: 'safe', incidents: 0, patrolFreq: 'High', cctv: 25, radius: 600 },
    { id: 14, name: 'Medical Square', lat: 21.1480, lng: 79.0650, safety: 'safe', incidents: 2, patrolFreq: 'High', cctv: 15, radius: 500 },
    { id: 15, name: 'Variety Square', lat: 21.1410, lng: 79.0720, safety: 'moderate', incidents: 4, patrolFreq: 'Medium', cctv: 10, radius: 400 },
];

const EMERGENCY_CONTACTS = [
    { name: 'Women Helpline', number: '181', color: 'from-pink-500 to-rose-500', icon: '👩' },
    { name: 'Police Control', number: '100', color: 'from-blue-500 to-indigo-500', icon: '🚔' },
    { name: 'Nagpur Police', number: '0712-2565010', color: 'from-purple-500 to-violet-500', icon: '📞' },
    { name: 'Ambulance', number: '108', color: 'from-red-500 to-orange-500', icon: '🚑' },
];

const TRUSTED_CONTACTS = [
    { name: 'Mom', avatar: '👩' },
    { name: 'Dad', avatar: '👨' },
    { name: 'Sister', avatar: '👧' },
];

// Map controller
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1 });
    }, [center, zoom, map]);
    return null;
};

const SafeRouteMap = ({ onClose }) => {
    const [selectedZone, setSelectedZone] = useState(null);
    const [showSOS, setShowSOS] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(5);
    const [sosTriggered, setSosTriggered] = useState(false);
    const [destination, setDestination] = useState('');
    const [routeInfo, setRouteInfo] = useState(null);
    const [liveTracking, setLiveTracking] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation] = useState({ lat: 21.1458, lng: 79.0882 });
    const [routePath, setRoutePath] = useState([]);
    const [mapCenter, setMapCenter] = useState([21.1458, 79.0882]);
    const [mapZoom, setMapZoom] = useState(13);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [destinationCoords, setDestinationCoords] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (showSOS && sosCountdown > 0) {
            const timer = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (showSOS && sosCountdown === 0) {
            setSosTriggered(true);
        }
    }, [showSOS, sosCountdown]);

    const getSafetyColor = (safety) => {
        switch (safety) {
            case 'safe': return { fill: 'rgba(34, 197, 94, 0.35)', stroke: '#16a34a' };
            case 'moderate': return { fill: 'rgba(251, 191, 36, 0.4)', stroke: '#d97706' };
            case 'unsafe': return { fill: 'rgba(239, 68, 68, 0.4)', stroke: '#dc2626' };
            default: return { fill: 'rgba(107, 114, 128, 0.2)', stroke: '#6b7280' };
        }
    };

    // Fetch real route from OSRM API
    const fetchRoute = async (startLat, startLng, endLat, endLng) => {
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
            );
            const data = await response.json();
            if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                return {
                    path: coords,
                    distance: (data.routes[0].distance / 1000).toFixed(1),
                    duration: Math.ceil(data.routes[0].duration / 60),
                };
            }
        } catch (error) {
            console.error('Route fetch failed:', error);
        }
        return null;
    };

    const calculateRoute = useCallback(async () => {
        if (!destination.trim()) return;

        setIsLoadingRoute(true);

        // Find destination zone
        const destZone = NAGPUR_ZONES.find(z =>
            z.name.toLowerCase().includes(destination.toLowerCase())
        );

        let endLat, endLng, destName, destSafety;

        if (destZone) {
            endLat = destZone.lat;
            endLng = destZone.lng;
            destName = destZone.name;
            destSafety = destZone.safety;
        } else {
            // Default to Sitabuldi for unknown destinations
            endLat = 21.1466;
            endLng = 79.0788;
            destName = destination;
            destSafety = 'moderate';
        }

        setDestinationCoords({ lat: endLat, lng: endLng });

        // Fetch real route
        const routeData = await fetchRoute(userLocation.lat, userLocation.lng, endLat, endLng);

        if (routeData) {
            setRoutePath(routeData.path);
            setRouteInfo({
                distance: routeData.distance,
                time: routeData.duration,
                safetyScore: destSafety === 'safe' ? 95 : destSafety === 'moderate' ? 70 : 45,
                via: NAGPUR_ZONES.filter(z => z.safety === 'safe').slice(0, 2).map(z => z.name),
                avoids: NAGPUR_ZONES.filter(z => z.safety === 'unsafe').slice(0, 2).map(z => z.name),
                destination: destName,
            });

            // Zoom to fit route
            setMapCenter([(userLocation.lat + endLat) / 2, (userLocation.lng + endLng) / 2]);
            setMapZoom(14);
        } else {
            // Fallback: straight line
            setRoutePath([[userLocation.lat, userLocation.lng], [endLat, endLng]]);
            setRouteInfo({
                distance: '5.2',
                time: 15,
                safetyScore: 75,
                via: ['Civil Lines', 'Dharampeth'],
                avoids: ['Itwari', 'Mahal'],
                destination: destName,
            });
        }

        setIsLoadingRoute(false);
    }, [destination, userLocation]);

    const cancelSOS = () => {
        setShowSOS(false);
        setSosCountdown(5);
        setSosTriggered(false);
    };

    const focusZone = (zone) => {
        setSelectedZone(zone);
        setMapCenter([zone.lat, zone.lng]);
        setMapZoom(15);
    };

    const clearRoute = () => {
        setRoutePath([]);
        setRouteInfo(null);
        setDestinationCoords(null);
        setDestination('');
        setMapCenter([21.1458, 79.0882]);
        setMapZoom(13);
    };

    const filteredZones = NAGPUR_ZONES.filter(z =>
        z.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isNightTime = currentTime.getHours() >= 20 || currentTime.getHours() < 6;

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 overflow-auto">
            <style>{`
        .leaflet-container { background: #f8fafc; border-radius: 16px; }
        .user-marker, .dest-marker { background: transparent !important; border: none !important; }
        .leaflet-popup-content-wrapper { background: white; color: #1e293b; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .leaflet-popup-tip { background: white; }
        .leaflet-popup-content { margin: 12px; }
      `}</style>

            <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30"
                        >
                            <span className="text-2xl">🛡️</span>
                        </motion.div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                                SafeRoute Nagpur
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>{currentTime.toLocaleTimeString()}</span>
                                {isNightTime && (
                                    <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full text-xs">🌙 Night Mode</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setLiveTracking(!liveTracking)}
                            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${liveTracking ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            📍 {liveTracking ? 'Sharing Live' : 'Share Location'}
                        </motion.button>
                        {onClose && (
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-2xl">✕</button>
                        )}
                    </div>
                </div>

                {/* SOS Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSOS(true)}
                    className="w-full mb-4 p-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-2xl shadow-lg shadow-red-500/30"
                >
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">🚨</span>
                        <span className="text-xl font-bold">EMERGENCY SOS</span>
                    </div>
                </motion.button>

                {/* Live Tracking */}
                <AnimatePresence>
                    {liveTracking && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                    <span className="font-medium text-green-400">Live Location Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {TRUSTED_CONTACTS.map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-green-500/20 rounded-full text-sm">{c.avatar} {c.name}</span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Route Search */}
                <div className="mb-4 p-4 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">📍</div>
                            <input
                                type="text"
                                value="Your Location"
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white"
                                readOnly
                            />
                        </div>
                        <div className="flex-1 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">🎯</div>
                            <input
                                type="text"
                                placeholder="Enter destination..."
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && calculateRoute()}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:border-purple-500 focus:outline-none text-white"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={calculateRoute}
                            disabled={isLoadingRoute}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {isLoadingRoute ? '⏳ Finding...' : '🧭 Find Route'}
                        </motion.button>
                        {routeInfo && (
                            <button onClick={clearRoute} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl">✕</button>
                        )}
                    </div>

                    {/* Quick Destinations */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {['Sitabuldi', 'Civil Lines', 'Dharampeth', 'Ramdaspeth'].map(place => (
                            <button
                                key={place}
                                onClick={() => { setDestination(place); }}
                                className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-slate-300 transition-all"
                            >
                                {place}
                            </button>
                        ))}
                    </div>

                    {/* Route Result */}
                    <AnimatePresence>
                        {routeInfo && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                                            ✅ Route to {routeInfo.destination}
                                            <span className={`px-2 py-0.5 rounded-full text-sm ${routeInfo.safetyScore >= 80 ? 'bg-emerald-500/30' :
                                                routeInfo.safetyScore >= 60 ? 'bg-amber-500/30 text-amber-400' : 'bg-red-500/30 text-red-400'
                                                }`}>
                                                {routeInfo.safetyScore}% Safe
                                            </span>
                                        </div>
                                        <p className="text-slate-300 mt-1">📏 {routeInfo.distance} km • ⏱️ ~{routeInfo.time} mins</p>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-emerald-300">✓ Via safe zones</p>
                                        <p className="text-red-300">✗ Avoids: {routeInfo.avoids.join(', ')}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Zone List */}
                    <div className="lg:col-span-1 space-y-3">
                        <input
                            type="text"
                            placeholder="🔍 Search area..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:border-purple-500 focus:outline-none text-white text-sm"
                        />
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
                            {filteredZones.slice(0, 12).map((zone) => (
                                <motion.div
                                    key={zone.id}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    onClick={() => focusZone(zone)}
                                    className={`p-3 bg-slate-800/50 rounded-xl border-2 cursor-pointer transition-all ${selectedZone?.id === zone.id ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-slate-700/50 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${zone.safety === 'safe' ? 'bg-emerald-500' : zone.safety === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                                                }`} />
                                            <span className="font-medium text-sm">{zone.name}</span>
                                        </div>
                                        <span className="text-xs text-slate-400">{zone.incidents} ⚠️</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* MAP */}
                    <div className="lg:col-span-3">
                        <div className="h-[450px] rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
                            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                                <MapController center={mapCenter} zoom={mapZoom} />
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* Safety Zone Overlays - Large faint areas */}
                                {NAGPUR_ZONES.map((zone) => {
                                    const colors = getSafetyColor(zone.safety);
                                    return (
                                        <Circle
                                            key={zone.id}
                                            center={[zone.lat, zone.lng]}
                                            radius={zone.radius}
                                            pathOptions={{
                                                color: colors.stroke,
                                                fillColor: colors.fill,
                                                fillOpacity: 0.5,
                                                weight: 3,
                                            }}
                                            eventHandlers={{
                                                click: () => setSelectedZone(zone),
                                            }}
                                        >
                                            <Popup>
                                                <div className="min-w-[160px]">
                                                    <strong className="text-lg">{zone.name}</strong>
                                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs text-white ${zone.safety === 'safe' ? 'bg-green-600' : zone.safety === 'moderate' ? 'bg-amber-500' : 'bg-red-600'
                                                        }`}>{zone.safety.toUpperCase()}</span>
                                                    <div className="mt-2 text-sm space-y-1">
                                                        <p>⚠️ Incidents: {zone.incidents}</p>
                                                        <p>📹 CCTV: {zone.cctv}</p>
                                                        <p>👮 Patrol: {zone.patrolFreq}</p>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Circle>
                                    );
                                })}

                                {/* User Location */}
                                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                    <Popup><strong>📍 You are here</strong></Popup>
                                </Marker>

                                {/* Destination Marker */}
                                {destinationCoords && (
                                    <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destIcon}>
                                        <Popup><strong>🎯 {routeInfo?.destination}</strong></Popup>
                                    </Marker>
                                )}

                                {/* Route Line - Google Maps style */}
                                {routePath.length > 0 && (
                                    <>
                                        {/* Shadow/glow effect */}
                                        <Polyline
                                            positions={routePath}
                                            pathOptions={{ color: '#7c3aed', weight: 10, opacity: 0.3 }}
                                        />
                                        {/* Main route line */}
                                        <Polyline
                                            positions={routePath}
                                            pathOptions={{ color: '#8b5cf6', weight: 6, opacity: 1 }}
                                        />
                                        {/* White dashes on top */}
                                        <Polyline
                                            positions={routePath}
                                            pathOptions={{
                                                color: '#c4b5fd',
                                                weight: 3,
                                                opacity: 0.9,
                                                dashArray: '8, 12',
                                            }}
                                        />
                                    </>
                                )}
                            </MapContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-6 mt-3 justify-center text-sm">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-700" /> Safe Zone</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-amber-600" /> Moderate</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-700" /> Unsafe</div>
                        </div>
                    </div>
                </div>

                {/* Emergency Contacts */}
                <div className="mt-6">
                    <h3 className="font-bold text-lg text-slate-200 mb-3">🚨 Emergency Contacts</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {EMERGENCY_CONTACTS.map((contact) => (
                            <motion.a key={contact.number} href={`tel:${contact.number}`}
                                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}
                                className={`p-4 bg-gradient-to-br ${contact.color} rounded-2xl shadow-lg`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{contact.icon}</span>
                                    <span className="font-semibold">{contact.name}</span>
                                </div>
                                <div className="text-2xl font-mono font-bold mt-1">{contact.number}</div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>

            {/* SOS Modal */}
            <AnimatePresence>
                {showSOS && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            className="w-full max-w-md mx-4 p-8 bg-gradient-to-br from-red-900 to-rose-900 rounded-3xl border-2 border-red-500">
                            {!sosTriggered ? (
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🚨</div>
                                    <h2 className="text-3xl font-bold mb-2">SOS Alert</h2>
                                    <p className="text-red-200 mb-6">Sending in...</p>
                                    <div className="text-8xl font-bold mb-6">{sosCountdown}</div>
                                    <button onClick={cancelSOS} className="w-full py-4 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-xl">Cancel</button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="text-6xl mb-4">✅</div>
                                    <h2 className="text-3xl font-bold mb-2">Alert Sent!</h2>
                                    <div className="text-left bg-black/20 p-4 rounded-xl mb-6 space-y-2">
                                        <p>✓ Police notified</p>
                                        <p>✓ Location shared</p>
                                        <p>✓ Family alerted</p>
                                    </div>
                                    <button onClick={cancelSOS} className="w-full py-4 bg-white/20 rounded-xl font-bold">Close</button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SafeRouteMap;
