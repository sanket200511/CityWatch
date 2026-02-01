# CityWatch AI - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying CityWatch to production environments.

---

## 📦 Backend Deployment (Render / Railway)

### Option 1: Docker Deployment (Recommended)

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY api.py logic_core.py ./
COPY yolov8n.pt ./

# Expose port
EXPOSE 8000

# Run server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### requirements.txt
```
fastapi>=0.104.0
uvicorn>=0.24.0
opencv-python-headless>=4.8.0
numpy>=1.24.0
ultralytics>=8.0.0
python-multipart>=0.0.6
requests>=2.31.0
torch>=2.0.0
torchvision>=0.15.0
```

### Option 2: Render Deployment

1. **Create `render.yaml`**:
```yaml
services:
  - type: web
    name: citywatch-api
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: TELEGRAM_BOT_TOKEN
        sync: false
    healthCheckPath: /stats
```

2. **Deploy**:
   - Connect GitHub repo to Render
   - Set environment variables in dashboard
   - Deploy automatically on push

### Option 3: Railway Deployment

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

---

## 🌐 Frontend Deployment (Vercel)

### 1. Build for Production

```bash
cd frontend-react

# Update API URL for production
# Edit src/App.jsx line 18:
# const API_URL = 'https://your-backend-url.render.com';

npm run build
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend-react
vercel

# Follow prompts:
# - Link to project
# - Use default settings
# - Get production URL
```

### 3. Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## ⚙️ Environment Variables

### Backend (.env)
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
CAMERA_INDEX=0
DEBUG_MODE=false
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.render.com
```

---

## 🔒 Security Checklist

- [ ] Set CORS origins to production domain only
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Use environment variables for secrets
- [ ] Add rate limiting to API endpoints
- [ ] Implement authentication for dashboard

### CORS Configuration (api.py)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",
        "https://citywatch.yourdomain.com"
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

---

## 📊 Monitoring

### Health Check Endpoint
```
GET /stats
```

Returns:
```json
{
  "status": "running",
  "uptime_seconds": 3600,
  "frames_processed": 54000,
  "threats_today": 0,
  "camera_enabled": true
}
```

### Logging
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("citywatch")
```

---

## 🐳 Docker Compose (Full Stack)

```yaml
version: '3.8'

services:
  backend:
    build: ./Backend
    ports:
      - "8000:8000"
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    devices:
      - /dev/video0:/dev/video0  # Camera access
    restart: unless-stopped

  frontend:
    build: ./frontend-react
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## 📱 Telegram Webhook (Production)

Instead of polling, use webhooks in production:

```python
# Set webhook
webhook_url = "https://your-backend.render.com/telegram/webhook"
requests.post(
    f"https://api.telegram.org/bot{TOKEN}/setWebhook",
    json={"url": webhook_url}
)

# Endpoint to receive updates
@app.post("/telegram/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    # Handle update
    return {"ok": True}
```

---

## 🔧 Troubleshooting

### Camera Not Working on Server
- Cloud servers don't have cameras
- Use pre-recorded video file for demo
- Or stream from local machine via WebSocket

### GPU Not Available
- Use CPU mode (slower but works)
- Or use GPU-enabled instances (expensive)

### Telegram Bot Not Responding
- Check token is correct
- Ensure webhook URL is HTTPS
- Check server firewall allows outbound HTTPS

---

## 💰 Cost Estimates

| Service | Tier | Cost/Month |
|---------|------|------------|
| Render (Backend) | Starter | $7 |
| Vercel (Frontend) | Hobby | Free |
| Domain | .com | $12/year |
| **Total** | | **~$8/month** |

### GPU Options (If Needed)
- AWS EC2 g4dn.xlarge: ~$0.50/hour
- Google Cloud A2: ~$0.60/hour
- RunPod: ~$0.20/hour

---

## ✅ Pre-Launch Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and connected
- [ ] Telegram bot configured
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Environment variables set
- [ ] Health monitoring active
- [ ] Error logging enabled
- [ ] Backup strategy defined
