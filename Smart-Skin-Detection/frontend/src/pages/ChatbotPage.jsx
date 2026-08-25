import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, Activity, Sparkles, Smile } from 'lucide-react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      reply: "Hello, I am your AI Dermatology Assistant. Ask me anything about skin issues like Acne, Eczema, or Psoriasis.",
      sender: "AI Assistant",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Audio speech states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const recognitionRef = useRef(null);
  const activeUtterance = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    // Initialize Web Speech API for voice recognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      rec.onerror = () => {
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput('');
    
    // Add user message
    setMessages((prev) => [...prev, {
      reply: query,
      sender: "User",
      timestamp: new Date().toISOString()
    }]);

    setLoading(true);
    
    // Cancel any ongoing speaking speech
    stopSpeaking();

    try {
      const res = await axios.post('/chatbot/message', { message: query });
      const replyObj = {
        reply: res.data.reply,
        sender: "AI Assistant",
        timestamp: res.data.timestamp
      };
      
      setMessages((prev) => [...prev, replyObj]);
      
      // Play voice output if allowed
      if (voiceEnabled) {
        speakResponse(res.data.reply);
      }
    } catch (err) {
      console.error("Chat message failed:", err);
      setMessages((prev) => [...prev, {
        reply: "Error matching medical criteria. Check connections.",
        sender: "AI Assistant",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      stopSpeaking();
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return;
    
    // Strip markdown formatting characters to speak clearly
    const cleanText = text.replace(/[*#_`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    
    utterance.onstart = () => setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);
    
    activeUtterance.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <MessageSquare className="w-8 h-8 text-primary-500" />
            <span>AI Dermatology Agent</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Clinical Chatbot &bull; Ask details regarding Acne, Psoriasis, Eczema, and basic skincare tips.
          </p>
        </div>

        {/* Speech Controls */}
        <div className="flex items-center space-x-2">
          {isPlayingVoice && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200/50 rounded-full">
              <Activity className="w-3.5 h-3.5 text-secondary-500 animate-pulse" />
              <span className="text-[10px] font-black text-secondary-500 uppercase">Speaking</span>
            </div>
          )}
          <button
            onClick={() => {
              const enabled = !voiceEnabled;
              setVoiceEnabled(enabled);
              if (!enabled) stopSpeaking();
            }}
            className={`p-2.5 rounded-xl transition ${voiceEnabled ? 'bg-secondary-500 text-white shadow-md' : 'border'}`}
            title="Toggle Voice Output"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main chat window */}
      <div className="glass-panel border shadow-lg flex flex-col h-[520px]">
        
        {/* Messages scroll content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar">
          {messages.map((m, idx) => {
            const isUser = m.sender === 'User';
            return (
              <div 
                key={idx} 
                className={`flex items-start gap-3.5 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0 ${isUser ? 'bg-primary-500' : 'bg-gradient-to-tr from-secondary-500 to-accent-500'}`}>
                  {isUser ? 'U' : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 shadow-sm ${
                  isUser 
                    ? 'bg-primary-500 text-white border-primary-400' 
                    : 'glass-card border-slate-200/60 dark:border-slate-800'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{m.reply}</p>
                  <span className={`text-[9px] block ${isUser ? 'text-primary-100' : 'text-slate-400'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex items-start gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-lg bg-secondary-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl glass-card border flex items-center space-x-2">
                <span className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input panel bar */}
        <form onSubmit={handleSend} className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
          
          {/* Voice button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3.5 rounded-xl transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'border hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Record Question"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? 'Listening for question...' : t('chatbot_placeholder')}
            className="flex-1 px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
          />

          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:scale-[1.01] active:scale-95 disabled:opacity-45 disabled:hover:scale-100 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
}
