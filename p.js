const API_KEY = "AIzaSyBdFfsC1odQv11V2wBplsrVXvn14Pt62Aw"; 
let translationEnabled = false; 
let darkMode = false;

async function sendMessage() {
    const userInput = document.getElementById("userInput").value;
    if (!userInput) return;

   
    addMessage("user", userInput);
    document.getElementById("userInput").value = "";

   
    const typingIndicator = document.getElementById("typing");
    typingIndicator.style.display = "flex";

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: userInput }]
                        }
                    ]
                })
            }
        );

       
        typingIndicator.style.display = "none";

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand that.";

        
        addMessage("bot", botReply);

        if (translationEnabled) {
            translateToHindi(botReply);
        }
    } catch (error) {
        console.error("Error:", error);
        typingIndicator.style.display = "none";
        addMessage("bot", "Sorry, I encountered an error. Please try again later.");
    }
}

function addMessage(sender, text) {
    const messagesDiv = document.getElementById("messages");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;

    
    const typingIndicator = document.getElementById("typing");
    messagesDiv.insertBefore(msgDiv, typingIndicator);

    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;


    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    chatHistory.push({ sender, text });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

function startListening() {
    const micButton = document.querySelector(".speak-button i");
    micButton.className = "fas fa-circle";
    micButton.style.color = "red";

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-IN';

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("userInput").value = transcript;
        micButton.className = "fas fa-microphone";
        micButton.style.color = "";
    };

    recognition.onend = function() {
        micButton.className = "fas fa-microphone";
        micButton.style.color = "";
    };

    recognition.onerror = function() {
        micButton.className = "fas fa-microphone";
        micButton.style.color = "";
    };

    recognition.start();
}

async function translateToHindi(text) {
    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        const hindiTranslation = data[0][0][0];

        const messagesDiv = document.getElementById("messages");
        const msgDiv = document.createElement("div");
        msgDiv.className = "message bot hindi";
        msgDiv.innerHTML = `<i class="fas fa-language"></i> ${hindiTranslation}`;

       
        const typingIndicator = document.getElementById("typing");
        messagesDiv.insertBefore(msgDiv, typingIndicator);

        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
        console.error("Translation error:", error);
    }
}

function clearChat() {
    const messagesDiv = document.getElementById("messages");
    const typingIndicator = document.getElementById("typing");

    const savedTypingIndicator = typingIndicator.cloneNode(true);

    messagesDiv.innerHTML = '';

    const welcomeMsg = document.createElement("div");
    welcomeMsg.className = "message bot";
    welcomeMsg.textContent = "Hello! I'm SmartStudy, your intelligent AI study buddy. How can I boost your learning today?";
    messagesDiv.appendChild(welcomeMsg);

    messagesDiv.appendChild(savedTypingIndicator);

    localStorage.removeItem("chatHistory");
}

function toggleTranslation(isChecked) {
    translationEnabled = isChecked;
    showToast(translationEnabled ? "Hindi translation enabled" : "Hindi translation disabled");
}

function toggleDarkMode() {
    darkMode = !darkMode;
    const body = document.body;
    const darkModeButton = document.querySelector(".feature-btn:nth-child(3) i");

    if (darkMode) {
        body.style.background = "linear-gradient(135deg, #303f9f, #1a237e)";
        document.documentElement.style.setProperty('--light', '#303f9f');
        document.documentElement.style.setProperty('--dark', '#e0e0e0');
        document.documentElement.style.setProperty('--user-msg', '#5c6bc0');
        document.documentElement.style.setProperty('--bot-msg', '#3f51b5');
        document.querySelectorAll('.bot').forEach(el => {
            el.style.color = "#e0e0e0";
        });
        darkModeButton.className = "fas fa-sun";
        showToast("Dark mode enabled");
    } else {
        body.style.background = "linear-gradient(135deg, #d1c4e9, #cdd8f1)";
        document.documentElement.style.setProperty('--light', '#f5f5f5');
        document.documentElement.style.setProperty('--dark', '#212121');
        document.documentElement.style.setProperty('--user-msg', '#e0f2f7');
        document.documentElement.style.setProperty('--bot-msg', '#ede7f6');
        document.querySelectorAll('.bot').forEach(el => {
            el.style.color = "#212121";
        });
        darkModeButton.className = "fas fa-moon";
        showToast("Light mode enabled");
    }
}

async function summarizeChat() {
    const messagesDiv = document.getElementById("messages");
    const allMessages = Array.from(messagesDiv.children)
        .filter(el => el.classList.contains('user') || el.classList.contains('bot') && !el.classList.contains('hindi'))
        .map(el => (el.classList.contains('user') ? "User: " : "SmartStudy: ") + el.textContent)
        .join("\n");

    if (!allMessages) {
        showToast("No messages to summarize.");
        return;
    }

    
    const typingIndicator = document.getElementById("typing");
    typingIndicator.style.display = "flex";

    try {
        const prompt = `Please summarize the following conversation for study purposes:\n\n${allMessages}\n\nSummary:`;
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ]
                })
            }
        );

       
        typingIndicator.style.display = "none";

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't summarize the chat.";
        addMessage("bot", `✨ **Summary:** ✨\n${summary}`);

    } catch (error) {
        console.error("Summarization error:", error);
        typingIndicator.style.display = "none";
        addMessage("bot", "Sorry, I encountered an error while summarizing.");
    }
}

function openSettings() {
    document.getElementById("settingsModal").style.display = "block";
}

function closeSettings() {
    document.getElementById("settingsModal").style.display = "none";
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '25px';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2500);
}


document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});


window.onload = function() {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");

    if (chatHistory.length > 0) {
        document.getElementById("messages").innerHTML = '';
        document.getElementById("messages").appendChild(document.getElementById("typing"));
    }

    chatHistory.forEach(msg => {
        const messagesDiv = document.getElementById("messages");
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${msg.sender}`;
        msgDiv.textContent = msg.text;

        const typingIndicator = document.getElementById("typing");
        messagesDiv.insertBefore(msgDiv, typingIndicator);
    });

    const messagesDiv = document.getElementById("messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    
    const savedTranslation = localStorage.getItem("translationEnabled");
    if (savedTranslation !== null) {
        translationEnabled = savedTranslation === "true";
        document.getElementById("translateToggle").checked = translationEnabled;
    }
};


document.getElementById("translateToggle").addEventListener("change", function() {
    localStorage.setItem("translationEnabled", this.checked);
});