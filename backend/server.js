require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI (lazy initialization)
let ai = null;

function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  }
  return ai;
}

// Helper function to generate content with Gemini
async function generateGeminiResponse(prompt) {
  try {
    console.log('Generating response with prompt:', prompt);
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text;
    console.log('Gemini response:', text);
    return text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw new Error('Failed to generate AI response');
  }
}

// Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, language, nativeLanguage } = req.body;

    if (!messages || !language || !nativeLanguage) {
      return res.status(400).json({ error: 'Missing required fields: messages, language, nativeLanguage' });
    }

    // Construct conversation history
    const conversationHistory = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const prompt = `You are an AI language tutor for IndicSpeak. The user is learning ${language} and their native language is ${nativeLanguage}.

Conversation history:
${conversationHistory}

Generate a helpful response in the following JSON format only (no additional text):
{
  "target": "response in ${language}",
  "transliteration": "hinglish transliteration of the response",
  "english": "english translation of the response",
  "native": "explanation in ${nativeLanguage} about the response and any grammar points"
}`;

    const responseText = await generateGeminiResponse(prompt);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pronunciation Evaluation API
app.post('/api/pronunciation/evaluate', async (req, res) => {
  try {
    const { word, transcript, language, nativeLanguage } = req.body;

    if (!word || !transcript || !language || !nativeLanguage) {
      return res.status(400).json({ error: 'Missing required fields: word, transcript, language, nativeLanguage' });
    }

    const prompt = `You are a pronunciation evaluator for IndicSpeak. Evaluate the user's pronunciation of the word "${word}" in ${language}.

User's spoken transcript: "${transcript}"
Target word: "${word}"
User's native language: ${nativeLanguage}

Provide a detailed evaluation in the following JSON format only:
{
  "score": number between 0-100,
  "mistakes": ["list of specific pronunciation mistakes found"],
  "feedback": "constructive feedback in English on how to improve",
  "native": "explanation in ${nativeLanguage} about the correct pronunciation and common mistakes"
}`;

    const responseText = await generateGeminiResponse(prompt);

    // Parse the JSON response
    let parsedResponse;
    try {
      const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('Error in /api/pronunciation/evaluate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Speech API (placeholder)
app.post('/api/pronunciation/speak', async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text || !language) {
      return res.status(400).json({ error: 'Missing required fields: text, language' });
    }

    // Placeholder implementation
    // In a real implementation, you would integrate with a TTS service like Google Text-to-Speech
    console.log(`Speech request: text="${text}", language="${language}"`);

    res.json({
      message: 'Speech synthesis placeholder',
      text: text,
      language: language,
      audioUrl: 'placeholder-audio-url', // Would be actual audio URL from TTS service
      note: 'This is a placeholder. Integrate with a real TTS API for production.'
    });
  } catch (error) {
    console.error('Error in /api/pronunciation/speak:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'IndicSpeak Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`IndicSpeak Backend server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});