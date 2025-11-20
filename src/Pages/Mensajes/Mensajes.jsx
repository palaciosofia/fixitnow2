// src/Pages/Mensajes/Mensajes.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import {
  subscribeToConversationsList,
  subscribeToUnreadCount,
} from "../../services/messages";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

export default function Mensajes() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Suscribirse a la lista de conversaciones
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const unsubscribe = subscribeToConversationsList(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Suscribirse a contador de no leídos
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUnreadCount(user.uid, setUnreadCount);
    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "Space Grotesk" }}>
            💬 Mensajes
          </h1>
          <p className="text-gray-600">
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                {unreadCount} sin leer
              </span>
            )}
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sin conversaciones</h2>
            <p className="text-gray-600">
              Las conversaciones aparecerán aquí cuando intercambies mensajes con técnicos o clientes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv, idx) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => nav(`/chat/${conv.otherUserId}/${encodeURIComponent(conv.otherUserName)}`)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${
                  conv.unread
                    ? "bg-emerald-50 border-2 border-emerald-200 hover:shadow-lg"
                    : "bg-white border-2 border-gray-200 hover:border-emerald-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        {conv.otherUserName || "Usuario"}
                      </h3>
                      {conv.unread && (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {dayjs(conv.timestamp?.toDate?.()).fromNow()}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
