# 🚀 CityWatch - Quick Start Guide

Get CityWatch running in under 5 minutes!

---

## 📋 Prerequisites

- ✅ Python 3.10 or higher
- ✅ Node.js 18 or higher
- ✅ Webcam or USB camera
- ✅ (Optional) NVIDIA GPU with CUDA

---

## ⚡ Step 1: Start Backend

```powershell
# Open terminal in project folder
cd Backend

# Activate virtual environment
.\venv_gpu\Scripts\activate

# Start server
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
[CityWatch] Initializing on device: cuda:0
[CityWatch] GPU detected: NVIDIA GeForce RTX 2050
[CityWatch] Engine initialized successfully!
```

---

## ⚡ Step 2: Start Frontend

```powershell
# Open NEW terminal
cd frontend-react

# Start dev server
npm run dev
```

**Expected output:**
```
VITE v5.4.21 ready in 1080 ms
➜  Local:   http://localhost:5173/
```

---

## ⚡ Step 3: Open Dashboard

🌐 **http://localhost:5173**

You should see:
- Live video feed from camera
- Real-time stats panel
- Control buttons in sidebar
- "SafeRoute Map" button

---

## 🎮 Test the Features

### 1. AI Detection
- Hold up a **phone** or **remote** in front of camera
- Watch for "WEAPON DETECTED" alert
- Check terminal for `[DETECT] cell phone` logs

### 2. SafeRoute Map
- Click purple **🛡️ SAFEROUTE MAP** button
- See Nagpur map with colored safety zones
- Type "Civil Lines" → Click "Find Route"
- Try the SOS button (cancel before countdown ends)

### 3. Telegram Alerts (Optional)
- Open Telegram → Search for your bot
- Send `/start` to register
- When detection triggers, you'll receive photo alerts

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not detected | Check USB connection, restart backend |
| Black video | Allow camera permission in Windows |
| Slow processing | Ensure GPU is being used |
| No alerts | Check Telegram bot token is set |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `G` | Grid/single view |
| `M` | Mute sounds |
| `C` | Camera on/off |
| `Space` | Pause detection |

---

## 🛑 Stopping the System

1. Press `Ctrl+C` in backend terminal
2. Press `Ctrl+C` in frontend terminal

---

## 📚 Next Steps

- Read [DEMO_SCRIPT.md](reference/DEMO_SCRIPT.md) for presentation tips
- Check [QA_DOCUMENT.md](reference/QA_DOCUMENT.md) for Q&A preparation
- See [DEPLOYMENT_GUIDE.md](reference/DEPLOYMENT_GUIDE.md) for production

---

**🎉 You're ready to demo!**
