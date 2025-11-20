// src/Pages/Chat/Chat.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import {
  sendMessage,
  subscribeToConversation,
  markConversationAsRead,
} from "../../services/messages";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

export default function Chat() {
  const { otherUserId, otherUserName } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suscribirse a los mensajes de la conversación
  useEffect(() => {
    if (!user?.uid || !otherUserId) return;

    const unsubscribe = subscribeToConversation(user.uid, otherUserId, (msgs) => {
      setMessages(msgs);
    });

    // Marcar como leído
    markConversationAsRead(user.uid, otherUserId, user.uid);

    return () => unsubscribe();
  }, [user?.uid, otherUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputText.trim()) {
      setError("El mensaje no puede estar vacío");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendMessage({
        senderId: user.uid,
        senderName: user.displayName || "Usuario",
        receiverId: otherUserId,
        receiverName: otherUserName || "Usuario",
        text: inputText,
      });

      setInputText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav("/mensajes")}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">{otherUserName || "Usuario"}</h1>
              <p className="text-sm text-white/70">Conversación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-2xl mx-auto h-[calc(100vh-180px)] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay mensajes aún</p>
              <p className="text-sm text-gray-400">Inicia la conversación</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSender = msg.senderId === user?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl ${
                    isSender
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {isSender ? "Tú" : msg.senderName}
                  </p>
                  <p className="break-words">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isSender ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {dayjs(msg.timestamp?.toDate?.()).fromNow()}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto p-4 border-t border-gray-200 bg-white">
        {error && (
          <p className="text-red-600 text-sm mb-2">{error}</p>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none"
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
