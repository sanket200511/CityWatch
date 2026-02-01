# CityWatch AI - Q&A Document (70+ Questions)

## 📌 General Questions

### 1. What is CityWatch?
CityWatch is an AI-powered urban surveillance and safety platform that provides real-time threat detection, instant alerts, and women's safety navigation.

### 2. What problem does it solve?
It addresses urban safety challenges by detecting threats in real-time and providing safe navigation routes for women traveling at night.

### 3. Who is the target audience?
- Smart city administrators
- Campus security teams
- Women's safety organizations
- Public transportation authorities

### 4. What makes CityWatch unique?
Combination of AI surveillance + proactive safety features (SafeRoute) + instant mobile alerts in one integrated platform.

### 5. Is this a new concept?
While surveillance exists, our integration with women's safety navigation and real-time mobile alerts is novel.

---

## 🤖 AI & Technical Questions

### 6. What AI model do you use?
YOLOv8 Nano (yolov8n.pt) - optimized for real-time detection with good accuracy.

### 7. Why YOLOv8 instead of other models?
- State-of-the-art accuracy
- Fast inference (15-25ms on GPU)
- Easy to fine-tune
- Active community support

### 8. What objects can it detect?
Currently: knife, scissors, cell phone, bottle, fork, remote, toothbrush. Can be extended to 80+ COCO classes.

### 9. What's the detection accuracy?
YOLOv8n has ~37% mAP on COCO. For demo objects, we see 60-80% confidence.

### 10. How do you handle false positives?
- Confidence threshold at 35%
- 10-second cooldown between alerts
- Multiple detection frames required for confirmation

### 11. Can it work without GPU?
Yes, CPU mode works at 5-10 FPS. GPU gives 15-30 FPS.

### 12. What GPU is required?
Any NVIDIA GPU with CUDA support. We use RTX 2050 (4GB VRAM).

### 13. How fast is the detection?
Under 25ms inference time on GPU, total alert latency under 500ms.

### 14. Is it real-time?
Yes, 15-30 FPS processing with sub-second alerts.

### 15. How does fall detection work?
Uses YOLOv8 pose estimation to analyze body keypoints. Triggers when person appears to be falling.

---

## 🗺️ SafeRoute Questions

### 16. What is SafeRoute?
A women's safety navigation system showing safe routes through Nagpur with real-time safety zone data.

### 17. How are safety zones determined?
Based on simulated crime data, CCTV coverage, and police patrol frequency for each area.

### 18. Where does the map data come from?
OpenStreetMap - free, open-source, and doesn't require expensive API keys.

### 19. How does routing work?
Uses OSRM (Open Source Routing Machine) API for actual road-based route calculation.

### 20. What happens when SOS is pressed?
5-second countdown, then simulates alerting police, sharing location with family, and notifying nearest patrol.

### 21. Can it use real GPS?
Yes, the browser's Geolocation API is integrated. Users must grant permission.

### 22. How accurate is live tracking?
Depends on device GPS - typically 5-20 meter accuracy on smartphones.

### 23. What areas of Nagpur are covered?
15 zones including Sitabuldi, Civil Lines, Dharampeth, Ramdaspeth, Itwari, Mahal, etc.

### 24. Can other cities be added?
Yes, zone data is easily configurable. Just need safety statistics for new areas.

### 25. What makes a route "safe"?
Routes through areas with high CCTV coverage, frequent police patrols, and low incident history.

---

## 📱 Telegram Integration

### 26. Why Telegram?
Free, reliable API, works globally, supports photos/location, instant delivery.

### 27. How do alerts reach users?
Bot sends photo + text + GPS coordinates when threat detected.

### 28. What's in an alert message?
Threat type, timestamp, sector name, snapshot image, Google Maps link.

### 29. How fast are alerts delivered?
Under 2 seconds from detection to Telegram notification.

### 30. Can users mute alerts?
Yes, `/mute` command pauses notifications, `/unmute` resumes.

### 31. What commands does the bot support?
`/start`, `/status`, `/help`, `/mute`, `/unmute`, `/testweapon`, `/testfall`

### 32. How do users register?
Send `/start` to the bot - automatically registers for alerts.

### 33. Can it integrate with WhatsApp?
Possible with WhatsApp Business API but requires paid subscription.

### 34. What about SMS alerts?
Can be added using Twilio or similar services.

### 35. Is there a web notification option?
Yes, the dashboard shows real-time notifications.

---

## 🏗️ Architecture Questions

### 36. What's the tech stack?
Backend: Python/FastAPI, Frontend: React/Vite, AI: PyTorch/Ultralytics

### 37. Why FastAPI?
Async support, automatic OpenAPI docs, high performance, easy to use.

### 38. Why React?
Component-based, great ecosystem, fast development, Framer Motion for animations.

### 39. How is video streamed?
MJPEG format - frames encoded as JPEG, streamed continuously.

### 40. Can it handle multiple cameras?
Architecture supports multiple cameras with grid view toggle.

### 41. Where is data stored?
Currently in-memory. Production would use PostgreSQL for user data.

### 42. Is there cloud dependency?
No, all AI processing is local. Only Telegram API requires internet.

### 43. How does camera toggle work?
Backend stops sending frames when disabled - privacy by design.

### 44. What's the API documentation?
Auto-generated at `/docs` (Swagger UI) and `/redoc`.

### 45. Is there authentication?
Demo version has no auth. Production would use JWT tokens.

---

## 🔒 Privacy & Security

### 46. Is video stored?
No, frames are processed and discarded. No recording by default.

### 47. Who can see the feed?
Only users with dashboard access on local network.

### 48. How is privacy protected?
- Camera on/off toggle
- Local processing only
- No cloud uploads
- Alert photos sent only to registered users

### 49. What about GDPR compliance?
Would need consent mechanisms and data deletion features for production.

### 50. Can footage be reviewed later?
Not in current version. Would need recording feature for production.

---

## 📈 Scalability & Performance

### 51. How many cameras can it handle?
Current: 1 primary. Architecture supports 4-8 with proper hardware.

### 52. What's the CPU usage?
~40-60% on i5 in CPU mode, ~20% with GPU offloading.

### 53. What's the memory usage?
~500MB Python process, ~1.5GB GPU VRAM.

### 54. Can it run 24/7?
Yes, designed for continuous operation.

### 55. What if the system crashes?
Auto-restart with systemd/PM2 in production deployment.

---

## 💰 Business & Market

### 56. What's the market size?
Global video surveillance market: $50+ billion by 2025.

### 57. Who are competitors?
Hikvision, Dahua, Milestone - but none with integrated women's safety.

### 58. What's the USP?
AI detection + Women's safety navigation + Mobile alerts in one platform.

### 59. What's the revenue model?
B2B SaaS - monthly subscription per camera/zone.

### 60. What's the deployment cost?
Low - uses open-source AI, no expensive API licenses.

---

## 🚀 Future Scope

### 61. What features are planned?
- License plate recognition
- Crowd density analysis
- Integration with city traffic systems
- Mobile app for SafeRoute

### 62. Can it detect other threats?
Yes, fire, smoke, unattended bags are future additions.

### 63. Will there be a mobile app?
Planned - React Native for cross-platform SafeRoute app.

### 64. Can it integrate with existing CCTV?
Yes, any RTSP stream can be processed.

### 65. Is there a cloud version planned?
Possible hybrid model - edge processing + cloud analytics.

---

## 🛠️ Development Questions

### 66. How long did it take to build?
Core functionality: 2-3 days. Full demo: 1 week.

### 67. What was the hardest part?
Balancing detection accuracy with real-time performance.

### 68. What would you do differently?
Start with WebSocket instead of MJPEG for lower latency.

### 69. How is it tested?
Manual testing with various objects, different lighting conditions.

### 70. Is it open source?
Demo version is. Production would be proprietary.

---

## 🎯 Demo-Specific

### 71. Why these specific detection objects?
COCO dataset classes that are easy to demonstrate (phone, remote, etc).

### 72. Why Nagpur for SafeRoute?
Local city - demonstrates hyperlocal safety data concept.

### 73. Is the safety data real?
Simulated for demo. Production would use actual crime statistics.

### 74. Can I try it myself?
Yes, all code is functional. Follow the START_GUIDE.md.

### 75. What if detection fails in demo?
Terminal shows all detections - demonstrates AI is processing even if confidence is low.
