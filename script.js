import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const app = {
    elements: {},
    state: {
        user: null, apiKey: null, language: 'ko', isDarkMode: false,
        accentTheme: 'theme-green', persona: { name: '', relation: '', style: '' },
        chat: null, chatHistory: [], db: null, auth: null,
    },
    i18n: {
        en: {
            loginPrompt: 'Please log in to sync your conversations across devices.', loginBtn: 'Login with Google', setupTitle: 'Setup',
            apiKeyLabel: 'API Key', apiKeyPlaceholder: 'Enter your Google AI API Key', getApiKeyBtn: 'How to get an API Key',
            personaLabel: 'AI Persona', personaNamePlaceholder: 'Name (e.g., Jisu)', personaRelationPlaceholder: 'Relationship (e.g., Girlfriend)',
            personaStylePlaceholder: 'Personality & Tone (e.g., Cheerful, uses emojis 💕)', accentThemeLabel: 'Accent Color', greenChat: 'Green', yellowChat: 'Yellow',
            startChatBtn: 'Start Chat', messagePlaceholder: 'Type a message...', modalTitle: 'Get Your Free Google AI API Key',
            modalStep1: 'Log in to Google AI Studio.', modalStep2: 'Click "Create API Key".', modalStep3: 'Copy the key and paste it in the app.',
            modalLink: 'Go to Google AI Studio',
        },
        ko: {
            loginPrompt: '대화 내용을 여러 기기에서 동기화하려면 로그인하세요.', loginBtn: 'Google 계정으로 로그인', setupTitle: '최초 설정',
            apiKeyLabel: 'API 키', apiKeyPlaceholder: 'Google AI API 키를 입력하세요', getApiKeyBtn: 'API 키 발급 방법',
            personaLabel: 'AI 페르소나', personaNamePlaceholder: '이름 (예: 지수)', personaRelationPlaceholder: '관계 (예: 여자친구)',
            personaStylePlaceholder: '성격 & 말투 (예: 활발하고, 이모티콘을 자주 씀 💕)', accentThemeLabel: '악센트 컬러', greenChat: '그린', yellowChat: '옐로우',
            startChatBtn: '채팅 시작', messagePlaceholder: '메시지를 입력하세요...', modalTitle: '무료 Google AI API 키 발급받기',
            modalStep1: 'Google AI Studio에 로그인하세요.', modalStep2: '"Create API Key"를 클릭하세요.', modalStep3: '생성된 키를 복사하여 앱에 붙여넣으세요.',
            modalLink: 'Google AI Studio로 이동',
        }
    },
    init() {
        const firebaseConfig = {
            apiKey: "AIzaSyDmO1wpZQJEiPEjNoq7xtFcq33akIzoGY8",
            authDomain: "aimeet-c235c.firebaseapp.com",
            projectId: "aimeet-c235c",
            storageBucket: "aimeet-c235c.firebasestorage.app",
            messagingSenderId: "732324287861",
            appId: "1:732324287861:web:15d894068755c627842f3c",
            measurementId: "G-CD2L6WFJN9"
        };

        const firebaseApp = initializeApp(firebaseConfig);
        this.state.auth = getAuth(firebaseApp);
        this.state.db = getFirestore(firebaseApp);

        const ids = ['app', 'login-screen', 'setup-screen', 'chat-screen', 'lang-toggle', 'theme-toggle', 'api-key', 'persona-name', 'persona-relation', 'persona-style', 'start-chat-btn', 'back-btn', 'logout-btn', 'chat-persona-name', 'message-area', 'message-input', 'send-btn', 'get-api-key-btn', 'api-key-modal', 'close-modal-btn', 'login-btn'];
        ids.forEach(id => this.elements[id] = document.getElementById(id));
        this.elements.themeOptions = document.querySelectorAll('.theme-option');

        this.addEventListeners();
        onAuthStateChanged(this.state.auth, user => {
            if (user) {
                this.state.user = user;
                this.loadDataFromFirestore();
            } else {
                this.state.user = null;
                this.showScreen('login-screen');
            }
        });
    },
    addEventListeners() {
        this.elements['login-btn'].addEventListener('click', () => this.loginWithGoogle());
        this.elements['logout-btn'].addEventListener('click', () => signOut(this.state.auth));
        this.elements['lang-toggle'].addEventListener('click', () => this.toggleLanguage());
        this.elements['theme-toggle'].addEventListener('click', () => this.toggleTheme());
        this.elements['get-api-key-btn'].addEventListener('click', () => this.elements['api-key-modal'].style.display = 'flex');
        this.elements['close-modal-btn'].addEventListener('click', () => this.elements['api-key-modal'].style.display = 'none');
        this.elements['start-chat-btn'].addEventListener('click', () => this.startChat());
        this.elements['back-btn'].addEventListener('click', () => this.showScreen('setup-screen'));
        this.elements['send-btn'].addEventListener('click', () => this.sendMessage());
        this.elements['message-input'].addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
        });
        this.elements.themeOptions.forEach(option => {
            option.addEventListener('click', () => this.setAccentTheme(option.dataset.theme));
        });
    },
    showScreen(screenId) {
        ['login-screen', 'setup-screen', 'chat-screen'].forEach(id => {
            this.elements[id].classList.toggle('active', id === screenId);
        });
    },
    async loadDataFromFirestore() {
        const userRef = doc(this.state.db, 'users', this.state.user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            Object.assign(this.state, data);
            this.elements['api-key'].value = this.state.apiKey || '';
            this.elements['persona-name'].value = this.state.persona.name || '';
            this.elements['persona-relation'].value = this.state.persona.relation || '';
            this.elements['persona-style'].value = this.state.persona.style || '';
            this.applyTheme();
            this.updateUI();
            this.showScreen('chat-screen');
            this.startChat(true);
        } else {
            this.applyTheme();
            this.updateUI();
            this.showScreen('setup-screen');
        }
    },
    async saveDataToFirestore() {
        if (!this.state.user) return;
        const userRef = doc(this.state.db, 'users', this.state.user.uid);
        const settings = {
            apiKey: this.state.apiKey, language: this.state.language, isDarkMode: this.state.isDarkMode,
            accentTheme: this.state.accentTheme, persona: this.state.persona, chatHistory: this.state.chatHistory
        };
        await setDoc(userRef, settings, { merge: true });
    },
    loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        signInWithPopup(this.state.auth, provider).catch(error => alert(`Login Failed: ${error.message}`));
    },
    toggleLanguage() { this.state.language = this.state.language === 'ko' ? 'en' : 'ko'; this.updateUI(); this.saveDataToFirestore(); },
    toggleTheme() { this.state.isDarkMode = !this.state.isDarkMode; this.applyTheme(); this.saveDataToFirestore(); },
    setAccentTheme(theme) { this.state.accentTheme = theme; this.applyTheme(); this.saveDataToFirestore(); },
    applyTheme() {
        document.body.className = '';
        if(this.state.isDarkMode) document.body.classList.add('dark-mode');
        document.body.classList.add(this.state.accentTheme);
        this.elements['theme-toggle'].textContent = this.state.isDarkMode ? '☀️' : '🌙';
        this.elements.themeOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === this.state.accentTheme);
        });
    },
    updateUI() {
        const translations = this.i18n[this.state.language];
        document.title = translations.appTitle;
        this.elements['lang-toggle'].textContent = this.state.language === 'ko' ? '🇺🇸' : '🇰🇷';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if(!translations[key]) return;
            if (el.placeholder !== undefined) el.placeholder = translations[key];
            else el.textContent = translations[key];
        });
    },
    startChat(isAutoStart = false) {
        if (!isAutoStart) {
            this.state.apiKey = this.elements['api-key'].value.trim();
            this.state.persona = {
                name: this.elements['persona-name'].value.trim(),
                relation: this.elements['persona-relation'].value.trim(),
                style: this.elements['persona-style'].value.trim(),
            };
            if (!this.state.apiKey || !this.state.persona.name) {
                alert('Please provide an API Key and a name for the AI.');
                return;
            }
            this.saveDataToFirestore();
        }

        if (typeof window.GoogleGenerativeAI === 'undefined') {
            alert('Could not connect to Google AI. Check your internet connection and refresh.');
            return;
        }
        
        this.elements['chat-persona-name'].textContent = this.state.persona.name;
        this.elements['message-area'].innerHTML = '';
        this.state.chatHistory.forEach(msg => this.displayMessage(msg.role, msg.parts[0].text));

        try {
            const genAI = new window.GoogleGenerativeAI(this.state.apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const systemPrompt = `You are ${this.state.persona.name}, my ${this.state.persona.relation}. Your personality and tone of voice is: ${this.state.persona.style}. Please reply in ${this.state.language === 'ko' ? 'Korean' : 'English'}. Keep replies natural and conversational.`;
            this.state.chat = model.startChat({
                history: this.state.chatHistory, generationConfig: { maxOutputTokens: 200 }, systemInstruction: systemPrompt,
            });
            this.showScreen('chat-screen');
        } catch (error) {
            alert(`Error initializing chat: ${error.message}`);
            this.showScreen('setup-screen');
        }
    },
    async sendMessage() {
        const messageText = this.elements['message-input'].value.trim();
        if (!messageText || !this.state.chat) return;

        this.displayMessage('user', messageText);
        this.state.chatHistory.push({ role: 'user', parts: [{ text: messageText }] });
        this.elements['message-input'].value = '';

        try {
            const result = await this.state.chat.sendMessage(messageText);
            const aiText = result.response.text();
            this.displayMessage('model', aiText);
            this.state.chatHistory.push({ role: 'model', parts: [{ text: aiText }] });
        } catch (error) {
            this.displayMessage('model', `Sorry, an error occurred: ${error.message}`);
        }
        this.saveDataToFirestore();
    },
    displayMessage(role, text) {
        const container = document.createElement('div');
        container.classList.add('message-container', role === 'model' ? 'partner' : role);
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');

        if (window.marked) bubble.innerHTML = marked.parse(text);
        else bubble.textContent = text;
        
        container.appendChild(bubble);
        this.elements['message-area'].appendChild(container);
        this.elements['message-area'].scrollTop = this.elements['message-area'].scrollHeight;
    }
};
app.init();
