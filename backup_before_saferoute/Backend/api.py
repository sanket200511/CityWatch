from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import cv2
import numpy as np
import threading
import time
import requests
import json
import io
import uvicorn
from collections import deque
from datetime import datetime
from logic_core import CityWatchEngine

# === CONFIGURATION ===
BOT_TOKEN = "8189148302:AAG0xPiBm4r5_ieUVkIVSEa31RJS2bswIb4"
TELEGRAM_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

# Mock Zone Data
ZONES = [
    {"id": 1, "name": "NORTH SECTOR", "status": "🟢 Clear", "lat": 21.1458, "lon": 79.0882},
    {"id": 2, "name": "SOUTH SECTOR", "status": "🟢 Clear", "lat": 21.1358, "lon": 79.0782},
    {"id": 3, "name": "EAST SECTOR", "status": "🟢 Clear", "lat": 21.1558, "lon": 79.0982},
    {"id": 4, "name": "WEST SECTOR", "status": "🟢 Clear", "lat": 21.1258, "lon": 79.0682},
]

# === GLOBAL STATE ===
class SystemState:
    def __init__(self):
        self.engine = None
        self.output_frame = None
        self.lock = threading.Lock()
        self.running = False
        self.grid_mode = False
        self.bot_running = False
        self.camera_enabled = True  # NEW: Camera on/off toggle
        
        # Bot State
        self.bot_users = {}  # {chat_id: {"muted": False, "joined": timestamp}}
        self.threat_history = deque(maxlen=10)
        self.command_stats = {}
        self.frame_buffer = deque(maxlen=15)  # For GIF generation

state = SystemState()

# File-based lock for cross-process synchronization
import os
BOT_LOCK_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot_polling.lock")

class TelegramSuperBot:
    def __init__(self):
        self.offset = 0
        self._lock_file = None
        
        # Clear all pending updates on startup
        self._clear_pending_updates()
    
    def _clear_pending_updates(self):
        """Clear any pending updates to start fresh."""
        try:
            url = f"{TELEGRAM_API_URL}/getUpdates?offset=-1&limit=1&timeout=1"
            response = requests.get(url, timeout=5)
            data = response.json()
            if data.get("result"):
                self.offset = data["result"][-1]["update_id"] + 1
                print(f"[BOT] Cleared pending updates, starting from offset {self.offset}")
        except Exception as e:
            print(f"[BOT] Could not clear updates: {e}")
    
    def _acquire_lock(self):
        """Try to acquire file-based lock. Returns True if acquired."""
        import os
        try:
            # Try to create lock file exclusively
            if os.path.exists(BOT_LOCK_FILE):
                # Check if lock is stale (older than 30 seconds)
                lock_age = time.time() - os.path.getmtime(BOT_LOCK_FILE)
                if lock_age > 30:
                    os.remove(BOT_LOCK_FILE)
                else:
                    return False
            
            # Create lock file with our PID
            with open(BOT_LOCK_FILE, 'w') as f:
                f.write(str(os.getpid()))
            self._lock_file = BOT_LOCK_FILE
            return True
        except:
            return False
    
    def _release_lock(self):
        """Release file-based lock."""
        import os
        try:
            if self._lock_file and os.path.exists(self._lock_file):
                os.remove(self._lock_file)
        except:
            pass
    
    def _refresh_lock(self):
        """Keep lock file fresh by updating its modification time."""
        import os
        try:
            if self._lock_file and os.path.exists(self._lock_file):
                os.utime(self._lock_file, None)
        except:
            pass
        
    def api_call(self, method, **kwargs):
        """Generic Telegram API caller."""
        url = f"{TELEGRAM_API_URL}/{method}"
        try:
            response = requests.post(url, json=kwargs, timeout=10)
            return response.json()
        except Exception as e:
            print(f"[BOT API ERROR] {method}: {e}")
            return None

    def send_message(self, chat_id, text, reply_markup=None, parse_mode="Markdown"):
        payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        return self.api_call("sendMessage", **payload)

    def send_photo(self, chat_id, photo_bytes, caption="", reply_markup=None):
        url = f"{TELEGRAM_API_URL}/sendPhoto"
        files = {'photo': ('snapshot.jpg', photo_bytes, 'image/jpeg')}
        data = {'chat_id': chat_id, 'caption': caption, 'parse_mode': 'Markdown'}
        if reply_markup:
            data['reply_markup'] = json.dumps(reply_markup)
        try:
            requests.post(url, files=files, data=data, timeout=10)
        except Exception as e:
            print(f"[BOT ERROR] Photo failed: {e}")

    def send_animation(self, chat_id, gif_bytes, caption=""):
        url = f"{TELEGRAM_API_URL}/sendAnimation"
        files = {'animation': ('clip.gif', gif_bytes, 'image/gif')}
        data = {'chat_id': chat_id, 'caption': caption, 'parse_mode': 'Markdown'}
        try:
            requests.post(url, files=files, data=data, timeout=15)
        except Exception as e:
            print(f"[BOT ERROR] GIF failed: {e}")

    def send_location(self, chat_id, lat, lon):
        return self.api_call("sendLocation", chat_id=chat_id, latitude=lat, longitude=lon)

    def answer_callback(self, callback_id, text=""):
        return self.api_call("answerCallbackQuery", callback_query_id=callback_id, text=text)

    def get_main_keyboard(self):
        """Inline keyboard for main menu."""
        return {
            "inline_keyboard": [
                [
                    {"text": "📸 Snap", "callback_data": "snap"},
                    {"text": "📊 Status", "callback_data": "status"},
                ],
                [
                    {"text": "🎬 Clip", "callback_data": "clip"},
                    {"text": "📍 Location", "callback_data": "location"},
                ],
                [
                    {"text": "🗺️ Zones", "callback_data": "zones"},
                    {"text": "📜 History", "callback_data": "history"},
                ],
                [
                    {"text": "🔕 Mute", "callback_data": "mute"},
                    {"text": "🔔 Unmute", "callback_data": "unmute"},
                ],
                [
                    {"text": "ℹ️ About", "callback_data": "about"},
                ]
            ]
        }

    def track_command(self, cmd):
        """Track command usage."""
        state.command_stats[cmd] = state.command_stats.get(cmd, 0) + 1

    # === COMMAND HANDLERS ===
    def cmd_start(self, chat_id):
        self.track_command("/start")
        state.bot_users[chat_id] = {"muted": False, "joined": datetime.now().isoformat()}
        
        msg = (
            "🛡️ *CITYWATCH SENTINEL v2.0*\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "You are now connected to the *Neural Threat Grid*.\n\n"
            "🔹 Real-time AI surveillance\n"
            "🔹 Instant threat alerts\n"
            "🔹 Multi-zone monitoring\n\n"
            "Use the buttons below or type commands:\n"
            "`/help` for full command list"
        )
        self.send_message(chat_id, msg, reply_markup=self.get_main_keyboard())

    def cmd_status(self, chat_id):
        self.track_command("/status")
        if state.engine:
            stats = state.engine.get_statistics()
            user_count = len(state.bot_users)
            muted = state.bot_users.get(chat_id, {}).get("muted", False)
            
            msg = (
                "📊 *SYSTEM STATUS REPORT*\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                f"⚡ *Uptime:* `{stats['uptime_seconds']}s`\n"
                f"🖼️ *Frames:* `{stats['frames_processed']}`\n"
                f"🎯 *Threats Today:* `{stats['threats_today']}`\n"
                f"🧠 *Active Zones:* `{stats['zones_monitored']}`\n"
                f"📡 *Grid Mode:* `{'ON' if state.grid_mode else 'OFF'}`\n"
                f"👥 *Connected Users:* `{user_count}`\n"
                f"🔔 *Your Alerts:* `{'Muted' if muted else 'Active'}`\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                "✅ *All Systems Nominal*"
            )
            self.send_message(chat_id, msg)
        else:
            self.send_message(chat_id, "⚠️ System Initializing...")

    def cmd_snap(self, chat_id):
        self.track_command("/snap")
        with state.lock:
            if state.output_frame is not None:
                _, img = cv2.imencode('.jpg', state.output_frame)
                self.send_photo(chat_id, img.tobytes(), "📸 *Live Feed Snapshot*")
            else:
                self.send_message(chat_id, "⚠️ Camera Offline")

    def cmd_clip(self, chat_id):
        self.track_command("/clip")
        self.send_message(chat_id, "🎬 Generating 3-second clip...")
        
        # Collect frames
        frames = []
        with state.lock:
            frames = list(state.frame_buffer)
        
        if len(frames) < 5:
            self.send_message(chat_id, "⚠️ Not enough frames buffered")
            return
            
        # Create GIF
        try:
            import imageio
            gif_buffer = io.BytesIO()
            with imageio.get_writer(gif_buffer, format='GIF', mode='I', duration=0.1) as writer:
                for frame in frames[::2]:  # Every other frame
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    small = cv2.resize(rgb, (320, 240))
                    writer.append_data(small)
            gif_buffer.seek(0)
            self.send_animation(chat_id, gif_buffer.read(), "🎬 *Live Clip (3s)*")
        except ImportError:
            self.send_message(chat_id, "⚠️ GIF library not installed. Use `/snap` instead.")
        except Exception as e:
            self.send_message(chat_id, f"⚠️ Clip failed: {e}")

    def cmd_zones(self, chat_id):
        self.track_command("/zones")
        msg = "🗺️ *MONITORED ZONES*\n━━━━━━━━━━━━━━━━━━━━\n"
        for z in ZONES:
            msg += f"\n*{z['name']}*\n"
            msg += f"   Status: {z['status']}\n"
            msg += f"   📍 `{z['lat']}, {z['lon']}`\n"
        self.send_message(chat_id, msg)

    def cmd_history(self, chat_id):
        self.track_command("/history")
        if not state.threat_history:
            self.send_message(chat_id, "📜 No threat events recorded yet.")
            return
            
        msg = "📜 *THREAT HISTORY*\n━━━━━━━━━━━━━━━━━━━━\n"
        for event in list(state.threat_history)[:5]:
            msg += f"\n🔴 *{event['type']}*\n"
            msg += f"   Time: `{event['time']}`\n"
            msg += f"   Zone: {event['zone']}\n"
        self.send_message(chat_id, msg)

    def cmd_location(self, chat_id):
        self.track_command("/location")
        # Send mock threat location
        self.send_message(chat_id, "📍 *Last Known Threat Location:*")
        self.send_location(chat_id, 21.1458, 79.0882)
        self.send_message(chat_id, "_NORTH SECTOR - Nagpur, India_")

    def cmd_mute(self, chat_id):
        self.track_command("/mute")
        if chat_id in state.bot_users:
            state.bot_users[chat_id]["muted"] = True
        self.send_message(chat_id, "🔕 *Alerts Muted*\nYou will not receive threat notifications.\nUse `/unmute` to re-enable.")

    def cmd_unmute(self, chat_id):
        self.track_command("/unmute")
        if chat_id in state.bot_users:
            state.bot_users[chat_id]["muted"] = False
        self.send_message(chat_id, "🔔 *Alerts Enabled*\nYou will receive threat notifications.")

    def cmd_grid(self, chat_id):
        self.track_command("/grid")
        state.grid_mode = not state.grid_mode
        mode = "ON (2x2)" if state.grid_mode else "OFF (Single)"
        self.send_message(chat_id, f"📺 *Grid View:* `{mode}`")

    def cmd_alert(self, chat_id):
        self.track_command("/alert")
        self.send_message(chat_id, "🧪 *Triggering Test Alert...*")
        with state.lock:
            if state.output_frame is not None:
                _, img = cv2.imencode('.jpg', state.output_frame)
                self.send_photo(chat_id, img.tobytes(), "🚨 *TEST ALERT*\n⚠️ This is a simulated threat for testing.")

    def cmd_about(self, chat_id):
        self.track_command("/about")
        total_cmds = sum(state.command_stats.values())
        msg = (
            "ℹ️ *ABOUT CITYWATCH*\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "*Version:* 2.0 SuperBot\n"
            "*Engine:* YOLOv8 + MediaPipe\n"
            "*Backend:* FastAPI + Uvicorn\n"
            "*Frontend:* React + Vite\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"*Commands Processed:* `{total_cmds}`\n"
            f"*Connected Users:* `{len(state.bot_users)}`\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "Built for *HackNagpur 2.0*\n"
            "Team: _The Code Alchemist_"
        )
        self.send_message(chat_id, msg)

    def cmd_help(self, chat_id):
        self.track_command("/help")
        msg = (
            "📖 *COMMAND REFERENCE*\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "`/start` - Connect & Menu\n"
            "`/status` - System Health\n"
            "`/snap` - Live Photo\n"
            "`/clip` - Video GIF\n"
            "`/zones` - All Sectors\n"
            "`/history` - Threat Log\n"
            "`/location` - GPS Pin\n"
            "`/mute` - Disable Alerts\n"
            "`/unmute` - Enable Alerts\n"
            "`/grid` - Toggle Grid View\n"
            "`/alert` - Test Alert\n"
            "`/about` - System Info\n"
            "`/help` - This Menu"
        )
        self.send_message(chat_id, msg, reply_markup=self.get_main_keyboard())

    def handle_callback(self, callback_id, chat_id, data):
        """Handle inline button presses."""
        self.answer_callback(callback_id, f"Processing {data}...")
        
        handlers = {
            "snap": self.cmd_snap,
            "status": self.cmd_status,
            "clip": self.cmd_clip,
            "zones": self.cmd_zones,
            "history": self.cmd_history,
            "location": self.cmd_location,
            "mute": self.cmd_mute,
            "unmute": self.cmd_unmute,
            "about": self.cmd_about,
        }
        
        if data in handlers:
            handlers[data](chat_id)

    def handle_command(self, chat_id, command):
        command = command.lower().strip().split()[0]  # Get first word only
        
        handlers = {
            "/start": self.cmd_start,
            "/status": self.cmd_status,
            "/snap": self.cmd_snap,
            "/clip": self.cmd_clip,
            "/zones": self.cmd_zones,
            "/history": self.cmd_history,
            "/location": self.cmd_location,
            "/mute": self.cmd_mute,
            "/unmute": self.cmd_unmute,
            "/grid": self.cmd_grid,
            "/alert": self.cmd_alert,
            "/about": self.cmd_about,
            "/help": self.cmd_help,
        }
        
        if command in handlers:
            handlers[command](chat_id)
        else:
            self.send_message(chat_id, "❓ Unknown command. Type `/help` for list.")

    def broadcast_alert(self, alert_type, frame):
        """Send alert to all non-muted users with photo AND location."""
        _, img = cv2.imencode('.jpg', frame)
        photo_bytes = img.tobytes()
        
        # 1. Prepare Message
        timestamp = datetime.now().strftime("%I:%M:%S %p")
        msg = (
            f"🚨 *CRITICAL ALERT: {alert_type}*\n"
            f"⏰ Time: {timestamp}\n"
            f"📍 Sector: North-East (Cam 01)\n"
            f"_Automated detection triggered. Immediate attention required._"
        )
        
        # 2. Simulated GPS Coordinates (NYC Time Square area for demo)
        lat, lon = 40.7580, -73.9855
        # Add random offset to simulate different locations
        import random
        lat += random.uniform(-0.001, 0.001)
        lon += random.uniform(-0.001, 0.001)
        
        for chat_id, user_data in state.bot_users.items():
            if not user_data.get("muted", False):
                try:
                    # 3. Send Photo
                    self.send_photo(chat_id, photo_bytes, msg)
                    
                    # 4. Send Location (Briefly waiting to ensure order)
                    time.sleep(0.5)
                    self.send_location(chat_id, lat, lon)
                except Exception as e:
                    print(f"Failed to send alert to {chat_id}: {e}")

    def poll(self):
        # Acquire file-based lock - prevents multiple processes from polling
        if not self._acquire_lock():
            print("[BOT] Another process is polling, this instance will skip.")
            return
        
        try:
            print("🤖 SuperBot Listener Started (exclusive lock acquired)")
            refresh_counter = 0
            
            while state.bot_running:
                try:
                    url = f"{TELEGRAM_API_URL}/getUpdates?offset={self.offset}&timeout=10"
                    response = requests.get(url, timeout=15)
                    data = response.json()
                    
                    if "result" in data:
                        for update in data["result"]:
                            self.offset = update["update_id"] + 1
                            
                            # Handle text messages
                            if "message" in update:
                                chat_id = update["message"]["chat"]["id"]
                                text = update["message"].get("text", "")
                                
                                if text.startswith("/"):
                                    print(f"[BOT] Command from {chat_id}: {text}")
                                    self.handle_command(chat_id, text)
                            
                            # Handle callback queries (button presses)
                            if "callback_query" in update:
                                cq = update["callback_query"]
                                callback_id = cq["id"]
                                chat_id = cq["message"]["chat"]["id"]
                                data_value = cq.get("data", "")
                                print(f"[BOT] Callback from {chat_id}: {data_value}")
                                self.handle_callback(callback_id, chat_id, data_value)
                    
                    # Refresh lock every 5 iterations to keep it alive
                    refresh_counter += 1
                    if refresh_counter >= 5:
                        self._refresh_lock()
                        refresh_counter = 0
                                
                except Exception as e:
                    print(f"[BOT ERROR] {e}")
                    time.sleep(2)
            print("🤖 SuperBot Listener Stopped")
        finally:
            self._release_lock()

bot = TelegramSuperBot()

# === ENGINE LIFECYCLE ===
def get_engine():
    if state.engine is None:
        state.engine = CityWatchEngine()
    return state.engine

def video_processing_loop():
    print("🚀 Video Loop Started")
    cap = cv2.VideoCapture(0)
    engine = get_engine()
    last_alert_time = 0
    
    # Create placeholder frame for when camera is disabled
    placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(placeholder, "CAMERA DISABLED", (150, 220),
               cv2.FONT_HERSHEY_SIMPLEX, 1.2, (100, 100, 100), 2)
    cv2.putText(placeholder, "Privacy Mode Active", (180, 270),
               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (80, 80, 80), 2)
    cv2.rectangle(placeholder, (100, 180), (540, 300), (60, 60, 60), 2)
    
    while state.running and cap.isOpened():
        # Check if camera is enabled
        if not state.camera_enabled:
            with state.lock:
                state.output_frame = placeholder.copy()
            time.sleep(0.1)  # Reduce CPU when disabled
            continue
            
        ret, frame = cap.read()
        if not ret:
            continue
            
        annotated_frame, status_data = engine.process_frame(frame, conf_threshold=0.5)
        
        # Store frame for GIF buffer
        state.frame_buffer.append(annotated_frame.copy())
        
        # Alert Logic
        is_threat = status_data['weapon_detected'] or status_data['fall_detected']
        curr_time = time.time()
        
        if is_threat and (curr_time - last_alert_time > 5.0):
            last_alert_time = curr_time
            
            alert_type = "CRITICAL THREAT"
            if status_data['weapon_detected']: alert_type = "WEAPON DETECTED"
            if status_data['fall_detected']: alert_type = "PERSON DOWN"
            
            # Log to history
            state.threat_history.append({
                "type": alert_type,
                "time": datetime.now().strftime("%H:%M:%S"),
                "zone": "NORTH SECTOR"
            })
            
            # Broadcast
            threading.Thread(target=bot.broadcast_alert, args=(alert_type, annotated_frame), daemon=True).start()
        
        # Grid Mode
        if state.grid_mode:
            h, w = annotated_frame.shape[:2]
            small = cv2.resize(annotated_frame, (w//2, h//2))
            top = cv2.hconcat([small, small])
            bottom = cv2.hconcat([small, small])
            final_frame = cv2.vconcat([top, bottom])
        else:
            final_frame = annotated_frame

        with state.lock:
            state.output_frame = final_frame.copy()
            
        time.sleep(0.01)
        
    cap.release()
    print("🛑 Video Loop Stopped")

@asynccontextmanager
async def lifespan(app: FastAPI):
    state.running = True
    state.bot_running = True
    
    t_video = threading.Thread(target=video_processing_loop, daemon=True)
    t_video.start()
    
    t_bot = threading.Thread(target=bot.poll, daemon=True)
    t_bot.start()
    
    yield
    state.running = False
    state.bot_running = False

app = FastAPI(title="CityWatch API", version="2.0 SuperBot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ENDPOINTS ===
@app.get("/")
def health_check():
    return {"status": "online", "system": "CityWatch SuperBot", "users": len(state.bot_users)}

@app.get("/stats")
def get_stats():
    if state.engine:
        stats = state.engine.get_statistics()
        stats['grid_mode'] = state.grid_mode
        stats['bot_users'] = len(state.bot_users)
        stats['weapon_detected'] = state.engine.status_flags['weapon_detected']
        stats['fall_detected'] = state.engine.status_flags['fall_detected']
        stats['sos_detected'] = state.engine.status_flags['sos_detected']
        return stats
    return {"status": "initializing"}

@app.post("/toggle_grid")
def toggle_grid_view():
    state.grid_mode = not state.grid_mode
    return {"grid_mode": state.grid_mode}

@app.post("/connect_bot")
def connect_telegram_bot():
    return {"status": "connected", "bot_name": "CityWatch SuperBot", "users": len(state.bot_users)}

@app.post("/toggle_camera")
def toggle_camera():
    """Toggle camera on/off for privacy mode."""
    state.camera_enabled = not state.camera_enabled
    status = "enabled" if state.camera_enabled else "disabled"
    print(f"[CAMERA] Camera {status}")
    return {"camera_enabled": state.camera_enabled, "status": status}

@app.get("/camera_status")
def get_camera_status():
    """Get current camera status."""
    return {"camera_enabled": state.camera_enabled}

def generate_mjpeg():
    while True:
        with state.lock:
            if state.output_frame is None:
                time.sleep(0.01)
                continue
            (flag, encodedImage) = cv2.imencode(".jpg", state.output_frame)
            if not flag: continue
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')
        time.sleep(0.033)

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_mjpeg(), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
