import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, X } from 'lucide-react';

const AlertOverlay = ({ type, message, onDismiss }) => {
    if (!type) return null;

    const isWeapon = type === 'weapon';
    const isFall = type === 'fall';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center"
                style={{
                    background: isWeapon
                        ? 'radial-gradient(circle at center, rgba(239,68,68,0.95) 0%, rgba(127,29,29,0.98) 100%)'
                        : 'radial-gradient(circle at center, rgba(245,158,11,0.9) 0%, rgba(146,64,14,0.95) 100%)',
                }}
            >
                {/* Animated rings */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute left-1/2 top-1/2 rounded-full border-2"
                            style={{
                                borderColor: 'rgba(255,255,255,0.2)',
                                transform: 'translate(-50%, -50%)',
                            }}
                            initial={{ width: 0, height: 0, opacity: 1 }}
                            animate={{
                                width: [0, 800],
                                height: [0, 800],
                                opacity: [1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.6,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="relative z-10 text-center text-white px-8"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        {isWeapon ? (
                            <Shield className="w-32 h-32 mx-auto mb-6 drop-shadow-2xl" />
                        ) : (
                            <AlertTriangle className="w-32 h-32 mx-auto mb-6 drop-shadow-2xl" />
                        )}
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        className="text-5xl font-black tracking-wider mb-4"
                        style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                    >
                        {isWeapon ? 'WEAPON DETECTED' : 'PERSON DOWN'}
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl opacity-90 mb-8"
                    >
                        {message || 'Authorities have been notified. Stay calm.'}
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center justify-center gap-4"
                    >
                        <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            DISPATCH SENT
                        </span>
                        <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            RECORDING ACTIVE
                        </span>
                    </motion.div>

                    {onDismiss && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            onClick={onDismiss}
                            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </motion.button>
                    )}
                </motion.div>

                {/* Corner brackets */}
                <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-white/30"></div>
                <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-white/30"></div>
                <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-white/30"></div>
                <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-white/30"></div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AlertOverlay;
