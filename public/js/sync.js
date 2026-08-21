/**
 * StreamHero - Real-Time WebSocket Synchronization Engine
 */

class SyncEngine {
  constructor(options = {}) {
    this.socket = io();
    this.roomId = null;
    this.memberInfo = null;
    this.roomState = null;
    this.serverTimeOffset = 0; // ms offset between client and server clock
    this.latency = 0;
    this.isRemoteAction = false;
    this.driftThresholdSeconds = 0.6;
    this.syncInterval = null;

    this.onStateChange = options.onStateChange || (() => {});
    this.onVideoChange = options.onVideoChange || (() => {});
    this.onPlay = options.onPlay || (() => {});
    this.onPause = options.onPause || (() => {});
    this.onSeek = options.onSeek || (() => {});
    this.onRateChange = options.onRateChange || (() => {});
    this.onMembersUpdate = options.onMembersUpdate || (() => {});
    this.onChatMessage = options.onChatMessage || (() => {});
    this.onReaction = options.onReaction || (() => {});
    this.onSystemMessage = options.onSystemMessage || (() => {});
    this.onSettingsChange = options.onSettingsChange || (() => {});
    this.onError = options.onError || (() => {});

    this.initSocketEvents();
    this.measureLatency();
  }

  measureLatency() {
    const t0 = Date.now();
    this.socket.emit('latency-ping', t0, (res) => {
      const t1 = Date.now();
      this.latency = Math.round((t1 - t0) / 2);
      this.serverTimeOffset = res.serverTimestamp - (t0 + this.latency);
    });
  }

  getServerTime() {
    return Date.now() + this.serverTimeOffset;
  }

  initSocketEvents() {
    this.socket.on('connect', () => {
      this.measureLatency();
      this.onSystemMessage('Connected to party server');
    });

    this.socket.on('disconnect', () => {
      this.onSystemMessage('Disconnected from server. Reconnecting...');
    });

    // Room members update
    this.socket.on('member-joined', (data) => {
      if (this.roomState) {
        this.roomState.members = data.members;
      }
      this.onMembersUpdate(data.members);
      if (data.systemMessage) this.onSystemMessage(data.systemMessage);
    });

    this.socket.on('member-left', (data) => {
      if (this.roomState) {
        this.roomState.members = data.members;
      }
      this.onMembersUpdate(data.members);
      if (data.systemMessage) this.onSystemMessage(data.systemMessage);
    });

    this.socket.on('host-transferred', (data) => {
      if (this.roomState) {
        this.roomState.hostId = data.newHostId;
        this.roomState.hostName = data.newHostName;
        this.roomState.members = data.members;
      }
      if (this.memberInfo) {
        this.memberInfo.isHost = this.memberInfo.id === data.newHostId;
      }
      this.onMembersUpdate(data.members);
      this.onSystemMessage(`${data.newHostName} is now the party host 👑`);
      this.onSettingsChange(this.roomState);
    });

    // Video Changed
    this.socket.on('video-changed', (data) => {
      if (this.roomState) {
        this.roomState.video = data.video;
        this.roomState.playback = data.playback;
      }
      this.onVideoChange(data.video);
      this.onSystemMessage(`${data.sender} changed the video to: ${data.video.name}`);
    });

    // Subtitles Changed
    this.socket.on('subtitles-changed', (data) => {
      if (this.roomState && this.roomState.video) {
        this.roomState.video.subtitleUrl = data.subtitleUrl;
        this.roomState.video.subtitleLabel = data.subtitleLabel;
      }
      this.onSystemMessage(`${data.sender} added subtitles: ${data.subtitleLabel}`);
    });

    // Play Event from Room
    this.socket.on('video-play', (data) => {
      this.isRemoteAction = true;
      // Account for transit time
      const transitSeconds = Math.max(0, (this.getServerTime() - data.serverTimestamp) / 1000);
      const targetTime = data.currentTime + transitSeconds;
      this.onPlay(targetTime);
      setTimeout(() => { this.isRemoteAction = false; }, 250);
    });

    // Pause Event from Room
    this.socket.on('video-pause', (data) => {
      this.isRemoteAction = true;
      this.onPause(data.currentTime);
      setTimeout(() => { this.isRemoteAction = false; }, 250);
    });

    // Seek Event from Room
    this.socket.on('video-seek', (data) => {
      this.isRemoteAction = true;
      const transitSeconds = data.isPlaying ? Math.max(0, (this.getServerTime() - data.serverTimestamp) / 1000) : 0;
      const targetTime = data.currentTime + transitSeconds;
      this.onSeek(targetTime, data.isPlaying);
      setTimeout(() => { this.isRemoteAction = false; }, 250);
    });

    // Speed Rate Change
    this.socket.on('video-rate', (data) => {
      this.isRemoteAction = true;
      this.onRateChange(data.playbackRate, data.currentTime);
      setTimeout(() => { this.isRemoteAction = false; }, 250);
    });

    // Settings Changed
    this.socket.on('settings-changed', (data) => {
      if (this.roomState) {
        this.roomState.hostOnlyControls = data.hostOnlyControls;
      }
      this.onSettingsChange(this.roomState);
      if (data.message) this.onSystemMessage(data.message);
    });

    // Chat Message
    this.socket.on('new-chat', (chatItem) => {
      this.onChatMessage(chatItem);
    });

    // Floating Reaction
    this.socket.on('new-reaction', (reaction) => {
      this.onReaction(reaction.emoji, reaction.senderName);
    });

    // Sync Correction (when client attempted unauthorized action or drifted)
    this.socket.on('sync-correction', (state) => {
      this.isRemoteAction = true;
      this.onSeek(state.currentTime, state.isPlaying);
      if (state.isPlaying) {
        this.onPlay(state.currentTime);
      } else {
        this.onPause(state.currentTime);
      }
      setTimeout(() => { this.isRemoteAction = false; }, 250);
    });

    this.socket.on('error-msg', (msg) => {
      this.onError(msg);
    });
  }

  // Join or Create a Room with Key Authentication
  joinRoom(roomId, userName, userAvatar, passkey = '', hostKey = '', callback) {
    this.roomId = (roomId || '').trim().toUpperCase();
    this.socket.emit('join-room', { 
      roomId: this.roomId, 
      userName, 
      userAvatar,
      passkey,
      hostKey
    }, (res) => {
      if (res && res.success) {
        this.roomId = res.roomId || this.roomId;
        this.roomState = res.roomState;
        this.memberInfo = res.myMemberInfo;
        this.startPeriodicSync();
        if (typeof callback === 'function') callback(res);
      } else {
        if (typeof callback === 'function') callback(res || { success: false, error: 'Connection error' });
      }
    });
  }

  // Periodic Drift Sync Check
  startPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => {
      this.requestSync();
    }, 4000);
  }

  requestSync(force = false) {
    if (!this.roomId) return;
    this.socket.emit('request-sync', (state) => {
      if (!state) return;
      this.onStateChange(state, force);
    });
  }

  // Actions emitted to room
  emitPlay(currentTime) {
    if (this.isRemoteAction) return;
    this.socket.emit('video-play', { currentTime });
  }

  emitPause(currentTime) {
    if (this.isRemoteAction) return;
    this.socket.emit('video-pause', { currentTime });
  }

  emitSeek(currentTime, wasPlaying) {
    if (this.isRemoteAction) return;
    this.socket.emit('video-seek', { currentTime, wasPlaying });
  }

  emitRate(playbackRate) {
    if (this.isRemoteAction) return;
    this.socket.emit('video-rate', { playbackRate });
  }

  emitSetVideo(videoData) {
    this.socket.emit('set-video', videoData);
  }

  emitSetSubtitles(subtitleData) {
    this.socket.emit('set-subtitles', subtitleData);
  }

  emitChat(message) {
    this.socket.emit('send-chat', { message });
  }

  emitReaction(emoji) {
    this.socket.emit('send-reaction', { emoji });
  }

  emitToggleHostControls(hostOnlyControls) {
    this.socket.emit('toggle-host-controls', { hostOnlyControls });
  }

  emitTransferHost(newHostId) {
    this.socket.emit('transfer-host', { newHostId });
  }
}

window.SyncEngine = SyncEngine;
