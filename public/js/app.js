/**
 * StreamHero — Main Application Orchestrator (Carbon Design System)
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const lobbyView = document.getElementById('lobbyView');
  const theaterView = document.getElementById('theaterView');
  const navRoomControls = document.getElementById('navRoomControls');
  const navRoomCode = document.getElementById('navRoomCode');
  const roomCodeBadge = document.getElementById('roomCodeBadge');
  const networkIpDisplay = document.getElementById('networkIpDisplay');
  const toastContainer = document.getElementById('toastContainer');
  const lobbyBgCanvas = document.getElementById('lobbyBgCanvas');

  // Interactive Harmonic Aurora & Bioluminescent Mesh Background
  let bgAnimId = null;
  function initLobbyBackground() {
    if (!lobbyBgCanvas) return { start: () => {} };
    const ctx = lobbyBgCanvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 55;
    let mouse = { x: null, y: null, targetX: null, targetY: null, radius: 180 };
    let time = 0;

    function resize() {
      width = lobbyBgCanvas.width = window.innerWidth;
      height = lobbyBgCanvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.targetX = null;
      mouse.targetY = null;
    });

    class AuroraParticle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.baseRadius = Math.random() * 2.2 + 1.2;
        this.radius = this.baseRadius;
        this.pulseSpeed = Math.random() * 0.03 + 0.015;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.radius = this.baseRadius + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.8;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 2.2;
            this.y -= (dy / dist) * force * 2.2;
          }
        }
      }

      draw(isDark) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(60, 255, 209, 0.7)' : 'rgba(10, 115, 92, 0.5)';
        ctx.shadowColor = '#3cffd1';
        ctx.shadowBlur = isDark ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new AuroraParticle());
    }

    function drawAuroraWave(yBase, amplitude, wavelength, speed, color1, color2) {
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 15) {
        let mouseDisplacement = 0;
        if (mouse.x !== null) {
          const dist = Math.abs(x - mouse.x);
          if (dist < 220) {
            mouseDisplacement = Math.cos((dist / 220) * (Math.PI / 2)) * 35;
          }
        }

        const y = yBase + Math.sin((x / wavelength) + (time * speed)) * amplitude 
                + Math.cos((x / (wavelength * 0.6)) + (time * speed * 0.8)) * (amplitude * 0.4)
                - mouseDisplacement;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, yBase - amplitude, 0, height);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function animate() {
      if (lobbyView && lobbyView.classList.contains('hidden')) {
        bgAnimId = null;
        return;
      }

      time += 0.016;

      // Smooth mouse coordinate damping
      if (mouse.targetX !== null) {
        if (mouse.x === null) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      const isDark = document.body.classList.contains('cds--theme-g100');
      ctx.clearRect(0, 0, width, height);

      // Render 3 Harmonic Aurora Wave Layers
      if (isDark) {
        drawAuroraWave(height * 0.72, 45, 260, 0.45, 'rgba(60, 255, 209, 0.06)', 'rgba(15, 25, 22, 0.0)');
        drawAuroraWave(height * 0.78, 38, 200, 0.65, 'rgba(30, 200, 165, 0.08)', 'rgba(10, 20, 18, 0.0)');
        drawAuroraWave(height * 0.84, 30, 160, 0.85, 'rgba(60, 255, 209, 0.07)', 'rgba(5, 15, 12, 0.0)');
      } else {
        drawAuroraWave(height * 0.70, 40, 260, 0.45, 'rgba(60, 255, 209, 0.12)', 'rgba(244, 244, 244, 0.0)');
        drawAuroraWave(height * 0.76, 32, 200, 0.65, 'rgba(30, 180, 150, 0.10)', 'rgba(244, 244, 244, 0.0)');
        drawAuroraWave(height * 0.82, 26, 160, 0.85, 'rgba(60, 255, 209, 0.08)', 'rgba(244, 244, 244, 0.0)');
      }

      // Draw Interactive Particle Constellation Mesh
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(isDark);

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * (isDark ? 0.32 : 0.22);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark ? `rgba(60, 255, 209, ${alpha})` : `rgba(10, 120, 95, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Cursor light glow
      if (mouse.x !== null && mouse.y !== null) {
        const cursorGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 140);
        cursorGrad.addColorStop(0, isDark ? 'rgba(60, 255, 209, 0.16)' : 'rgba(60, 255, 209, 0.22)');
        cursorGrad.addColorStop(1, 'rgba(60, 255, 209, 0)');
        ctx.fillStyle = cursorGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 140, 0, Math.PI * 2);
        ctx.fill();
      }

      bgAnimId = requestAnimationFrame(animate);
    }

    animate();

    return {
      start: () => {
        if (!bgAnimId) animate();
      }
    };
  }

  const bgController = initLobbyBackground();

  // Lobby Elements
  const joinLobbyForm = document.getElementById('joinLobbyForm');
  const inputUserName = document.getElementById('inputUserName');
  const inputRoomCode = document.getElementById('inputRoomCode');
  const btnAvatarPicker = document.getElementById('btnAvatarPicker');
  const avatarSelectorGrid = document.getElementById('avatarSelectorGrid');

  // Modals & Navigation Buttons
  const modalShare = document.getElementById('modalShare');
  const btnShareParty = document.getElementById('btnShareParty');
  const btnCloseShareModal = document.getElementById('btnCloseShareModal');
  const qrCodeImage = document.getElementById('qrCodeImage');
  const inputShareUrl = document.getElementById('inputShareUrl');
  const btnCopyShareUrl = document.getElementById('btnCopyShareUrl');

  const modalUpload = document.getElementById('modalUpload');
  const btnUploadModalNav = document.getElementById('btnUploadModalNav');
  const btnUploadModalEmpty = document.getElementById('btnUploadModalEmpty');
  const btnCloseUploadModal = document.getElementById('btnCloseUploadModal');
  const btnCancelUpload = document.getElementById('btnCancelUpload');

  const uploadDropzone = document.getElementById('uploadDropzone');
  const btnBrowseFilesTrigger = document.getElementById('btnBrowseFilesTrigger');
  const videoFileInput = document.getElementById('videoFileInput');
  const selectedFileInfo = document.getElementById('selectedFileInfo');
  const selectedFileName = document.getElementById('selectedFileName');
  const selectedFileSize = document.getElementById('selectedFileSize');
  const btnRemoveSelectedFile = document.getElementById('btnRemoveSelectedFile');

  const subtitleFileInput = document.getElementById('subtitleFileInput');
  const btnBrowseSubtitles = document.getElementById('btnBrowseSubtitles');
  const subtitlesAttachedName = document.getElementById('subtitlesAttachedName');
  const subtitlesBtnText = document.getElementById('subtitlesBtnText');

  const uploadProgressWrap = document.getElementById('uploadProgressWrap');
  const uploadProgressBarFill = document.getElementById('uploadProgressBarFill');
  const uploadProgressPercent = document.getElementById('uploadProgressPercent');
  const btnStartUpload = document.getElementById('btnStartUpload');

  const modalLibrary = document.getElementById('modalLibrary');
  const btnVideoLibraryNav = document.getElementById('btnVideoLibraryNav');
  const btnBrowseLibraryEmpty = document.getElementById('btnBrowseLibraryEmpty');
  const btnCloseLibraryModal = document.getElementById('btnCloseLibraryModal');
  const btnCloseLibraryFooter = document.getElementById('btnCloseLibraryFooter');
  const libraryVideosGrid = document.getElementById('libraryVideosGrid');
  const btnOpenUploadFromLibrary = document.getElementById('btnOpenUploadFromLibrary');

  const btnLoadDemoVideo = document.getElementById('btnLoadDemoVideo');

  // Sidebar Elements
  const theaterSidebar = document.getElementById('theaterSidebar');
  const btnToggleSidebarMobile = document.getElementById('btnToggleSidebarMobile');
  const sidebarTabs = document.querySelectorAll('.cds--tab');
  const sidebarContents = document.querySelectorAll('.cds--tab-panel');
  const membersListContainer = document.getElementById('membersListContainer');
  const memberCountBadge = document.getElementById('memberCountBadge');
  const chkHostOnlyControls = document.getElementById('chkHostOnlyControls');
  const settingsLanUrlDisplay = document.getElementById('settingsLanUrlDisplay');
  const btnOpenQrFromSettings = document.getElementById('btnOpenQrFromSettings');
  const btnToggleSoundEffects = document.getElementById('btnToggleSoundEffects');
  const soundIcon = document.getElementById('soundIcon');

  // Reactions Quick Bar
  const reactionButtons = document.querySelectorAll('.cds--btn-rx');

  // State Variables
  let selectedAvatar = '🍿';
  let selectedVideoFile = null;
  let selectedSubtitleFile = null;
  let currentRoomId = 'MAIN';
  let lanNetworkUrl = '';

  // 1. Initialize Subsystems
  const reactions = new ReactionsManager('reactionsContainer');

  const chat = new ChatManager({
    reactionsManager: reactions,
    onSendMessage: (msg) => {
      sync.emitChat(msg);
    }
  });

  const player = new CinePlayer({
    onUserPlay: (time) => sync.emitPlay(time),
    onUserPause: (time) => sync.emitPause(time),
    onUserSeek: (time, wasPlaying) => sync.emitSeek(time, wasPlaying),
    onUserRate: (rate) => sync.emitRate(rate),
    onForceSync: () => sync.requestSync(true),
    onToggleSidebar: () => toggleSidebar()
  });

  const sync = new SyncEngine({
    onStateChange: (state, force) => {
      handleSyncState(state, force);
    },
    onVideoChange: (videoData) => {
      if (videoData.type === 'youtube') {
        player.loadYouTube(videoData.youtubeId, videoData.name);
      } else {
        player.loadVideo(videoData);
      }
    },
    onPlay: (targetTime) => {
      if (Math.abs(player.video.currentTime - targetTime) > 0.4) {
        player.seekTo(targetTime, false);
      }
      player.play(false);
    },
    onPause: (targetTime) => {
      player.seekTo(targetTime, false);
      player.pause(false);
    },
    onSeek: (targetTime, isPlaying) => {
      player.seekTo(targetTime, false);
      if (isPlaying) {
        player.play(false);
      } else {
        player.pause(false);
      }
    },
    onRateChange: (rate, currentTime) => {
      if (currentTime !== undefined) player.seekTo(currentTime, false);
      player.setPlaybackRate(rate, false);
    },
    onMembersUpdate: (members) => {
      renderMembersList(members);
    },
    onChatMessage: (chatItem) => {
      chat.addChatMessage(chatItem);
    },
    onReaction: (emoji, sender) => {
      reactions.spawnReaction(emoji);
    },
    onSystemMessage: (sysMsg) => {
      chat.addSystemMessage(sysMsg);
    },
    onSettingsChange: (roomState) => {
      if (chkHostOnlyControls) chkHostOnlyControls.checked = roomState.hostOnlyControls;
      applyHostControlRestrictions();
    },
    onError: (errMsg) => {
      showToast(errMsg, 'error');
    }
  });

  // Handle Playback Drift Synchronization
  function handleSyncState(state, force = false) {
    if (!player.video.src || isNaN(player.video.duration)) return;

    const currentDiff = Math.abs(player.video.currentTime - state.currentTime);

    if (force || currentDiff > sync.driftThresholdSeconds) {
      player.setSyncStatus('resyncing', 'Re-syncing...');
      player.seekTo(state.currentTime, false);
      if (state.isPlaying && player.video.paused) {
        player.play(false);
      } else if (!state.isPlaying && !player.video.paused) {
        player.pause(false);
      }
      setTimeout(() => player.setSyncStatus('in-sync', 'Synchronized'), 800);
    } else {
      player.setSyncStatus('in-sync', 'Synchronized');
    }

    if (player.video.playbackRate !== state.playbackRate) {
      player.setPlaybackRate(state.playbackRate, false);
    }
  }

  function applyHostControlRestrictions() {
    const isHost = sync.memberInfo?.isHost;
    const isRestricted = sync.roomState?.hostOnlyControls && !isHost;

    if (isRestricted) {
      player.setSyncStatus('in-sync', 'Host Controlled');
    }
  }

  // 2. Fetch Network Info & URL query params
  function loadNetworkInfo(roomId) {
    fetch(`/api/network-info?roomId=${encodeURIComponent(roomId)}`)
      .then(res => res.json())
      .then(data => {
        lanNetworkUrl = data.joinUrl;
        if (networkIpDisplay) networkIpDisplay.textContent = `LAN: ${data.primaryIp}:3000`;
        if (qrCodeImage) qrCodeImage.src = data.qrDataUrl;
        if (inputShareUrl) inputShareUrl.value = data.joinUrl;
        if (settingsLanUrlDisplay) settingsLanUrlDisplay.textContent = data.joinUrl;
      })
      .catch(err => {
        console.warn('Network info error:', err);
      });
  }

  // Check URL param ?room=
  const urlParams = new URLSearchParams(window.location.search);
  const paramRoom = urlParams.get('room');
  if (paramRoom) {
    inputRoomCode.value = paramRoom.toUpperCase();
    currentRoomId = paramRoom.toUpperCase();
  }

  loadNetworkInfo(currentRoomId);

  // 3. Avatar Picker Logic
  if (btnAvatarPicker) {
    btnAvatarPicker.addEventListener('click', () => {
      avatarSelectorGrid.classList.toggle('hidden');
    });
  }

  if (avatarSelectorGrid) {
    avatarSelectorGrid.querySelectorAll('.cds--avatar-cell').forEach(opt => {
      opt.addEventListener('click', () => {
        avatarSelectorGrid.querySelectorAll('.cds--avatar-cell').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedAvatar = opt.dataset.avatar;
        btnAvatarPicker.textContent = selectedAvatar;
        avatarSelectorGrid.classList.add('hidden');
      });
    });
  }

  // 4. Lobby Join Room Form
  if (joinLobbyForm) {
    joinLobbyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userName = inputUserName.value.trim() || 'Viewer';
      currentRoomId = (inputRoomCode.value.trim() || 'MAIN').toUpperCase();

      sync.joinRoom(currentRoomId, userName, selectedAvatar, (res) => {
        lobbyView.classList.add('hidden');
        theaterView.classList.remove('hidden');
        navRoomControls.classList.remove('hidden');
        navRoomCode.textContent = currentRoomId;

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('room', currentRoomId);
        window.history.pushState({}, '', newUrl);

        loadNetworkInfo(currentRoomId);

        if (res.roomState && res.roomState.video) {
          player.loadVideo(res.roomState.video);
          player.seekTo(res.roomState.playback.currentTime, false);
          if (res.roomState.playback.isPlaying) {
            player.play(false);
          }
        }

        showToast(`Joined party room ${currentRoomId}`, 'success');
      });
    });
  }

  // 5. Sidebar Tabs & Mobile Toggle
  sidebarTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      sidebarTabs.forEach(t => t.classList.remove('active'));
      sidebarContents.forEach(c => {
        c.classList.add('hidden');
        c.classList.remove('active');
      });

      tab.classList.add('active');
      const targetContent = document.getElementById(`tabContent${target.charAt(0).toUpperCase() + target.slice(1)}`);
      if (targetContent) {
        targetContent.classList.remove('hidden');
        targetContent.classList.add('active');
      }

      chat.setChatActive(target === 'chat');
    });
  });

  function toggleSidebar() {
    theaterSidebar.classList.toggle('hidden');
  }

  if (btnToggleSidebarMobile) {
    btnToggleSidebarMobile.addEventListener('click', toggleSidebar);
  }

  // 6. Member List Renderer
  function renderMembersList(members) {
    if (!membersListContainer) return;
    membersListContainer.innerHTML = '';
    if (memberCountBadge) memberCountBadge.textContent = members.length;

    members.forEach(member => {
      const item = document.createElement('div');
      item.className = 'member-item';

      const isMe = member.id === sync.memberInfo?.id;
      const isHost = member.isHost;

      item.innerHTML = `
        <div class="member-avatar">${member.avatar || '🍿'}</div>
        <div class="member-details">
          <div class="member-name-row">
            <span class="member-name">${member.name} ${isMe ? '(You)' : ''}</span>
            ${isHost ? '<span class="chat-badge-host">HOST</span>' : ''}
          </div>
          <span class="member-ping">● Connected</span>
        </div>
      `;

      if (sync.memberInfo?.isHost && !isMe) {
        const transferBtn = document.createElement('button');
        transferBtn.className = 'cds--btn cds--btn--secondary cds--btn--sm';
        transferBtn.title = 'Make Host';
        transferBtn.textContent = 'Make Host';
        transferBtn.addEventListener('click', () => {
          if (confirm(`Transfer host role to ${member.name}?`)) {
            sync.emitTransferHost(member.id);
          }
        });
        item.querySelector('.member-details').appendChild(transferBtn);
      }

      membersListContainer.appendChild(item);
    });
  }

  // 7. Reaction Buttons
  reactionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      if (emoji) {
        reactions.spawnReaction(emoji);
        sync.emitReaction(emoji);
      }
    });
  });

  // Sound Effects Toggle
  if (btnToggleSoundEffects) {
    btnToggleSoundEffects.addEventListener('click', () => {
      const isEnabled = reactions.toggleSound();
      soundIcon.textContent = isEnabled ? '🔊' : '🔇';
      showToast(isEnabled ? 'Audio FX Enabled' : 'Audio FX Muted', 'info');
    });
  }

  // Host Controls Checkbox
  if (chkHostOnlyControls) {
    chkHostOnlyControls.addEventListener('change', (e) => {
      if (!sync.memberInfo?.isHost) {
        e.target.checked = !e.target.checked;
        return showToast('Only the host can toggle host controls', 'error');
      }
      sync.emitToggleHostControls(e.target.checked);
    });
  }

  // 8. Share LAN Modal
  function openShareModal() {
    loadNetworkInfo(currentRoomId);
    if (modalShare) modalShare.classList.remove('hidden');
  }

  if (btnShareParty) btnShareParty.addEventListener('click', openShareModal);
  if (btnCloseShareModal) btnCloseShareModal.addEventListener('click', () => modalShare.classList.add('hidden'));
  if (btnOpenQrFromSettings) btnOpenQrFromSettings.addEventListener('click', openShareModal);
  if (roomCodeBadge) {
    roomCodeBadge.addEventListener('click', () => {
      copyToClipboard(lanNetworkUrl || window.location.href);
      showToast('Room link copied to clipboard', 'success');
    });
  }

  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', () => {
      copyToClipboard(inputShareUrl.value);
      showToast('Link copied! Share it on your Wi-Fi network', 'success');
    });
  }

  // 9. VIDEO UPLOAD HANDLING (Robust & Unblocked)
  function openUploadModal(autoTriggerPicker = false) {
    if (modalUpload) {
      modalUpload.classList.remove('hidden');
      resetUploadForm();
      if (autoTriggerPicker && videoFileInput) {
        setTimeout(() => videoFileInput.click(), 100);
      }
    }
  }

  if (btnUploadModalNav) {
    btnUploadModalNav.addEventListener('click', (e) => {
      e.stopPropagation();
      openUploadModal(false);
    });
  }

  if (btnUploadModalEmpty) {
    btnUploadModalEmpty.addEventListener('click', (e) => {
      e.stopPropagation();
      openUploadModal(true);
    });
  }

  if (btnCloseUploadModal) {
    btnCloseUploadModal.addEventListener('click', () => modalUpload.classList.add('hidden'));
  }
  if (btnCancelUpload) {
    btnCancelUpload.addEventListener('click', () => modalUpload.classList.add('hidden'));
  }

  // Dropzone click handlers
  if (uploadDropzone) {
    uploadDropzone.addEventListener('click', (e) => {
      if (videoFileInput) videoFileInput.click();
    });
  }

  if (btnBrowseFilesTrigger) {
    btnBrowseFilesTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (videoFileInput) videoFileInput.click();
    });
  }

  // File Input Change
  if (videoFileInput) {
    videoFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleSelectedVideo(e.target.files[0]);
      }
    });
  }

  // Drag and Drop on dropzone
  if (uploadDropzone) {
    uploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.add('dragover');
    });

    uploadDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.remove('dragover');
    });

    uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleSelectedVideo(e.dataTransfer.files[0]);
      }
    });
  }

  // Direct Drag & Drop onto the entire theater stage
  const theaterStage = document.getElementById('theaterStage');
  if (theaterStage) {
    theaterStage.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    theaterStage.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        openUploadModal(false);
        handleSelectedVideo(e.dataTransfer.files[0]);
      }
    });
  }

  function handleSelectedVideo(file) {
    selectedVideoFile = file;
    if (selectedFileName) selectedFileName.textContent = file.name;
    if (selectedFileSize) selectedFileSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    if (selectedFileInfo) selectedFileInfo.classList.remove('hidden');
    if (uploadDropzone) uploadDropzone.classList.add('hidden');
    if (btnStartUpload) btnStartUpload.removeAttribute('disabled');
  }

  if (btnRemoveSelectedFile) {
    btnRemoveSelectedFile.addEventListener('click', () => {
      resetUploadForm();
    });
  }

  function resetUploadForm() {
    selectedVideoFile = null;
    selectedSubtitleFile = null;
    if (videoFileInput) videoFileInput.value = '';
    if (subtitleFileInput) subtitleFileInput.value = '';
    if (selectedFileInfo) selectedFileInfo.classList.add('hidden');
    if (uploadDropzone) uploadDropzone.classList.remove('hidden');
    if (uploadProgressWrap) uploadProgressWrap.classList.add('hidden');
    if (uploadProgressBarFill) uploadProgressBarFill.style.width = '0%';
    if (subtitlesAttachedName) {
      subtitlesAttachedName.classList.add('hidden');
      subtitlesAttachedName.textContent = '';
    }
    if (subtitlesBtnText) subtitlesBtnText.textContent = '+ Attach Subtitle File';
    if (btnStartUpload) btnStartUpload.setAttribute('disabled', 'true');
  }

  // Subtitle File Handling
  if (btnBrowseSubtitles) {
    btnBrowseSubtitles.addEventListener('click', (e) => {
      e.stopPropagation();
      if (subtitleFileInput) subtitleFileInput.click();
    });
  }

  if (subtitleFileInput) {
    subtitleFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        selectedSubtitleFile = e.target.files[0];
        if (subtitlesAttachedName) {
          subtitlesAttachedName.textContent = selectedSubtitleFile.name;
          subtitlesAttachedName.classList.remove('hidden');
        }
        if (subtitlesBtnText) subtitlesBtnText.textContent = 'Change Subtitle';
      }
    });
  }

  // Start Video Upload with XMLHttpRequest Progress
  if (btnStartUpload) {
    btnStartUpload.addEventListener('click', () => {
      if (!selectedVideoFile) return;

      btnStartUpload.setAttribute('disabled', 'true');
      if (uploadProgressWrap) uploadProgressWrap.classList.remove('hidden');

      const formData = new FormData();
      formData.append('video', selectedVideoFile);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          if (uploadProgressBarFill) uploadProgressBarFill.style.width = `${percent}%`;
          if (uploadProgressPercent) uploadProgressPercent.textContent = `${percent}%`;
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          let subtitleUrl = null;
          let subtitleLabel = null;

          if (selectedSubtitleFile) {
            try {
              const subFormData = new FormData();
              subFormData.append('subtitles', selectedSubtitleFile);
              const subRes = await fetch('/api/upload-subtitles', { method: 'POST', body: subFormData });
              const subJson = await subRes.json();
              if (subJson.success) {
                subtitleUrl = subJson.subtitleUrl;
                subtitleLabel = subJson.label;
              }
            } catch (e) {
              console.warn('Subtitle upload failed:', e);
            }
          }

          const videoPayload = {
            url: result.file.streamUrl,
            name: result.file.originalName,
            size: result.file.size,
            formattedSize: result.file.formattedSize,
            subtitleUrl,
            subtitleLabel
          };

          sync.emitSetVideo(videoPayload);
          if (modalUpload) modalUpload.classList.add('hidden');
          showToast('Video uploaded and streaming to room', 'success');
        } else {
          showToast('Upload failed. Check server logs.', 'error');
          btnStartUpload.removeAttribute('disabled');
        }
      };

      xhr.onerror = () => {
        showToast('Network error during upload', 'error');
        btnStartUpload.removeAttribute('disabled');
      };

      xhr.send(formData);
    });
  }

  // Theme Toggle (Light / Dark Mode)
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const btnHome = document.getElementById('btnHome');

  function initTheme() {
    const savedTheme = localStorage.getItem('streamhero_theme') || 'light';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.remove('cds--theme-white');
      document.body.classList.add('cds--theme-g100');
      if (themeToggleIcon) themeToggleIcon.textContent = '☀️';
      localStorage.setItem('streamhero_theme', 'dark');
    } else {
      document.body.classList.remove('cds--theme-g100');
      document.body.classList.add('cds--theme-white');
      if (themeToggleIcon) themeToggleIcon.textContent = '🌙';
      localStorage.setItem('streamhero_theme', 'light');
    }
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('cds--theme-g100');
      applyTheme(isDark ? 'light' : 'dark');
      showToast(isDark ? 'Switched to Light Theme' : 'Switched to Dark Theme', 'info');
    });
  }

  initTheme();

  // Home Button (Leave Room & Return to Lobby)
  if (btnHome) {
    btnHome.addEventListener('click', () => {
      if (confirm('Leave current watch party and return to home?')) {
        player.pause(false);
        theaterView.classList.add('hidden');
        lobbyView.classList.remove('hidden');
        navRoomControls.classList.add('hidden');

        // Clear query param
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.pushState({}, '', url.pathname);

        if (bgController) bgController.start();
        showToast('Returned to home lobby', 'info');
      }
    });
  }

  // 10. Video Library Modal & Video Deletion
  function openLibraryModal() {
    if (modalLibrary) {
      modalLibrary.classList.remove('hidden');
      loadLibraryVideos();
    }
  }

  if (btnVideoLibraryNav) btnVideoLibraryNav.addEventListener('click', openLibraryModal);
  if (btnBrowseLibraryEmpty) btnBrowseLibraryEmpty.addEventListener('click', openLibraryModal);
  if (btnCloseLibraryModal) btnCloseLibraryModal.addEventListener('click', () => modalLibrary.classList.add('hidden'));
  if (btnCloseLibraryFooter) btnCloseLibraryFooter.addEventListener('click', () => modalLibrary.classList.add('hidden'));
  if (btnOpenUploadFromLibrary) {
    btnOpenUploadFromLibrary.addEventListener('click', () => {
      modalLibrary.classList.add('hidden');
      openUploadModal(false);
    });
  }

  function loadLibraryVideos() {
    if (!libraryVideosGrid) return;
    libraryVideosGrid.innerHTML = '<div class="cds--library-loading">Loading uploaded files...</div>';

    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        if (!data.files || data.files.length === 0) {
          libraryVideosGrid.innerHTML = '<div class="cds--body-02">No videos uploaded yet. Upload your first video.</div>';
          return;
        }

        libraryVideosGrid.innerHTML = '';
        data.files.forEach(file => {
          const card = document.createElement('div');
          card.className = 'library-item-card';
          card.innerHTML = `
            <div>
              <div class="library-item-title" title="${file.originalName}">🎬 ${file.originalName}</div>
              <div class="library-item-meta cds--font-mono">
                <span>${file.formattedSize}</span>
                <span>${new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="library-card-actions">
              <button class="cds--btn cds--btn--primary cds--btn--sm btn-lib-play">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2.5v11l9-5.5-9-5.5z"/>
                </svg>
                <span>Play in Room</span>
              </button>
              <button class="cds--btn cds--btn--tertiary cds--btn--sm btn-lib-delete" title="Delete video">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
                <span>Delete</span>
              </button>
            </div>
          `;

          // Play button action
          card.querySelector('.btn-lib-play').addEventListener('click', (e) => {
            e.stopPropagation();
            sync.emitSetVideo({
              url: file.streamUrl,
              name: file.originalName,
              size: file.size,
              formattedSize: file.formattedSize
            });
            modalLibrary.classList.add('hidden');
            showToast(`Now playing: ${file.originalName}`, 'success');
          });

          // Delete button action
          card.querySelector('.btn-lib-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${file.originalName}" from the server?`)) {
              try {
                const res = await fetch(`/api/videos/${encodeURIComponent(file.filename)}`, {
                  method: 'DELETE'
                });
                const resJson = await res.json();
                if (resJson.success) {
                  showToast('Video deleted from library', 'success');
                  loadLibraryVideos(); // Refresh grid
                } else {
                  showToast(resJson.error || 'Failed to delete video', 'error');
                }
              } catch (err) {
                showToast('Network error while deleting video', 'error');
              }
            }
          });

          libraryVideosGrid.appendChild(card);
        });
      })
      .catch(err => {
        libraryVideosGrid.innerHTML = '<div class="cds--body-02">Failed to load video library</div>';
      });
  }

  // 11. Sample Demo Video Loader
  if (btnLoadDemoVideo) {
    btnLoadDemoVideo.addEventListener('click', () => {
      const demoVideoData = {
        url: '/stream/demo-sample-party.mp4',
        name: 'Big Buck Bunny (Party Demo Clip)',
        size: 4139823,
        formattedSize: '4.14 MB',
        subtitleUrl: '/uploads/subtitles/demo-sample-party.vtt',
        subtitleLabel: 'English Subtitles'
      };

      sync.emitSetVideo(demoVideoData);
      showToast('Loaded local demo video & subtitles', 'success');
    });
  }

  // 12. YouTube Stream Modal & Handler
  const modalYouTube = document.getElementById('modalYouTube');
  const btnYouTubeModalNav = document.getElementById('btnYouTubeModalNav');
  const btnYouTubeModalEmpty = document.getElementById('btnYouTubeModalEmpty');
  const btnCloseYouTubeModal = document.getElementById('btnCloseYouTubeModal');
  const btnCancelYouTube = document.getElementById('btnCancelYouTube');
  const inputYouTubeUrl = document.getElementById('inputYouTubeUrl');
  const youTubePreviewWrap = document.getElementById('youTubePreviewWrap');
  const youTubeThumbnail = document.getElementById('youTubeThumbnail');
  const youTubePreviewTitle = document.getElementById('youTubePreviewTitle');
  const btnStartYouTube = document.getElementById('btnStartYouTube');

  function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function openYouTubeModal() {
    if (modalYouTube) {
      modalYouTube.classList.remove('hidden');
      if (inputYouTubeUrl) {
        inputYouTubeUrl.value = '';
        inputYouTubeUrl.focus();
      }
      if (youTubePreviewWrap) youTubePreviewWrap.classList.add('hidden');
    }
  }

  if (btnYouTubeModalNav) btnYouTubeModalNav.addEventListener('click', openYouTubeModal);
  if (btnYouTubeModalEmpty) btnYouTubeModalEmpty.addEventListener('click', openYouTubeModal);
  if (btnCloseYouTubeModal) btnCloseYouTubeModal.addEventListener('click', () => modalYouTube.classList.add('hidden'));
  if (btnCancelYouTube) btnCancelYouTube.addEventListener('click', () => modalYouTube.classList.add('hidden'));

  if (inputYouTubeUrl) {
    inputYouTubeUrl.addEventListener('input', () => {
      const ytId = extractYouTubeId(inputYouTubeUrl.value.trim());
      if (ytId) {
        if (youTubeThumbnail) youTubeThumbnail.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        if (youTubePreviewTitle) youTubePreviewTitle.textContent = `YouTube Video ID: ${ytId}`;
        if (youTubePreviewWrap) youTubePreviewWrap.classList.remove('hidden');
      } else {
        if (youTubePreviewWrap) youTubePreviewWrap.classList.add('hidden');
      }
    });
  }

  if (btnStartYouTube) {
    btnStartYouTube.addEventListener('click', () => {
      const url = inputYouTubeUrl.value.trim();
      const ytId = extractYouTubeId(url);
      if (!ytId) {
        showToast('Please enter a valid YouTube video URL', 'error');
        return;
      }

      const payload = {
        type: 'youtube',
        youtubeId: ytId,
        name: `YouTube Stream (${ytId})`,
        url: `https://www.youtube.com/watch?v=${ytId}`
      };

      sync.emitSetVideo(payload);
      modalYouTube.classList.add('hidden');
      showToast('Streaming YouTube video to watch party', 'success');
    });
  }

  // Helper: Copy to Clipboard
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  // Helper: Show Toast Notification
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }
});
