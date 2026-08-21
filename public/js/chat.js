/**
 * StreamHero - Chat Manager
 */

class ChatManager {
  constructor(options) {
    this.messagesContainer = document.getElementById('chatMessagesContainer');
    this.chatInput = document.getElementById('chatTextInput');
    this.chatForm = document.getElementById('chatInputForm');
    this.unreadDot = document.getElementById('chatUnreadDot');
    this.reactionsManager = options.reactionsManager;
    this.onSendMessage = options.onSendMessage || (() => {});

    this.isChatActive = true;
    this.unreadCount = 0;

    this.initEvents();
  }

  initEvents() {
    if (this.chatForm) {
      this.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.chatInput.value.trim();
        if (text) {
          this.onSendMessage(text);
          this.chatInput.value = '';
        }
      });
    }
  }

  setChatActive(active) {
    this.isChatActive = active;
    if (active) {
      this.unreadCount = 0;
      if (this.unreadDot) this.unreadDot.classList.add('hidden');
    }
  }

  addChatMessage(msg) {
    if (!this.messagesContainer) return;

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg-item';

    const avatarEl = document.createElement('div');
    avatarEl.className = 'chat-msg-avatar';
    avatarEl.textContent = msg.senderAvatar || '🍿';

    const bodyEl = document.createElement('div');
    bodyEl.className = 'chat-msg-body';

    const headerEl = document.createElement('div');
    headerEl.className = 'chat-msg-header';

    const nameEl = document.createElement('span');
    nameEl.className = 'chat-sender-name';
    nameEl.textContent = msg.senderName;

    headerEl.appendChild(nameEl);

    if (msg.isHost) {
      const hostBadge = document.createElement('span');
      hostBadge.className = 'chat-badge-host';
      hostBadge.textContent = 'HOST';
      headerEl.appendChild(hostBadge);
    }

    const timeEl = document.createElement('span');
    timeEl.className = 'chat-msg-time';
    timeEl.textContent = msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    headerEl.appendChild(timeEl);

    const textEl = document.createElement('div');
    textEl.className = 'chat-msg-text';
    textEl.textContent = msg.text;

    bodyEl.appendChild(headerEl);
    bodyEl.appendChild(textEl);

    msgEl.appendChild(avatarEl);
    msgEl.appendChild(bodyEl);

    this.messagesContainer.appendChild(msgEl);
    this.scrollToBottom();

    if (!this.isChatActive) {
      this.unreadCount++;
      if (this.unreadDot) this.unreadDot.classList.remove('hidden');
    }

    if (this.reactionsManager) {
      this.reactionsManager.playNotificationSound();
    }
  }

  addSystemMessage(text) {
    if (!this.messagesContainer || !text) return;

    const sysEl = document.createElement('div');
    sysEl.className = 'chat-system-msg';
    sysEl.textContent = text;

    this.messagesContainer.appendChild(sysEl);
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  clearChat() {
    if (this.messagesContainer) {
      const welcome = this.messagesContainer.querySelector('.chat-welcome-banner');
      this.messagesContainer.innerHTML = '';
      if (welcome) this.messagesContainer.appendChild(welcome);
    }
  }
}

window.ChatManager = ChatManager;
