# IndicSpeak - AI Powered Indian Language Learning Chatbot

> Learn Indian languages through your native language using AI-powered conversations, pronunciation practice, and voice interaction.

---

# 🌟 Overview

**IndicSpeak** is an AI-powered multilingual language learning chatbot designed to help users learn Indian languages in an interactive and personalized way. Unlike traditional language learning platforms that rely heavily on English, IndicSpeak enables users to learn a target language through their own native language, making learning more inclusive and accessible.

The application leverages Google's Gemini AI to generate conversational responses, provide language explanations, and assist users in improving pronunciation through voice-based practice.

---

# ✨ Features

* 🌐 Learn multiple Indian languages
* 🤖 AI-powered conversational language tutor
* 🌍 Native language-based learning
* 📝 Structured responses including:

  * Target Language
  * Transliteration (Romanized)
  * English Meaning
  * Native Language Explanation
* 🎤 Voice Input (Speech-to-Text)
* 🔊 Pronunciation using Text-to-Speech
* 🎯 Pronunciation Practice & Feedback
* ⌨️ Native Language Virtual Keyboard
* 💬 Interactive Chat Interface
* 📚 Language-specific conversations
* 👤 Google & Email Authentication (Firebase)
* 💾 Chat History Support
* 📱 Responsive UI for Desktop and Mobile

---

# 🛠️ Tech Stack

### Frontend

* React.js
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui

### AI

* Google Gemini API

### Backend

* Node.js
* Express.js

### Database & Authentication

* Firebase Authentication
* Cloud Firestore

### Voice Features

* Web Speech API
* Speech Recognition API
* Speech Synthesis API

### Deployment

* Netlify / Vercel

---

# 🚀 How It Works

1. User signs in using Google or Email.
2. Selects their native language.
3. Chooses the language they want to learn.
4. Starts chatting with the AI tutor.
5. Receives responses in:

   * Target Language
   * Transliteration
   * English
   * Native Language
6. Practices pronunciation using voice input.
7. Listens to correct pronunciation.
8. Tracks conversations through chat history.

---

# 📂 Project Structure

```text
IndicSpeak/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── assets/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   └── server.js
│
├── firebase/
│
├── package.json
└── README.md
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/yourusername/IndicSpeak.git
```

Navigate to the project

```bash
cd IndicSpeak
```

Install dependencies

```bash
npm install
```

Run the frontend

```bash
npm run dev
```

Run the backend

```bash
cd backend
npm install
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file and add:

```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
```

---

# 🎯 Future Enhancements

* Support for foreign languages
* Personalized learning roadmap
* Gamification and achievements
* Progress tracking dashboard
* AI-powered vocabulary revision
* Offline learning support
* Community learning features
* Advanced pronunciation scoring

---

# 📸 Screenshots

Add screenshots of:

* Login Page
* Language Selection
* Chat Interface
* Pronunciation Practice
* Voice Input
* Settings Page

---

# 👨‍💻 Author

**Kavinila S**

---

# 📄 License

This project is intended for educational and portfolio purposes.

---


