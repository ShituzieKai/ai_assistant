document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const clearBtn = document.getElementById('clear-btn');
    const offlineBanner = document.getElementById('offline-banner');
    const badgeOffline = document.getElementById('badge-offline');
    const badgeOnline = document.getElementById('badge-online');
    const connectionText = document.getElementById('connection-text');

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    async function sendMessage() {
        const prompt = userInput.value.trim();
        if (!prompt) return;

        if (!navigator.onLine) {
            alert("You are currently offline. Please reconnect to send prompts.");
            return;
        }

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        chatWindow.innerHTML += `
            <div class="mb-3 text-end">
                <small class="text-muted fw-bold">YOU (STUDENT) • ${currentTime}</small>
                <div class="p-3 bg-dark text-white rounded mt-1 text-start d-inline-block" style="max-width: 85%;">
                    ${escapeHtml(prompt)}
                </div>
            </div>
        `;

        userInput.value = '';
        chatWindow.scrollTop = chatWindow.scrollHeight;

        const tempId = 'loading-' + Date.now();
        chatWindow.innerHTML += `
            <div class="mb-3" id="${tempId}">
                <small class="text-muted fw-bold">CLASS ASSISTANT</small>
                <div class="p-3 bg-light rounded border mt-1 text-muted">
                    <em>Generating response...</em>
                </div>
            </div>
        `;
        chatWindow.scrollTop = chatWindow.scrollHeight;

        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();
            document.getElementById(tempId).remove();

            if (response.ok) {
                chatWindow.innerHTML += `
                    <div class="mb-3">
                        <small class="text-muted fw-bold">CLASS ASSISTANT • ${currentTime}</small>
                        <div class="p-3 bg-light rounded border mt-1">
                            ${formatText(data.response)}
                        </div>
                    </div>
                `;
            } else {
                chatWindow.innerHTML += `<div class="alert alert-danger">Error: ${data.error}</div>`;
            }
        } catch (err) {
            document.getElementById(tempId).remove();
            chatWindow.innerHTML += `<div class="alert alert-danger">Network error occurred.</div>`;
        }

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    clearBtn.addEventListener('click', () => {
        userInput.value = '';
    });

    function updateConnectionStatus() {
        if (navigator.onLine) {
            offlineBanner.classList.add('d-none');
            badgeOffline.classList.add('d-none');
            badgeOnline.classList.remove('d-none');
            connectionText.textContent = "Online PWA";
            connectionText.className = "text-success fw-bold";
        } else {
            offlineBanner.classList.remove('d-none');
            badgeOffline.classList.remove('d-none');
            badgeOnline.classList.add('d-none');
            connectionText.textContent = "Offline PWA";
            connectionText.className = "text-danger fw-bold";
        }
    }

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();

    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function formatText(text) {
        return text.replace(/\n/g, '<br>');
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Error:', err));
    }
});