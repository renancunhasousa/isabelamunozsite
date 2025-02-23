const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente nutricional da Isabela Muñoz. Responda dúvidas sobre nutrição, consultas e serviços oferecidos."
                },
                {
                    role: "user",
                    content: message
                }
            ],
        });

        res.json({ response: completion.choices[0].message.content });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro ao processar mensagem' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});