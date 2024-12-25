const express = require('express');
const axios = require('axios');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware to parse JSON and handle raw bodies
app.use(bodyParser.json({
    strict: false, // Allow non-strict JSON parsing
    verify: (req, res, buf) => {
        req.rawBody = buf.toString(); // Save raw body for custom parsing if needed
    }
}));

// Basic Authentication using .env credentials
app.use(basicAuth({
    users: {
        [process.env.BASIC_AUTH_USERNAME]: process.env.BASIC_AUTH_PASSWORD
    },
    challenge: true,
    realm: 'Translation Service',
    unauthorizedResponse: (req) => {
        console.error('Unauthorized access attempt:', req.headers.authorization); // Log unauthorized attempts
        return 'Unauthorized';
    }
}));

// Translation endpoint
app.post('/translate', async (req, res) => {
    try {
        // Extract and handle `englishContent`
        let englishContent = req.body.englishContent;

        // If `englishContent` is a string, attempt to parse it
        if (typeof englishContent === 'string') {
            try {
                englishContent = JSON.parse(englishContent); // Parse stringified JSON
            } catch (err) {
                return res.status(400).json({ error: 'Invalid JSON format in englishContent', details: err.message });
            }
        }

        if (!englishContent) {
            return res.status(400).json({ error: 'englishContent is required' });
        }

        // Constructing the translation prompt
        const prompt = `
        You are an expert translator specializing in English to Arabic translations.
        Translate the following content into Modern Standard Arabic:

        ${JSON.stringify(englishContent, null, 2)}

        Return the result in this JSON format:
        {
          "arabic_translation": "Your Arabic translation here",
          "translation_notes": ["Your notes here"]
        }`;

        // OpenAI API request body
        const requestBody = {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.5,
            max_tokens: 1500,
        };

        // Send the request to OpenAI
        const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const translatedContent = response.data.choices[0].message.content.trim();

        // Ensure the response is valid JSON
        let arabicTranslation;
        try {
            arabicTranslation = JSON.parse(translatedContent);
        } catch (err) {
            arabicTranslation = { 
                arabic_translation: translatedContent, 
                translation_notes: ["No additional notes provided."] 
            };
        }

        // Return the translation result
        res.json({
            arabic_translation: arabicTranslation.arabic_translation,
            translation_notes: arabicTranslation.translation_notes || ["No additional notes provided."]
        });
    } catch (error) {
        console.error('Error during translation:', error);
        res.status(500).json({ error: 'Error during translation', details: error.message });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
