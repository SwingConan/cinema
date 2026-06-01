import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import {
  Mic, MicOff, Send, Bot, User, Sparkles, X,
  Film, Calendar, ArrowRight, Loader2, MessageCircle,
} from "lucide-react";

// ── SPEECH RECOGNITION ─────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceBookingAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isBookingPage = location.pathname.startsWith("/booking");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "🎬 Xin chào! Tôi là **CineBot** — trợ lý đặt vé AI của CinemaMS.\n\nBạn có thể nói hoặc gõ yêu cầu như:\n- *\"Phim gì đang chiếu?\"*\n- *\"Tôi muốn xem phim hành động\"*\n- *\"Lịch chiếu Spider-Man\"*",
      suggestions: ["Phim đang chiếu", "Phim hành động", "Lịch chiếu hôm nay"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Init speech recognition
  useEffect(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setIsListening(false);
      // Auto-send
      handleSend(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  // Toggle mic
  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt không hỗ trợ Speech Recognition.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Send message
  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content }));

      const res = await api.post("/customer/voice-booking", { text: msg, history });
      const data = res.data;

      let content = data.response || "Tôi không hiểu yêu cầu. Vui lòng thử lại.";

      // Enrich with showtime cards
      if (data.intent === "search_showtime" && data.data?.length > 0) {
        content += "\n\n---\n";
        data.data.forEach(s => {
          const dt = new Date(String(s.startTime).replace("Z", ""));
          content += `\n📅 **${dt.toLocaleDateString("vi-VN")}** ${dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} — ${s.roomName} (${s.roomType}) — ${s.availableSeats} ghế trống`;
        });
      }

      // Enrich with movie list
      if (data.intent === "search_movie" && data.data?.length > 0) {
        content += "\n\n---\n";
        data.data.forEach(m => {
          content += `\n🎬 **${m.title}** (${m.genre || "N/A"}, ${m.duration}p)`;
        });
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content,
        suggestions: data.suggestions || [],
        intent: data.intent,
        data: data.data,
        entities: data.entities,
      }]);

      // Auto-navigate nếu select_showtime
      if (data.intent === "select_showtime" && data.entities?.showtimeId) {
        setTimeout(() => {
          navigate(`/booking/${data.entities.showtimeId}`);
          setIsOpen(false);
        }, 1500);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Đã xảy ra lỗi. Vui lòng thử lại sau.",
        suggestions: ["Thử lại", "Phim đang chiếu"],
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, navigate]);

  if (!user || user.role !== "customer") return null;

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${isBookingPage ? "bottom-32" : "bottom-20"} right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#E50914] to-[#b81d24] rounded-full shadow-2xl shadow-red-900/50 flex items-center justify-center hover:scale-110 transition-transform group cursor-pointer`}
          title="Trợ lý đặt vé AI"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-full sm:h-[560px] bg-[#141414] border-0 sm:border border-[#2a2a2a] rounded-none sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
             style={{ animation: "slideUp 0.25s ease-out" }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#E50914] to-[#b81d24] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm">CineBot AI</h3>
                <p className="text-red-200 text-[10px] font-medium">Trợ lý đặt vé thông minh</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-red-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user"
                  ? "bg-[#E50914] text-white rounded-2xl rounded-br-md"
                  : "bg-[#1e1e1e] border border-[#2a2a2a] text-gray-200 rounded-2xl rounded-bl-md"
                } px-4 py-3`}>
                  {/* Icon */}
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.role === "assistant"
                      ? <Bot className="w-3.5 h-3.5 text-[#E50914]" />
                      : <User className="w-3.5 h-3.5 text-red-200" />}
                    <span className="text-[10px] font-bold opacity-60">
                      {msg.role === "assistant" ? "CineBot" : "Bạn"}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {msg.content.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith("**") ? (
                        <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>
                      ) : part.startsWith("*") && part.endsWith("*") ? (
                        <em key={j} className="text-gray-400">{part.slice(1, -1)}</em>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                  {/* Showtime cards */}
                  {msg.data && msg.intent === "search_showtime" && (
                    <div className="mt-2 space-y-1.5">
                      {msg.data.map(s => (
                        <button key={s.showtimeId}
                          onClick={() => { navigate(`/booking/${s.showtimeId}`); setIsOpen(false); }}
                          className="w-full text-left bg-[#111] border border-[#333] rounded-lg px-3 py-2 hover:border-[#E50914] transition-colors group/card">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
                              <span className="text-xs font-bold text-white">
                                {new Date(String(s.startTime).replace("Z","")).toLocaleString("vi-VN", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"2-digit" })}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover/card:text-[#E50914] transition-colors" />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{s.roomName} ({s.roomType}) · {s.availableSeats} ghế trống</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Movie cards */}
                  {msg.data && msg.intent === "search_movie" && (
                    <div className="mt-2 space-y-1.5">
                      {msg.data.map(m => (
                        <button key={m.movieId}
                          onClick={() => { navigate(`/movies/${m.movieId}`); setIsOpen(false); }}
                          className="w-full text-left bg-[#111] border border-[#333] rounded-lg px-3 py-2 hover:border-[#E50914] transition-colors group/card">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Film className="w-3.5 h-3.5 text-[#E50914]" />
                              <span className="text-xs font-bold text-white">{m.title}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover/card:text-[#E50914] transition-colors" />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{m.genre || "N/A"} · {m.duration}p</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Suggestions */}
                  {msg.suggestions?.length > 0 && msg.role === "assistant" && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {msg.suggestions.map((s, j) => (
                        <button key={j} onClick={() => handleSend(s)}
                          className="text-[10px] px-2.5 py-1 bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/30 rounded-full hover:bg-[#E50914]/20 font-bold transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#E50914] animate-spin" />
                  <span className="text-xs text-gray-500">CineBot đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#2a2a2a] p-3 flex items-center gap-2 flex-shrink-0 bg-[#111]">
            <button
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-all ${isListening
                ? "bg-[#E50914] text-white animate-pulse shadow-lg shadow-red-900/50"
                : "bg-[#222] text-gray-400 hover:text-white hover:bg-[#333]"}`}
              title={isListening ? "Đang nghe..." : "Nói để đặt vé"}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "🎤 Đang nghe..." : "Nhập yêu cầu..."}
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#E50914] outline-none transition-colors"
              disabled={isListening}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
