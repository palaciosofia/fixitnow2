// src/Components/Messaging.jsx
// Bandeja de mensajes en dos paneles: lista de conversaciones + chat.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { ArrowLeft, MessageCircle, Search, Send } from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import {
  sendMessage,
  subscribeToConversation,
  subscribeToConversationsList,
  markConversationAsRead,
} from "../services/messages";
import { Alert, Avatar, EmptyState } from "../ui";
import { cx } from "../ui/cx";

function tsDate(ts) {
  return ts?.toDate?.() || null;
}

function shortTime(d) {
  if (!d) return "";
  const m = dayjs(d);
  if (m.isSame(dayjs(), "day")) return m.format("h:mm a");
  if (m.isSame(dayjs().subtract(1, "day"), "day")) return "Ayer";
  return m.format("D MMM");
}

/* ------------------------------------------------------------------ */
/*  Marco de dos paneles                                               */
/* ------------------------------------------------------------------ */
export function MessagingLayout({ activeUserId, activeUserName }) {
  const hasChat = !!activeUserId;
  return (
    <div>
      <h1 className={cx("mb-4 text-2xl font-semibold", hasChat && "hidden lg:block")}>Mensajes</h1>
      <div className="flex h-[calc(100vh-12rem)] min-h-[520px] overflow-hidden rounded-2xl border border-line bg-white lg:h-[calc(100vh-11rem)]">
        <div className={cx("w-full border-line lg:block lg:w-[320px] lg:shrink-0 lg:border-r", hasChat && "hidden")}>
          <ConversationList activeUserId={activeUserId} />
        </div>
        <div className={cx("min-w-0 flex-1", !hasChat && "hidden lg:flex")}>
          {hasChat ? (
            <ChatPane key={activeUserId} otherUserId={activeUserId} otherUserName={activeUserName} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState icon={MessageCircle} title="Elige una conversación" text="O escríbele a un técnico desde su perfil." className="border-0" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lista de conversaciones                                            */
/* ------------------------------------------------------------------ */
function ConversationList({ activeUserId }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    return subscribeToConversationsList(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });
  }, [user?.uid]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => String(c.otherUserName || "").toLowerCase().includes(term));
  }, [conversations, q]);

  return (
    <section aria-label="Conversaciones" className="flex h-full flex-col">
      <label className="m-3.5 flex h-10 items-center gap-2 rounded-[10px] border border-line px-3 text-subtle focus-within:border-brand">
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Buscar conversación</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle" />
      </label>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted">Cargando conversaciones…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">{q ? "Sin resultados." : "Aún no tienes conversaciones."}</p>
        ) : (
          <ul>
            {filtered.map((c) => {
              const active = c.otherUserId === activeUserId;
              return (
                <li key={c.id}>
                  <Link
                    to={`/chat/${c.otherUserId}/${encodeURIComponent(c.otherUserName || "Usuario")}`}
                    aria-current={active ? "true" : undefined}
                    className={cx(
                      "flex gap-2.5 border-l-[3px] px-3.5 py-3 transition-colors",
                      active ? "border-brand bg-[#F7F6FF]" : "border-transparent hover:bg-canvas"
                    )}
                  >
                    <Avatar name={c.otherUserName} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-2 text-sm font-semibold">
                        <span className="truncate">{c.otherUserName || "Usuario"}</span>
                        <span className="shrink-0 text-xs font-normal text-subtle">{shortTime(tsDate(c.timestamp))}</span>
                      </span>
                      <span className={cx("mt-0.5 flex items-center justify-between gap-2 text-[13px]", c.unread ? "font-medium text-ink" : "text-muted")}>
                        <span className="truncate">{c.lastMessage}</span>
                        {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand"><span className="sr-only">Sin leer</span></span>}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat                                                               */
/* ------------------------------------------------------------------ */
function ChatPane({ otherUserId, otherUserName }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user?.uid || !otherUserId) return;
    return subscribeToConversation(user.uid, otherUserId, (msgs) => {
      setMessages(msgs);
      // Marca como leídos los que llegan mientras el chat está abierto
      if (msgs.some((m) => m.receiverId === user.uid && !m.read)) {
        markConversationAsRead(user.uid, otherUserId, user.uid).catch((err) =>
          console.warn("No se pudieron marcar como leídos:", err?.message)
        );
      }
    });
  }, [user?.uid, otherUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      await sendMessage({
        senderId: user.uid,
        senderName: profile?.name || user.displayName || "Usuario",
        receiverId: otherUserId,
        receiverName: otherUserName || "Usuario",
        text,
      });
      setText("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError(err?.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  // Separadores por día
  let lastDay = "";

  return (
    <section aria-label={`Chat con ${otherUserName || "usuario"}`} className="flex h-full w-full flex-col">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button type="button" onClick={() => navigate("/mensajes")} aria-label="Volver a conversaciones" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas lg:hidden">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <Avatar name={otherUserName} size={40} />
        <p className="flex-1 truncate text-[15px] font-semibold">{otherUserName || "Usuario"}</p>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#FBFBFC] px-4 py-5" aria-live="polite">
        {messages.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-muted">Escribe el primer mensaje. Cuéntale qué necesitas y cuándo.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user?.uid;
          const d = tsDate(m.timestamp);
          const dayKey = d ? dayjs(d).format("YYYY-MM-DD") : "";
          const showDay = dayKey && dayKey !== lastDay;
          if (showDay) lastDay = dayKey;
          return (
            <div key={m.id} className="flex flex-col">
              {showDay && (
                <p className="my-2 self-center text-xs text-subtle first-letter:uppercase">
                  {dayjs(d).isSame(dayjs(), "day") ? "Hoy" : dayjs(d).format("dddd D [de] MMMM")}
                </p>
              )}
              <div
                className={cx(
                  "max-w-[78%] whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed",
                  mine
                    ? "self-end rounded-[14px_14px_4px_14px] bg-brand text-white"
                    : "self-start rounded-[14px_14px_14px_4px] border border-line bg-white"
                )}
              >
                {m.text}
              </div>
              <p className={cx("mt-1 text-[11px] text-subtle", mine ? "self-end" : "self-start")}>
                {d ? dayjs(d).format("h:mm a") : "Enviando…"}
                {mine && m.read ? " · Leído" : ""}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <Alert tone="danger" className="mx-4 mb-2">{error}</Alert>}
      <form onSubmit={onSend} className="flex gap-2.5 border-t border-line px-4 py-3">
        <label htmlFor="chat-input" className="sr-only">Escribe un mensaje</label>
        <input
          id="chat-input"
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={5000}
          placeholder="Escribe un mensaje…"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-xl border border-field px-3.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand-soft"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Enviar"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white hover:bg-brand-hover disabled:bg-line disabled:text-subtle"
        >
          <Send className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
