import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  addDoc,
  deleteDoc,
  OperationType,
  handleFirestoreError,
  getDocFromServer
} from './firebase';
import { UserProfile, ChatSession, Message, INDIAN_LANGUAGES, LANGUAGE_CHARSETS } from './types';
import { generateChatResponse, evaluatePronunciation, generateSpeech } from './services/geminiService';
import { 
  Mic, 
  Send, 
  Plus, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  MessageSquare, 
  Volume2, 
  CheckCircle2, 
  ChevronRight,
  Languages,
  X,
  Globe,
  Trash2,
  ArrowLeft,
  Loader2,
  Square,
  Keyboard as KeyboardIcon,
  Type as TypeIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const text = "IndicSpeak";
  return (
    <motion.div 
      className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="relative">
        <div className="flex space-x-2">
          {text.split("").map((char, index) => (
            <motion.span
              key={index}
              className="text-6xl md:text-8xl font-bold text-white tracking-tighter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1, 
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        <motion.div 
          className="absolute -inset-10 bg-white/5 blur-3xl rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <motion.div
        className="absolute bottom-20 text-white/40 text-sm tracking-[0.3em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        Your AI Language Mentor
      </motion.div>
      <motion.div
        className="hidden"
        animate={{ opacity: 1 }}
        onAnimationComplete={() => setTimeout(onComplete, 3000)}
      />
    </motion.div>
  );
};

const LoginScreen = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        return;
      }
      
      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          return;
        }
      }
      toast.success("Welcome to IndicSpeak!");
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to sign in. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-md space-y-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">IndicSpeak</h1>
          <p className="text-white/60 text-lg">Master Indian languages with AI.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full bg-white text-black font-semibold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/90 transition-colors"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
              <span>Continue with Google</span>
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-white/40">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Email address"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
              <input 
                type="password" 
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
              <button className="w-full bg-white/10 text-white font-semibold py-4 rounded-2xl hover:bg-white/20 transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-sm">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

const Sidebar = ({ 
  chats, 
  activeChatId, 
  onChatSelect, 
  onNewChat, 
  onOpenSettings,
  onLogout,
  user
}: { 
  chats: ChatSession[], 
  activeChatId: string | null, 
  onChatSelect: (id: string) => void,
  onNewChat: () => void,
  onOpenSettings: () => void,
  onLogout: () => void,
  user: UserProfile | null
}) => {
  return (
    <div className="w-80 h-full bg-black border-r border-white/10 flex-shrink-0 flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">IndicSpeak</h2>
        <button 
          onClick={onNewChat}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-2 py-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Recent Conversations</p>
          {chats.length === 0 ? (
            <p className="text-sm text-white/30 px-2 italic">No chats yet. Start a new one!</p>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={cn(
                  "w-full flex items-center space-x-3 p-3 rounded-2xl transition-all group",
                  activeChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                  {chat.type === 'general' ? <MessageSquare className="w-4 h-4 text-white/60" /> : <Languages className="w-4 h-4 text-white/60" />}
                </div>
                <div className="flex-1 text-left truncate">
                  <p className="text-sm font-medium text-white truncate">{chat.title}</p>
                  <p className="text-xs text-white/40 truncate">{chat.lastMessage || 'No messages yet'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 space-y-4">
        <div className="flex items-center space-x-3 p-2">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} /> : <UserIcon className="w-full h-full p-2 text-white/40" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onOpenSettings}
            className="flex items-center justify-center space-x-2 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-white/60 text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center space-x-2 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-red-400/80 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const VirtualKeyboard = ({ 
  language, 
  onKeyPress, 
  onBackspace,
  onEnter,
  onClose
}: { 
  language: string, 
  onKeyPress: (char: string) => void, 
  onBackspace: () => void,
  onEnter: () => void,
  onClose: () => void
}) => {
  const charset = LANGUAGE_CHARSETS[language] || [];
  
  if (charset.length === 0) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="bg-zinc-900 border-t border-white/10 p-4 pb-8 space-y-4 shadow-2xl z-30"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <KeyboardIcon className="w-4 h-4 text-white/40" />
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{language} Keyboard</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg">
          <X className="w-4 h-4 text-white/40" />
        </button>
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5 max-h-[40vh] overflow-y-auto p-1 custom-scrollbar">
        {charset.map((char, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onKeyPress(char)}
            className="h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-xl hover:bg-white/10 active:scale-90 transition-all text-white font-medium"
          >
            {char}
          </button>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-white/10 active:scale-95 transition-all text-white/40 uppercase tracking-tighter"
          title="Switch to Standard Keyboard"
        >
          <TypeIcon className="w-4 h-4 mr-1" />
          ABC
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className="flex-1 h-12 flex items-center justify-center bg-white/10 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/20 active:scale-95 transition-all text-white"
        >
          DEL
        </button>
        <button
          type="button"
          onClick={() => onKeyPress(' ')}
          className="flex-[4] h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 active:scale-95 transition-all text-white/60"
        >
          SPACE BAR
        </button>
        <button
          type="button"
          onClick={onEnter}
          className="flex-1 h-12 flex items-center justify-center bg-white text-black border border-white/10 rounded-xl text-sm font-bold hover:bg-white/90 active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const ChatArea = ({ 
  activeChat, 
  messages, 
  onSendMessage,
  onPronunciationPractice,
  onDeleteMessage,
  onDeleteChat,
  isProcessing,
  nativeLanguage,
  inputMethod,
  recognitionRef
}: { 
  activeChat: ChatSession | null, 
  messages: Message[], 
  onSendMessage: (content: string) => void,
  onPronunciationPractice: (word: string, audioBase64: string) => void,
  onDeleteMessage: (id: string) => void,
  onDeleteChat: (id: string) => void,
  isProcessing: boolean,
  nativeLanguage?: string,
  inputMethod?: 'standard' | 'native',
  recognitionRef: React.RefObject<any>
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'starting' | 'listening' | 'speaking'>('idle');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'listening' | 'recording' | 'processing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Configure shared Speech Recognition
    const recognition = recognitionRef.current;
    if (recognition) {
      // Map native language to BCP 47
      const langMap: Record<string, string> = {
        'Hindi': 'hi-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN', 'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN', 'Bengali': 'bn-IN', 'Gujarati': 'gu-IN', 'Marathi': 'mr-IN',
        'Punjabi': 'pa-IN', 'English': 'en-US'
      };

      recognition.lang = (nativeLanguage && langMap[nativeLanguage]) || 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev: string) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
        }
      };

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechStatus('listening');
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechStatus('idle');
      };

      recognition.onspeechstart = () => {
        setSpeechStatus('speaking');
      };

      recognition.onspeechend = () => {
        setSpeechStatus('listening');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechStatus('idle');
        if (event.error === 'not-allowed') {
          toast.error("Microphone access required.");
        }
      };
    }
  }, [nativeLanguage, recognitionRef]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput("");
    setShowKeyboard(false);
    if (isListening) stopListening();
  };

  const handleKeyPress = (char: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const newValue = input.substring(0, start) + char + input.substring(end);
      setInput(newValue);
      
      // Set cursor position after update
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = start + char.length;
          inputRef.current.focus();
        }
      }, 0);
    } else {
      setInput((prev: string) => prev + char);
    }
  };

  const handleBackspace = () => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      
      if (start !== end) {
        setInput(input.substring(0, start) + input.substring(end));
      } else if (start > 0) {
        setInput(input.substring(0, start - 1) + input.substring(start));
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd = start - 1;
            inputRef.current.focus();
          }
        }, 0);
      }
    } else {
      setInput((prev: string) => prev.slice(0, -1));
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setIsListening(true); // Instant UI feedback
        setSpeechStatus('starting');
        recognitionRef.current.start();
        toast.info(`Listening in ${nativeLanguage || 'English'}...`);
      } catch (err: any) {
        console.error("Failed to start recognition:", err);
        // If already started, just ensure state is correct
        if (err.name === 'InvalidStateError') {
          setIsListening(true);
          setSpeechStatus('listening');
        } else {
          setIsListening(false);
          setSpeechStatus('idle');
          toast.error("Microphone access failed.");
        }
      }
    } else {
      toast.error("Speech recognition not supported.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error("Failed to stop recognition:", err);
        setIsListening(false);
      }
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startRecording = async (text: string) => {
    try {
      let wordToPractice = text;
      const nativeMatch = text.match(/\*\*Target Language \(Script\)\*\*:\s*(.+)/i) || 
                          text.match(/\*\*Native Script\*\*:\s*(.+)/i) || 
                          text.match(/Native:\s*(.+)/i);
      if (nativeMatch && nativeMatch[1]) {
        wordToPractice = nativeMatch[1].split('\n')[0].trim();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setRecordingState('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await onPronunciationPractice(wordToPractice, base64Audio);
          setRecordingState('idle');
        };
        stream.getTracks().forEach(track => track.stop());
      };

      setRecordingState('listening');
      setTimeout(() => {
        setRecordingState('recording');
        mediaRecorder.start();
      }, 500);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const stopSpeaking = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(null);
  };

  const playFallbackSpeech = async (text: string, language?: string, messageId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error("Speech synthesis not supported in this browser.");
      setIsSpeaking(null);
      return;
    }

    try {
      // Cancel any current speech to avoid overlapping or stuck states
      window.speechSynthesis.cancel();

      setIsSpeaking(messageId || null);
      const utterance = new SpeechSynthesisUtterance(text);
      
      const langMap: Record<string, string> = {
        'Hindi': 'hi-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN', 'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN', 'Bengali': 'bn-IN', 'Gujarati': 'gu-IN', 'Marathi': 'mr-IN',
        'Punjabi': 'pa-IN', 'English': 'en-US'
      };

      const targetLang = language ? langMap[language] : 'en-US';
      utterance.lang = targetLang || 'en-US';
      
      // Try to find a matching voice
      let voices = window.speechSynthesis.getVoices();
      console.log(`playFallbackSpeech - Available voices: ${voices.length}, target: ${targetLang}`);
      
      const findVoice = (l: string) => {
        const lowerL = l.toLowerCase();
        return voices.find(v => v.lang.toLowerCase() === lowerL) || 
               voices.find(v => v.lang.toLowerCase().startsWith(lowerL.split('-')[0]));
      };

      let voice = findVoice(targetLang);
      
      if (!voice && voices.length === 0) {
        // Wait a bit for voices to load
        await new Promise(resolve => setTimeout(resolve, 100));
        voices = window.speechSynthesis.getVoices();
        voice = findVoice(targetLang);
      }

      if (voice) {
        console.log(`playFallbackSpeech - Found voice: ${voice.name} (${voice.lang})`);
        utterance.voice = voice;
      } else {
        console.warn(`playFallbackSpeech - No specific voice found for ${targetLang}, using default.`);
      }

      utterance.onstart = () => {
        console.log("playFallbackSpeech - Started speaking");
      };

      utterance.onend = () => {
        console.log("playFallbackSpeech - Finished speaking");
        setIsSpeaking(null);
      };

      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        setIsSpeaking(null);
        // 'interrupted' and 'canceled' are normal when we stop or start new speech
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          toast.error(`Browser speech failed: ${e.error}`);
        }
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Fallback speech error:", err);
      setIsSpeaking(null);
    }
  };

  const handleListen = async (text: string, messageId: string) => {
    if (isSpeaking === messageId) {
      stopSpeaking();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(null);
      return;
    }
    
    if (isSpeaking) {
      stopSpeaking();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    try {
      setIsGeneratingAudio(messageId);
      
      let textToSpeak = text;
      
      // Robust extraction for tutor responses
      const scriptPatterns = [
        /\*\*Target Language \(Script\)\*\*:\s*(.+)/i,
        /\*\*Native Script\*\*:\s*(.+)/i,
        /\*\*Script\*\*:\s*(.+)/i,
        /1\.\s*\*\*Target Script\*\*:\s*(.+)/i,
        /1\.\s*Target Script\s*:\s*(.+)/i,
        /1\.\s*\*\*Target Language \(Script\)\*\*:\s*(.+)/i,
        /1\.\s*Target Language \(Script\):\s*(.+)/i,
        /\*\*1\.\s*Target Language \(Script\)\*\*:\s*(.+)/i,
        /1\.\s*Target Language\s*:\s*(.+)/i,
        /^1\.\s*[^:]+:\s*(.+)/m,
        new RegExp(`\\*\\*${activeChat?.language} \\(Script\\)\\*\\*:\\s*(.+)`, 'i'),
        new RegExp(`\\*\\*1\\.\\s*${activeChat?.language} \\(Script\\)\\*\\*:\\s*(.+)`, 'i'),
        new RegExp(`\\*\\*${activeChat?.language}\\*\\*:\\s*(.+)`, 'i'),
        new RegExp(`1\\.\\s*\\*\\*${activeChat?.language}\\*\\*:\\s*(.+)`, 'i'),
        /Native:\s*(.+)/i,
        /Script:\s*(.+)/i,
        /Target:\s*(.+)/i
      ];

      let found = false;
      for (const pattern of scriptPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          textToSpeak = match[1].split('\n')[0].replace(/\([^)]*\)/g, '').trim();
          if (textToSpeak) {
            found = true;
            break;
          }
        }
      }

      // If not found and text is long, try to find a line that contains characters of the target language
      if (!found) {
        const lines = text.split('\n');
        const scriptRanges: Record<string, RegExp> = {
          'Punjabi': /[\u0A00-\u0A7F]/,
          'Hindi': /[\u0900-\u097F]/,
          'Tamil': /[\u0B80-\u0BFF]/,
          'Telugu': /[\u0C00-\u0C7F]/,
          'Kannada': /[\u0C80-\u0CFF]/,
          'Malayalam': /[\u0D00-\u0D7F]/,
          'Bengali': /[\u0980-\u09FF]/,
          'Marathi': /[\u0900-\u097F]/,
          'Gujarati': /[\u0A80-\u0AFF]/
        };

        const targetRange = activeChat?.language ? scriptRanges[activeChat.language] : null;

        if (targetRange) {
          for (const line of lines) {
            if (targetRange.test(line)) {
              // Clean the line: remove leading numbers, labels, and parentheticals
              textToSpeak = line
                .replace(/^[0-9.\s*]+/, '')
                .replace(/^[^:]+:\s*/, '')
                .replace(/\([^)]*\)/g, '')
                .trim();
              if (textToSpeak) {
                found = true;
                break;
              }
            }
          }
        }
        
        if (!found && text.length > 150) {
          textToSpeak = text.split('\n')[0].substring(0, 150);
        }
      }

      console.log(`handleListen - Language: ${activeChat?.language}, Extracted text: "${textToSpeak}"`);

      if (!textToSpeak.trim()) {
        toast.error("Could not find text to pronounce.");
        setIsSpeaking(null);
        return;
      }

      // Show a small toast with the text being spoken for debugging
      toast.info(`Speaking: ${textToSpeak.substring(0, 50)}${textToSpeak.length > 50 ? '...' : ''}`, {
        duration: 2000,
        position: 'top-center'
      });

      const base64 = await generateSpeech(textToSpeak, activeChat?.language);
      setIsGeneratingAudio(null);
      
      if (base64) {
        console.log(`handleListen - Received base64 audio, length: ${base64.length}`);
        try {
          setIsSpeaking(messageId);
          const binaryString = window.atob(base64);
          const len = binaryString.length;
          const bufferLen = len % 2 === 0 ? len : len - 1;
          const arrayBuffer = new ArrayBuffer(bufferLen);
          const bytes = new Uint8Array(arrayBuffer);
          for (let i = 0; i < bufferLen; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const pcmData = new Int16Array(arrayBuffer);
          console.log(`handleListen - PCM data length: ${pcmData.length} samples`);
          
          if (pcmData.length === 0) {
            throw new Error("Empty PCM data generated.");
          }

          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          
          const audioContext = audioContextRef.current;
          if (audioContext.state === 'suspended') {
            console.log("handleListen - Resuming suspended AudioContext");
            await audioContext.resume();
          }
          
          console.log(`handleListen - AudioContext state: ${audioContext.state}, sampleRate: ${audioContext.sampleRate}`);
          
          const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
          const channelData = audioBuffer.getChannelData(0);
          for (let i = 0; i < pcmData.length; i++) {
            channelData[i] = pcmData[i] / 32768;
          }
          
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          audioSourceRef.current = source;
          
          source.onended = () => {
            console.log("handleListen - Audio playback ended");
            setIsSpeaking(null);
          };
          
          console.log("handleListen - Starting audio source");
          source.start();
        } catch (audioErr) {
          console.error("Audio playback error:", audioErr);
          setIsSpeaking(null);
          toast.error("Primary audio failed, trying fallback...");
          playFallbackSpeech(textToSpeak, activeChat?.language, messageId);
        }
      } else {
        console.log("Falling back to browser speech synthesis");
        playFallbackSpeech(textToSpeak, activeChat?.language, messageId);
      }
    } catch (error) {
      console.error("Error in handleListen:", error);
      toast.error("Failed to process audio.");
      setIsSpeaking(null);
      setIsGeneratingAudio(null);
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black">
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6">
          <Globe className="w-10 h-10 text-white/40" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to IndicSpeak</h2>
        <p className="text-white/40 max-w-sm">Select a chat from the sidebar or start a new conversation to begin your language journey.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black relative">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            {activeChat.type === 'general' ? <MessageSquare className="w-4 h-4 text-white" /> : <Languages className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{activeChat.title}</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">{activeChat.type === 'tutor' ? `Learning ${activeChat.language}` : 'General Assistant'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to delete this entire chat?")) {
                onDeleteChat(activeChat.id);
              }
            }}
            className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-400/60 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((msg, idx) => (
          <motion.div 
            key={msg.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex w-full group",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[80%] space-y-2 relative",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-white text-black font-medium" 
                  : "bg-white/5 border border-white/10 text-white"
              )}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div className={cn(
                "flex items-center space-x-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
                msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row"
              )}>
                <button 
                  onClick={() => handleListen(msg.content, msg.id || `${idx}`)}
                  className={cn(
                    "p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative",
                    (isSpeaking === (msg.id || `${idx}`) || isGeneratingAudio === (msg.id || `${idx}`)) && "bg-white/20"
                  )}
                  title={isSpeaking === (msg.id || `${idx}`) ? "Stop" : "Listen"}
                >
                  {isGeneratingAudio === (msg.id || `${idx}`) ? (
                    <Loader2 className="w-3 h-3 text-white/60 animate-spin" />
                  ) : isSpeaking === (msg.id || `${idx}`) ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Square className="w-3 h-3 text-white fill-white/40" />
                    </motion.div>
                  ) : (
                    <Volume2 className="w-3 h-3 text-white/60" />
                  )}
                </button>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => startRecording(msg.content)}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[10px] font-bold text-white/60 uppercase tracking-wider px-2"
                    title="Practice"
                  >
                    Practice
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (confirm("Delete this message?")) {
                      onDeleteMessage(msg.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-white/30" />
                </button>
              </div>

              {msg.isPronunciationFeedback && msg.feedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 w-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/10 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <h4 className="font-bold text-white">Pronunciation Result</h4>
                    </div>
                    <div className="text-2xl font-black text-white">{msg.feedback.score}%</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Feedback</p>
                      <p className="text-sm text-white">{msg.feedback.comment}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Mistakes Identified</p>
                      <p className="text-sm text-red-400/80">{msg.feedback.mistakes}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Tips for Improvement</p>
                      <p className="text-sm text-white/80 italic">{msg.feedback.tips}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center space-x-3">
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
              <span className="text-sm text-white/40">IndicSpeak is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording Overlay */}
      <AnimatePresence>
        {recordingState !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-20"
          >
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-3xl shadow-2xl space-y-4 text-center">
              <div className="flex justify-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                  recordingState === 'listening' && "bg-blue-500 animate-pulse",
                  recordingState === 'recording' && "bg-red-500 scale-110",
                  recordingState === 'processing' && "bg-white/20"
                )}>
                  {recordingState === 'processing' ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : recordingState === 'recording' ? (
                    <Square className="w-6 h-6 text-white fill-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white capitalize">{recordingState}...</h4>
                <p className="text-sm text-white/60">
                  {recordingState === 'listening' && "Get ready to speak"}
                  {recordingState === 'recording' && "Speak clearly now"}
                  {recordingState === 'processing' && "Analyzing your pronunciation"}
                </p>
              </div>
              {recordingState === 'recording' && (
                <button 
                  onClick={stopRecording}
                  className="w-full bg-white text-black font-bold py-3 rounded-2xl hover:bg-white/90 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-gradient-to-t from-black via-black to-transparent">
        <div className="p-6">
          <form 
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto relative group"
          >
            <div className={cn(
              "absolute -inset-0.5 bg-gradient-to-r from-white/20 to-white/5 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500",
              isListening && "opacity-100 from-red-500/20 to-orange-500/20"
            )} />
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-3xl p-2 backdrop-blur-xl">
              <button 
                type="button"
                onClick={toggleMic}
                className={cn(
                  "p-3 rounded-2xl transition-all relative",
                  isListening ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "hover:bg-white/5 text-white/40"
                )}
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Square className="w-6 h-6 fill-white" />
                  </motion.div>
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
              <div className="flex-1 flex flex-col min-w-0">
                {isListening && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-8 left-4 flex items-center space-x-2"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      speechStatus === 'starting' && "bg-blue-500 animate-pulse",
                      speechStatus === 'listening' && "bg-green-500 animate-pulse",
                      speechStatus === 'speaking' && "bg-red-500 animate-bounce"
                    )} />
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      speechStatus === 'starting' && "text-blue-500",
                      speechStatus === 'listening' && "text-green-500",
                      speechStatus === 'speaking' && "text-red-500"
                    )}>
                      {speechStatus === 'starting' && "Initializing..."}
                      {speechStatus === 'listening' && `Listening in ${nativeLanguage || 'English'}...`}
                      {speechStatus === 'speaking' && "Recording Speech..."}
                    </span>
                  </motion.div>
                )}
                <div className="relative flex items-center">
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isProcessing}
                    placeholder={isListening ? "Listening..." : (inputMethod === 'native' ? `Type in ${nativeLanguage}...` : "Ask anything...")}
                    className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder:text-white/20 disabled:opacity-50"
                  />
                  {input && (
                    <button
                      type="button"
                      onClick={() => {
                        setInput("");
                        inputRef.current?.focus();
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white/40 transition-colors mr-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {nativeLanguage && inputMethod === 'native' && (
                <button 
                  type="button"
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className={cn(
                    "p-3 rounded-2xl transition-all mr-2",
                    showKeyboard ? "bg-white/20 text-white" : "hover:bg-white/5 text-white/40"
                  )}
                >
                  <KeyboardIcon className="w-6 h-6" />
                </button>
              )}
              <button 
                type="submit"
                disabled={(!input.trim() && !isListening) || isProcessing}
                className="p-3 bg-white text-black rounded-2xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </form>
        </div>
        
        <AnimatePresence>
          {showKeyboard && nativeLanguage && (
            <VirtualKeyboard 
              language={nativeLanguage}
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onEnter={handleSubmit}
              onClose={() => setShowKeyboard(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const NewChatModal = ({ 
  isOpen, 
  onClose, 
  onCreateChat 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onCreateChat: (type: 'general' | 'tutor', language?: string) => void 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] bg-black border border-white/10 rounded-3xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/40" />
            </button>
            <h2 className="text-xl font-bold text-white">Start New Conversation</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">General Assistant</p>
            <button 
              onClick={() => onCreateChat('general')}
              className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-white/20">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-white">General Chat</p>
                  <p className="text-sm text-white/40">Ask about grammar, vocabulary, or translation.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Language Tutors</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INDIAN_LANGUAGES.filter(l => l.id !== 'english').map(lang => (
                <button 
                  key={lang.id}
                  onClick={() => onCreateChat('tutor', lang.name)}
                  className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                >
                  <span className="text-2xl mb-2">{lang.native}</span>
                  <span className="text-sm font-bold text-white">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  user,
  onUpdateNativeLanguage,
  onUpdateInputMethod
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: UserProfile | null,
  onUpdateNativeLanguage: (lang: string) => void,
  onUpdateInputMethod: (method: 'standard' | 'native') => void
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-black border border-white/10 rounded-3xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Profile Information</p>
            <div className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 overflow-hidden">
                {user?.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} /> : <UserIcon className="w-full h-full p-3 text-white/40" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user?.displayName}</p>
                <p className="text-xs text-white/40">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Learning Preferences</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Your Native Language</label>
                <select 
                  value={user?.nativeLanguage || ""}
                  onChange={(e) => onUpdateNativeLanguage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none"
                >
                  <option value="" disabled className="bg-black">Select Native Language</option>
                  {INDIAN_LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.name} className="bg-black">
                      {lang.name} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/60">Input Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onUpdateInputMethod('standard')}
                    className={cn(
                      "flex items-center justify-center space-x-2 p-3 rounded-2xl border transition-all",
                      user?.inputMethod === 'standard' || !user?.inputMethod ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <TypeIcon className="w-4 h-4" />
                    <span className="text-xs font-bold">Standard</span>
                  </button>
                  <button 
                    onClick={() => onUpdateInputMethod('native')}
                    className={cn(
                      "flex items-center justify-center space-x-2 p-3 rounded-2xl border transition-all",
                      user?.inputMethod === 'native' ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <KeyboardIcon className="w-4 h-4" />
                    <span className="text-xs font-bold">Native Keyboard</span>
                  </button>
                </div>
                <p className="text-[10px] text-white/30 italic">Native keyboard allows typing directly in your script.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [explainInEnglish] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Pre-initialize Speech Recognition at App level
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;
      console.log("IndicSpeak: SpeechRecognition pre-initialized");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser(userSnap.data() as UserProfile);
          } else {
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newUser);
            setUser(newUser as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'), 
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      setChats(chatList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, `chats/${activeChatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeChatId}/messages`);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const handleCreateChat = async (type: 'general' | 'tutor', language?: string) => {
    if (!user) return;

    try {
      const chatData: Omit<ChatSession, 'id'> = {
        userId: user.uid,
        type,
        language,
        title: type === 'general' ? 'General Chat' : `${language} Tutor`,
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData).catch(err => handleFirestoreError(err, OperationType.CREATE, 'chats'));
      if (!docRef) return;
      setActiveChatId(docRef.id);
      setIsNewChatModalOpen(false);
      
      setIsProcessing(true);
      const greeting = await generateChatResponse(
        [{ role: 'user', content: `Start a new ${type} session${language ? ` for ${language}` : ''}. Introduce yourself and offer to help me learn. Remember to ALWAYS use the 4-layer response format: 1. Target Script, 2. Transliteration, 3. English Meaning, and 4. Native Explanation (${user?.nativeLanguage || 'English'}).` }],
        language,
        type,
        explainInEnglish,
        user?.nativeLanguage
      );

      await addDoc(collection(db, `chats/${docRef.id}/messages`), {
        chatId: docRef.id,
        role: 'assistant',
        content: greeting,
        timestamp: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `chats/${docRef.id}/messages`));
      setIsProcessing(false);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to create chat.");
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChatId || !user || isProcessing) return;

    try {
      setIsProcessing(true);
      // Add user message
      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        chatId: activeChatId,
        role: 'user',
        content,
        timestamp: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `chats/${activeChatId}/messages`));

      // Update chat last message
      await setDoc(doc(db, 'chats', activeChatId), {
        lastMessage: content,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `chats/${activeChatId}`));

      // Get AI response
      const activeChat = chats.find(c => c.id === activeChatId);
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content });

      const aiResponse = await generateChatResponse(chatHistory, activeChat?.language, activeChat?.type, explainInEnglish, user?.nativeLanguage);

      // Add AI message
      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        chatId: activeChatId,
        role: 'assistant',
        content: aiResponse,
        timestamp: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `chats/${activeChatId}/messages`));
      setIsProcessing(false);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to send message.");
      }
    }
  };

  const handlePronunciationPractice = async (text: string, audioBase64: string) => {
    if (!activeChatId || !user) return;

    try {
      setIsProcessing(true);
      const activeChat = chats.find(c => c.id === activeChatId);
      const feedback = await evaluatePronunciation(text, audioBase64, activeChat?.language || 'Hindi', user?.nativeLanguage);

      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        chatId: activeChatId,
        role: 'assistant',
        content: `Pronunciation feedback for: "${text.substring(0, 50)}..."`,
        timestamp: serverTimestamp(),
        isPronunciationFeedback: true,
        feedback
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `chats/${activeChatId}/messages`));
      setIsProcessing(false);
      toast.success("Feedback received!");
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to evaluate pronunciation.");
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChatId) return;
    try {
      await deleteDoc(doc(db, `chats/${activeChatId}/messages`, messageId)).catch(err => handleFirestoreError(err, OperationType.DELETE, `chats/${activeChatId}/messages/${messageId}`));
      toast.success("Message deleted.");
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to delete message.");
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteDoc(doc(db, 'chats', chatId)).catch(err => handleFirestoreError(err, OperationType.DELETE, `chats/${chatId}`));
      if (activeChatId === chatId) setActiveChatId(null);
      toast.success("Chat deleted.");
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to delete chat.");
      }
    }
  };

  const handleLogout = () => {
    signOut(auth);
    toast.success("Logged out successfully.");
  };

  const handleUpdateNativeLanguage = async (lang: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { nativeLanguage: lang }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
      setUser({ ...user, nativeLanguage: lang });
      toast.success(`Native language updated to ${lang}`);
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to update native language.");
      }
    }
  };

  const handleUpdateInputMethod = async (method: 'standard' | 'native') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { inputMethod: method }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
      setUser({ ...user, inputMethod: method });
      toast.success(`Input method updated to ${method}`);
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.includes('FirestoreErrorInfo'))) {
        toast.error("Failed to update input method.");
      }
    }
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" /></div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        onChatSelect={setActiveChatId} 
        onNewChat={() => setIsNewChatModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
        user={user}
      />
      
      <ChatArea 
        activeChat={chats.find(c => c.id === activeChatId) || null} 
        messages={messages} 
        onSendMessage={handleSendMessage}
        onPronunciationPractice={handlePronunciationPractice}
        onDeleteMessage={handleDeleteMessage}
        onDeleteChat={handleDeleteChat}
        isProcessing={isProcessing}
        nativeLanguage={user?.nativeLanguage}
        inputMethod={user?.inputMethod}
        recognitionRef={recognitionRef}
      />

      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)} 
        onCreateChat={handleCreateChat}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        user={user}
        onUpdateNativeLanguage={handleUpdateNativeLanguage}
        onUpdateInputMethod={handleUpdateInputMethod}
      />

      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
