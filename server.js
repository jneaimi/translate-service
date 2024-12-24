const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


app.post('/translate', async (req, res) => {
    const { englishContent } = req.body;


    const prompt = `
    You are an expert translator specializing in English to Arabic translations. Your task is to provide an accurate and natural-sounding translation while preserving the original meaning and tone of the text.

    Here is the English content to be translated:

    <english_content>
    ${englishContent}
    </english_content>

    Please follow these instructions carefully:
    1. Translate the content into Modern Standard Arabic (فصحى), ensuring grammatical correctness.
    2. Keep proper nouns, brand names, and technical terms in their original form.
    `;

    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.5,
        max_tokens: 1500,
    };

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const arabicTranslation = response.data.choices[0].message.content.trim();
        return res.json({
            arabic_translation: arabicTranslation,
            translation_notes: "No additional notes provided."
        });
    } catch (error) {
        console.error('Error during translation:', error);
        return res.status(500).send('Error during translation');
    }
});

// Run server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
