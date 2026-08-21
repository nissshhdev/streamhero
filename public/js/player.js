/**
 * StreamHero - Video Player Controller
 */

class CinePlayer {
  constructor(options = {}) {
    this.video = document.getElementById('mainVideo');
    this.container = document.getElementById('videoContainer');
    this.controlsOverlay = document.getElementById('playerControlsOverlay');
    this.emptyState = document.getElementById('emptyPlayerState');
    this.spinner = document.getElementById('videoBufferSpinner');
    this.ambientCanvas = document.getElementById('ambientCanvas');
    this.ambientCtx = this.ambientCanvas ? this.ambientCanvas.getContext('2d') : null;

    // Controls elements
    this.btnPlayPause = document.getElementById('btnPlayPause');
    this.iconPlay = this.btnPlayPause.querySelector('.icon-play');
    this.iconPause = this.btnPlayPause.querySelector('.icon-pause');
    this.btnRewind10 = document.getElementById('btnRewind10');
    this.btnForward10 = document.getElementById('btnForward10');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.btnVolumeMute = document.getElementById('btnVolumeMute');
    this.iconVolHigh = this.btnVolumeMute.querySelector('.icon-vol-high');
    this.iconVolMute = this.btnVolumeMute.querySelector('.icon-vol-mute');
    this.timeCurrent = document.getElementById('timeCurrent');
    this.timeDuration = document.getElementById('timeDuration');
    this.videoActiveTitle = document.getElementById('videoActiveTitle');
    this.videoSyncStatus = document.getElementById('videoSyncStatus');

    // Timeline elements
    this.timelineContainer = document.getElementById('timelineContainer');
    this.timelineProgress = document.getElementById('timelineProgress');
    this.timelineBuffer = document.getElementById('timelineBuffer');
    this.timelineThumb = document.getElementById('timelineThumb');
    this.timelineHoverTime = document.getElementById('timelineHoverTime');

    // Extra controls
    this.btnPip = document.getElementById('btnPip');
    this.btnTheaterMode = document.getElementById('btnTheaterMode');
    this.btnFullscreen = document.getElementById('btnFullscreen');
    this.iconExpand = this.btnFullscreen.querySelector('.icon-expand');
    this.iconCompress = this.btnFullscreen.querySelector('.icon-compress');
    this.playStateCue = document.getElementById('playStateCue');
    this.cuePlay = this.playStateCue.querySelector('.play-cue');
    this.cuePause = this.playStateCue.querySelector('.pause-cue');

    // Speed, Subtitles & Audio Track Dropdowns
    this.btnSpeedToggle = document.getElementById('btnSpeedToggle');
    this.speedDropdownMenu = document.getElementById('speedDropdownMenu');
    this.currentSpeedLabel = document.getElementById('currentSpeedLabel');
    this.btnSubtitlesToggle = document.getElementById('btnSubtitlesToggle');
    this.subtitlesDropdownMenu = document.getElementById('subtitlesDropdownMenu');
    this.btnAudioTracksToggle = document.getElementById('btnAudioTracksToggle');
    this.audioTracksDropdownMenu = document.getElementById('audioTracksDropdownMenu');
    this.audioTracksList = document.getElementById('audioTracksList');
    this.btnAudioUploadOption = document.getElementById('btnAudioUploadOption');
    this.audioFileInput = document.getElementById('audioFileInput');
    this.secondaryAudio = document.getElementById('secondaryAudio');
    this.youtubeContainer = document.getElementById('youtubePlayer');
    this.seekRippleLeft = document.getElementById('seekRippleLeft');
    this.seekRippleRight = document.getElementById('seekRippleRight');
    this.btnForceSync = document.getElementById('btnForceSync');

    this.hasExternalAudio = false;
    this.isYouTube = false;
    this.ytPlayer = null;
    this.singleClickTimeout = null;

    // Callbacks for sync engine
    this.onUserPlay = options.onUserPlay || (() => {});
    this.onUserPause = options.onUserPause || (() => {});
    this.onUserSeek = options.onUserSeek || (() => {});
    this.onUserRate = options.onUserRate || (() => {});
    this.onForceSync = options.onForceSync || (() => {});
    this.onToggleSidebar = options.onToggleSidebar || (() => {});

    this.isDraggingTimeline = false;
    this.controlsHideTimeout = null;
    this.ambientLoopId = null;
    this.currentVideoData = null;

    this.initEvents();
    this.initKeyboardShortcuts();
    this.initAmbientLighting();
  }

  triggerSeekRipple(side) {
    const el = side === 'left' ? this.seekRippleLeft : this.seekRippleRight;
    if (!el) return;
    el.classList.remove('hidden');
    // Force DOM reflow to re-trigger CSS animation
    void el.offsetWidth;
    setTimeout(() => {
      el.classList.add('hidden');
    }, 620);
  }

  initEvents() {
    // Play/Pause button click
    this.btnPlayPause.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlayPause(true);
    });

    // Double-Tap / Double-Click to Seek 10s on Left/Right side of Video
    let lastTapTime = 0;
    const handleVideoTap = (clientX) => {
      const now = Date.now();
      const rect = this.videoContainer.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const isLeft = clickX < rect.width / 2;

      if (now - lastTapTime < 320) {
        // Double-Tap / Click triggered!
        clearTimeout(this.singleClickTimeout);
        this.singleClickTimeout = null;

        if (isLeft) {
          this.seekRelative(-10);
          this.triggerSeekRipple('left');
        } else {
          this.seekRelative(10);
          this.triggerSeekRipple('right');
        }
        lastTapTime = 0;
      } else {
        lastTapTime = now;
        this.singleClickTimeout = setTimeout(() => {
          this.togglePlayPause(true);
        }, 300);
      }
    };

    this.video.addEventListener('click', (e) => {
      handleVideoTap(e.clientX);
    });

    this.video.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        handleVideoTap(e.changedTouches[0].clientX);
      }
    });

    // Rewind / Forward 10s buttons
    this.btnRewind10.addEventListener('click', (e) => {
      e.stopPropagation();
      this.seekRelative(-10);
      this.triggerSeekRipple('left');
    });

    this.btnForward10.addEventListener('click', (e) => {
      e.stopPropagation();
      this.seekRelative(10);
      this.triggerSeekRipple('right');
    });

    // Native Video Element Events
    this.video.addEventListener('play', () => {
      this.updatePlayPauseUI(true);
      this.showPlayCue(true);
      this.startAmbientLoop();
    });

    this.video.addEventListener('pause', () => {
      this.updatePlayPauseUI(false);
      this.showPlayCue(false);
      this.stopAmbientLoop();
    });

    this.video.addEventListener('timeupdate', () => {
      this.updateTimelineProgress();
      this.updateTimeDisplay();
    });

    this.video.addEventListener('progress', () => {
      this.updateBufferProgress();
    });

    this.video.addEventListener('loadedmetadata', () => {
      this.updateTimeDisplay();
      this.detectAudioTracks();
      if (this.emptyState) this.emptyState.classList.add('hidden');
    });

    this.video.addEventListener('waiting', () => {
      if (this.spinner) this.spinner.classList.remove('hidden');
      if (this.hasExternalAudio && this.secondaryAudio) this.secondaryAudio.pause();
    });

    this.video.addEventListener('playing', () => {
      if (this.spinner) this.spinner.classList.add('hidden');
      if (this.hasExternalAudio && this.secondaryAudio && !this.video.paused) {
        this.secondaryAudio.play().catch(e => console.warn(e));
      }
    });

    // Timeline Scrubbing & Hover
    this.initTimelineEvents();

    // Volume & Mute
    this.volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.setVolume(val);
    });

    this.btnVolumeMute.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute();
    });

    // Dropdowns
    if (this.btnAudioTracksToggle) {
      this.btnAudioTracksToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.toggle('hidden');
        if (this.speedDropdownMenu) this.speedDropdownMenu.classList.add('hidden');
        if (this.subtitlesDropdownMenu) this.subtitlesDropdownMenu.classList.add('hidden');
      });
    }

    if (this.btnSpeedToggle) {
      this.btnSpeedToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.speedDropdownMenu) this.speedDropdownMenu.classList.toggle('hidden');
        if (this.subtitlesDropdownMenu) this.subtitlesDropdownMenu.classList.add('hidden');
        if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.add('hidden');
      });
    }

    if (this.speedDropdownMenu) {
      this.speedDropdownMenu.querySelectorAll('.cds--menu-item, .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const speed = parseFloat(item.dataset.speed);
          if (!isNaN(speed)) {
            this.setPlaybackRate(speed, true);
            this.speedDropdownMenu.querySelectorAll('.cds--menu-item, .dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
          }
          this.speedDropdownMenu.classList.add('hidden');
        });
      });
    }

    if (this.btnSubtitlesToggle) {
      this.btnSubtitlesToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.subtitlesDropdownMenu) this.subtitlesDropdownMenu.classList.toggle('hidden');
        if (this.speedDropdownMenu) this.speedDropdownMenu.classList.add('hidden');
        if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.add('hidden');
      });
    }

    // Audio file input trigger for custom audio track
    if (this.btnAudioUploadOption && this.audioFileInput) {
      this.btnAudioUploadOption.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.add('hidden');
        this.audioFileInput.click();
      });

      this.audioFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const audioFile = e.target.files[0];
          const audioUrl = URL.createObjectURL(audioFile);
          this.attachExternalAudio(audioUrl, audioFile.name.replace(/\.[^/.]+$/, ''));
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      if (this.speedDropdownMenu) this.speedDropdownMenu.classList.add('hidden');
      if (this.subtitlesDropdownMenu) this.subtitlesDropdownMenu.classList.add('hidden');
      if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.add('hidden');
    });

    // Force Sync button
    this.btnForceSync.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onForceSync();
      this.setSyncStatus('resyncing', 'Re-syncing...');
      setTimeout(() => this.setSyncStatus('in-sync', 'Synchronized'), 1200);
    });

    // Picture-in-Picture
    if (document.pictureInPictureEnabled) {
      this.btnPip.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else if (this.video.readyState >= 1) {
            await this.video.requestPictureInPicture();
          }
        } catch (err) {
          console.warn('PiP error:', err);
        }
      });
    } else {
      this.btnPip.classList.add('hidden');
    }

    // Theater Mode
    this.btnTheaterMode.addEventListener('click', (e) => {
      e.stopPropagation();
      const theaterView = document.getElementById('theaterView');
      theaterView.classList.toggle('mode-theater');
    });

    // Fullscreen
    this.btnFullscreen.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });

    document.addEventListener('fullscreenchange', () => {
      const isFull = !!document.fullscreenElement;
      this.iconExpand.classList.toggle('hidden', isFull);
      this.iconCompress.classList.toggle('hidden', !isFull);
    });

    // Overlay visibility autohide
    this.container.addEventListener('mousemove', () => this.handleMouseMove());
    this.container.addEventListener('mouseleave', () => {
      if (!this.video.paused) {
        this.controlsOverlay.classList.remove('controls-visible');
      }
    });
  }

  handleMouseMove() {
    this.controlsOverlay.classList.add('controls-visible');
    clearTimeout(this.controlsHideTimeout);
    this.controlsHideTimeout = setTimeout(() => {
      if (!this.video.paused) {
        this.controlsOverlay.classList.remove('controls-visible');
      }
    }, 2800);
  }

  initTimelineEvents() {
    const handleTimelineClick = (e) => {
      const rect = this.timelineContainer.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetTime = pos * (this.video.duration || 0);
      this.seekTo(targetTime, true);
    };

    this.timelineContainer.addEventListener('mousedown', (e) => {
      this.isDraggingTimeline = true;
      handleTimelineClick(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingTimeline) {
        handleTimelineClick(e);
      }

      // Tooltip position on hover
      const rect = this.timelineContainer.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top - 15 && e.clientY <= rect.bottom + 15) {
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const hoverSecs = pos * (this.video.duration || 0);
        this.timelineHoverTime.textContent = this.formatTime(hoverSecs);
        this.timelineHoverTime.style.left = `${pos * 100}%`;
        this.timelineHoverTime.classList.remove('hidden');
      } else {
        this.timelineHoverTime.classList.add('hidden');
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDraggingTimeline = false;
    });
  }

  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't intercept when user is typing in chat or input
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          this.togglePlayPause(true);
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          this.seekRelative(-10);
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          this.seekRelative(10);
          break;
        case 'KeyM':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'KeyT':
          e.preventDefault();
          document.getElementById('theaterView').classList.toggle('mode-theater');
          break;
        case 'KeyC':
          e.preventDefault();
          this.onToggleSidebar();
          break;
      }
    });
  }

  // Cinema Ambient Backlight Loop
  initAmbientLighting() {
    if (!this.ambientCanvas || !this.ambientCtx) return;
    this.ambientCanvas.width = 64;
    this.ambientCanvas.height = 36;
  }

  startAmbientLoop() {
    if (this.ambientLoopId) return;
    const renderAmbient = () => {
      if (this.video.paused || this.video.ended || !this.video.videoWidth) {
        this.ambientLoopId = null;
        return;
      }
      try {
        this.ambientCtx.drawImage(this.video, 0, 0, 64, 36);
      } catch (e) {}
      this.ambientLoopId = requestAnimationFrame(renderAmbient);
    };
    this.ambientLoopId = requestAnimationFrame(renderAmbient);
  }

  stopAmbientLoop() {
    if (this.ambientLoopId) {
      cancelAnimationFrame(this.ambientLoopId);
      this.ambientLoopId = null;
    }
  }

  // Load YouTube Video
  loadYouTube(youtubeId, title = 'YouTube Stream') {
    this.isYouTube = true;
    this.emptyState.classList.add('hidden');
    this.video.classList.add('hidden');
    this.video.pause();
    this.resetAudioTracks();

    this.videoActiveTitle.textContent = title;
    if (this.youtubeContainer) this.youtubeContainer.classList.remove('hidden');

    if (window.YT && window.YT.Player) {
      this.initYouTubePlayer(youtubeId);
    } else {
      window.onYouTubeIframeAPIReady = () => {
        this.initYouTubePlayer(youtubeId);
      };
    }
  }

  initYouTubePlayer(youtubeId) {
    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
      this.ytPlayer.loadVideoById(youtubeId);
      this.ytPlayer.playVideo();
    } else if (window.YT && window.YT.Player) {
      this.ytPlayer = new YT.Player('youtubePlayer', {
        height: '100%',
        width: '100%',
        videoId: youtubeId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              this.updatePlayPauseUI(true);
              this.onUserPlay(this.ytPlayer.getCurrentTime());
            } else if (event.data === YT.PlayerState.PAUSED) {
              this.updatePlayPauseUI(false);
              this.onUserPause(this.ytPlayer.getCurrentTime());
            }
          }
        }
      });
    }
  }

  // Load a new video source
  loadVideo(videoData) {
    this.isYouTube = false;
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try { this.ytPlayer.pauseVideo(); } catch (e) {}
    }
    if (this.youtubeContainer) this.youtubeContainer.classList.add('hidden');
    this.video.classList.remove('hidden');

    this.currentVideoData = videoData;
    this.video.src = videoData.url;
    this.video.muted = false; // Always ensure main video is unmuted!
    this.videoActiveTitle.textContent = videoData.name || 'Untitled Video';
    this.emptyState.classList.add('hidden');

    // Reset external audio
    this.resetAudioTracks();

    // Handle Subtitles
    this.clearSubtitles();
    if (videoData.subtitleUrl) {
      this.attachSubtitleTrack(videoData.subtitleUrl, videoData.subtitleLabel || 'Subtitles');
    }

    this.video.load();
  }

  detectAudioTracks() {
    if (!this.audioTracksList) return;
    this.audioTracksList.innerHTML = '';

    // Check if HTML5 audioTracks API is supported by the browser
    if (this.video.audioTracks && this.video.audioTracks.length > 1) {
      const tracks = this.video.audioTracks;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const btn = document.createElement('button');
        btn.className = `cds--menu-item ${track.enabled ? 'active' : ''}`;
        const langName = track.label || track.language || `Track ${i + 1}`;
        btn.textContent = `${langName} ${track.language ? `[${track.language}]` : ''}`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          for (let j = 0; j < tracks.length; j++) {
            tracks[j].enabled = (j === i);
          }
          this.hasExternalAudio = false;
          this.video.muted = false;
          if (this.secondaryAudio) this.secondaryAudio.pause();
          this.audioTracksList.querySelectorAll('.cds--menu-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.add('hidden');
        });
        this.audioTracksList.appendChild(btn);
      }
    } else {
      // Provide clean selectable audio options
      const defaultBtn = document.createElement('button');
      defaultBtn.className = 'cds--menu-item active';
      defaultBtn.textContent = 'Default Video Audio (Main)';
      defaultBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hasExternalAudio = false;
        this.video.muted = false; // Guaranteed unmuted
        if (this.secondaryAudio) this.secondaryAudio.pause();
        this.audioTracksList.querySelectorAll('.cds--menu-item').forEach(b => b.classList.remove('active'));
        defaultBtn.classList.add('active');
        if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.add('hidden');
      });
      this.audioTracksList.appendChild(defaultBtn);
    }
  }

  attachExternalAudio(url, label) {
    if (!this.secondaryAudio) return;
    this.secondaryAudio.src = url;
    this.hasExternalAudio = true;
    this.video.muted = true; // Mute main video so the dubbed track plays exclusively

    this.secondaryAudio.currentTime = this.video.currentTime || 0;
    this.secondaryAudio.playbackRate = this.video.playbackRate || 1;
    this.secondaryAudio.volume = this.video.volume || 1;

    if (!this.video.paused) {
      this.secondaryAudio.play().catch(e => console.warn(e));
    }

    // Add button to audio tracks list
    if (this.audioTracksList) {
      const extBtn = document.createElement('button');
      extBtn.className = 'cds--menu-item active';
      extBtn.textContent = `🎙️ ${label} (Active Track)`;
      this.audioTracksList.querySelectorAll('.cds--menu-item').forEach(b => b.classList.remove('active'));

      extBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hasExternalAudio = true;
        this.video.muted = true;
        this.secondaryAudio.currentTime = this.video.currentTime;
        if (!this.video.paused) this.secondaryAudio.play().catch(e => console.warn(e));
        this.audioTracksList.querySelectorAll('.cds--menu-item').forEach(b => b.classList.remove('active'));
        extBtn.classList.add('active');
        if (this.audioTracksDropdownMenu) this.audioTracksDropdownMenu.classList.add('hidden');
      });

      this.audioTracksList.appendChild(extBtn);
    }
  }

  resetAudioTracks() {
    this.hasExternalAudio = false;
    if (this.secondaryAudio) {
      try { this.secondaryAudio.pause(); } catch(e) {}
      this.secondaryAudio.src = '';
    }
    this.video.muted = false;
    if (this.audioTracksList) {
      this.audioTracksList.innerHTML = '<button class="cds--menu-item active">Default Video Audio (Main)</button>';
    }
  }

  attachSubtitleTrack(url, label) {
    this.clearSubtitles();
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = label;
    track.srclang = 'en';
    track.src = url;
    track.default = true;
    this.video.appendChild(track);

    // Update subtitles menu
    this.updateSubtitlesMenu(label);
  }

  clearSubtitles() {
    const tracks = this.video.querySelectorAll('track');
    tracks.forEach(t => t.remove());
  }

  updateSubtitlesMenu(activeLabel) {
    const subItems = this.subtitlesDropdownMenu.querySelectorAll('.cds--menu-item:not(#btnSubUploadOption), .dropdown-item:not(#btnSubUploadOption)');
    subItems.forEach((item, idx) => {
      if (idx === 0 && !activeLabel) item.classList.add('active');
      else if (item.textContent.trim() === activeLabel) item.classList.add('active');
      else item.classList.remove('active');
    });
  }

  togglePlayPause(userInitiated = false) {
    if (this.isYouTube && this.ytPlayer) {
      if (typeof this.ytPlayer.getPlayerState === 'function') {
        const state = this.ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
          this.pause(userInitiated);
        } else {
          this.play(userInitiated);
        }
      }
      return;
    }

    if (this.video.paused) {
      this.play(userInitiated);
    } else {
      this.pause(userInitiated);
    }
  }

  play(userInitiated = false) {
    if (this.isYouTube && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      this.ytPlayer.playVideo();
      this.updatePlayPauseUI(true);
      if (userInitiated) {
        this.onUserPlay(this.ytPlayer.getCurrentTime());
      }
      return;
    }

    const playPromise = this.video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.updatePlayPauseUI(true);
        if (this.hasExternalAudio && this.secondaryAudio) {
          this.secondaryAudio.currentTime = this.video.currentTime;
          this.secondaryAudio.play().catch(e => console.warn(e));
        }
        if (userInitiated) {
          this.onUserPlay(this.video.currentTime);
        }
      }).catch(err => {
        console.warn('Playback prevented or waiting for interaction:', err);
      });
    }
  }

  pause(userInitiated = false) {
    if (this.isYouTube && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
      this.updatePlayPauseUI(false);
      if (userInitiated) {
        this.onUserPause(this.ytPlayer.getCurrentTime());
      }
      return;
    }

    this.video.pause();
    this.updatePlayPauseUI(false);
    if (this.hasExternalAudio && this.secondaryAudio) {
      this.secondaryAudio.pause();
    }
    if (userInitiated) {
      this.onUserPause(this.video.currentTime);
    }
  }

  seekTo(seconds, userInitiated = false) {
    if (this.isYouTube && this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      this.ytPlayer.seekTo(seconds, true);
      if (userInitiated) {
        this.onUserSeek(seconds, true);
      }
      return;
    }

    const safeTime = Math.max(0, Math.min(seconds, this.video.duration || seconds));
    this.video.currentTime = safeTime;
    if (this.hasExternalAudio && this.secondaryAudio) {
      this.secondaryAudio.currentTime = safeTime;
    }
    this.updateTimelineProgress();
    this.updateTimeDisplay();

    if (userInitiated) {
      this.onUserSeek(safeTime, !this.video.paused);
    }
  }

  seekRelative(deltaSeconds) {
    if (this.isYouTube && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
      const cur = this.ytPlayer.getCurrentTime() || 0;
      this.seekTo(cur + deltaSeconds, true);
      return;
    }

    const newTime = Math.max(0, Math.min((this.video.currentTime || 0) + deltaSeconds, this.video.duration || 0));
    this.seekTo(newTime, true);
  }

  setPlaybackRate(rate, userInitiated = false) {
    if (this.isYouTube && this.ytPlayer && typeof this.ytPlayer.setPlaybackRate === 'function') {
      this.ytPlayer.setPlaybackRate(rate);
    } else {
      this.video.playbackRate = rate;
      if (this.hasExternalAudio && this.secondaryAudio) {
        this.secondaryAudio.playbackRate = rate;
      }
    }

    if (this.currentSpeedLabel) {
      this.currentSpeedLabel.textContent = `${rate}x`;
    }
    if (userInitiated) {
      this.onUserRate(rate);
    }
  }

  setVolume(val) {
    if (this.isYouTube && this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      this.ytPlayer.setVolume(val * 100);
    } else if (this.hasExternalAudio && this.secondaryAudio) {
      this.secondaryAudio.volume = val;
      this.secondaryAudio.muted = (val === 0);
    } else {
      this.video.volume = val;
      this.video.muted = (val === 0);
    }
    this.volumeSlider.value = val;
    this.updateVolumeIcon();
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
    if (this.video.muted) {
      this.volumeSlider.value = 0;
    } else {
      this.volumeSlider.value = this.video.volume || 1;
    }
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    const isMuted = this.video.muted || this.video.volume === 0;
    this.iconVolHigh.classList.toggle('hidden', isMuted);
    this.iconVolMute.classList.toggle('hidden', !isMuted);
  }

  updatePlayPauseUI(isPlaying) {
    this.iconPlay.classList.toggle('hidden', isPlaying);
    this.iconPause.classList.toggle('hidden', !isPlaying);
  }

  showPlayCue(isPlaying) {
    if (!this.playStateCue) return;
    this.cuePlay.classList.toggle('hidden', !isPlaying);
    this.cuePause.classList.toggle('hidden', isPlaying);
    this.playStateCue.classList.remove('hidden');
    clearTimeout(this.cueTimeout);
    this.cueTimeout = setTimeout(() => {
      this.playStateCue.classList.add('hidden');
    }, 600);
  }

  updateTimelineProgress() {
    if (!this.video.duration) return;
    const percent = (this.video.currentTime / this.video.duration) * 100;
    this.timelineProgress.style.width = `${percent}%`;
    this.timelineThumb.style.left = `${percent}%`;
  }

  updateBufferProgress() {
    if (!this.video.duration || !this.video.buffered.length) return;
    const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
    const percent = (bufferedEnd / this.video.duration) * 100;
    this.timelineBuffer.style.width = `${percent}%`;
  }

  updateTimeDisplay() {
    const cur = this.formatTime(this.video.currentTime || 0);
    const dur = this.formatTime(this.video.duration || 0);
    this.timeCurrent.textContent = cur;
    this.timeDuration.textContent = dur;
  }

  formatTime(seconds) {
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);

    const pad = (n) => String(n).padStart(2, '0');

    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  }

  setSyncStatus(status, text) {
    if (!this.videoSyncStatus) return;
    const dot = this.videoSyncStatus.querySelector('.sync-dot');
    const label = this.videoSyncStatus.querySelector('.sync-text');

    dot.className = 'sync-dot ' + status;
    label.textContent = text;
  }
}

window.CinePlayer = CinePlayer;
