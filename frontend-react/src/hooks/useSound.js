import { useCallback, useRef } from 'react';

// Web Audio API based sound system
const useSound = () => {
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);
    const mutedRef = useRef(false);

    const getContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.connect(audioContextRef.current.destination);
        }
        return audioContextRef.current;
    };

    const playTone = useCallback((frequency, duration, type = 'sine', volume = 0.3) => {
        if (mutedRef.current) return;

        try {
            const ctx = getContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

            gainNode.gain.setValueAtTime(volume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }, []);

    const playClick = useCallback(() => {
        playTone(800, 0.05, 'sine', 0.1);
    }, [playTone]);

    const playSuccess = useCallback(() => {
        playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 200);
    }, [playTone]);

    const playError = useCallback(() => {
        playTone(200, 0.3, 'sawtooth', 0.2);
    }, [playTone]);

    const playAlert = useCallback(() => {
        // Urgent alarm pattern
        const pattern = () => {
            playTone(880, 0.15, 'square', 0.3);
            setTimeout(() => playTone(660, 0.15, 'square', 0.3), 200);
        };
        pattern();
        setTimeout(pattern, 400);
        setTimeout(pattern, 800);
    }, [playTone]);

    const playNotification = useCallback(() => {
        playTone(1047, 0.1, 'sine', 0.15);
        setTimeout(() => playTone(1319, 0.15, 'sine', 0.15), 120);
    }, [playTone]);

    const toggleMute = useCallback(() => {
        mutedRef.current = !mutedRef.current;
        return mutedRef.current;
    }, []);

    const isMuted = useCallback(() => mutedRef.current, []);

    return {
        playClick,
        playSuccess,
        playError,
        playAlert,
        playNotification,
        toggleMute,
        isMuted,
    };
};

export default useSound;
