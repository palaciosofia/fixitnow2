// src/services/messages.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
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
  if (!text.trim()) {
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

    console.log("✅ Mensaje enviado:", docRef.id);
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

/**
 * Obtiene las últimas conversaciones de un usuario
 * @param {string} userId
 * @param {(conversations: Object[]) => void} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConversationsList(userId, callback) {
  const q = query(
    collection(db, "messages"),
    where("receiverId", "==", userId),
    orderBy("timestamp", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // Agrupar por conversationId y obtener el último mensaje de cada una
      const conversationMap = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const convId = data.conversationId;

        if (!conversationMap[convId] || data.timestamp > conversationMap[convId].timestamp) {
          conversationMap[convId] = {
            id: convId,
            lastMessage: data.text,
            otherUserId: data.senderId,
            otherUserName: data.senderName,
            timestamp: data.timestamp,
            unread: !data.read,
            ...data,
          };
        }
      });

      // También obtener conversaciones donde el usuario es el remitente
      const q2 = query(
        collection(db, "messages"),
        where("senderId", "==", userId),
        orderBy("timestamp", "desc")
      );

      const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
        snapshot2.docs.forEach((doc) => {
          const data = doc.data();
          const convId = data.conversationId;

          if (
            !conversationMap[convId] ||
            data.timestamp > conversationMap[convId].timestamp
          ) {
            conversationMap[convId] = {
              id: convId,
              lastMessage: data.text,
              otherUserId: data.receiverId,
              otherUserName: data.receiverName,
              timestamp: data.timestamp,
              unread: false,
              ...data,
            };
          }
        });

        const conversations = Object.values(conversationMap).sort(
          (a, b) => b.timestamp - a.timestamp
        );
        callback(conversations);
      });

      return () => {
        unsubscribe();
        unsubscribe2();
      };
    }
  );

  return unsubscribe;
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
    console.log("✅ Mensajes marcados como leídos");
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
