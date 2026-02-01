# 🤖 CityWatch Telegram Bot - Setup & Content Guide

Use the following content to set up your **CityWatch Alert Bot** in Telegram via [@BotFather](https://t.me/BotFather).

---

### 1. 🖼️ Bot Profile Picture
**Action**: Send the generated icon (below) to BotFather when asked for the bot picture.
> *Use the image saved as `citywatch_bot_icon.png` in your project folder.*
![CityWatch Alert Bot Icon](C:/Users/ASUS/.gemini/antigravity/brain/34cdd219-8775-40c0-a064-de9c1d5a71c3/citywatch_bot_icon_1769840616882.png)

---

### 2. 📝 Bot Name
**Name**: `CityWatch Sentinel`
> *This is the display name shown in chat lists.*

---

### 3. ℹ️ About Text (Short Description)
*Used when users view the bot's profile.*

**Copy & Paste This:**
```text
The official alert dispatch system for the CityWatch Neural Grid. 
Receives real-time notifications for Weapons, Falls, and SOS Signals detected by AI surveillance.
Protecting citizens with autonomous vigilance. 🛡️
```

---

### 4. 📄 Description Text (Long Description)
*Shown to new users before they click "Start".*

**Copy & Paste This:**
```text
🛡️ **CityWatch Autonomous Defense System**

This is the secure notification channel for the CityWatch AI ecosystem.
It connects directly to local surveillance grids to provide instant alerts for:

🔴 **Weapon Detection**: Knives, firearms, and dangerous objects.
🟡 **Fall Detection**: Sudden collapse or accidents.
🔵 **SOS Signals**: "Open Palm" distress gestures.

**Status**: 🟢 ONLINE
**Response Time**: < 2.5s
**Coverage**: Multi-Sector Grid

_Authorized personnel only. Use /start to register this device for alerts._
```

---

### 5. 🛠️ Commands List
*Send this to BotFather to set up the menu button.*

**Copy & Paste This:**
```text
start - Connect to the CityWatch Grid
status - Check system connectivity
test - Send a test alert simulation
help - Show emergency contacts
```

---

### 6. 👋 Welcome Message
*While we can't set this in BotFather directly, here is the text your bot should send when a user clicks `/start` (handled by code).*

**Code Logic Response:**
> "Verify Identity: **GRANTED**.
>
> 🛡️ **Connection Established**.
> You are now subscribed to **CityWatch Alert Channel #1**.
>
> Status: **Monitoring Active**
> GPU Node: **RTX 2050**
>
> *Stand by for incoming dispatch...*"

---

### 🚀 Next Steps:
1. Open Telegram and search for **@BotFather**.
2. Send `/mybots` -> Select your bot -> **Edit Bot**.
3. Update **Name**, **About**, **Description**, and **Botpic** using the content above.
4. Copy the **API TOKEN** provided by BotFather.
5. Paste it into `Frontend/main.py`.

*(You are now ready to be the "Commissioner" of your digital city.)*
