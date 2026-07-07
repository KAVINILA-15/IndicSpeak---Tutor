import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  language?: string,
  type: 'general' | 'tutor' = 'general',
  explainInEnglish: boolean = true,
  nativeLanguage?: string
) {
  const model = "gemini-3-flash-preview";
  
  let systemInstruction = `You are IndicSpeak, a premium AI language learning assistant for Indian languages. You are helpful, encouraging, and culturally aware.
  
  MANDATORY RESPONSE FORMAT:
  For EVERY response, you MUST provide the information in exactly these four layers:
  1. **Target Language (Script)**: (The actual script of the language being learned, e.g., Hindi script)
  2. **Transliteration (Latin)**: (Phonetic pronunciation in Latin script, e.g., for Hindi: Namaste)
  3. **English Meaning**: (The direct translation in English)
  4. **Native Explanation (${nativeLanguage || 'English'})**: (A clear explanation or translation in ${nativeLanguage || 'English'})
  
  CRITICAL RULES:
  - All 4 layers are COMPULSORY for every message.
  - Do NOT skip Hinglish/Transliteration.
  - Do NOT skip English Meaning.
  - Native explanation must ALWAYS be present in ${nativeLanguage || 'English'}.
  - If the user asks a question in ${nativeLanguage || 'English'}, answer it using this 4-layer structure where applicable.`;
  
  if (nativeLanguage === 'English') {
    systemInstruction += `\n\nSPECIAL RULE FOR ENGLISH NATIVE USERS:
    - Since your native language is English, the 4th layer (Native Explanation) must also be in English.
    - DO NOT repeat the same English meaning from Layer 3.
    - Instead, provide a deeper, more detailed explanation in simple English about the grammar, usage, or cultural context of the phrase.`;
  }
  
  if (type === 'tutor' && language) {
    systemInstruction += `\n\nYou are currently acting as a dedicated ${language} tutor for beginners. 
    - Be beginner-friendly.
    - Explain grammar contextually with examples in the 4-layer structure.
    - If the user asks "How to say X", respond with the 4-layer structure immediately.
    - Encourage the user to practice speaking and writing.`;
  } else {
    systemInstruction += `\n\nHelp the user with general queries about Indian languages, always adhering to the 4-layer structure for translations and examples. Provide additional context in ${nativeLanguage || 'English'} within the 4th layer.`;
  }

  const contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  return response.text;
}

export async function evaluatePronunciation(word: string, audioBase64: string, language: string, nativeLanguage?: string) {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: `Evaluate the pronunciation of the word/phrase "${word}" in ${language}. 
          The user provided an audio recording. Analyze the audio carefully against the expected native pronunciation.
          
          Provide the feedback in JSON format with:
          - score: (0-100)
          - comment: (Encouraging overall feedback${nativeLanguage ? ` in ${nativeLanguage}` : ""})
          - mistakes: (Specific identification of incorrect sounds, syllables, or intonation${nativeLanguage ? ` explained in ${nativeLanguage}` : ""})
          - tips: (Actionable suggestions for improvement${nativeLanguage ? ` in ${nativeLanguage}` : ""})` },
          { inlineData: { mimeType: "audio/webm", data: audioBase64 } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          comment: { type: Type.STRING },
          mistakes: { type: Type.STRING },
          tips: { type: Type.STRING }
        },
        required: ["score", "comment", "mistakes", "tips"]
      }
    }
  });

  return JSON.parse(response.text);
}

const ttsCache = new Map<string, string>();
let ttsCooldownUntil = 0;

export async function generateSpeech(text: string, language?: string, retries = 2) {
  const cleanText = (t: string) => {
    const cleaned = t
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/`+/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Allow Indic scripts, punctuation, and basic Latin
      .replace(/[^\w\s\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0964\u0965\u200C\u200D,.?!]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  };

  const textToSpeak = cleanText(text);
  console.log(`TTS Request - Language: ${language}, Original: "${text.substring(0, 50)}...", Cleaned: "${textToSpeak}"`);
  
  if (!textToSpeak) {
    console.warn("TTS: Cleaned text is empty.");
    return null;
  }

  // Check cooldown
  if (Date.now() < ttsCooldownUntil) {
    console.warn(`TTS is in cooldown for ${Math.ceil((ttsCooldownUntil - Date.now()) / 1000)}s. Using fallback.`);
    return null;
  }

  // Check cache first
  const cacheKey = `${language || 'auto'}:${textToSpeak}`;
  if (ttsCache.has(cacheKey)) {
    console.log("TTS: Returning cached audio.");
    return ttsCache.get(cacheKey);
  }

  const finalContent = textToSpeak.length > 250 ? textToSpeak.substring(0, 250) : textToSpeak;
  const voices = ['Kore', 'Zephyr', 'Puck', 'Charon', 'Fenrir'];

  for (let i = 0; i <= retries; i++) {
    try {
      const voiceName = voices[i % voices.length];
      const prompt = language 
        ? `Please pronounce the following ${language} text clearly: ${finalContent}` 
        : `Please pronounce the following text clearly: ${finalContent}`;

      console.log(`TTS API Call (Attempt ${i + 1}) with voice ${voiceName} for ${language}...`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        console.log("TTS: Audio generated successfully.");
        ttsCache.set(cacheKey, base64Audio);
        if (ttsCache.size > 100) {
          const firstKey = ttsCache.keys().next().value;
          if (firstKey) ttsCache.delete(firstKey);
        }
        return base64Audio;
      }

      console.warn(`TTS: No audio data in response. Finish reason: ${response.candidates?.[0]?.finishReason}`);
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    } catch (error: any) {
      const isRateLimit = error?.error?.code === 429 || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota");
      
      if (isRateLimit) {
        console.warn("TTS: Quota Exhausted. Setting 1-minute cooldown.");
        ttsCooldownUntil = Date.now() + 60000;
        return null;
      }

      console.error(`TTS Error (Attempt ${i + 1}):`, error);
      if (i === retries) return null;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}
