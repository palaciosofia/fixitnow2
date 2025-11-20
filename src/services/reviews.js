// src/services/reviews.js
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const REVIEWS_COLLECTION = "reviews";
const TECHS_COLLECTION = "technicians";

/**
 * Crea una reseña y actualiza el rating del técnico
 */
export async function createReview(technicianId, clientId, clientName, rating, comment) {
  try {
    // Crear documento de reseña
    const reviewData = {
      technicianId,
      clientId,
      clientName: clientName || "Cliente Anónimo",
      rating: parseInt(rating) || 5,
      comment: comment || "",
      createdAt: serverTimestamp(),
      verified: true,
    };

    const reviewRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewData);

    // Actualizar rating promedio y contador del técnico
    await updateTechnicianRating(technicianId);

    return { id: reviewRef.id, ...reviewData };
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

/**
 * Obtiene todas las reseñas de un técnico (desde el cliente)
 * Nota: Con las reglas actuales, esto no funcionará desde el cliente.
 * Alternativa: Usar un Cloud Function o cambiar permisos de lectura.
 */
export async function getTechnicianReviews(technicianId) {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("technicianId", "==", technicianId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    // Retornar array vacío si no hay permisos
    return [];
  }
}

/**
 * Actualiza el rating promedio del técnico basado en todas sus reseñas
 */
export async function updateTechnicianRating(technicianId) {
  try {
    const reviews = await getTechnicianReviews(technicianId);
    
    if (reviews.length === 0) {
      await updateDoc(doc(db, TECHS_COLLECTION, technicianId), {
        ratingPromedio: 0,
        reseñasCount: 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);

    await updateDoc(doc(db, TECHS_COLLECTION, technicianId), {
      ratingPromedio: parseFloat(averageRating),
      reseñasCount: reviews.length,
    });
  } catch (error) {
    console.error("Error updating technician rating:", error);
  }
}

/**
 * Obtiene todas las reseñas de la plataforma (paginadas)
 */
export async function getAllReviews(limit = 50) {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION));
    const snapshot = await getDocs(q);
    const allReviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Enriquecer reseñas con datos del técnico
    const enrichedReviews = await Promise.all(
      allReviews.map(async (review) => {
        const techDoc = await getDoc(doc(db, TECHS_COLLECTION, review.technicianId));
        return {
          ...review,
          technicianData: techDoc.exists() ? { id: techDoc.id, ...techDoc.data() } : null,
        };
      })
    );

    return enrichedReviews.slice(0, limit);
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return [];
  }
}

/**
 * Verifica si un cliente ya dejó reseña a un técnico
 */
export async function hasUserReviewedTechnician(technicianId, clientId) {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("technicianId", "==", technicianId),
      where("clientId", "==", clientId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0;
  } catch (error) {
    console.error("Error checking review:", error);
    return false;
  }
}

/**
 * Obtiene todas las reseñas que ha dejado un cliente
 */
export async function getClientReviews(clientId) {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("clientId", "==", clientId)
    );
    const snapshot = await getDocs(q);
    
    // Enriquecer con datos del técnico
    const reviewsWithTechData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const reviewData = doc.data();
        try {
          const techDoc = await getDoc(doc(db, TECHS_COLLECTION, reviewData.technicianId));
          return {
            id: doc.id,
            ...reviewData,
            technicianName: techDoc.exists() ? techDoc.data().nombre : "Técnico",
          };
        } catch (e) {
          return {
            id: doc.id,
            ...reviewData,
            technicianName: "Técnico",
          };
        }
      })
    );
    
    return reviewsWithTechData;
  } catch (error) {
    console.error("Error fetching client reviews:", error);
    return [];
  }
}
