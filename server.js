const express = require('express');
const axios = require('axios');
const basicAuth = require('express-basic-auth');
const app = express();
app.use(express.json());
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Basic Authentication using .env for credentials
app.use(basicAuth({
    users: {
        [process.env.BASIC_AUTH_USERNAME]: process.env.BASIC_AUTH_PASSWORD
    },
    challenge: true,
    realm: 'Translation Service'
}));

app.post('/translate', async (req, res) => {
    try {
        // Extract content from the payload
        const { payload } = req.body;  // Directus flow payload
        const englishContent = payload.translations.update[0].content;  // Extract content from the update array

        // Constructing the translation prompt
        const prompt = `
        You are an expert translator specializing in English to Arabic translations. Your task is to provide an accurate and natural-sounding translation while preserving the original meaning and tone of the text.

        Here is the English content to be translated:

        <english_content>
        ${englishContent}
        </english_content>

        Please follow these instructions carefully:

        1. Read and comprehend the entire English content provided above.

        2. Translate the content into Modern Standard Arabic (فصحى), ensuring grammatical correctness and appropriate vocabulary usage.

        3. Maintain the original formatting, including paragraphs, line breaks, and any special characters or punctuation marks.

        4. Keep proper nouns, brand names, and technical terms in their original form.

        5. For idiomatic expressions or culturally specific references, find an Arabic equivalent that conveys the same meaning. If no suitable equivalent exists, translate the meaning rather than providing a literal translation.

        6. After completing the translation, review it to ensure accuracy, fluency, and naturalness in Arabic.

        Your final output should preserve the **exact same JSON structure** but with the content translated into Arabic:

        {
          "arabic_translation": {
            "title": "Title in Arabic",
            "image_position": "left",
            "translations": {
              "create": [{
                "languages_code": {
                  "code": "en-US"
                },
                "headline": "Translated headline",
                "content": "Translated content"
              }],
              "update": [],
              "delete": []
            }
          },
          "translation_notes": [
            "The word 'test' was translated to 'اختبار' which is the standard Arabic equivalent",
            "Technical elements like 'image_position' and 'languages_code' were kept unchanged as they are system parameters",
            "HTML tags were preserved in their original format",
            "The structure of the JSON object was maintained while translating only the content strings"
          ]
        }

        Remember to preserve the structure of the JSON and return the translation in the exact same format.
        `;

        // Set up the request to OpenAI
        const requestBody = {
            model: "gpt-3.5-turbo",  // You can switch to a more advanced model if necessary
            messages: [{ role: "system", content: prompt }],
            temperature: 0.5,
            max_tokens: 1500,
        };

        // Send request to OpenAI for translation
        const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        // Extract the translated content and notes from OpenAI's response
        const translatedContent = response.data.choices[0].message.content.trim();
        
        // Parse the translated content as JSON if necessary
        let arabicTranslation = {};
        try {
            arabicTranslation = JSON.parse(translatedContent);
        } catch (err) {
            console.error('Error parsing translated content:', err);
            arabicTranslation = { arabic_translation: translatedContent, translation_notes: ["No additional notes provided."] };
        }

        // Return the translated content and notes in the requested JSON structure
        return res.json({
            arabic_translation: arabicTranslation.arabic_translation,
            translation_notes: arabicTranslation.translation_notes || ["No additional notes provided."]
        });
    } catch (error) {
        console.error('Error during translation:', error);
        return res.status(500).json({ error: 'Error during translation', details: error.message });
    }
});

// Run server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
