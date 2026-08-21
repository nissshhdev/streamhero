# StreamHero

> Real-time synchronized watch party platform for local networks (LAN / Wi-Fi), YouTube streaming, and Windows Desktop.

StreamHero allows you to host private watch parties with zero cloud upload overhead. Upload a video once to your local machine, and everyone on the same Wi-Fi network can watch in lockstep synchronization with sub-second latency, live chat, interactive reactions, multi-track audio, and mobile QR joining.

Developed by **Nishant** &bull; [GitHub Repository](https://github.com/nissshhdev/streamhero)

---

## Key Features

- **Windows Desktop Application**: Run as a standalone native Windows desktop application (`.exe`) with embedded server management or in standard browser mode.
- **Local LAN Video Streaming**: Uses HTTP 206 Partial Content byte-range streaming for instantaneous seeking on large media files (MP4, WebM, MKV, MOV).
- **YouTube Watch Parties**: Paste any YouTube link to stream synchronously with shared play, pause, seek, and buffering states.
- **Sub-Second Drift Compensation**: NTP-style clock offset calculation keeps viewers automatically aligned within ±300ms.
- **Double-Tap / Click Seeking**: Double-click or double-tap on the left/right half of the video stage to seek ±10 seconds with animated ripple feedback.
- **Multi-Track & Dubbed Audio**: Switch audio language tracks or attach external dubbed audio files (`.mp3`, `.aac`, `.m4a`, `.wav`) with synchronized playback.
- **Real-Time Live Chat & Reactions**: Socket.io chat room with floating emoji particles and Web Audio sound effects.
- **Zero Config QR Joining**: Automatically detects local IPv4 network address and generates a QR code for mobile devices to join instantly.
- **Minimalist Carbon UI**: Built with IBM Carbon Design tokens, IBM Plex typography, and persistent Light / Dark mode toggle.
- **Interactive Aurora Canvas**: Fluid harmonic aurora wave and particle mesh background on the home screen.

---

## Tech Stack

- **Desktop Framework**: Electron, Electron-Builder (Windows NSIS & Portable)
- **Backend**: Node.js, Express, Socket.io, Multer, QRCode
- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Video API, YouTube IFrame Player API, Web Audio API, Canvas 2D
- **Design System**: IBM Carbon Design System (Custom Light/Dark CSS, IBM Plex Sans & Mono)

---

## Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nissshhdev/streamhero
cd streamhero
```

2. Install dependencies:
```bash
npm install
```

### Running the App

| Command | Target | Description |
|---|---|---|
| `npm run electron:start` | **Windows Desktop App** | Launches StreamHero in a native desktop window with auto-managed backend |
| `npm start` | **Web Browser Server** | Starts the local HTTP & WebSocket server (`http://localhost:3000`) |
| `npm run dev` | **Development Mode** | Starts server with file watcher (`--watch`) |
| `npm run electron:build` | **Build Windows Installer** | Packages standalone `.exe` installer and portable executable to `./dist/` |

### Connecting Devices on LAN

1. Open StreamHero on your host PC (`http://localhost:3000` or the desktop app).
2. Enter your nickname and join a room code (default is `MAIN`).
3. Click **Share QR** in the top navigation bar.
4. Scan the QR code with any smartphone or tablet connected to the same Wi-Fi network to start watching together!

---

## Packaging Windows Executables

To generate standalone Windows distribution files:

```bash
npm run electron:build
```

The build artifacts will be generated in `./dist/`:
- `StreamHero Setup <version>.exe` (Full Windows NSIS Installer)
- `StreamHero <version>.exe` (Standalone Portable Executable)

---

## How It Works

```
                        +----------------------------+
                        |   Host Machine (Server)    |
                        |  Node.js / Electron Native |
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
├── electron/
│   ├── main.js                # Electron main process (lifecycle & server spawn)
│   └── preload.js             # Electron preload context bridge
├── public/
│   ├── css/
│   │   └── style.css          # Carbon Design System styles & themes
│   ├── js/
│   │   ├── app.js             # Main application orchestrator & canvas
│   │   ├── chat.js            # Live chat management
│   │   ├── player.js          # Video player controller & YouTube API
│   │   ├── reactions.js       # Floating emoji particles & Web Audio
│   │   └── sync.js            # Real-time WebSocket synchronization engine
│   └── index.html             # Application markup & Carbon layout
├── uploads/
│   ├── audio/                 # Dubbed / secondary audio tracks
│   └── subtitles/             # Attached SRT / VTT subtitle files
├── server.js                  # Express & Socket.io streaming server
├── verify-dom.js              # DOM integrity validator
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

## Contributing

Contributions are welcome! If you want to contribute:

1. Fork the repository on GitHub: [nissshhdev/streamhero](https://github.com/nissshhdev/streamhero)
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request on GitHub.

---

## License

This project is licensed under the MIT License.
