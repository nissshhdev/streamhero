/**
 * StreamHero - Reactions Engine
 */

class ReactionsManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.audioCtx = null;
    this.soundEnabled = true;

    // Web Audio synthesizer for reaction pops
    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  playPopSound(freq = 440) {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.16);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  playNotificationSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  toggleSound(enable) {
    this.soundEnabled = enable !== undefined ? enable : !this.soundEnabled;
    return this.soundEnabled;
  }

  spawnReaction(emoji) {
    if (!this.container) return;

    // Spawn 1 to 3 staggered emoji particles for richer burst feel
    const count = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'reaction-particle';
        el.textContent = emoji;

        // Random horizontal start (20% to 80% of width)
        const startX = 15 + Math.random() * 70;
        const driftX = (Math.random() - 0.5) * 160;
        const rotStart = (Math.random() - 0.5) * 40;
        const rotEnd = (Math.random() - 0.5) * 90;

        el.style.left = `${startX}%`;
        el.style.setProperty('--drift-x', `${driftX}px`);
        el.style.setProperty('--rot-deg', `${rotStart}deg`);
        el.style.setProperty('--rot-deg-end', `${rotEnd}deg`);

        this.container.appendChild(el);

        // Remove element after animation ends
        setTimeout(() => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 3300);
      }, i * 120);
    }

    // Play pitch-varied pop sound
    const pitchMap = {
      '🍿': 520,
      '❤️': 600,
      '😂': 660,
      '🔥': 750,
      '👏': 480,
      '😱': 850,
      '🎉': 900
    };
    this.playPopSound(pitchMap[emoji] || 500);
  }
}

window.ReactionsManager = ReactionsManager;
