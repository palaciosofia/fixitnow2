// src/Pages/Chat/Chat.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, MessageSquare, Clock, CheckCheck } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import {
  sendMessage,
  subscribeToConversation,
  markConversationAsRead,
} from "../../services/messages";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.extend(utc);
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
  const inputRef = useRef(null);

  // Debug: verificar parámetros
  useEffect(() => {
    console.log("📱 Chat params:", { otherUserId, otherUserName });
  }, [otherUserId, otherUserName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suscribirse a los mensajes de la conversación
  useEffect(() => {
    if (!user?.uid || !otherUserId) {
      console.warn("⚠️ Falta user?.uid o otherUserId", { userUid: user?.uid, otherUserId });
      return;
    }

    console.log("✅ Suscribiendo a conversación", { userId: user.uid, otherUserId });
    const unsubscribe = subscribeToConversation(user.uid, otherUserId, (msgs) => {
      console.log("📨 Mensajes recibidos:", msgs.length);
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
      console.log("📤 Enviando mensaje:", {
        senderId: user.uid,
        senderName: user.displayName || "Usuario",
        receiverId: otherUserId,
        text: inputText.substring(0, 50),
      });

      await sendMessage({
        senderId: user.uid,
        senderName: user.displayName || "Usuario",
        receiverId: otherUserId,
        receiverName: otherUserName || "Usuario",
        text: inputText,
      });

      console.log("✅ Mensaje enviado correctamente");
      setInputText("");
      setError("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  // Agrupar mensajes por remitente consecutivos
  const groupedMessages = messages.reduce((acc, msg, idx) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup[0].senderId === msg.senderId) {
      lastGroup.push(msg);
    } else {
      acc.push([msg]);
    }
    return acc;
  }, []);

  // Mostrar fecha si hay salto de más de 1 hora
  const shouldShowDate = (currentMsg, previousMsg) => {
    if (!previousMsg) return false;
    const diff = dayjs(currentMsg.timestamp?.toDate?.()).diff(
      dayjs(previousMsg.timestamp?.toDate?.()),
      "minute"
    );
    return diff > 60;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav("/mensajes")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {otherUserName?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 text-base">{otherUserName || "Usuario"}</h1>
                <p className="text-xs text-gray-500">Activo ahora</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">En línea</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-gray-600 font-medium text-lg">Comienza la conversación</p>
                <p className="text-sm text-gray-400 mt-2">Envía un mensaje para conectar con {otherUserName}</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {groupedMessages.map((group, groupIdx) => {
                const isSender = group[0].senderId === user?.uid;
                const previousGroup = groupIdx > 0 ? groupedMessages[groupIdx - 1] : null;
                const showDateDivider = previousGroup && shouldShowDate(group[0], previousGroup[previousGroup.length - 1]);

                return (
                  <motion.div key={`group-${groupIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {showDateDivider && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-medium px-2">
                          {dayjs(group[0].timestamp?.toDate?.()).format("DD MMM")}
                        </span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                    )}

                    <div className={`flex gap-2 mb-2 ${isSender ? "justify-end" : "justify-start"}`}>
                      {!isSender && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                          {group[0].senderName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}

                      <div className={`flex flex-col gap-1 max-w-sm ${isSender ? "items-end" : "items-start"}`}>
                        {!isSender && (
                          <p className="text-xs font-semibold text-gray-600 px-3">{group[0].senderName}</p>
                        )}

                        {group.map((msg, msgIdx) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: msgIdx * 0.05 }}
                            className={`px-4 py-3 rounded-2xl ${
                              isSender
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm shadow-md"
                                : "bg-white text-gray-900 rounded-tl-sm border border-gray-200 shadow-sm"
                            }`}
                          >
                            <p className="break-words text-sm leading-relaxed">{msg.text}</p>
                          </motion.div>
                        ))}

                        <div className={`flex items-center gap-2 mt-1 px-2 ${isSender ? "justify-end" : "justify-start"}`}>
                          <span className="text-xs text-gray-400 font-medium">
                            {dayjs(group[group.length - 1].timestamp?.toDate?.()).format("HH:mm")}
                          </span>
                          {isSender && group[group.length - 1].read && (
                            <CheckCheck className="w-3 h-3 text-teal-200" />
                          )}
                          {isSender && !group[group.length - 1].read && (
                            <Clock className="w-3 h-3 text-white/50" />
                          )}
                        </div>
                      </div>

                      {isSender && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2"
            >
              <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5">!</div>
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder-gray-400 disabled:bg-gray-50"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4"
                >
                  <Clock className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
