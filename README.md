# IndicSpeak — Tutor 🇮🇳

An AI-powered language tutor for Indian languages built with React, TypeScript, and Google Gemini AI.

## Features

- 🗣️ **Pronunciation Teacher** — Get exact translations and pronunciations for any phrase in supported Indian languages
- 📚 **Level-based Learning** — Beginner, Intermediate, and Advanced educational content
- 🔥 **Firebase Integration** — Secure authentication and Firestore database
- 🌐 **Multi-language Support** — Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, and more
- 🎯 **Vocabulary Lessons** — Learn contextual vocabulary including everyday phrases and meal-time language

## Project Structure

```
IndicSpeak---Tutor/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── firebase.ts    # Firebase configuration
│   │   ├── types.ts       # TypeScript type definitions
│   │   ├── index.css      # Global styles
│   │   └── services/      # API and AI service handlers
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── backend/           # Node.js Express backend
    ├── server.js      # Express server with Gemini AI integration
    └── package.json
```

## Setup & Installation

### Prerequisites
- Node.js >= 18
- npm >= 9
- A Google AI Studio API key (Gemini)
- Firebase project

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your API keys in .env
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your GEMINI_API_KEY in .env
npm install
node server.js
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Firebase SDK
- **Backend**: Node.js, Express, Google Generative AI (Gemini)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Google Gemini API via AI Studio

## App Link

🔗 [Live App on AI Studio](https://ai.studio/apps/94c2096e-774d-4961-a095-f47747313a35)

## License

MIT
