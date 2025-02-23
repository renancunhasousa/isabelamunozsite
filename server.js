const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir arquivos estáticos

// Verificar se a chave da API está definida
if (!process.env.OPENAI_API_KEY) {
    console.error('Erro: OPENAI_API_KEY não está definida no arquivo .env');
    process.exit(1);
}

// Armazenamento do histórico de conversas
const conversas = {};

// Configuração OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente nutricional da Isabela Muñoz. Responda de forma amigável e profissional sobre nutrição, saúde e bem-estar."
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
        res.status(500).json({ error: 'Erro ao processar mensagem', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 