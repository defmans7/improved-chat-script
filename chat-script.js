// Chat Widget Script
(function() {
  // Utility: Merge configs deeply
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // Utility: Create element with classes and attributes
  function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.attrs) {
      Object.entries(options.attrs).forEach(([k, v]) => el.setAttribute(k, v));
    }
    if (options.html) el.innerHTML = options.html;
    return el;
  }

  // Inject font and styles only once
  function injectFontAndStyles(styles) {
    if (!document.getElementById('n8n-chat-font')) {
      const fontLink = createElement('link', {
        attrs: {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css',
          id: 'n8n-chat-font'
        }
      });
      document.head.appendChild(fontLink);
    }
    if (!document.getElementById('n8n-chat-style')) {
      const styleSheet = createElement('style', {
        attrs: { id: 'n8n-chat-style' },
        html: styles
      });
      document.head.appendChild(styleSheet);
    }
  }

  const styles = `
        .n8n-chat-widget {
            --chat--color-primary: var(--n8n-chat-primary-color, #854fff);
            --chat--color-secondary: var(--n8n-chat-secondary-color, #6b3fd4);
            --chat--color-background: var(--n8n-chat-background-color, #ffffff);
            --chat--color-font: var(--n8n-chat-font-color, #333333);
            font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .n8n-chat-widget .chat-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: none;
            width: 380px;
            height: 600px;
            background: var(--chat--color-background);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(133, 79, 255, 0.15);
            border: 1px solid rgba(133, 79, 255, 0.2);
            overflow: hidden;
            font-family: inherit;
        }

        .n8n-chat-widget .chat-container.position-left {
            right: auto;
            left: 20px;
        }

        .n8n-chat-widget .chat-container.open {
            display: flex;
            flex-direction: column;
        }

        .n8n-chat-widget .brand-header {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(133, 79, 255, 0.1);
            position: relative;
        }

        .n8n-chat-widget .close-button {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--chat--color-font);
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
            font-size: 20px;
            opacity: 0.6;
        }

        .n8n-chat-widget .close-button:hover {
            opacity: 1;
        }

        .n8n-chat-widget .brand-header img {
            width: 32px;
            height: 32px;
        }

        .n8n-chat-widget .brand-header span {
            font-size: 18px;
            font-weight: 500;
            color: var(--chat--color-font);
        }

        .n8n-chat-widget .new-conversation {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            text-align: center;
            width: 100%;
            max-width: 300px;
        }

        .n8n-chat-widget .welcome-text {
            font-size: 24px;
            font-weight: 600;
            color: var(--chat--color-font);
            margin-bottom: 24px;
            line-height: 1.3;
        }

        .n8n-chat-widget .new-chat-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 16px 24px;
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.3s;
            font-weight: 500;
            font-family: inherit;
            margin-bottom: 12px;
        }

        .n8n-chat-widget .new-chat-btn:hover {
            transform: scale(1.02);
        }

        .n8n-chat-widget .message-icon {
            width: 20px;
            height: 20px;
        }

        .n8n-chat-widget .response-text {
            font-size: 14px;
            color: var(--chat--color-font);
            opacity: 0.7;
            margin: 0;
        }

        .n8n-chat-widget .chat-interface {
            display: none;
            flex-direction: column;
            height: 100%;
        }

        .n8n-chat-widget .chat-interface.active {
            display: flex;
        }

        .n8n-chat-widget .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: var(--chat--color-background);
            display: flex;
            flex-direction: column;
        }

        .n8n-chat-widget .chat-message {
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 12px;
            max-width: 80%;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.5;
        }

        .n8n-chat-widget .chat-message.user {
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            align-self: flex-end;
            box-shadow: 0 4px 12px rgba(133, 79, 255, 0.2);
            border: none;
        }

        .n8n-chat-widget .chat-message.bot {
            background: var(--chat--color-background);
            border: 1px solid rgba(133, 79, 255, 0.2);
            color: var(--chat--color-font);
            align-self: flex-start;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .n8n-chat-widget .chat-input {
            padding: 16px;
            background: var(--chat--color-background);
            border-top: 1px solid rgba(133, 79, 255, 0.1);
            display: flex;
            gap: 8px;
        }

        .n8n-chat-widget .chat-input textarea {
            flex: 1;
            padding: 12px;
            border: 1px solid rgba(133, 79, 255, 0.2);
            border-radius: 8px;
            background: var(--chat--color-background);
            color: var(--chat--color-font);
            resize: none;
            font-family: inherit;
            font-size: 14px;
        }

        .n8n-chat-widget .chat-input textarea::placeholder {
            color: var(--chat--color-font);
            opacity: 0.6;
        }

        .n8n-chat-widget .chat-input button {
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0 20px;
            cursor: pointer;
            transition: transform 0.2s;
            font-family: inherit;
            font-weight: 500;
        }

        .n8n-chat-widget .chat-input button:hover {
            transform: scale(1.05);
        }

        .n8n-chat-widget .chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(133, 79, 255, 0.3);
            z-index: 999;
            transition: transform 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .n8n-chat-widget .chat-toggle.position-left {
            right: auto;
            left: 20px;
        }

        .n8n-chat-widget .chat-toggle:hover {
            transform: scale(1.05);
        }

        .n8n-chat-widget .chat-toggle svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }

        .n8n-chat-widget .chat-footer {
            padding: 8px;
            text-align: center;
            background: var(--chat--color-background);
            border-top: 1px solid rgba(133, 79, 255, 0.1);
        }

        .n8n-chat-widget .chat-footer a {
            color: var(--chat--color-primary);
            text-decoration: none;
            font-size: 12px;
            opacity: 0.8;
            transition: opacity 0.2s;
            font-family: inherit;
        }

        .n8n-chat-widget .chat-footer a:hover {
            opacity: 1;
        }
    `;

  injectFontAndStyles(styles + `
    .thinking-indicator .dots {
      display: inline-block;
      font-size: 20px;
      letter-spacing: 2px;
    }
    .thinking-indicator .dots span {
      display: inline-block;
      animation: wave 1s infinite;
      transform-origin: bottom center;
    }
    .thinking-indicator .dots span:nth-child(1) {
      animation-delay: 0s;
    }
    .thinking-indicator .dots span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .thinking-indicator .dots span:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes wave {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }
    .thinking-word {
      font-style: italic;
      color: #854fff;
      opacity: 0.8;
      font-size: 16px;
      margin-bottom: 0;
      margin-top: 0;
      align-self: flex-start;
      background: none;
      border: none;
      box-shadow: none;
    }
  `);

  // Default configuration
  const defaultConfig = {
    webhook: {
      url: '',
      route: ''
    },
    branding: {
      logo: '',
      name: '',
      welcomeText: '',
      responseTimeText: '',
      poweredBy: {
        text: 'Powered by n8n',
        link: 'https://n8n.partnerlinks.io/m8a94i19zhqq?utm_source=nocodecreative.io'
      }
    },
    style: {
      primaryColor: '#854fff',
      secondaryColor: '#6b3fd4',
      position: 'right',
      backgroundColor: '#ffffff',
      fontColor: '#333333'
    },
    // New behavior configuration
    behavior: {
      // Auto-open the chat widget after N seconds (0 disables)
      autoOpenDelaySeconds: 0,
      // If set to a non-empty string (e.g. 'support'), auto-open only when location.hash matches (#support)
      // Set to false or '' to disable hash-based opening. Legacy value true means open on ANY non-empty hash.
      openOnHash: ''
    }
  };

  // Default thinking words
  const defaultThinkingWords = [
    "hmmm...",
    "ah!",
    "HA!",
    "an interesting point...",
    "let's see...",
    "good question...",
    "one moment...",
    "uno momento...",
    "... calculating the 314159th digit of Pi ...",
    "pondering...",
    "considering...",
    ".. oh wait...",
    "processing...",
    "let me think...",
    "aha!",
    "mmmh...",
    "interesting...",
    "fascinating...",
    "curious...",
    "intriguing...",
    "just a sec!",
    "🤔",
    "calculating...",
    "hocus pocus..."
  ];

  // Merge user config with defaults
  const config = window.ChatWidgetConfig ? deepMerge(JSON.parse(JSON.stringify(defaultConfig)), window.ChatWidgetConfig) : defaultConfig;
  config.thinkingWords = config.thinkingWords || defaultThinkingWords;
  // Safety defaults if user provided partial behavior object
  if (!config.behavior) config.behavior = {};
  if (typeof config.behavior.autoOpenDelaySeconds !== 'number') config.behavior.autoOpenDelaySeconds = 0;
  if (typeof config.behavior.openOnHash === 'undefined' || config.behavior.openOnHash === true) {
    // Keep legacy true meaning open on any hash; default now is '' meaning disabled
    config.behavior.openOnHash = config.behavior.openOnHash === true ? true : '';
  }

  // Prevent multiple initializations
  if (window.N8NChatWidgetInitialized) return;
  window.N8NChatWidgetInitialized = true;

  let currentSessionId = '';

  // Create widget container
  const widgetContainer = createElement('div', { className: 'n8n-chat-widget' });

  // Set CSS variables for colors
  Object.entries({
    '--n8n-chat-primary-color': config.style.primaryColor,
    '--n8n-chat-secondary-color': config.style.secondaryColor,
    '--n8n-chat-background-color': config.style.backgroundColor,
    '--n8n-chat-font-color': config.style.fontColor
  }).forEach(([k, v]) => widgetContainer.style.setProperty(k, v));

  const chatContainer = createElement('div', {
    className: `chat-container${config.style.position === 'left' ? ' position-left' : ''}`
  });

  const newConversationHTML = `
        <div class="brand-header">
            <img src="${config.branding.logo}" alt="${config.branding.name}">
            <span>${config.branding.name}</span>
            <button class="close-button" aria-label="Close chat" tabindex="0">×</button>
        </div>
        <div class="new-conversation">
            <h2 class="welcome-text">${config.branding.welcomeText}</h2>
            <button class="new-chat-btn" aria-label="Start new chat" tabindex="0">
                <svg class="message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
                </svg>
                Send us a message
            </button>
            <p class="response-text">${config.branding.responseTimeText}</p>
        </div>
    `;

  const chatInterfaceHTML = `
        <div class="chat-interface" aria-live="polite">
            <div class="brand-header">
                <img src="${config.branding.logo}" alt="${config.branding.name}">
                <span>${config.branding.name}</span>
                <button class="close-button" aria-label="Close chat" tabindex="0">×</button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Type your message here..." rows="1" aria-label="Chat input" tabindex="0"></textarea>
                <button type="submit" aria-label="Send message" tabindex="0">Send</button>
            </div>
            <div class="chat-footer">
                <a href="${config.branding.poweredBy.link}" target="_blank">${config.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

  chatContainer.innerHTML = newConversationHTML + chatInterfaceHTML;

  const toggleButton = createElement('button', {
    className: `chat-toggle${config.style.position === 'left' ? ' position-left' : ''}`,
    html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.476 0-2.886-.313-4.156-.878l-3.156.586.586-3.156A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
        </svg>`
  });

  widgetContainer.appendChild(chatContainer);
  widgetContainer.appendChild(toggleButton);
  document.body.appendChild(widgetContainer);

  // DOM refs
  const newChatBtn = chatContainer.querySelector('.new-chat-btn');
  const chatInterface = chatContainer.querySelector('.chat-interface');
  const messagesContainer = chatContainer.querySelector('.chat-messages');
  const textarea = chatContainer.querySelector('textarea');
  const sendButton = chatContainer.querySelector('button[type="submit"]');
  const closeButtons = chatContainer.querySelectorAll('.close-button');

  // Accessibility: Focus management
  function focusInput() {
    textarea.focus();
  }

  // Helper: Open chat programmatically (idempotent)
  function openChat() {
    if (!chatContainer.classList.contains('open')) {
      chatContainer.classList.add('open');
      focusInput();
    }
  }

  // Utility: Generate UUID
  function generateUUID() {
    return (crypto && crypto.randomUUID) ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }

  // Utility: Get page info and useful metadata
  function getPageInfo() {
    const now = new Date();
    return {
      pageUrl: window.location.href,
      pageTitle: document.title,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: now.toISOString(),
      date: now.toISOString().slice(0, 10)
    };
  }

  // Show error message in chat
  function showError(message) {
    const errorDiv = createElement('div', { className: 'chat-message bot', html: `<span style='color:red;'>${message}</span>` });
    messagesContainer.appendChild(errorDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show/hide thinking indicator with two random thinking words and random timing
  let thinkingDotsDiv = null;
  let thinkingWordDiv1 = null;
  let thinkingWordDiv2 = null;
  let thinkingDotsTimeout = null;
  let thinkingWordTimeout1 = null;
  let thinkingWordTimeout2 = null;

  function getRandomDelay(min = 1500, max = 3000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getTwoDistinctWords(words) {
    if (words.length < 2) return [words[0], words[0]];
    const idx1 = Math.floor(Math.random() * words.length);
    let idx2;
    do {
      idx2 = Math.floor(Math.random() * words.length);
    } while (idx2 === idx1);
    return [words[idx1], words[idx2]];
  }

  function showThinkingIndicator() {
    hideThinkingIndicator(); // Clean up any previous indicators
    // Step 1: Show dots immediately
    thinkingDotsDiv = createElement('div', {
      className: 'chat-message bot thinking-indicator',
      html: `<span class="dots" aria-label="Bot is thinking" role="status"><span>.</span><span>.</span><span>.</span></span>`
    });
    messagesContainer.appendChild(thinkingDotsDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    // Step 2: After random delay, show first random word
    const [word1, word2] = getTwoDistinctWords(config.thinkingWords);
    const delay1 = getRandomDelay();
    thinkingDotsTimeout = setTimeout(() => {
      if (thinkingDotsDiv) {
        thinkingDotsDiv.remove();
        thinkingDotsDiv = null;
      }
      thinkingWordDiv1 = createElement('div', {
        className: 'chat-message bot thinking-word',
        html: `<span aria-label="Bot is thinking" role="status">${word1}</span>`
      });
      messagesContainer.appendChild(thinkingWordDiv1);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      // Step 3: After another random delay, show second random word
      const delay2 = getRandomDelay();
      thinkingWordTimeout1 = setTimeout(() => {
        if (thinkingWordDiv1) {
          thinkingWordDiv1.remove();
          thinkingWordDiv1 = null;
        }
        thinkingWordDiv2 = createElement('div', {
          className: 'chat-message bot thinking-word',
          html: `<span aria-label="Bot is thinking" role="status">${word2}</span>`
        });
        messagesContainer.appendChild(thinkingWordDiv2);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        // Step 4: After another random delay, switch back to dots
        thinkingWordTimeout2 = setTimeout(() => {
          if (thinkingWordDiv2) {
            thinkingWordDiv2.remove();
            thinkingWordDiv2 = null;
          }
          thinkingDotsDiv = createElement('div', {
            className: 'chat-message bot thinking-indicator',
            html: `<span class="dots" aria-label="Bot is thinking" role="status"><span>.</span><span>.</span><span>.</span></span>`
          });
          messagesContainer.appendChild(thinkingDotsDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, getRandomDelay());
      }, delay2);
    }, delay1);
  }

  function hideThinkingIndicator() {
    if (thinkingDotsTimeout) {
      clearTimeout(thinkingDotsTimeout);
      thinkingDotsTimeout = null;
    }
    if (thinkingWordTimeout1) {
      clearTimeout(thinkingWordTimeout1);
      thinkingWordTimeout1 = null;
    }
    if (thinkingWordTimeout2) {
      clearTimeout(thinkingWordTimeout2);
      thinkingWordTimeout2 = null;
    }
    if (thinkingDotsDiv) {
      thinkingDotsDiv.remove();
      thinkingDotsDiv = null;
    }
    if (thinkingWordDiv1) {
      thinkingWordDiv1.remove();
      thinkingWordDiv1 = null;
    }
    if (thinkingWordDiv2) {
      thinkingWordDiv2.remove();
      thinkingWordDiv2 = null;
    }
    // Also remove any stray indicators
    const strayDots = messagesContainer.querySelector('.thinking-indicator');
    if (strayDots) strayDots.remove();
    const strayWord = messagesContainer.querySelectorAll('.thinking-word');
    strayWord.forEach(w => w.remove());
  }

  // Utility: Format URLs in text as clickable links
  function formatUrls(text) {
    // Regex matches http(s)://, www., and bare domains
    const urlRegex = /((https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+(:\d+)?(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?)/gi;
    return text.replace(urlRegex, function(url) {
      let href = url;
      if (!href.match(/^https?:\/\//)) {
        href = 'https://' + href;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }

  // Start new conversation
  async function startNewConversation() {
    currentSessionId = generateUUID();
    const data = [{
      action: "loadPreviousSession",
      sessionId: currentSessionId,
      route: config.webhook.route,
      metadata: {
        userId: "",
        ...getPageInfo()
      }
    }];
    try {
      const response = await fetch(config.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Network error');
      const responseData = await response.json();
      chatContainer.querySelector('.brand-header').style.display = 'none';
      chatContainer.querySelector('.new-conversation').style.display = 'none';
      chatInterface.classList.add('active');
      const botMessageDiv = createElement('div', {
        className: 'chat-message bot',
        html: formatUrls(Array.isArray(responseData) ? responseData[0].output : responseData.output)
      });
      messagesContainer.appendChild(botMessageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      focusInput();
    } catch (error) {
      showError('Failed to start conversation. Please try again.');
      console.error('Error:', error);
    }
  }

  // Send message
  async function sendMessage(message) {
    if (!message) return;
    const messageData = {
      action: "sendMessage",
      sessionId: currentSessionId,
      route: config.webhook.route,
      chatInput: message,
      metadata: {
        userId: "",
        ...getPageInfo()
      }
    };
    const userMessageDiv = createElement('div', { className: 'chat-message user', html: message });
    messagesContainer.appendChild(userMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    showThinkingIndicator();
    try {
      const response = await fetch(config.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      hideThinkingIndicator();
      const botMessageDiv = createElement('div', {
        className: 'chat-message bot',
        html: formatUrls(Array.isArray(data) ? data[0].output : data.output)
      });
      messagesContainer.appendChild(botMessageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      focusInput();
    } catch (error) {
      hideThinkingIndicator();
      showError('Failed to send message. Please try again.');
      console.error('Error:', error);
    }
  }

  // Event listeners
  newChatBtn.addEventListener('click', startNewConversation);
  sendButton.addEventListener('click', () => {
    const message = textarea.value.trim();
    if (message) {
      sendMessage(message);
      textarea.value = '';
    }
  });
  textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = textarea.value.trim();
      if (message) {
        sendMessage(message);
        textarea.value = '';
      }
    }
  });
  toggleButton.addEventListener('click', () => {
    chatContainer.classList.toggle('open');
    if (chatContainer.classList.contains('open')) focusInput();
  });
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      chatContainer.classList.remove('open');
    });
  });

  // Auto-open logic
  // Hash-based opening logic (string match or legacy true)
  const openOnHashSetting = config.behavior.openOnHash;
  if (!chatContainer.classList.contains('open')) {
    if (typeof openOnHashSetting === 'string' && openOnHashSetting.trim() !== '') {
      const target = openOnHashSetting.replace(/^#/, '').trim();
      const current = window.location.hash.replace(/^#/, '').trim();
      if (current && current === target) {
        openChat();
      }
    } else if (openOnHashSetting === true) {
      // Legacy behavior: any hash triggers
      if (window.location.hash && window.location.hash.length > 1) {
        openChat();
      }
    }
  }
  // Timed auto-open (only if still not open)
  if (!chatContainer.classList.contains('open') && config.behavior.autoOpenDelaySeconds > 0) {
    setTimeout(() => {
      if (!chatContainer.classList.contains('open')) {
        openChat();
      }
    }, config.behavior.autoOpenDelaySeconds * 1000);
  }

  // Accessibility: ESC closes chat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatContainer.classList.contains('open')) {
      chatContainer.classList.remove('open');
      toggleButton.focus();
    }
  });
})();
