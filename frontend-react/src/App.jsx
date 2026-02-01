import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Shield, AlertTriangle, Bell, Play, Pause, Grid, Volume2, VolumeX,
  Maximize2, Clock, Eye, Zap, Radio, MapPin, Users, TrendingUp, Map
} from 'lucide-react';

// Components
import ParticleField from './components/ParticleField';
import AnimatedChart from './components/AnimatedChart';
import AlertOverlay from './components/AlertOverlay';
import SafeRouteMap from './components/SafeRouteMap';

// Hooks
import useSound from './hooks/useSound';
import useKeyboard from './hooks/useKeyboard';

const API_URL = 'http://localhost:8000';

// === MEMOIZED STAT CARD ===
const StatCard = memo(({ icon, value, label, color = 'cyan', alert = false }) => {
  const colorClasses = {
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  };

  return (
    <motion.div
      className={`stat-card ${alert ? 'border-red-500/50' : ''}`}
      animate={alert ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.5, repeat: alert ? Infinity : 0 }}
    >
      <div className={`mb-2 ${colorClasses[color]}`}>{icon}</div>
      <div className={`stat-value ${colorClasses[color]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// === MAIN APP ===
function App() {
  // State
  const [stats, setStats] = useState({
    uptime_seconds: 0,
    frames_processed: 0,
    threats_today: 0,
    zones_monitored: 4,
    grid_mode: false,
    weapon_detected: false,
    fall_detected: false,
    bot_users: 0,
  });
  const [isActive, setIsActive] = useState(true);
  const [gridMode, setGridMode] = useState(false);
  const [botConnected, setBotConnected] = useState(true); // Already connected in backend
  const [muted, setMuted] = useState(false);
  const [threatHistory, setThreatHistory] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [apiError, setApiError] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showSafeRoute, setShowSafeRoute] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const lastAlertRef = useRef(0);
  const fetchIntervalRef = useRef(null);

  // Hooks
  const sound = useSound();

  // Notification helper - defined first since other callbacks use it
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => {
      // Keep max 5 notifications
      const updated = [...prev.slice(-4), { id, message, type, time: new Date() }];
      return updated;
    });
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Memoized shortcut handlers to prevent re-registration
  const toggleGrid = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/toggle_grid`);
      setGridMode(prev => !prev);
      if (!muted) sound.playClick();
    } catch (e) {
      console.error('Toggle grid failed');
    }
  }, [muted, sound]);

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen?.();
      }
    }
  }, []);

  const toggleActive = useCallback(() => {
    setIsActive(prev => !prev);
    if (!muted) sound.playClick();
  }, [muted, sound]);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  // Toggle Camera On/Off
  const toggleCamera = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/toggle_camera`);
      setCameraEnabled(res.data.camera_enabled);
      if (!muted) sound.playClick();
      addNotification(res.data.camera_enabled ? 'Camera Enabled' : 'Camera Disabled (Privacy Mode)', 'info');
    } catch (e) {
      console.error('Toggle camera failed');
    }
  }, [muted, sound, addNotification]);

  // Keyboard shortcuts with memoized handlers
  const shortcuts = useMemo(() => ({
    'g': toggleGrid,
    'm': toggleMute,
    'f': toggleFullscreen,
    ' ': toggleActive,
    'c': toggleCamera,
    'escape': dismissAlert,
  }), [toggleGrid, toggleMute, toggleFullscreen, toggleActive, toggleCamera, dismissAlert]);

  useKeyboard(shortcuts);

  // Fetch stats - optimized with error handling
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/stats`, { timeout: 3000 });
        const data = res.data;

        if (data.status === 'initializing') {
          return; // Engine still starting
        }

        setStats(prev => ({
          ...prev,
          ...data,
        }));
        setApiError(false);

        // Sync grid mode from server
        if (data.grid_mode !== undefined) {
          setGridMode(data.grid_mode);
        }

        // Check for threats (with cooldown)
        const now = Date.now();
        if (data.weapon_detected && now - lastAlertRef.current > 10000) {
          lastAlertRef.current = now;
          setActiveAlert({ type: 'weapon', message: 'AI detected potential weapon in frame' });
          if (!muted) sound.playAlert();
          addNotification('WEAPON DETECTED', 'critical');
        }
        if (data.fall_detected && now - lastAlertRef.current > 10000) {
          lastAlertRef.current = now;
          setActiveAlert({ type: 'fall', message: 'Person down detected' });
          if (!muted) sound.playAlert();
          addNotification('PERSON DOWN', 'critical');
        }
      } catch (e) {
        setApiError(true);
        console.error('Stats fetch failed:', e.message);
      }
    };

    fetchStats(); // Initial fetch
    fetchIntervalRef.current = setInterval(fetchStats, 200); // Increased frequency for immediate alerts

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [muted, sound, addNotification]);

  // Clock - update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Threat history chart data - throttled updates
  useEffect(() => {
    const interval = setInterval(() => {
      setThreatHistory(prev => {
        const newVal = stats.weapon_detected || stats.fall_detected
          ? 70 + Math.random() * 30
          : 10 + Math.random() * 20;
        return [...prev.slice(-29), newVal];
      });
    }, 2000); // Slower updates for optimization
    return () => clearInterval(interval);
  }, [stats.weapon_detected, stats.fall_detected]);

  // Connect bot
  const connectBot = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/connect_bot`);
      setBotConnected(true);
      if (!muted) sound.playSuccess();
      addNotification('Telegram Bot Connected', 'success');
    } catch (e) {
      addNotification('Bot connection failed', 'warning');
    }
  }, [muted, sound, addNotification]);

  // Formatters - memoized
  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  }, []);

  const formatUptime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoized video URL to prevent re-renders
  const videoUrl = useMemo(() => `${API_URL}/video_feed`, []);

  return (
    <div className="min-h-screen bg-void text-white overflow-hidden">
      {/* Particle Background */}
      <ParticleField />

      {/* Alert Overlay */}
      <AnimatePresence>
        {activeAlert && (
          <AlertOverlay
            type={activeAlert.type}
            message={activeAlert.message}
            onDismiss={dismissAlert}
          />
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="relative z-10 flex h-screen">

        {/* === SIDEBAR === */}
        <aside className="sidebar p-6 flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-10 h-10 text-cyan-400" />
              <div className="absolute inset-0 animate-spin-slow">
                <div className="w-10 h-10 border border-cyan-500/30 rounded-full" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">CITYWATCH</h1>
              <p className="text-xs text-slate-500 font-medium">NEURAL GRID v2.0</p>
            </div>
          </div>

          {/* Status */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</span>
              <div className={`status-dot ${apiError ? 'status-danger' : (isActive ? 'status-online' : 'status-warning')}`} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime</span>
                <span className="font-mono text-cyan-400">{formatUptime(stats.uptime_seconds || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frames</span>
                <span className="font-mono">{(stats.frames_processed || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GPU</span>
                <span className="font-mono text-green-400">RTX 2050</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.zones_monitored || 4}</div>
              <div className="text-xs text-slate-500 mt-1">ZONES</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className={`text-2xl font-bold ${(stats.threats_today || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {stats.threats_today || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">THREATS</div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <button
              onClick={toggleActive}
              className={`w-full btn-premium ${isActive ? 'btn-danger' : 'btn-primary'}`}
            >
              {isActive ? <><Pause className="w-4 h-4" /> PAUSE</> : <><Play className="w-4 h-4" /> RESUME</>}
            </button>

            <button
              onClick={toggleCamera}
              className={`w-full btn-premium ${cameraEnabled ? 'btn-primary' : 'btn-ghost bg-amber-500/20 border-amber-500/50'}`}
            >
              {cameraEnabled ? 'CAMERA ON' : 'CAMERA OFF'}
            </button>

            <button
              onClick={toggleGrid}
              className={`w-full btn-premium btn-ghost ${gridMode ? 'bg-cyan-500/20 border-cyan-500/50' : ''}`}
            >
              <Grid className="w-4 h-4" />
              {gridMode ? 'SINGLE VIEW' : 'GRID VIEW'}
            </button>

            <button
              onClick={connectBot}
              className={`w-full btn-premium ${botConnected ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Radio className="w-4 h-4" />
              {botConnected ? 'BOT ONLINE' : 'CONNECT BOT'}
            </button>
          </div>

          {/* SafeRoute Button */}
          <button
            onClick={() => setShowSafeRoute(true)}
            className="w-full btn-premium bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 hover:from-purple-500/30 hover:to-pink-500/30"
          >
            <Map className="w-4 h-4" />
            🛡️ SAFEROUTE MAP
          </button>

          {/* Keyboard Hints */}
          <div className="mt-auto glass-card p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Shortcuts</div>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between"><span>Camera On/Off</span><kbd className="kbd">C</kbd></div>
              <div className="flex justify-between"><span>Toggle Grid</span><kbd className="kbd">G</kbd></div>
              <div className="flex justify-between"><span>Mute/Unmute</span><kbd className="kbd">M</kbd></div>
              <div className="flex justify-between"><span>Fullscreen</span><kbd className="kbd">F</kbd></div>
              <div className="flex justify-between"><span>Pause/Resume</span><kbd className="kbd">␣</kbd></div>
            </div>
          </div>
        </aside>

        {/* === MAIN CONTENT === */}
        <main className="flex-1 p-6 ml-[280px] overflow-auto">

          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Command Center</h2>
              <p className="text-slate-400 text-sm">Real-time surveillance & threat detection</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleMute} className="btn-premium btn-ghost p-2" title={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="glass-card px-4 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-lg">{formatTime(currentTime)}</span>
              </div>
            </div>
          </header>

          {/* Video Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <div className="glass-panel p-1">
                <div ref={videoRef} className="video-container relative">
                  <img
                    src={videoUrl}
                    alt="Live Feed"
                    className="w-full h-full object-cover"
                    style={{ filter: isActive ? 'none' : 'grayscale(100%) brightness(0.5)' }}
                  />

                  {/* HUD Overlay */}
                  <div className="video-overlay" />
                  <div className="video-hud">
                    <div className="hud-corner top-left" />
                    <div className="hud-corner top-right" />
                    <div className="hud-corner bottom-left" />
                    <div className="hud-corner bottom-right" />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isActive ? 'bg-red-500/90' : 'bg-slate-600/90'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                      {isActive ? 'LIVE' : 'PAUSED'}
                    </span>
                    {gridMode && (
                      <span className="px-3 py-1.5 rounded-full bg-cyan-500/90 text-xs font-bold">
                        2x2 GRID
                      </span>
                    )}
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                    title="Fullscreen (F)"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Stats */}
            <div className="space-y-4">
              {/* Threat Level Chart */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Threat Level</span>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <AnimatedChart
                  data={threatHistory}
                  height={100}
                  color={(stats.threats_today || 0) > 0 ? '#ef4444' : '#06b6d4'}
                />
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Eye className="w-5 h-5" />}
                  value={stats.frames_processed || 0}
                  label="Frames"
                  color="cyan"
                />
                <StatCard
                  icon={<AlertTriangle className="w-5 h-5" />}
                  value={stats.threats_today || 0}
                  label="Threats"
                  color={(stats.threats_today || 0) > 0 ? 'red' : 'green'}
                  alert={(stats.threats_today || 0) > 0}
                />
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  value={stats.bot_users || 0}
                  label="Bot Users"
                  color="purple"
                />
                <StatCard
                  icon={<Zap className="w-5 h-5" />}
                  value="GPU"
                  label="Accelerator"
                  color="amber"
                />
              </div>

              {/* Zone Status */}
              <div className="glass-card p-4">
                <div className="text-sm font-semibold mb-3">Active Zones</div>
                <div className="space-y-2">
                  {['NORTH', 'SOUTH', 'EAST', 'WEST'].map((zone) => (
                    <div key={zone} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-400">{zone} SECTOR</span>
                      </div>
                      <span className="text-green-400 text-xs font-semibold">CLEAR</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Event Log */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Live Event Log</span>
              <Bell className="w-4 h-4 text-slate-500" />
            </div>
            <div className="space-y-2 max-h-40 overflow-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  System initialized. Listening for events...
                </p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`event-item ${notif.type}`}>
                    <span className="text-xs text-slate-500 font-mono">
                      {notif.time.toLocaleTimeString()}
                    </span>
                    <span className="text-sm">{notif.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>
      </div>

      {/* SafeRoute Map Overlay */}
      <AnimatePresence>
        {showSafeRoute && (
          <SafeRouteMap onClose={() => setShowSafeRoute(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
