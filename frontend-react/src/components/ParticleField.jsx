import React, { useRef, useEffect, memo } from 'react';

// Memoized to prevent unnecessary re-renders
const ParticleField = memo(() => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let isActive = true;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createParticles();
        };

        const createParticles = () => {
            // Reduced particle count for performance (was /15000, now /25000)
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 60);
            particlesRef.current = [];

            for (let i = 0; i < count; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.2, // Slower movement
                    vy: (Math.random() - 0.5) * 0.2,
                    radius: Math.random() * 1.2 + 0.3,
                    alpha: Math.random() * 0.4 + 0.1,
                });
            }
        };

        const drawParticles = () => {
            if (!isActive) return;

            const particles = particlesRef.current;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})`;
                ctx.fill();
            }

            // Draw connections (optimized - only check nearby particles)
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy; // Avoid sqrt for performance

                    if (distSq < 8000) { // ~90px
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            animationRef.current = requestAnimationFrame(drawParticles);
        };

        resize();
        drawParticles();

        window.addEventListener('resize', resize);

        return () => {
            isActive = false;
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.5,
            }}
        />
    );
});

ParticleField.displayName = 'ParticleField';

export default ParticleField;
