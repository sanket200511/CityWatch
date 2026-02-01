# CityWatch AI - Project Guide

## 🎯 Overview

CityWatch is an **AI-powered urban surveillance system** that provides real-time threat detection, safety monitoring, and emergency response capabilities. Built for smart city deployments, it combines computer vision, instant alerts, and women's safety navigation.

---

## 🏗️ Project Structure

```
CityWatch_Project/
├── Backend/
│   ├── api.py              # FastAPI server with all endpoints
│   ├── logic_core.py       # YOLOv8 AI detection engine
│   └── venv_gpu/           # Python virtual environment (GPU)
├── frontend-react/
│   ├── src/
│   │   ├── App.jsx         # Main dashboard component
│   │   ├── components/
│   │   │   ├── SafeRouteMap.jsx    # Women's safety navigation
│   │   │   ├── AlertOverlay.jsx    # Threat alert popups
│   │   │   ├── AnimatedChart.jsx   # Real-time statistics
│   │   │   └── ParticleField.jsx   # Background effects
│   │   └── index.css       # Global styles
├── reference/              # Documentation files
├── yolov8n.pt             # YOLO model file
└── requirements.txt        # Python dependencies
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10-3.13** (with pip)
- **Node.js 18+** (with npm)
- **NVIDIA GPU** (optional, for faster processing)
- **Telegram Bot Token** (for alert notifications)

### 1. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv_gpu
.\venv_gpu\Scripts\activate   # Windows
source venv_gpu/bin/activate  # Linux/Mac

# Install dependencies
pip install fastapi uvicorn opencv-python numpy ultralytics python-multipart requests

# For GPU support (CUDA 12.x):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# Start server
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend-react

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access Dashboard
- **Dashboard**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## ✨ Key Features

### 🎥 Real-Time Surveillance
- Live video feed processing at 15-30 FPS
- GPU-accelerated inference with NVIDIA RTX
- Multi-camera grid view support

### 🔫 Threat Detection
- **Weapon Detection**: Knife, scissors, and suspicious objects
- **Fall Detection**: Person down alerts
- **SOS Gesture**: Hand signal recognition
- Confidence threshold: 35% (adjustable)

### 📱 Telegram Integration
- Instant photo alerts with detected threats
- GPS coordinates with Google Maps links
- User commands: `/start`, `/status`, `/mute`, `/unmute`
- Auto-registration for new users

### 🛡️ SafeRoute Navigation (NEW!)
- **Real Nagpur Map** with OpenStreetMap
- Safety zone overlays (Safe/Moderate/Unsafe)
- **Real-time routing** via OSRM API
- Emergency SOS with countdown
- Live location sharing to trusted contacts
- One-tap emergency contacts (181, 100, 108)

---

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `G` | Toggle grid view |
| `M` | Mute/unmute sounds |
| `F` | Fullscreen video |
| `C` | Toggle camera on/off |
| `Space` | Pause/resume detection |
| `Esc` | Dismiss alerts |

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/video_feed` | GET | MJPEG video stream |
| `/stats` | GET | System statistics |
| `/toggle_grid` | POST | Switch view mode |
| `/toggle_camera` | POST | Enable/disable camera |
| `/test_alert/{type}` | POST | Trigger test alert |
| `/telegram/poll` | POST | Poll Telegram updates |

---

## 🌍 Environment Variables

Create a `.env` file in Backend/:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

---

## 📊 System Requirements

### Minimum
- CPU: Intel i5 / AMD Ryzen 5
- RAM: 8GB
- Camera: USB/Built-in webcam

### Recommended (GPU Mode)
- GPU: NVIDIA RTX 2050 or better
- VRAM: 4GB+
- CUDA: 12.x

---

## 🎯 Detection Classes

The system currently detects:
- Person (class 0)
- Knife (class 43)
- Scissors (class 76)
- Cell Phone (class 67)
- Bottle (class 39)
- Fork (class 42)
- Remote (class 65)
- Toothbrush (class 79)

---

## 📝 Version History

- **v2.0** - SafeRoute navigation, GPU support, Telegram photo alerts
- **v1.5** - Multi-camera grid, improved UI
- **v1.0** - Initial release with weapon detection

---

## 👥 Team

Built for hackathon demonstration. Combines AI/ML, web development, and IoT concepts for smart city solutions.
