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
            closeModalBtn: document.querySelector('.close-btn'),
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
            this.loadSettings();
            this.applyTheme();
            this.updateUI();
            this.addEventListeners();
            this.elements.typingIndicator.innerHTML = `<p>typing... <span></span><span></span><span></span></p>`;
        },

        addEventListeners() {
            this.elements.langKoBtn.addEventListener('click', () => this.setLanguage('ko'));
            this.elements.langEnBtn.addEventListener('click', () => this.setLanguage('en'));
            this.elements.getApiKeyBtn.addEventListener('click', () => this.elements.apiKeyModal.style.display = 'flex');
            this.elements.closeModalBtn.addEventListener('click', () => this.elements.apiKeyModal.style.display = 'none');
            this.elements.themeOptions.forEach(option => {
                option.addEventListener('click', () => this.setTheme(option.dataset.theme));
            });
            this.elements.startChatBtn.addEventListener('click', () => this.startChat());
            this.elements.backToSetupBtn.addEventListener('click', () => {
                this.showSetupScreen();
                clearTimeout(this.state.nudgeTimer);
            });
            this.elements.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
            this.elements.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
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
            document.body.className = this.state.theme;
        },

        updateUI() {
            const translations = i18n[this.state.language];
            document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = translations[el.dataset.i18n]);
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = translations[el.dataset.i18nPlaceholder]);
            this.elements.langKoBtn.classList.toggle('active', this.state.language === 'ko');
            this.elements.langEnBtn.classList.toggle('active', this.state.language === 'en');
            this.elements.themeOptions.forEach(option => option.classList.toggle('active', option.dataset.theme === this.state.theme));
            this.elements.chatPersonaName.textContent = this.state.persona.name || 'AI';
            this.elements.chatPersonaStatus.textContent = this.state.persona.mbti || 'Online';
        },

        saveSettings() {
            this.state.apiKey = this.elements.apiKeyInput.value;
            this.state.persona = {
                name: this.elements.personaNameInput.value,
                relationship: this.elements.personaRelationshipInput.value,
                mbti: this.elements.personaMbtiInput.value,
                tone: this.elements.personaToneInput.value,
            };
            const settings = {
                apiKey: this.state.apiKey, language: this.state.language, theme: this.state.theme, persona: this.state.persona,
                chatHistory: this.state.chatHistory,
                lastMessageTimestamp: Date.now()
            };
            localStorage.setItem('aiLoverSettings', JSON.stringify(settings));
        },

        loadSettings() {
            const settings = JSON.parse(localStorage.getItem('aiLoverSettings'));
            if (settings) {
                this.state = { ...this.state, ...settings };
                this.elements.apiKeyInput.value = this.state.apiKey || '';
                Object.keys(this.state.persona).forEach(key => {
                    const el = this.elements[`persona${key.charAt(0).toUpperCase() + key.slice(1)}Input`];
                    if (el) el.value = this.state.persona[key] || '';
                });
            }
        },
        
        async startChat() {
            this.saveSettings();
            if (!this.state.apiKey) {
                alert('Please enter your API key.');
                return;
            }
            
            const timeSinceLast = Date.now() - (this.state.lastMessageTimestamp || 0);
            const wasLongAgo = timeSinceLast > (60 * 60 * 1000); // 1 hour

            this.initChat();
            this.elements.setupScreen.style.display = 'none';
            this.elements.chatScreen.style.display = 'flex';
            this.elements.messageArea.innerHTML = '';
            this.state.chatHistory.forEach(({ role, parts }) => this.displayMessage(role, parts[0].text, false));
            this.updateUI();

            if (wasLongAgo && this.state.chatHistory.length > 0) {
                await this.sendWelcomeBackMessage();
            }

            this.resetNudgeTimer();
        },

        initChat() {
            try {
                const genAI = new GoogleGenerativeAI(this.state.apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const systemPrompt = `You are ${this.state.persona.name}, my ${this.state.persona.relationship}. Your personality is ${this.state.persona.mbti}. You talk like this: "${this.state.persona.tone}". Please reply in ${this.state.language === 'ko' ? 'Korean' : 'English'}. Keep your replies short and natural, like a real chat.`;
                this.state.chat = model.startChat({
                    history: this.state.chatHistory,
                    generationConfig: { maxOutputTokens: 100 },
                    systemInstruction: systemPrompt,
                });
            } catch (error) {
                console.error("Error initializing chat:", error);
                alert("Failed to initialize chat. Check your API key and network connection.");
                this.showSetupScreen();
            }
        },

        async sendMessage() {
            const messageText = this.elements.messageInput.value.trim();
            if (!messageText || this.state.isTyping) return;
            
            this.resetNudgeTimer();
            this.displayMessage('user', messageText, true);
            this.elements.messageInput.value = '';
            
            await this.getAiResponse(messageText);
        },

        async getAiResponse(prompt) {
            this.state.isTyping = true;
            this.elements.typingIndicator.style.display = 'block';
            this.elements.messageArea.scrollTop = this.elements.messageArea.scrollHeight;

            try {
                const result = await this.state.chat.sendMessage(prompt);
                const response = result.response;
                this.removeReadReceipts();
                const aiText = response.text();
                this.displayMessage('model', aiText, false);
                this.state.chatHistory = await this.state.chat.getHistory();
            } catch (error) {
                console.error("Error sending message:", error);
                this.displayMessage('model', "Sorry, I'm having a little trouble right now.", false);
            } finally {
                this.state.isTyping = false;
                this.elements.typingIndicator.style.display = 'none';
                this.saveSettings();
            }
        },

        displayMessage(role, text, showReadReceipt) {
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
            
            this.elements.messageArea.appendChild(container);
            this.elements.messageArea.scrollTop = this.elements.messageArea.scrollHeight;
        },

        removeReadReceipts() {
            const receipts = this.elements.messageArea.querySelectorAll('.read-receipt');
            receipts.forEach(receipt => receipt.remove());
        },

        resetNudgeTimer() {
            clearTimeout(this.state.nudgeTimer);
            const randomInterval = (Math.random() * 4 * 60 * 1000) + (1 * 60 * 1000); // 1 to 5 minutes
            this.state.nudgeTimer = setTimeout(() => this.sendNudgeMessage(), randomInterval);
        },

        async sendNudgeMessage() {
            if (this.isLastMessageFromUser()) {
                const nudgePrompt = "I haven't heard from you in a bit, say something to gently restart the conversation based on your persona. For example: 'What are you up to?', 'Thinking of you!', or 'I'm bored...'.";
                await this.getAiResponse(nudgePrompt);
            }
        },
        
        async sendWelcomeBackMessage() {
            const welcomePrompt = "I'm opening the app again after a long time. Greet me in character, like you missed me. For example: 'I missed you!', 'Where have you been?', or 'Finally! I was waiting...'.";
            await this.getAiResponse(welcomePrompt);
        },

        isLastMessageFromUser() {
            const lastMessage = this.state.chatHistory[this.state.chatHistory.length - 1];
            return lastMessage && lastMessage.role === 'user';
        },

        showSetupScreen() {
            this.elements.chatScreen.style.display = 'none';
            this.elements.setupScreen.style.display = 'flex';
        },
        
        resetSettings() {
            if (confirm('Are you sure you want to reset all settings? This will clear your chat history.')) {
                clearTimeout(this.state.nudgeTimer);
                localStorage.removeItem('aiLoverSettings');
                this.state.apiKey = null;
                this.state.persona = { name: '', relationship: '', mbti: '', tone: '' };
                this.state.chatHistory = [];
                this.state.lastMessageTimestamp = null;
                this.elements.apiKeyInput.value = '';
                this.elements.personaNameInput.value = '';
                this.elements.personaRelationshipInput.value = '';
                this.elements.personaMbtiInput.value = '';
                this.elements.personaToneInput.value = '';
                this.showSetupScreen();
            }
        }
    };

    app.init();
});
