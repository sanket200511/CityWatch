# 🛡️ CityWatch AI

**AI-Powered Urban Surveillance & Women's Safety Platform**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-purple.svg)](https://ultralytics.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

---

## ✨ Features

### 🎥 Real-Time Surveillance
- Live video feed with AI-powered detection
- GPU-accelerated processing (15-30 FPS)
- Multi-camera grid view support

### 🔫 Threat Detection
- Weapon detection (knife, scissors)
- Fall detection with pose analysis
- SOS gesture recognition
- Instant Telegram alerts with photos

### 🗺️ SafeRoute Navigation
- Interactive Nagpur city map
- Safety zones (Safe/Moderate/Unsafe)
- Real-time route optimization
- Emergency SOS with countdown
- Live location sharing

### 📱 Mobile Alerts
- Telegram bot integration
- Photo + GPS coordinates
- Google Maps links
- User commands (/start, /status, /mute)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ with pip
- Node.js 18+ with npm
- NVIDIA GPU (optional, for faster processing)
- Webcam or USB camera

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/citywatch.git
cd citywatch
```

### 2. Backend

```bash
cd Backend
python -m venv venv_gpu
.\venv_gpu\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend-react
npm install
npm run dev
```

### 4. Access

- **Dashboard**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `G` | Toggle grid view |
| `M` | Mute/unmute sounds |
| `F` | Fullscreen video |
| `C` | Camera on/off |
| `Space` | Pause/resume |
| `Esc` | Dismiss alerts |

---

## 📁 Project Structure

```
CityWatch_Project/
├── Backend/
│   ├── api.py              # FastAPI server
│   ├── logic_core.py       # YOLOv8 AI engine
│   └── yolov8n.pt          # YOLO model
├── frontend-react/
│   └── src/
│       ├── App.jsx         # Main dashboard
│       └── components/
│           └── SafeRouteMap.jsx  # Safety navigation

```

---

## 🔧 Configuration

### Telegram Bot

1. Create bot via [@BotFather](https://t.me/BotFather)
2. Get your token
3. Set environment variable:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

### GPU Support

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Video FPS | 15-30 |
| Inference (GPU) | 15-25ms |
| Alert Latency | < 500ms |
| Memory Usage | ~500MB |

---

## 🛣️ Roadmap

- [x] Real-time weapon detection
- [x] Telegram alerts with photos
- [x] SafeRoute navigation
- [x] GPU acceleration
- [ ] Mobile app (React Native)
- [ ] Multi-city support
- [ ] License plate recognition
- [ ] Crowd density analysis

---



---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ for hackathon demonstration.

**Tech Stack**: Python • FastAPI • React • YOLOv8 • Leaflet • Telegram API
