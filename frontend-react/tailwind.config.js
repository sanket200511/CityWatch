/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'neon-cyan': '#00d9ff',
                'neon-red': '#ff0055',
                'neon-green': '#00ff88',
                'dark-bg': '#0a0e1a',
                'panel-bg': 'rgba(255, 255, 255, 0.05)',
            },
            fontFamily: {
                'mono': ['Courier New', 'monospace'],
                'sans': ['Segoe UI', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
