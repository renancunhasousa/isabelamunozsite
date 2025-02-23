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
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.response) {
            throw new Error('Resposta inválida do servidor');
        }
        
        console.log('Resposta recebida:', data.response);
        return data.response;
    } catch (error) {
        console.error('Erro detalhado ao chamar a API:', error);
        return "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, verifique se o servidor está rodando e tente novamente.";
    }
}

// Atualizar a função sendMessage
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Adiciona mensagem do usuário
    addMessage(message, 'user');
    chatInput.value = '';

    // Adiciona mensagem de "digitando"
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'typing');
    typingDiv.textContent = "Digitando...";
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Chama a API do ChatGPT
        const response = await callChatGPT(message);
        
        // Remove mensagem de "digitando"
        typingDiv.remove();
        
        // Adiciona resposta do bot
        addMessage(response, 'bot');
    } catch (error) {
        // Remove mensagem de "digitando"
        typingDiv.remove();
        
        // Adiciona mensagem de erro
        addMessage("Desculpe, ocorreu um erro. Por favor, tente novamente.", 'bot');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Configuração do botão FAQ
    const faqButton = document.querySelector('.faq-button');
    if (faqButton) {
        faqButton.setAttribute('title', 'Dúvidas frequentes');
        faqButton.setAttribute('data-tooltip', 'Dúvidas frequentes');
    }

    // Configuração do botão de chat
    if (chatButton) {
        chatButton.addEventListener('click', () => {
            chatContainer.classList.toggle('active');
        });
    }

    // Configuração do botão de envio
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Configuração do input para enviar com Enter
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}); 