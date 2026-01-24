// Criar um novo arquivo chat.js
// Identificador único para o usuário (pode ser melhorado com um sistema de autenticação)
const userId = 'user_' + Math.random().toString(36).substr(2, 9);

// Elementos do DOM
const chatMessages = document.querySelector('.chat-messages');
const chatInput = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');
const chatButton = document.querySelector('.chat-bot-button');
const chatContainer = document.querySelector('.chat-container');

// Função para adicionar mensagens ao chat
function addMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    // Criar o conteúdo da mensagem
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.textContent = message;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Rolar para a última mensagem
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function callChatGPT(message) {
    try {
        console.log('Enviando mensagem:', message);
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                userId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || `Erro HTTP: ${response.status}`);
        }

        if (!data.response) {
            throw new Error('Resposta inválida do servidor');
        }

        console.log('Resposta recebida:', data.response);
        return data.response;
    } catch (error) {
        console.error('Erro ao chamar a API:', error);
        throw error;
    }
}

// Atualizar a função sendMessage
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    const chatMessages = document.getElementById('chatMessages');

    if (!message) return;

    // Adiciona mensagem do usuário
    chatMessages.innerHTML += `
        <div class="message user-message">
            ${message}
        </div>
    `;

    input.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                userId: 'user-' + Date.now() // Identificador único para o usuário
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || `Erro HTTP: ${response.status}`);
        }

        // Adiciona resposta do bot
        chatMessages.innerHTML += `
            <div class="message bot-message">
                ${data.response}
            </div>
        `;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        chatMessages.innerHTML += `
            <div class="message bot-message error">
                Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.
            </div>
        `;
    }

    // Rola para a última mensagem
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Configuração do botão FAQ
    const faqButton = document.querySelector('.faq-button');
    if (faqButton) {
        faqButton.setAttribute('title', 'Dúvidas frequentes');
        faqButton.setAttribute('data-tooltip', 'Dúvidas frequentes');
    }

    // Configuração do botão de chat
    if (chatButton) {
        chatButton.addEventListener('click', () => {
            const wasActive = chatContainer.classList.contains('active');
            chatContainer.classList.toggle('active');
            chatButton.classList.toggle('chat-open');

            // Se o chat está sendo fechado, limpar as mensagens
            if (wasActive) {
                chatMessages.innerHTML = '';
                // Adicionar mensagem inicial do bot
                addMessage("Olá! Eu sou a Nutrita! Assistente nutricional da Dra. Isabela. Como posso ajudar você hoje?", 'bot');
            }
        });
    }

    // Configuração do botão de envio
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Configuração do input para enviar com Enter
    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// Função para limpar o chat ao sair da página
window.addEventListener('beforeunload', () => {
    chatMessages.innerHTML = '';
});

// Ajustar altura do chat em dispositivos móveis quando o teclado aparecer
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    const chatInput = document.querySelector('.chat-input input');
    const chatContainer = document.querySelector('.chat-container');

    chatInput.addEventListener('focus', () => {
        setTimeout(() => {
            chatContainer.style.height = '40vh';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 300);
    });

    chatInput.addEventListener('blur', () => {
        chatContainer.style.height = '60vh';
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 300);
    });
}

// Fechar o chat ao clicar fora em dispositivos móveis
document.addEventListener('click', (e) => {
    const chatContainer = document.querySelector('.chat-container');
    const chatButton = document.querySelector('.chat-bot-button');

    if (window.innerWidth <= 768) {
        if (!chatContainer.contains(e.target) &&
            !chatButton.contains(e.target) &&
            chatContainer.classList.contains('active')) {
            chatContainer.classList.remove('active');
            chatButton.classList.remove('chat-open');
        }
    }
});

// Prevenir zoom ao dar double tap em dispositivos móveis
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false); 