import { GoogleGenerativeAI } from "https://sdk.gemini.ai/v1.5/gemini-web.js";

document.addEventListener('DOMContentLoaded', () => {
    const i18n = {
        en: {
            apiKeyLabel: '🔑 API Key',
            apiKeyPlaceholder: 'Enter your Google AI API Key',
            getApiKeyBtn: 'Get a free API key (1 min)',
            themeLabel: 'Messenger Theme',
            yellowTalk: 'Yellow Talk',
            greenChat: 'Green Chat',
            personaLabel: 'AI Persona',
            personaNamePlaceholder: 'Name (e.g., Jisu)',
            personaRelationshipPlaceholder: 'Relationship (e.g., Girlfriend)',
            personaMbtiPlaceholder: 'Personality (e.g., ENFP, cheerful)',
            personaTonePlaceholder: 'Tone example (e.g., "Heeey! What are you up to? 💕")',
            startChatBtn: 'Start Chat',
            modalTitle: 'Get Your Free Google AI API Key',
            modalStep1: 'Log in with your Google account.',
            modalStep2: 'Click "Create API Key".',
            modalStep3: 'Copy the key and paste it here.',
            modalLink: 'Go to Google AI Studio',
            // New neutral title suggestions
            appTitle: 'AI Chat Companion',
            appTitleKo: 'AI 채팅 친구',
        },
        ko: {
            apiKeyLabel: '🔑 API 키',
            apiKeyPlaceholder: 'Google AI API 키를 입력하세요',
            getApiKeyBtn: '무료 API 키 발급받기 (1분 소요)',
            themeLabel: '메신저 테마',
            yellowTalk: '옐로우톡',
            greenChat: '그린챗',
            personaLabel: 'AI 페르소나',
            personaNamePlaceholder: '이름 (예: 지수)',
            personaRelationshipPlaceholder: '관계 (예: 여자친구)',
            personaMbtiPlaceholder: '성격 (예: ENFP, 활발함)',
            personaTonePlaceholder: '말투 예시 (예: "오빠! 뭐해? 💕")',
            startChatBtn: '채팅 시작하기',
            modalTitle: '무료 Google AI API 키 발급받기',
            modalStep1: '구글 아이디로 로그인',
            modalStep2: '"Create API Key" 클릭',
            modalStep3: '키를 복사해서 붙여넣기',
            modalLink: 'Google AI Studio로 이동',
            // New neutral title suggestions
            appTitle: 'AI 채팅 친구',
            appTitleKo: 'AI 채팅 친구',
        }
    };

    const app = {
        elements: {
            app: document.getElementById('app'),
            setupScreen: document.getElementById('setup-screen'),
            chatScreen: document.getElementById('chat-screen'),
            langKoBtn: document.getElementById('lang-ko'),
            langEnBtn: document.getElementById('lang-en'),
            apiKeyInput: document.getElementById('api-key'),
            getApiKeyBtn: document.getElementById('get-api-key-btn'),
            apiKeyModal: document.getElementById('api-key-modal'),
            closeModalBtn: document.querySelector('#api-key-modal .close-btn'), // More specific selector
            themeOptions: document.querySelectorAll('.theme-option'),
            personaNameInput: document.getElementById('persona-name'),
            personaRelationshipInput: document.getElementById('persona-relationship'),
            personaMbtiInput: document.getElementById('persona-mbti'),
            personaToneInput: document.getElementById('persona-tone'),
            startChatBtn: document.getElementById('start-chat-btn'),
            backToSetupBtn: document.getElementById('back-to-setup-btn'),
            resetSettingsBtn: document.getElementById('reset-settings-btn'),
            chatPersonaName: document.getElementById('chat-persona-name'),
            chatPersonaStatus: document.getElementById('chat-persona-status'),
            messageArea: document.getElementById('message-area'),
            typingIndicator: document.getElementById('typing-indicator'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
        },
        state: {
            apiKey: null,
            language: 'en',
            theme: 'theme-yellow',
            persona: { name: '', relationship: '', mbti: '', tone: '' },
            chat: null,
            chatHistory: [],
            isTyping: false,
            nudgeTimer: null,
            lastMessageTimestamp: null,
        },

        init() {
            console.log('App initialization started.');
            this.loadSettings();
            this.applyTheme();
            this.updateUI(); // Initial UI update to apply language and theme to existing elements
            this.addEventListeners();
            
            if (this.elements.typingIndicator) {
                this.elements.typingIndicator.innerHTML = `<p>typing... <span></span><span></span><span></span></p>`;
            } else {
                console.error('Typing indicator element not found.');
            }

            // Set initial screen
            if (this.state.apiKey && this.state.persona.name) { // If essential settings are present, go to chat
                this.elements.setupScreen.style.display = 'none';
                this.elements.chatScreen.style.display = 'flex';
                this.initChat(); // Initialize chat only if we're going to the chat screen directly
            } else { // Otherwise, stay on setup
                this.elements.setupScreen.style.display = 'flex';
                this.elements.chatScreen.style.display = 'none';
            }
            console.log('App initialization completed. Current state:', this.state);
        },

        addEventListeners() {
            console.log('Attaching event listeners...');
            // Loop through all elements to log their status and attach listeners
            for (const key in this.elements) {
                const el = this.elements[key];
                if (!el) {
                    console.error(`Element not found for: ${key}`);
                    continue;
                }
                if (key === 'themeOptions') { // NodeList needs special handling
                    el.forEach((option, index) => {
                        console.log(`Found NodeList element for: ${key}[${index}]`);
                        option.addEventListener('click', () => { console.log(`themeOption ${option.dataset.theme} clicked`); this.setTheme(option.dataset.theme); });
                    });
                } else if (typeof el.addEventListener === 'function') {
                    console.log(`Found element for: ${key}`);
                    // Attach specific listeners
                    switch (key) {
                        case 'langKoBtn': el.addEventListener('click', () => { console.log('langKoBtn clicked'); this.setLanguage('ko'); }); break;
                        case 'langEnBtn': el.addEventListener('click', () => { console.log('langEnBtn clicked'); this.setLanguage('en'); }); break;
                        case 'getApiKeyBtn': el.addEventListener('click', () => { console.log('getApiKeyBtn clicked'); this.elements.apiKeyModal.style.display = 'flex'; }); break;
                        case 'closeModalBtn': el.addEventListener('click', () => { console.log('closeModalBtn clicked'); this.elements.apiKeyModal.style.display = 'none'; }); break;
                        case 'startChatBtn': el.addEventListener('click', () => { console.log('startChatBtn clicked'); this.startChat(); }); break;
                        case 'backToSetupBtn': el.addEventListener('click', () => { console.log('backToSetupBtn clicked'); this.showSetupScreen(); clearTimeout(this.state.nudgeTimer); }); break;
                        case 'resetSettingsBtn': el.addEventListener('click', () => { console.log('resetSettingsBtn clicked'); this.resetSettings(); }); break;
                        case 'sendBtn': el.addEventListener('click', () => { console.log('sendBtn clicked'); this.sendMessage(); }); break;
                        case 'messageInput': el.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                console.log('messageInput Enter keydown');
                                this.sendMessage();
                            }
                        }); break;
                        // No default, as we're explicitly handling each expected element
                    }
                } else {
                    console.warn(`Element for "${key}" is not null but not an HTMLElement or NodeList suitable for event listener.`);
                }
            }
            console.log('Event listeners attachment attempt completed.');
        },

        setLanguage(lang) {
            this.state.language = lang;
            this.updateUI();
        },

        setTheme(theme) {
            this.state.theme = theme;
            this.applyTheme();
            this.updateUI();
        },

        applyTheme() {
            if (document.body) {
                document.body.className = this.state.theme;
            } else {
                console.warn('Document body not found to apply theme.');
            }
        },

        updateUI() {
            const translations = i18n[this.state.language];
            // Update app title
            const appTitleElement = document.querySelector('title');
            if (appTitleElement) {
                appTitleElement.textContent = translations.appTitle;
            } else {
                console.warn('App title element not found.');
            }
            
            document.querySelectorAll('[data-i18n]').forEach(el => {
                if (el) el.textContent = translations[el.dataset.i18n];
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                if (el) el.placeholder = translations[el.dataset.i18nPlaceholder];
            });
            
            if (this.elements.langKoBtn) this.elements.langKoBtn.classList.toggle('active', this.state.language === 'ko');
            if (this.elements.langEnBtn) this.elements.langEnBtn.classList.toggle('active', this.state.language === 'en');
            this.elements.themeOptions.forEach(option => {
                if (option) option.classList.toggle('active', option.dataset.theme === this.state.theme);
            });
            if (this.elements.chatPersonaName) this.elements.chatPersonaName.textContent = this.state.persona.name || 'AI';
            if (this.elements.chatPersonaStatus) this.elements.chatPersonaStatus.textContent = this.state.persona.mbti || 'Online';
        },

        saveSettings() {
            if (this.elements.apiKeyInput) this.state.apiKey = this.elements.apiKeyInput.value;
            if (this.elements.personaNameInput) this.state.persona.name = this.elements.personaNameInput.value;
            if (this.elements.personaRelationshipInput) this.state.persona.relationship = this.elements.personaRelationshipInput.value;
            if (this.elements.personaMbtiInput) this.state.persona.mbti = this.elements.personaMbtiInput.value;
            if (this.elements.personaToneInput) this.state.persona.tone = this.elements.personaToneInput.value;

            const settings = {
                apiKey: this.state.apiKey, language: this.state.language, theme: this.state.theme, persona: this.state.persona,
                chatHistory: this.state.chatHistory,
                lastMessageTimestamp: Date.now()
            };
            localStorage.setItem('aiLoverSettings', JSON.stringify(settings));
            console.log('Settings saved:', settings);
        },

        loadSettings() {
            const settings = JSON.parse(localStorage.getItem('aiLoverSettings'));
            if (settings) {
                this.state = { ...this.state, ...settings };
                if (this.elements.apiKeyInput) this.elements.apiKeyInput.value = this.state.apiKey || '';
                Object.keys(this.state.persona).forEach(key => {
                    const el = this.elements[`persona${key.charAt(0).toUpperCase() + key.slice(1)}Input`];
                    if (el) el.value = this.state.persona[key] || '';
                });
                console.log('Settings loaded:', settings);
            } else {
                console.log('No settings found in localStorage.');
            }
        },
        
        async startChat() {
            console.log('startChat called.');
            this.saveSettings();
            if (!this.state.apiKey) {
                alert('Please enter your API key.');
                return;
            }
            
            const timeSinceLast = Date.now() - (this.state.lastMessageTimestamp || 0);
            const wasLongAgo = timeSinceLast > (60 * 60 * 1000); // 1 hour

            this.initChat();
            if (this.elements.setupScreen) this.elements.setupScreen.style.display = 'none';
            if (this.elements.chatScreen) this.elements.chatScreen.style.display = 'flex';
            if (this.elements.messageArea) this.elements.messageArea.innerHTML = '';
            this.state.chatHistory.forEach(({ role, parts }) => this.displayMessage(role, parts[0].text, false));
            this.updateUI();

            if (wasLongAgo && this.state.chatHistory.length > 0) {
                console.log('Sending welcome back message due to long absence.');
                await this.sendWelcomeBackMessage();
            }

            this.resetNudgeTimer();
            console.log('Chat started.');
        },

        initChat() {
            console.log('initChat called with API Key:', this.state.apiKey);
            try {
                const genAI = new GoogleGenerativeAI(this.state.apiKey);
                // Ensure model name is correct, e.g., "gemini-pro" or "gemini-1.5-flash"
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
                const systemPrompt = `You are ${this.state.persona.name}, my ${this.state.persona.relationship}. Your personality is ${this.state.persona.mbti}. You talk like this: "${this.state.persona.tone}". Please reply in ${this.state.language === 'ko' ? 'Korean' : 'English'}. Keep your replies short and natural, like a real chat.`;
                this.state.chat = model.startChat({
                    history: this.state.chatHistory,
                    generationConfig: { maxOutputTokens: 100 },
                    systemInstruction: systemPrompt,
                });
                console.log('Gemini chat model initialized.');
            } catch (error) {
                console.error("Error initializing chat:", error);
                alert("Failed to initialize chat. Check your API key and network connection.");
                this.showSetupScreen();
            }
        },

        async sendMessage() {
            const messageText = (this.elements.messageInput ? this.elements.messageInput.value.trim() : '');
            console.log('sendMessage called with text:', messageText);
            if (!messageText || this.state.isTyping) {
                console.log('Message empty or AI is typing, returning.');
                return;
            }
            
            this.resetNudgeTimer();
            this.displayMessage('user', messageText, true);
            if (this.elements.messageInput) this.elements.messageInput.value = '';
            
            await this.getAiResponse(messageText);
        },

        async getAiResponse(prompt) {
            console.log('getAiResponse called with prompt:', prompt);
            this.state.isTyping = true;
            if (this.elements.typingIndicator) this.elements.typingIndicator.style.display = 'block';
            if (this.elements.messageArea) this.elements.messageArea.scrollTop = this.elements.messageArea.scrollHeight;

            try {
                const result = await this.state.chat.sendMessage(prompt);
                const response = result.response;
                this.removeReadReceipts();
                const aiText = response.text();
                this.displayMessage('model', aiText, false);
                this.state.chatHistory = await this.state.chat.getHistory();
                console.log('AI response received and displayed.');
            } catch (error) {
                console.error("Error sending message to AI:", error);
                this.displayMessage('model', "Sorry, I'm having a little trouble right now.", false);
            } finally {
                this.state.isTyping = false;
                if (this.elements.typingIndicator) this.elements.typingIndicator.style.display = 'none';
                this.saveSettings();
            }
        },

        displayMessage(role, text, showReadReceipt) {
            console.log(`Displaying message - role: ${role}, text: ${text}, showReadReceipt: ${showReadReceipt}`);
            const container = document.createElement('div');
            container.classList.add('message-container', role === 'user' ? 'user' : 'partner');

            const bubble = document.createElement('div');
            bubble.classList.add('message-bubble', role === 'user' ? 'user' : 'partner');
            bubble.innerHTML = marked.parse(text);

            if (role === 'user') {
                if (showReadReceipt) {
                    const readReceipt = document.createElement('span');
                    readReceipt.classList.add('read-receipt');
                    readReceipt.textContent = '1';
                    container.appendChild(readReceipt);
                }
                container.appendChild(bubble);
            } else {
                container.appendChild(bubble);
            }
            
            if (this.elements.messageArea) {
                this.elements.messageArea.appendChild(container);
                this.elements.messageArea.scrollTop = this.elements.messageArea.scrollHeight;
            } else {
                console.error('Message area element not found.');
            }
        },

        removeReadReceipts() {
            console.log('Removing read receipts.');
            const receipts = this.elements.messageArea ? this.elements.messageArea.querySelectorAll('.read-receipt') : [];
            receipts.forEach(receipt => receipt.remove());
        },

        resetNudgeTimer() {
            clearTimeout(this.state.nudgeTimer);
            const randomInterval = (Math.random() * 4 * 60 * 1000) + (1 * 60 * 1000); // 1 to 5 minutes
            this.state.nudgeTimer = setTimeout(() => this.sendNudgeMessage(), randomInterval);
            console.log(`Nudge timer reset for ${randomInterval / 1000} seconds.`);
        },

        async sendNudgeMessage() {
            if (this.isLastMessageFromUser() && !this.state.isTyping && this.state.chat) {
                console.log('Attempting to send nudge message.');
                const nudgePrompt = "I haven't heard from you in a bit, say something to gently restart the conversation based on your persona. For example: 'What are you up to?', 'Thinking of you!', or 'I'm bored...'.";
                await this.getAiResponse(nudgePrompt);
            } else {
                console.log('Nudge condition not met or AI is typing.');
            }
        },
        
        async sendWelcomeBackMessage() {
            if (!this.state.isTyping && this.state.chat) {
                console.log('Attempting to send welcome back message.');
                const welcomePrompt = "I'm opening the app again after a long time. Greet me in character, like you missed me. For example: 'I missed you!', 'Where have you been?', or 'Finally! I was waiting...'.";
                await this.getAiResponse(welcomePrompt);
            } else {
                console.log('Welcome back condition not met or AI is typing.');
            }
        },

        isLastMessageFromUser() {
            const lastMessage = this.state.chatHistory[this.state.chatHistory.length - 1];
            return lastMessage && lastMessage.role === 'user';
        },

        showSetupScreen() {
            console.log('Showing setup screen.');
            if (this.elements.chatScreen) this.elements.chatScreen.style.display = 'none';
            if (this.elements.setupScreen) this.elements.setupScreen.style.display = 'flex';
        },
        
        resetSettings() {
            console.log('Resetting all settings.');
            if (confirm('Are you sure you want to reset all settings? This will clear your chat history.')) {
                clearTimeout(this.state.nudgeTimer);
                localStorage.removeItem('aiLoverSettings');
                this.state.apiKey = null;
                this.state.persona = { name: '', relationship: '', mbti: '', tone: '' };
                this.state.chatHistory = [];
                this.state.lastMessageTimestamp = null;
                if (this.elements.apiKeyInput) this.elements.apiKeyInput.value = '';
                if (this.elements.personaNameInput) this.elements.personaNameInput.value = '';
                if (this.elements.personaRelationshipInput) this.elements.personaRelationshipInput.value = '';
                if (this.elements.personaMbtiInput) this.elements.personaMbtiInput.value = '';
                if (this.elements.personaToneInput) this.elements.personaToneInput.value = '';
                this.showSetupScreen();
                this.updateUI(); // Re-apply UI state after reset
                console.log('Settings reset and setup screen shown.');
            }
        }
    };

    app.init();
});
