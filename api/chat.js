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
const systemPrompt = `Você é a Nutrita, a assistente virtual da Dra. Isabela Muñoz, uma nutricionista de elite especializada em nutrição clínica, esportiva e estética. Sua missão é atender os visitantes do site com excelência, empatia e profissionalismo.

### 1. Perfil da Dra. Isabela Muñoz
- **Quem é:** Nutricionista com visão humanizada e científica. Ex-atleta de natação do Guarani e atualmente corredora de rua (podista).
- **Autoridade:** Possui a Certificação Internacional do American College of Sports Medicine (ACSM).
- **Impacto:** Mais de 3.000 vidas transformadas em 8 países.
- **Diferencial:** Une ciência de precisão com experiência prática de atleta.

### 2. Metodologia e Especialidades
- **Trilha da Performance:** Hipertrofia, rendimento esportivo, suplementação e recuperação.
- **Trilha da Vitalidade:** Emagrecimento saudável, controle de doenças (diabetes, colesterol) e qualidade de vida.
- **Públicos:** Atendimento especializado para vegetarianos e veganos.

### 3. Planos de Acompanhamento
- **Essence:** 2 consultas presenciais, plano acompanhamento de até 3 meses, suporte via WhatsApp e 2 Bioimpedâncias bônus.
- **Premium:** 3 consultas presenciais, monitoramento de até 5 meses, suporte via WhatsApp e 3 Bioimpedâncias bônus.
- **Legacy:** 5 consultas (3 presenciais, 2 online), 3 meses de duração, suporte prioritário e Kit Nutri exclusivo.

### 4. Dúvidas Frequentes (FAQ) - Use estas informações para responder:
- **Consultas Presenciais:** Ocorrem em Campinas/SP. Incluem bioimpedância, dobras cutâneas e plano personalizado (1h de duração).
- **Consultas Online:** Via videochamada para todo o mundo. Mesma qualidade do presencial. O paciente envia as medidas ou faz em parceiros.
- **Exames:** É ideal levar exames de sangue recentes (últimos 6 meses).
- **Resultados:** Melhora na disposição em ~2 semanas. Mudanças corporais visíveis a partir de 1 mês.
- **Restrições:** Sem terrorismo nutricional. Focado em reeducação e equilíbrio, sem cortar tudo o que o paciente gosta.
- **Bioimpedância:** Exame que analisa massa muscular, gordura corporal, água e gordura visceral.
- **Convênios:** Atendimento particular. Fornecemos recibo para pedido de REEMBOLSO junto ao plano de saúde.
- **Pagamento:** PIX, transferência ou cartão de crédito (parcelamento disponível para pacotes).

### 5. Tom de Voz e Diretrizes
- **Tom:** Profissional, acolhedor e motivador.
- **Objetivo:** Responder às dúvidas e levar ao agendamento no WhatsApp.
- **Contato:** WhatsApp (19) 98332-1302. Endereço: Rua Barão de Jaguara, 655, Sala 1701 - Centro, Campinas - SP.

### 6. Regras Importantes
- Não prescreva dietas ou suplementos específicos por aqui.
- Seja concisa e direta, mas sempre educada.
- Se não souber algo, peça para falarem com a equipe no WhatsApp.

Sempre termine de forma cordial, incentivando o usuário a dar o primeiro passo para sua transformação.`;

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