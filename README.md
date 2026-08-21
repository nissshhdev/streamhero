# StreamHero

> Real-time synchronized watch party platform for local networks (LAN / Wi-Fi) and YouTube streaming.

StreamHero allows you to host private watch parties with zero cloud upload overhead. Upload a video once to your local machine, and everyone on the same Wi-Fi network can watch in lockstep synchronization with low latency, live chat, interactive reactions, and multi-track audio support.

Developed by **Nishant**.

---

## Features

- **Local LAN Video Streaming**: Uses HTTP 206 Partial Content byte-range streaming for instantaneous seeking on large media files (MP4, WebM, MKV, MOV).
- **YouTube Watch Parties**: Paste any YouTube link to stream synchronously with synchronized play, pause, seek, and buffering states.
- **Microsecond Drift Compensation**: NTP-style clock offset calculation keeps viewers aligned within ±300ms.
- **Double-Tap / Click Seeking**: Double-click or double-tap on the left/right half of the video stage to seek ±10 seconds with animated ripple feedback.
- **Multi-Track & Dubbed Audio**: Switch audio language tracks or attach external dubbed audio files (`.mp3`, `.aac`, `.m4a`, `.wav`) with synchronized playback.
- **Real-Time Live Chat & Reactions**: Socket.io chat room with floating emoji particles and Web Audio sound effects.
- **Zero Config QR Joining**: Automatically detects local IPv4 network address and generates a QR code for mobile devices to join instantly.
- **Minimalist Carbon UI**: Built with IBM Carbon Design tokens, IBM Plex typography, and a persistent Light / Dark mode toggle.
- **Interactive Aurora Canvas**: Fluid harmonic aurora wave and particle mesh background on the home screen.

---

## Tech Stack

- **Backend**: Node.js, Express, Socket.io, Multer, QRCode
- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Video API, YouTube IFrame Player API, Web Audio API, Canvas 2D
- **Design System**: IBM Carbon Design System (Custom Light/Dark CSS, IBM Plex Sans & Mono)

---

## Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm

### Installation

1. Clone repository:
```bash
git clone https://github.com/your-username/streamhero.git
cd streamhero
```

2. Install dependencies:
```bash
npm install
```

3. Start server:
```bash
npm start
```

4. Open your browser:
- **Host (This Machine)**: `http://localhost:3000`
- **Other Devices on Wi-Fi**: Use the LAN URL printed in your terminal (or scan the QR code from the party share modal).

---

## How It Works

```
                        +----------------------------+
                        |   Host Machine (Server)    |
                        |     Node.js + Socket.io    |
                        +--------------+-------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
         [HTTP 206 Byte Ranges]                  [WebSocket Sync Events]
                   |                                       |
    +--------------v-------------+           +-------------v--------------+
    |  Video / Audio Stream Feed |           |  Play / Pause / Seek Sync  |
    +----------------------------+           +----------------------------+
                   |                                       |
       +-----------+-----------+               +-----------+-----------+
       |                       |               |                       |
+------v------+         +------v------+ +------v------+         +------v------+
| Phone Client|         | Tablet Client | Laptop Client|         | Smart TV    |
+-------------+         +-------------+ +-------------+         +-------------+
```

1. **Host Server**: Serves static assets, manages WebSocket rooms, and provides chunked range streaming for video files stored in `./uploads`.
2. **Sync Engine**: When the host or any participant plays, pauses, or seeks, state events are broadcast across the room with timestamp validation to prevent drift loops.
3. **Drift Auto-Correction**: Each client continuously compares local playback time against room state. If difference exceeds 0.6 seconds, client automatically adjusts playback smoothly.

---

## Project Structure

```
.
├── public/
│   ├── css/
│   │   └── style.css          # Carbon Design System styles & themes
│   ├── js/
│   │   ├── app.js             # Main application orchestrator & canvas
│   │   ├── chat.js            # Live chat management
│   │   ├── player.js          # Video player controller & YouTube API
│   │   ├── reactions.js       # Floating emoji particles & Web Audio
│   │   └── sync.js            # Real-time WebSocket synchronization engine
│   └── index.html             # Application markup
├── uploads/
│   ├── audio/                 # Dubbed / secondary audio tracks
│   └── subtitles/             # Attached SRT / VTT subtitle files
├── server.js                  # Express & Socket.io streaming server
├── package.json
└── README.md
```

---

## Supported Formats

- **Video**: MP4 (H.264 / AAC), WebM (VP8/VP9), MOV, MKV
- **Audio**: MP3, AAC, M4A, WAV, OGG
- **Subtitles**: VTT, SRT
- **External Stream**: YouTube URLs and Share links

---

## License

This project is licensed under the MIT License.
