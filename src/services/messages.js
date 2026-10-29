// src/services/messages.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

/**
 * @typedef {Object} Message
 * @property {string} id - Documento ID
 * @property {string} conversationId - ID de la conversación
 * @property {string} senderId - UID del remitente
 * @property {string} senderName - Nombre del remitente
 * @property {string} receiverId - UID del receptor
 * @property {string} receiverName - Nombre del receptor
 * @property {string} text - Contenido del mensaje
 * @property {boolean} read - ¿Leído?
 * @property {any} timestamp - Timestamp de creación
 */

/**
 * Genera un ID de conversación único entre dos usuarios
 * @param {string} userId1
 * @param {string} userId2
 * @returns {string}
 */
export function generateConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join("_");
}

/**
 * Envía un mensaje
 * @param {{senderId: string, senderName: string, receiverId: string, receiverName: string, text: string}} params
 * @returns {Promise<string>} Message ID
 */
export async function sendMessage({
  senderId,
  senderName,
  receiverId,
  receiverName,
  text,
}) {
  if (!text?.trim()) {
    throw new Error("El mensaje no puede estar vacío");
  }

  if (text.length > 5000) {
    throw new Error("El mensaje es demasiado largo (máx 5000 caracteres)");
  }

  const conversationId = generateConversationId(senderId, receiverId);

  try {
    const messagesRef = collection(db, "messages");
    const docRef = await addDoc(messagesRef, {
      conversationId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      text: text.trim(),
      read: false,
      timestamp: serverTimestamp(),
    });

    return docRef.id;
  } catch (err) {
    console.error("❌ Error enviando mensaje:", err);
    throw err;
  }
}

/**
 * Obtiene todos los mensajes de una conversación en tiempo real
 * @param {string} userId1
 * @param {string} userId2
 * @param {(messages: Message[]) => void} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConversation(userId1, userId2, callback) {
  const conversationId = generateConversationId(userId1, userId2);

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (err) => {
      console.error("Error obteniendo mensajes:", err);
    }
  );

  return unsubscribe;
}

/** Milisegundos de un Timestamp de Firestore (null mientras el servidor no lo asigna). */
function tsMillis(ts) {
  return ts?.toMillis?.() ?? Date.now();
}

/**
 * Obtiene las últimas conversaciones de un usuario (recibidas y enviadas).
 * Usa dos listeners fijos y combina sus resultados; la función devuelta
 * cancela ambos.
 * @param {string} userId
 * @param {(conversations: Object[]) => void} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConversationsList(userId, callback) {
  let received = [];
  let sent = [];
  let gotReceived = false;
  let gotSent = false;

  const emit = () => {
    if (!gotReceived || !gotSent) return; // espera la primera respuesta de ambos
    const map = {};

    const consider = (msg, isReceived) => {
      const convId = msg.conversationId;
      const prev = map[convId];
      const unread = (prev?.unread ?? false) || (isReceived && !msg.read);
      if (!prev || tsMillis(msg.timestamp) > tsMillis(prev.timestamp)) {
        map[convId] = {
          ...msg,
          id: convId,
          lastMessage: msg.text,
          otherUserId: isReceived ? msg.senderId : msg.receiverId,
          otherUserName: isReceived ? msg.senderName : msg.receiverName,
          timestamp: msg.timestamp,
          unread,
        };
      } else {
        prev.unread = unread;
      }
    };

    received.forEach((m) => consider(m, true));
    sent.forEach((m) => consider(m, false));

    const conversations = Object.values(map).sort(
      (a, b) => tsMillis(b.timestamp) - tsMillis(a.timestamp)
    );
    callback(conversations);
  };

  const onErr = (err) => console.error("Error obteniendo conversaciones:", err);

  const unsubReceived = onSnapshot(
    query(collection(db, "messages"), where("receiverId", "==", userId), orderBy("timestamp", "desc")),
    (snap) => {
      received = snap.docs.map((d) => d.data());
      gotReceived = true;
      emit();
    },
    (err) => {
      onErr(err);
      gotReceived = true;
      emit();
    }
  );

  const unsubSent = onSnapshot(
    query(collection(db, "messages"), where("senderId", "==", userId), orderBy("timestamp", "desc")),
    (snap) => {
      sent = snap.docs.map((d) => d.data());
      gotSent = true;
      emit();
    },
    (err) => {
      onErr(err);
      gotSent = true;
      emit();
    }
  );

  return () => {
    unsubReceived();
    unsubSent();
  };
}

/**
 * Marca todos los mensajes de una conversación como leídos
 * @param {string} userId1
 * @param {string} userId2
 * @param {string} currentUserId
 * @returns {Promise<void>}
 */
export async function markConversationAsRead(userId1, userId2, currentUserId) {
  const conversationId = generateConversationId(userId1, userId2);

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    where("receiverId", "==", currentUserId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);

  try {
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );
    await Promise.all(updates);
  } catch (err) {
    console.error("❌ Error marcando como leídos:", err);
  }
}

/**
 * Cuenta los mensajes no leídos de un usuario
 * @param {string} userId
 * @param {(count: number) => void} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUnreadCount(userId, callback) {
  const q = query(
    collection(db, "messages"),
    where("receiverId", "==", userId),
    where("read", "==", false)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.length);
    },
    (err) => {
      console.error("Error contando no leídos:", err);
      callback(0);
    }
  );

  return unsubscribe;
}
