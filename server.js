const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100MB
});

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const SUBTITLES_DIR = path.join(__dirname, 'uploads', 'subtitles');
const AUDIO_DIR = path.join(__dirname, 'uploads', 'audio');

// Ensure upload directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(SUBTITLES_DIR)) {
  fs.mkdirSync(SUBTITLES_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/subtitles', express.static(SUBTITLES_DIR));
app.use('/uploads/audio', express.static(AUDIO_DIR));

// Helper: Get local network IP addresses
function getLocalNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // IPv4 and non-internal (i.e. not 127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
          url: `http://${net.address}:${PORT}`
        });
      }
    }
  }

  const primaryIp = addresses.length > 0 ? addresses[0].ip : 'localhost';
  const primaryUrl = addresses.length > 0 ? addresses[0].url : `http://localhost:${PORT}`;

  return {
    primaryIp,
    primaryUrl,
    allInterfaces: addresses
  };
}

// Multer storage for video files
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

// Multer storage for subtitles
const subtitleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SUBTITLES_DIR);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit
});

const uploadSubtitle = multer({
  storage: subtitleStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Multer storage for external audio tracks
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// API: Get Network Info & QR Code
app.get('/api/network-info', async (req, res) => {
  try {
    const roomId = req.query.roomId || '';
    const netInfo = getLocalNetworkInfo();
    const joinUrl = roomId ? `${netInfo.primaryUrl}/?room=${encodeURIComponent(roomId)}` : netInfo.primaryUrl;
    const qrDataUrl = await qrcode.toDataURL(joinUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f62fe',
        light: '#FFFFFF'
      }
    });

    res.json({
      ...netInfo,
      joinUrl,
      qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate network QR info', details: err.message });
  }
});

// API: List Available Uploaded Videos
app.get('/api/videos', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR).filter(file => {
      const fullPath = path.join(UPLOAD_DIR, file);
      if (fs.statSync(fullPath).isDirectory()) return false;
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.webm', '.mkv', '.mov', '.ogg', '.m4v'].includes(ext);
    });

    const fileList = files.map(filename => {
      const stats = fs.statSync(path.join(UPLOAD_DIR, filename));
      return {
        id: filename,
        filename,
        originalName: filename.replace(/^\d+-\d+-/, ''),
        size: stats.size,
        formattedSize: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        createdAt: stats.birthtime,
        streamUrl: `/stream/${encodeURIComponent(filename)}`
      };
    });

    res.json({ files: fileList.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list videos', details: err.message });
  }
});

// API: Delete Video File from Library
app.delete('/api/videos/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'Video deleted successfully' });
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video', details: err.message });
  }
});

// API: Upload Video File
app.post('/api/upload', uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const filename = req.file.filename;
  const streamUrl = `/stream/${encodeURIComponent(filename)}`;

  res.json({
    success: true,
    file: {
      id: filename,
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      formattedSize: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
      mimetype: req.file.mimetype,
      streamUrl
    }
  });
});

// API: Upload Subtitles File (.vtt or .srt)
app.post('/api/upload-subtitles', uploadSubtitle.single('subtitles'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No subtitle file provided' });
  }

  const filename = req.file.filename;
  let subtitleUrl = `/uploads/subtitles/${encodeURIComponent(filename)}`;

  // If SRT, convert to WebVTT on the fly for native browser <track> support
  if (path.extname(req.file.originalname).toLowerCase() === '.srt') {
    try {
      const srtPath = path.join(SUBTITLES_DIR, filename);
      const vttFilename = filename.replace(/\.srt$/i, '.vtt');
      const vttPath = path.join(SUBTITLES_DIR, vttFilename);
      const srtContent = fs.readFileSync(srtPath, 'utf8');

      // Simple SRT to WebVTT conversion
      let vttContent = 'WEBVTT\n\n' + srtContent
        .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
        .replace(/\r\n|\r/g, '\n');

      fs.writeFileSync(vttPath, vttContent, 'utf8');
      subtitleUrl = `/uploads/subtitles/${encodeURIComponent(vttFilename)}`;
    } catch (e) {
      console.warn('SRT to VTT conversion fallback:', e);
    }
  }

  res.json({
    success: true,
    subtitleUrl,
    label: req.file.originalname
  });
});

// API: Upload External Audio Track File (.mp3, .aac, .m4a, .wav, .ogg)
app.post('/api/upload-audio', uploadAudio.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const filename = req.file.filename;
  const audioUrl = `/uploads/audio/${encodeURIComponent(filename)}`;

  res.json({
    success: true,
    audioUrl,
    label: req.file.originalname.replace(/\.[^/.]+$/, '')
  });
});

// HTTP 206 Partial Content Video Streaming Engine
app.get('/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOAD_DIR, filename);

  // Security check: ensure path is within UPLOAD_DIR
  if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).send('Video file not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Determine MIME type
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'video/mp4';
  if (ext === '.webm') contentType = 'video/webm';
  else if (ext === '.ogg') contentType = 'video/ogg';
  else if (ext === '.mkv') contentType = 'video/x-matroska';
  else if (ext === '.mov') contentType = 'video/quicktime';

  if (range) {
    // Parse Range header e.g. "bytes=32324-"
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`).send('Requested range not satisfiable');
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Initial request or browser doesn't send range
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// ----------------------------------------------------
// Real-Time Room State & Synchronization Manager
// ----------------------------------------------------
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      hostId: null,
      hostName: '',
      hostOnlyControls: false,
      video: null, // { url, name, size, duration, subtitleUrl }
      playback: {
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1.0
      },
      members: new Map(), // socketId -> { id, name, avatar, isHost, joinedAt }
      chatHistory: []
    });
  }
  return rooms.get(roomId);
}

function calculateCurrentTime(playback) {
  if (!playback.isPlaying) {
    return playback.currentTime;
  }
  const elapsed = (Date.now() - playback.lastUpdated) / 1000;
  return playback.currentTime + elapsed * playback.playbackRate;
}

function sanitizeRoomState(room) {
  return {
    id: room.id,
    hostId: room.hostId,
    hostName: room.hostName,
    hostOnlyControls: room.hostOnlyControls,
    video: room.video,
    playback: {
      isPlaying: room.playback.isPlaying,
      currentTime: calculateCurrentTime(room.playback),
      playbackRate: room.playback.playbackRate,
      lastUpdated: Date.now()
    },
    members: Array.from(room.members.values()),
    chatHistory: room.chatHistory.slice(-50)
  };
}

io.on('connection', (socket) => {
  let currentRoomId = null;
  let memberInfo = null;

  // Ping / Latency check
  socket.on('latency-ping', (clientTimestamp, cb) => {
    if (typeof cb === 'function') {
      cb({ clientTimestamp, serverTimestamp: Date.now() });
    }
  });

  // Join or Create Room
  socket.on('join-room', ({ roomId, userName, userAvatar }, callback) => {
    roomId = (roomId || 'default').trim().toUpperCase();
    currentRoomId = roomId;

    const room = getRoom(roomId);
    const isFirstMember = room.members.size === 0;

    if (isFirstMember) {
      room.hostId = socket.id;
      room.hostName = userName || 'Host';
    }

    memberInfo = {
      id: socket.id,
      name: userName || `Viewer ${Math.floor(Math.random() * 1000)}`,
      avatar: userAvatar || '🍿',
      isHost: room.hostId === socket.id,
      joinedAt: Date.now()
    };

    room.members.set(socket.id, memberInfo);
    socket.join(roomId);

    // Notify room of new member
    io.to(roomId).emit('member-joined', {
      member: memberInfo,
      members: Array.from(room.members.values()),
      systemMessage: `${memberInfo.name} joined the party! 🎉`
    });

    // Send full current room state to joining client
    if (typeof callback === 'function') {
      callback({
        success: true,
        roomState: sanitizeRoomState(room),
        myMemberInfo: memberInfo
      });
    }
  });

  // Set / Change Current Video
  socket.on('set-video', (videoData) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    // Check permission
    if (room.hostOnlyControls && room.hostId !== socket.id) {
      return socket.emit('error-msg', 'Only the host can change the video.');
    }

    room.video = {
      url: videoData.url,
      name: videoData.name || 'Untitled Video',
      size: videoData.size || 0,
      formattedSize: videoData.formattedSize || '',
      subtitleUrl: videoData.subtitleUrl || null,
      subtitleLabel: videoData.subtitleLabel || null
    };

    room.playback = {
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now(),
      playbackRate: 1.0
    };

    io.to(currentRoomId).emit('video-changed', {
      video: room.video,
      playback: room.playback,
      sender: memberInfo?.name || 'Someone'
    });
  });

  // Set Subtitles for Current Video
  socket.on('set-subtitles', (subtitleData) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);
    if (!room.video) return;

    room.video.subtitleUrl = subtitleData.subtitleUrl;
    room.video.subtitleLabel = subtitleData.subtitleLabel || 'Subtitles';

    io.to(currentRoomId).emit('subtitles-changed', {
      subtitleUrl: room.video.subtitleUrl,
      subtitleLabel: room.video.subtitleLabel,
      sender: memberInfo?.name || 'Someone'
    });
  });

  // Play Event
  socket.on('video-play', ({ currentTime }) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    if (room.hostOnlyControls && room.hostId !== socket.id) {
      // Revert client
      return socket.emit('sync-correction', {
        isPlaying: room.playback.isPlaying,
        currentTime: calculateCurrentTime(room.playback),
        playbackRate: room.playback.playbackRate
      });
    }

    room.playback.isPlaying = true;
    room.playback.currentTime = typeof currentTime === 'number' ? currentTime : room.playback.currentTime;
    room.playback.lastUpdated = Date.now();

    socket.to(currentRoomId).emit('video-play', {
      currentTime: room.playback.currentTime,
      serverTimestamp: room.playback.lastUpdated,
      sender: memberInfo?.name || 'Someone'
    });
  });

  // Pause Event
  socket.on('video-pause', ({ currentTime }) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    if (room.hostOnlyControls && room.hostId !== socket.id) {
      return socket.emit('sync-correction', {
        isPlaying: room.playback.isPlaying,
        currentTime: calculateCurrentTime(room.playback),
        playbackRate: room.playback.playbackRate
      });
    }

    room.playback.isPlaying = false;
    room.playback.currentTime = typeof currentTime === 'number' ? currentTime : calculateCurrentTime(room.playback);
    room.playback.lastUpdated = Date.now();

    socket.to(currentRoomId).emit('video-pause', {
      currentTime: room.playback.currentTime,
      serverTimestamp: room.playback.lastUpdated,
      sender: memberInfo?.name || 'Someone'
    });
  });

  // Seek Event
  socket.on('video-seek', ({ currentTime, wasPlaying }) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    if (room.hostOnlyControls && room.hostId !== socket.id) {
      return socket.emit('sync-correction', {
        isPlaying: room.playback.isPlaying,
        currentTime: calculateCurrentTime(room.playback),
        playbackRate: room.playback.playbackRate
      });
    }

    room.playback.currentTime = currentTime;
    room.playback.lastUpdated = Date.now();
    if (typeof wasPlaying === 'boolean') {
      room.playback.isPlaying = wasPlaying;
    }

    socket.to(currentRoomId).emit('video-seek', {
      currentTime: room.playback.currentTime,
      isPlaying: room.playback.isPlaying,
      serverTimestamp: room.playback.lastUpdated,
      sender: memberInfo?.name || 'Someone'
    });
  });

  // Playback Rate Change
  socket.on('video-rate', ({ playbackRate }) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    if (room.hostOnlyControls && room.hostId !== socket.id) return;

    room.playback.currentTime = calculateCurrentTime(room.playback);
    room.playback.playbackRate = playbackRate;
    room.playback.lastUpdated = Date.now();

    socket.to(currentRoomId).emit('video-rate', {
      playbackRate,
      currentTime: room.playback.currentTime,
      serverTimestamp: room.playback.lastUpdated,
      sender: memberInfo?.name || 'Someone'
    });
  });

  // Sync Request (Periodic or after buffering)
  socket.on('request-sync', (callback) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);
    if (typeof callback === 'function') {
      callback({
        isPlaying: room.playback.isPlaying,
        currentTime: calculateCurrentTime(room.playback),
        playbackRate: room.playback.playbackRate,
        serverTimestamp: Date.now()
      });
    }
  });

  // Chat Message
  socket.on('send-chat', ({ message }) => {
    if (!currentRoomId || !message || !message.trim()) return;
    const room = getRoom(currentRoomId);

    const chatItem = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      senderId: socket.id,
      senderName: memberInfo?.name || 'Anonymous',
      senderAvatar: memberInfo?.avatar || '🍿',
      isHost: room.hostId === socket.id,
      text: message.trim().slice(0, 500),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    room.chatHistory.push(chatItem);
    if (room.chatHistory.length > 100) room.chatHistory.shift();

    io.to(currentRoomId).emit('new-chat', chatItem);
  });

  // Floating Emoji Reaction
  socket.on('send-reaction', ({ emoji }) => {
    if (!currentRoomId || !emoji) return;
    io.to(currentRoomId).emit('new-reaction', {
      emoji,
      senderId: socket.id,
      senderName: memberInfo?.name || 'Someone'
    });
  });

  // Toggle Host-Only Controls
  socket.on('toggle-host-controls', ({ hostOnlyControls }) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);
    if (room.hostId !== socket.id) return;

    room.hostOnlyControls = !!hostOnlyControls;
    io.to(currentRoomId).emit('settings-changed', {
      hostOnlyControls: room.hostOnlyControls,
      message: room.hostOnlyControls ? 'Host enabled Host-Only playback controls.' : 'Playback controls are now open to everyone.'
    });
  });

  // Transfer Host Role
  socket.on('transfer-host', ({ newHostId }) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);
    if (room.hostId !== socket.id) return;

    if (room.members.has(newHostId)) {
      const oldHost = room.members.get(socket.id);
      const newHost = room.members.get(newHostId);
      if (oldHost) oldHost.isHost = false;
      if (newHost) newHost.isHost = true;

      room.hostId = newHostId;
      room.hostName = newHost.name;

      io.to(currentRoomId).emit('host-transferred', {
        newHostId,
        newHostName: newHost.name,
        members: Array.from(room.members.values())
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    if (room.members.has(socket.id)) {
      const leavingMember = room.members.get(socket.id);
      room.members.delete(socket.id);

      // If host left, elect new host
      if (room.hostId === socket.id && room.members.size > 0) {
        const nextHostId = room.members.keys().next().value;
        const nextHost = room.members.get(nextHostId);
        nextHost.isHost = true;
        room.hostId = nextHostId;
        room.hostName = nextHost.name;

        io.to(currentRoomId).emit('host-transferred', {
          newHostId: nextHostId,
          newHostName: nextHost.name,
          members: Array.from(room.members.values()),
          systemMessage: `${leavingMember.name} left. ${nextHost.name} is now the host!`
        });
      }

      io.to(currentRoomId).emit('member-left', {
        memberId: socket.id,
        memberName: leavingMember.name,
        members: Array.from(room.members.values()),
        systemMessage: `${leavingMember.name} left the party.`
      });

      // Clean up empty room after 10 minutes
      if (room.members.size === 0) {
        setTimeout(() => {
          if (rooms.has(currentRoomId) && rooms.get(currentRoomId).members.size === 0) {
            rooms.delete(currentRoomId);
          }
        }, 10 * 60 * 1000);
      }
    }
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  const netInfo = getLocalNetworkInfo();
  console.log(`[StreamHero] Server listening on port ${PORT}`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  LAN:   ${netInfo.primaryUrl}`);
});
