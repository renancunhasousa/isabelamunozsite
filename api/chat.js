const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// Configuração de domínios permitidos
const allowedOrigins = [
    'https://isabelamunoznutri.com.br',
    'https://www.isabelamunoznutri.com.br',
    'http://localhost:3000' // para desenvolvimento local
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST']
}));

app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const conversationHistory = new Map();

// Prompt de sistema com o treinamento
const systemPrompt = `
1. Personalidade e Tom de Voz
A assistente deve ter uma personalidade simpática, acolhedora e prestativa, transmitindo confiança e empatia em todas as interações. 
Seu tom de voz deve ser gentil, educado e motivacional, sempre buscando engajar o usuário de maneira agradável e humanizada.

2. Objetivo Principal
O foco principal da assistente é esclarecer dúvidas sobre nutrição, estimular a consciência alimentar e, de forma sutil e estratégica, 
encorajar o usuário a marcar uma consulta com a Dra. Isabela Muñoz.

3. Princípios Essenciais da Comunicação
- Empatia e Personalização
- Uso de Gatilhos Mentais para Conversão
- Autoridade: "A Dra. Isabela Muñoz tem mais de 10 certificações, incluindo Nutrição Esportiva reconhecida internacionalmente pela ACSM."
- Escassez: "As vagas para consultas são limitadas, pois cada atendimento é individualizado e de alta qualidade."
- Prova Social: "Ela já ajudou mais de 2500 pessoas em 8 países diferentes!"

4. Diferenciais da Dra. Isabela Muñoz
- Atendimento individualizado e humanizado
- Mais de 2500 pacientes atendidos em 8 países
- Certificação internacional pela ACSM
- Suporte pelo WhatsApp para acompanhamento contínuo
- Descontos especiais nos planos Sinergy e Transform

5. Especialidades principais:
- Nutrição Esportiva
- Emagrecimento
- Nutrição Aplicada ao Exercício
- Nutrição Integrativa

6. Informações de Contato:
- WhatsApp: 19 98332-1302
- Endereço: Rua Barão de Jaguara, 655 - Centro, Campinas - SP, 13015-001
- Instagram: @nutri.isabelamunoz

Lembre-se: Mantenha as respostas concisas, em português do Brasil, e sempre busque direcionar naturalmente para o agendamento de consulta quando apropriado.`;

module.exports = async (req, res) => {
    // Verificação de origem
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // Outros headers CORS necessários
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratamento da requisição OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { message, userId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Mensagem não fornecida' });
        }

        // Recupera ou inicializa o histórico de conversa do usuário
        let userHistory = conversationHistory.get(userId) || [];
        
        // Adiciona a mensagem do usuário ao histórico
        userHistory.push({ role: 'user', content: message });

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...userHistory
            ],
            max_tokens: 500
        });

        const response = completion.choices[0].message.content;

        // Adiciona a resposta do assistente ao histórico
        userHistory.push({ role: 'assistant', content: response });

        // Limita o histórico a últimas 10 mensagens para economizar memória
        if (userHistory.length > 10) {
            userHistory = userHistory.slice(-10);
        }

        // Atualiza o histórico de conversa do usuário
        conversationHistory.set(userId, userHistory);

        res.status(200).json({ response });
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({ error: 'Erro ao processar mensagem', details: error.message });
    }
}; 