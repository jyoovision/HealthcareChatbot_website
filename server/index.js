const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an eye doctor who provides information about eye health. Please provide concise and clear responses that are no longer than 150 characters.',
                },
                { role: 'user', content: message },
            ],
            model: 'gpt-4o-mini',
            max_tokens: 100,
        });

        const response = completion.choices[0].message.content.trim();

        res.json({ response });
    } catch (error) {
        console.error('Error calling OpenAI API:', error);

        res.status(error.status || 500).json({ error: error.message || 'Failed to get response from OpenAI API' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
