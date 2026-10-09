# 🚌 HRTC Deluxe Bus — 90s Hindi Hill Stations Radio

A nostalgic, retro-themed 90s Hindi Hill Stations Radio web application inspired by Himachal Road Transport Corporation (HRTC) mountain bus journeys.

🌐 **Live Deployed Demo**: [https://hrtc-tau.vercel.app/](https://hrtc-tau.vercel.app/)

---

## 🌟 Key Features

- **📺 Full-Bleed Vintage Background**: Retro mountain HRTC bus photo with atmospheric vignetting and 90s CRT radio scanlines overlay.
- **🕒 Real-Time Clock**: Live updating local time badge in top-left corner.
- **🟢 Live Online Passengers ("1 सवारी")**: Real-time connected user counter powered by WebSockets (`ws`).
- **📻 Exact Match Translucent Music Dock**:
  - Translucent 90s glass dock with 75% transparency & backdrop blur.
  - Embedded Album Art & ID3 Metadata parser for downloaded MP3/MP4 media files.
  - Inline seekbar with time indicator (`0:00 / 0:00`), volume controls, and random track engine.
- **⚡ No Database Required**: Pure lightweight Node.js Express server + WebSockets.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js, WebSockets (`ws`)
- **Metadata**: `music-metadata` (for ID3 & embedded cover art parsing)

---

## 🚀 Quick Start (Local Setup)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sania-Patiyal/HRTC.git
   cd HRTC
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open in Browser**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Adding Music**:
   Place your downloaded MP3 or media files in the `music/` directory. The server will automatically scan and extract metadata!

---

## 📜 License

MIT License
