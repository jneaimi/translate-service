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
      // Extract the englishContent field from the request body
      let englishContent = req.body.englishContent;

      // Check if englishContent is a stringified JSON
      if (typeof englishContent === 'string') {
          try {
              englishContent = JSON.parse(englishContent); // Parse the stringified JSON
          } catch (parseError) {
              return res.status(400).json({ error: 'Invalid JSON format in englishContent', details: parseError.message });
          }
      }

      if (!englishContent) {
          return res.status(400).json({ error: 'englishContent is required' });
      }

      // Constructing the translation prompt
      const prompt = `
      You are an expert translator specializing in English to Arabic translations. Your task is to provide an accurate and natural-sounding translation while preserving the original meaning and tone of the text.

      Here is the English content to be translated:

      <english_content>
      ${JSON.stringify(englishContent, null, 2)}
      </english_content>

      Please follow these instructions carefully:
      [instructions remain unchanged]
      `;

      // Set up the request to OpenAI
      const requestBody = {
          model: "gpt-3.5-turbo",
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

      // Extract translated content
      const translatedContent = response.data.choices[0].message.content.trim();

      // Attempt to parse the response content if it's in JSON format, otherwise treat it as a plain string
      let arabicTranslation = {};
      try {
          arabicTranslation = JSON.parse(translatedContent);
      } catch (err) {
          console.error('Error parsing translated content:', err);
          arabicTranslation = { arabic_translation: translatedContent, translation_notes: ["No additional notes provided."] };
      }

      // Send the translated response in the required format
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
