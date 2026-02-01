import React, { useState } from 'react';
import { Maximize, Grid, Wifi, WifiOff, Video, VideoOff } from 'lucide-react';
import { motion } from 'framer-motion';

const VideoPlayer = ({ gridMode, toggleGrid }) => {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const streamUrl = "http://localhost:8000/video_feed";

    return (
        <motion.div
            className="card video-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Video Stream */}
            <img
                src={streamUrl}
                alt="Live Feed"
                className="w-full h-full object-cover"
                onLoad={() => { setLoading(false); setConnected(true); }}
                onError={(e) => {
                    e.target.onerror = null;
                    setConnected(false);
                    setLoading(false);
                }}
            />

            {/* Gradient Overlay */}
            <div className="video-overlay"></div>

            {/* Top Left - Live Badge */}
            <motion.div
                className="absolute top-4 left-4 z-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className={`video-badge ${connected ? 'text-green-400' : 'text-red-400'}`}>
                    {connected ? (
                        <>
                            <span className="status-dot"></span>
                            <span>LIVE</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-4 h-4" />
                            <span>OFFLINE</span>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Top Right - Controls */}
            <motion.div
                className="absolute top-4 right-4 z-10 flex gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.button
                    onClick={toggleGrid}
                    className="btn-icon"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={gridMode ? "Single View" : "Grid View"}
                >
                    {gridMode ? <Maximize className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                </motion.button>
            </motion.div>

            {/* Bottom Left - Resolution */}
            <motion.div
                className="absolute bottom-4 left-4 z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="video-badge text-white/80">
                    <Video className="w-4 h-4" />
                    <span>{gridMode ? '4 Cameras' : 'Primary Feed'}</span>
                    <span className="text-white/50">• 1080p</span>
                </div>
            </motion.div>

            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
                    <div className="loader mb-4"></div>
                    <div className="text-white/60 text-sm">Connecting to camera...</div>
                </div>
            )}

            {/* No Connection State */}
            {!loading && !connected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                    <VideoOff className="w-16 h-16 text-white/30 mb-4" />
                    <div className="text-white/60 text-sm">No video signal</div>
                    <div className="text-white/40 text-xs mt-1">Check backend connection</div>
                </div>
            )}
        </motion.div>
    );
};

export default VideoPlayer;
