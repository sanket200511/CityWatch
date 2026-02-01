# CityWatch AI - Code Explanation

## 📁 Core Files Overview

This document explains the main code components of CityWatch.

---

## 🔧 Backend Files

### 1. `api.py` - FastAPI Server

**Purpose**: Main server handling all HTTP endpoints, video streaming, and Telegram integration.

#### Key Components:

```python
# FastAPI Application
app = FastAPI(title="CityWatch AI API")

# Video streaming endpoint
@app.get("/video_feed")
async def video_feed():
    """Streams processed video frames as MJPEG."""
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# System statistics
@app.get("/stats")
def get_stats():
    """Returns current system status and metrics."""
    return {
        "uptime_seconds": state.uptime_seconds,
        "frames_processed": state.frame_count,
        "weapon_detected": state.weapon_detected,
        "camera_enabled": state.camera_enabled
    }
```

#### Telegram SuperBot Class:

```python
class TelegramSuperBot:
    def __init__(self, token):
        self.token = token
        self.base_url = f"https://api.telegram.org/bot{token}"
    
    def broadcast_alert(self, alert_type, frame):
        """Send alert with photo and location to all registered users."""
        # 1. Encode frame as JPEG
        _, img = cv2.imencode('.jpg', frame)
        
        # 2. Send photo with caption
        self.send_photo(chat_id, img.tobytes(), message)
        
        # 3. Send GPS location
        self.send_location(chat_id, lat, lon)
```

---

### 2. `logic_core.py` - AI Detection Engine

**Purpose**: Handles YOLOv8 model loading, inference, and threat detection logic.

#### Key Components:

```python
class CityWatchEngine:
    # Detection class IDs
    PERSON_CLASS = 0
    KNIFE_CLASS = 43
    SCISSORS_CLASS = 76
    CELL_PHONE_CLASS = 67
    BOTTLE_CLASS = 39
    
    # Classes that trigger alerts
    WEAPON_CLASSES = {43, 76, 67, 39, 42, 65, 79}
    
    def __init__(self):
        # Auto-detect GPU
        self.device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
        
        # Load YOLOv8 model
        self.model = YOLO('yolov8n.pt')
        self.model.to(self.device)
```

#### Detection Pipeline:

```python
def process_frame(self, frame, conf_threshold=0.35):
    """Main detection pipeline."""
    
    # 1. Run YOLO inference
    results = self.model(frame, conf=conf_threshold)
    
    # 2. Process detections
    for detection in results[0].boxes:
        class_id = int(detection.cls)
        confidence = float(detection.conf)
        
        # 3. Check for threats
        if class_id in self.WEAPON_CLASSES:
            weapon_detected = True
            self.draw_bounding_box(frame, detection, color=RED)
    
    # 4. Return annotated frame and metadata
    return frame, {
        "weapon_detected": weapon_detected,
        "person_count": person_count
    }
```

---

## 🎨 Frontend Files

### 3. `App.jsx` - Main Dashboard

**Purpose**: React component rendering the surveillance dashboard.

#### Key State Management:

```javascript
function App() {
  // System state
  const [stats, setStats] = useState({
    uptime_seconds: 0,
    frames_processed: 0,
    threats_today: 0,
    weapon_detected: false
  });
  
  // UI state
  const [isActive, setIsActive] = useState(true);
  const [gridMode, setGridMode] = useState(false);
  const [showSafeRoute, setShowSafeRoute] = useState(false);
  
  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      const res = await axios.get(`${API_URL}/stats`);
      setStats(res.data);
      
      // Check for threats
      if (res.data.weapon_detected) {
        setActiveAlert({ type: 'weapon' });
        sound.playAlert();
      }
    };
    
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);
}
```

#### Keyboard Shortcuts:

```javascript
const shortcuts = {
  'g': toggleGrid,      // Grid view
  'm': toggleMute,      // Sound
  'f': toggleFullscreen,// Fullscreen
  'c': toggleCamera,    // Privacy mode
  ' ': toggleActive,    // Pause/Resume
  'escape': dismissAlert
};

useKeyboard(shortcuts);
```

---

### 4. `SafeRouteMap.jsx` - Navigation Component

**Purpose**: Women's safety map with route finding and SOS features.

#### Map Integration:

```javascript
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';

// Zone data with safety levels
const NAGPUR_ZONES = [
  { name: 'Sitabuldi', lat: 21.1466, lng: 79.0788, safety: 'safe' },
  { name: 'Itwari', lat: 21.1547, lng: 79.0944, safety: 'unsafe' },
  // ... more zones
];

// Real routing via OSRM API
const fetchRoute = async (start, end) => {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/
     ${start.lng},${start.lat};${end.lng},${end.lat}
     ?overview=full&geometries=geojson`
  );
  return response.json();
};
```

#### SOS Feature:

```javascript
const [sosCountdown, setSosCountdown] = useState(5);

useEffect(() => {
  if (showSOS && sosCountdown > 0) {
    setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
  } else if (sosCountdown === 0) {
    // Alert triggered
    setSosTriggered(true);
    // Would send alert to emergency services
  }
}, [showSOS, sosCountdown]);
```

---

## 🔄 Data Flow

```
1. Camera captures frame
         ↓
2. logic_core.py processes with YOLOv8
         ↓
3. api.py returns annotated frame + metadata
         ↓
4. App.jsx displays frame and updates stats
         ↓
5. If threat detected:
   - AlertOverlay.jsx shows warning
   - TelegramSuperBot sends photo + location
         ↓
6. User receives alert on phone
```

---

## 🎯 Key Design Decisions

1. **MJPEG over WebSocket**: Simpler implementation, good browser support
2. **Local Processing**: Privacy-first, no cloud dependency
3. **Confidence Threshold 35%**: Balance between sensitivity and false positives
4. **10-second Alert Cooldown**: Prevents notification spam
5. **Framer Motion**: Smooth animations for premium feel
6. **OpenStreetMap + OSRM**: Free, no API costs

---

## 📝 Configuration Points

| File | Setting | Current Value |
|------|---------|---------------|
| logic_core.py | `conf_threshold` | 0.35 |
| logic_core.py | `WEAPON_CLASSES` | {43, 76, 67, 39, 42, 65, 79} |
| api.py | Alert cooldown | 10 seconds |
| App.jsx | Stats poll interval | 2000ms |
| SafeRouteMap.jsx | SOS countdown | 5 seconds |
