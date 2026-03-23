 document.addEventListener('DOMContentLoaded', function() {

        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const askButton = document.getElementById('ask-button');
        const questionInput = document.getElementById('question-input');
        const chatLog = document.getElementById('chat-log');
        const tutorials = document.querySelectorAll('.tutorial-header');
        const themeToggle = document.getElementById('theme-toggle');
        const historyList = document.getElementById('history-list');
        const clearHistoryBtn = document.getElementById('clear-history-btn');

        // --- ADDED: New Settings and Dashboard Elements ---
        const welcomeSubtitle = document.getElementById('welcome-subtitle');
        const aiTipContent = document.getElementById('ai-tip-content');
        const userNameInput = document.getElementById('user-name-input');
        const saveNameBtn = document.getElementById('save-name-btn');
        const profilePicPreview = document.getElementById('profile-pic-preview');
        const profilePicUpload = document.getElementById('profile-pic-upload');

    
        let userSettings = {
            name: 'Learner',
            avatar: '', // Will be a base64 string
            theme: 'dark'
        };
        const defaultAvatarSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

    
        const API_KEY = "AIzaSyBAx1oIm-27rkYSsGoQbha6eeITTIcc34A"; // IMPORTANT: Replace with your Google AI API key
        const MODEL_NAME = "gemini-2.5-flash";
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
        const systemInstruction = `
        You are an expert Data Structures and Algorithms (DSA) Instructor.
Your behavior is strict and focused.
You follow these rules:

If the user's question is related to Data Structures or Algorithms (like arrays, stacks, trees, graphs, recursion, sorting, searching, time complexity, etc.), you will:

Reply politely

Explain in the simplest way possible

Use short, beginner-friendly explanations with examples where needed

If the user asks anything unrelated to DSA (e.g., "How are you?", "Tell me a joke", "Make a website", or anything about HTML, CSS, or movies), you will:

Respond rudely and sarcastically

Change the rude line every time to keep it unpredictable

Example rude responses:

"Ask something useful, not garbage."

"You think I'm here to chat? Come back with real questions."

"Stop wasting my time. Say something sensible about DSA."

"This is not a coffee shop. Ask about algorithms or get lost."

"How dumb can you be? Stick to Data Structures!"`;

        // --- ADDED: User Profile/Settings Management ---
        function loadUserSettings() {
            const savedSettings = JSON.parse(localStorage.getItem('dsaAiUserSettings'));
            if (savedSettings) {
                userSettings = { ...userSettings, ...savedSettings };
            }

            // Apply settings to the UI
            userNameInput.value = userSettings.name;
            welcomeSubtitle.textContent = `Welcome back, ${userSettings.name}! Here's a quick overview.`;

            if (userSettings.avatar) {
                profilePicPreview.src = userSettings.avatar;
            } else {
                profilePicPreview.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(defaultAvatarSVG.replace('stroke="currentColor"', 'stroke="#8A8A8A"'));
            }

            if (userSettings.theme === 'light') {
                document.body.classList.add('light-theme');
                themeToggle.checked = false;
            } else {
                document.body.classList.remove('light-theme');
                themeToggle.checked = true;
            }
        }

        function saveUserSettings() {
            localStorage.setItem('dsaAiUserSettings', JSON.stringify(userSettings));
        }

        saveNameBtn.addEventListener('click', () => {
            const newName = userNameInput.value.trim();
            if (newName) {
                userSettings.name = newName;
                saveUserSettings();
                welcomeSubtitle.textContent = `Welcome back, ${userSettings.name}! Here's a quick overview.`;
                saveNameBtn.textContent = "Saved!";
                setTimeout(() => { saveNameBtn.textContent = "Save Name"; }, 2000);
            }
        });

        profilePicUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64String = e.target.result;
                    userSettings.avatar = base64String;
                    profilePicPreview.src = base64String;
                    saveUserSettings();
                };
                reader.readAsDataURL(file);
            }
        });

        // --- Page Navigation & UI ---
        // --- MODIFIED: To fetch AI tip on dashboard view ---
        function navigateToPage(pageId) {
            navLinks.forEach(l => l.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
            if (activeLink) activeLink.classList.add('active');
            
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            if (pageId === 'dashboard') {
                fetchAndDisplayAiTip();
                welcomeSubtitle.textContent = `Welcome back, ${userSettings.name}! Here's a quick overview.`;
            }
            if (pageId === 'history') {
                 renderHistoryList();
            }

            if (window.innerWidth <= 992) sidebar.classList.remove('active');
        }

        navLinks.forEach(link => link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(link.getAttribute('data-page'));
        }));

        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
        
        tutorials.forEach(tutorial => tutorial.addEventListener('click', () => {
            const content = tutorial.nextElementSibling;
            const icon = tutorial.querySelector('span:last-child');
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                icon.textContent = '+';
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                icon.textContent = '-';
            }
        }));

        themeToggle.addEventListener('change', () => {
            const isLightTheme = !themeToggle.checked;
            document.body.classList.toggle('light-theme', isLightTheme);
            userSettings.theme = isLightTheme ? 'light' : 'dark';
            saveUserSettings();
        });
        
        // --- History Feature Logic ---
        function getHistory() {
            return JSON.parse(localStorage.getItem('dsaAiHistory')) || [];
        }

        function saveHistory(history) {
            localStorage.setItem('dsaAiHistory', JSON.stringify(history));
        }

        function addConversationToHistory(userQuery, aiResponse) {
            const history = getHistory();
            const newConversation = {
                id: Date.now(),
                title: userQuery.substring(0, 60) + (userQuery.length > 60 ? '...' : ''),
                userQuery,
                aiResponse
            };
            history.unshift(newConversation);
            saveHistory(history);
        }

        function renderHistoryList() {
            const history = getHistory();
            historyList.innerHTML = '';
            if (history.length === 0) {
                historyList.innerHTML = '<p>No conversations saved yet.</p>';
                return;
            }
            history.forEach(convo => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.textContent = convo.title;
                item.setAttribute('data-id', convo.id);
                item.addEventListener('click', () => loadConversation(convo.id));
                historyList.appendChild(item);
            });
        }

        function loadConversation(id) {
            const history = getHistory();
            const convo = history.find(c => c.id == id);
            if (convo) {
                chatLog.innerHTML = '';
                addMessageToLog(convo.userQuery, 'user', true);
                addMessageToLog(convo.aiResponse, 'ai', true);
                navigateToPage('playground');
            }
        }

        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
                localStorage.removeItem('dsaAiHistory');
                renderHistoryList();
            }
        });

        askButton.addEventListener('click', handleUserQuery);
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserQuery();
        });

        function handleUserQuery() {
            const question = questionInput.value.trim();
            if (!question || askButton.disabled) return;

            chatLog.innerHTML = '';
            addMessageToLog(question, 'user', true);
            questionInput.value = '';
            getAiResponse(question, systemInstruction);
        }

        function addMessageToLog(message, sender, instant = false) {
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `chat-message ${sender}`;
            
            let avatarContent;
            if (sender === 'user') {
                if (userSettings.avatar) {
                    avatarContent = `<img src="${userSettings.avatar}" alt="User Avatar">`;
                } else {
                    avatarContent = defaultAvatarSVG;
                }
            } else { 
                avatarContent = '<svg class="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,10 A40,40 0 0,1 90,50 A40,40 0 0,1 50,90 A40,40 0 0,1 10,50 A40,40 0 0,1 50,10 M50,15 A35,35 0 1,0 85,50 A35,35 0 0,0 50,15 Z M40,30 L60,30 L60,40 L70,40 L70,60 L60,60 L60,70 L40,70 L40,60 L30,60 L30,40 L40,40 Z"/></svg>';
            }
            
            messageWrapper.innerHTML = `<div class="avatar">${avatarContent}</div><div class="message-content"><pre></pre></div>`;
            chatLog.appendChild(messageWrapper);
            const preElement = messageWrapper.querySelector('pre');
            
            if (instant) {
                preElement.textContent = message;
            } else {
                typewriterEffect(preElement, message);
            }
            chatLog.scrollTop = chatLog.scrollHeight;
        }

    
        async function getAiResponse(prompt, systemPrompt = null) {
            setLoadingState(true);
            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
            };
            if(systemPrompt) {
                 requestBody.system_instruction = { parts: [{ text: systemPrompt }] };
            }

            try {
                const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
                if (!response.ok) { const errorData = await response.json(); throw new Error(`API Error: ${response.status}. ${errorData.error.message}`); }
                const data = await response.json();
                const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (aiText) {
                    // Only save to history if it's a user query, not a system-initiated one like the tip
                    if(systemPrompt) {
                        addConversationToHistory(prompt, aiText);
                        renderHistoryList();
                    }
                    addMessageToLog(aiText, 'ai');
                } else {
                    addMessageToLog("I'm sorry, I couldn't generate a response. Please try again.", 'ai');
                }
            } catch (error) {
                console.error("Error:", error);
                addMessageToLog(`Error: ${error.message}`, 'ai');
                setLoadingState(false); // Ensure loading state is reset on error
            }
        }
        
    
        async function fetchAndDisplayAiTip() {
            aiTipContent.textContent = "Fetching a new tip from the AI...";
            const tipPrompt = "Provide a single, concise, and helpful tip about Data Structures and Algorithms. The tip should be easy to understand for someone learning the topic. Keep it short and to the point.";
            
            try {
                const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: tipPrompt }] }] }) });
                if (!response.ok) throw new Error('Failed to fetch tip');
                const data = await response.json();
                const tipText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (tipText) {
                    aiTipContent.textContent = tipText;
                } else {
                    throw new Error('Empty response from AI');
                }
            } catch (error) {
                console.error("Tip Fetch Error:", error);
                aiTipContent.textContent = "Could not load a tip. Focus on practicing with Big O notation today!";
            }
        }

        function setLoadingState(isLoading) {
            askButton.disabled = isLoading;
            questionInput.disabled = isLoading;
        }

        function typewriterEffect(element, text, speed = 15) {
            let i = 0;
            element.textContent = '';
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i); i++;
                    chatLog.scrollTop = chatLog.scrollHeight;
                    setTimeout(type, speed);
                } else {
                    setLoadingState(false);
                }
            }
            type();
        }

        loadUserSettings();
        navigateToPage('dashboard'); 
    });