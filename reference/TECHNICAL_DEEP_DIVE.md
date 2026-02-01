# CityWatch AI - Technical Deep Dive

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐  │
│  │   Dashboard  │ │  SafeRoute   │ │    Alert Overlay         │  │
│  │   (App.jsx)  │ │   Map.jsx    │ │    (AlertOverlay.jsx)    │  │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI + Python)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐  │
│  │   api.py     │ │ logic_core   │ │   Telegram SuperBot      │  │
│  │  (Endpoints) │ │   (YOLOv8)   │ │   (Alert Broadcaster)    │  │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐         ┌──────────┐
   │  Camera  │        │   GPU    │         │ Telegram │
   │  (USB)   │        │ (CUDA)   │         │   API    │
   └──────────┘        └──────────┘         └──────────┘
```

---

## 🧠 AI Detection Pipeline

### YOLOv8 Inference Flow

```python
Frame Capture → Preprocessing → YOLOv8 Inference → Post-processing → Alert Logic
      ↓              ↓               ↓                  ↓              ↓
   640x480      Resize/Pad      GPU Forward         NMS Filter    Broadcast
   30 FPS        to 640         ~15-20ms           Conf > 0.35    to Telegram
```

### Detection Classes (COCO Dataset)

| Class ID | Object | Category |
|----------|--------|----------|
| 0 | Person | Tracking |
| 43 | Knife | Weapon |
| 76 | Scissors | Weapon |
| 67 | Cell Phone | Demo Object |
| 39 | Bottle | Demo Object |
| 42 | Fork | Demo Object |
| 65 | Remote | Demo Object |
| 79 | Toothbrush | Demo Object |

### Confidence Threshold: **0.35** (35%)

---

## 🎯 Detection Features

### 1. Weapon Detection
```python
WEAPON_CLASSES = {43, 76, 67, 39, 42, 65, 79}  # Extended for demo

def detect_weapons(frame, results):
    for detection in results:
        if detection.class_id in WEAPON_CLASSES:
            if detection.confidence > 0.35:
                trigger_alert("weapon", frame)
```

### 2. Fall Detection
- Uses YOLOv8 Pose estimation
- Analyzes body keypoints (shoulders, hips)
- Triggers when person aspect ratio indicates falling

### 3. SOS Gesture Detection
- Hand tracking with 5-point skeleton
- Detects raised hand with specific pattern
- Cooldown: 5 seconds between triggers

---

## 📡 Telegram Integration

### Alert Flow
```
Threat Detected → Encode Frame → Send Photo → Send Location
                      ↓
              JPEG encoding
              Quality: 85%
                      ↓
              Telegram Bot API
              /sendPhoto + /sendLocation
```

### API Endpoints Used
- `sendMessage` - Text alerts
- `sendPhoto` - Threat snapshots
- `sendLocation` - GPS coordinates (simulated for demo)
- `getUpdates` - Polling for user commands

### User Commands
| Command | Action |
|---------|--------|
| `/start` | Register for alerts |
| `/status` | Get system status |
| `/help` | Show commands |
| `/mute` | Disable alerts |
| `/unmute` | Resume alerts |
| `/testweapon` | Trigger test alert |

---

## 🗺️ SafeRoute Navigation System

### Technology Stack
- **Map**: Leaflet.js + React-Leaflet
- **Tiles**: CartoDB Dark (dark theme)
- **Routing**: OSRM (Open Source Routing Machine)
- **Data**: 15 Nagpur zones with safety ratings

### Zone Safety Algorithm
```javascript
// Each zone has:
{
  name: "Sitabuldi",
  lat: 21.1466, lng: 79.0788,
  safety: "safe",      // safe | moderate | unsafe
  incidents: 2,        // Last 30 days
  cctv: 15,           // Camera count
  patrolFreq: "High"  // Police patrol frequency
}
```

### Route Calculation
```javascript
// OSRM API call
const response = await fetch(
  `https://router.project-osrm.org/route/v1/driving/
   ${startLng},${startLat};${endLng},${endLat}
   ?overview=full&geometries=geojson`
);
// Returns actual road-based route with distance/duration
```

---

## ⚡ Performance Metrics

| Metric | Value |
|--------|-------|
| Video FPS | 15-30 |
| Inference Time (GPU) | 15-25ms |
| Inference Time (CPU) | 80-150ms |
| Alert Latency | < 500ms |
| Telegram Delivery | < 2s |

### GPU Acceleration
- **Device**: NVIDIA RTX 2050
- **CUDA Version**: 12.6
- **PyTorch**: CUDA-enabled build
- **Memory Usage**: ~1.5GB VRAM

---

## 🔐 Security Considerations

1. **Camera Privacy**: Toggle on/off with `C` key
2. **Alert Throttling**: 10-second cooldown between alerts
3. **Telegram**: Only registered users receive alerts
4. **No Cloud Storage**: All processing is local

---

## 📦 Dependencies

### Backend (Python)
```
fastapi>=0.104.0
uvicorn>=0.24.0
opencv-python>=4.8.0
numpy>=1.24.0
ultralytics>=8.0.0
python-multipart>=0.0.6
requests>=2.31.0
torch>=2.0.0 (with CUDA)
```

### Frontend (Node.js)
```
react@18.3.1
framer-motion@11.15.0
axios@1.7.9
lucide-react@0.468.0
leaflet@1.9.4
react-leaflet@4.2.1
```

---

## 🚀 Deployment Checklist

- [ ] Set TELEGRAM_BOT_TOKEN environment variable
- [ ] Install CUDA drivers for GPU support
- [ ] Build frontend: `npm run build`
- [ ] Configure CORS for production domain
- [ ] Set up reverse proxy (Nginx)
- [ ] Enable HTTPS for Telegram webhook
