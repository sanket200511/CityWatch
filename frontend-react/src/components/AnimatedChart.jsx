import React, { useRef, useEffect, useState, memo } from 'react';

const AnimatedChart = memo(({ data = [], height = 120, color = '#06b6d4' }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [width, setWidth] = useState(300);

    // Resize observer for container width
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateWidth = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0) {
                setWidth(rect.width);
            }
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    // Draw chart
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size with device pixel ratio
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        if (data.length < 2) {
            ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
            ctx.textAlign = 'center';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText('Collecting data...', width / 2, height / 2);
            return;
        }

        const padding = { top: 10, bottom: 10, left: 5, right: 5 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxVal = Math.max(...data, 100);
        const minVal = 0;

        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, `${color}40`);
        gradient.addColorStop(1, `${color}05`);

        // Calculate points
        const points = data.map((val, i) => ({
            x: padding.left + (i / (data.length - 1)) * chartWidth,
            y: padding.top + (1 - (val - minVal) / (maxVal - minVal)) * chartHeight,
        }));

        // Draw filled area
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Draw current value dot
        const last = points[points.length - 1];

        // Glow
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `${color}40`;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

    }, [data, width, height, color]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: `${height}px` }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
            />
        </div>
    );
});

AnimatedChart.displayName = 'AnimatedChart';

export default AnimatedChart;
