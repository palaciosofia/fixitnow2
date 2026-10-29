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
  getDoc,
  limit as qLimit,
} from "firebase/firestore";
import { db } from "../firebase";

const REVIEWS_COLLECTION = "reviews";
const TECHS_COLLECTION = "technicians";

/**
 * Crea una reseña y actualiza el rating del técnico
 */
export async function createReview(technicianId, clientId, clientName, rating, comment) {
  if (await hasUserReviewedTechnician(technicianId, clientId)) {
    throw new Error("Ya dejaste una reseña para este técnico.");
  }
  try {
    // Crear documento de reseña
    const reviewData = {
      technicianId,
      clientId,
      clientName: clientName || "Cliente Anónimo",
      rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
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
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
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
export async function getAllReviews(max = 50) {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), qLimit(max));
    const snapshot = await getDocs(q);
    const allReviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Enriquecer con datos del técnico (una lectura por técnico, no por reseña)
    const techIds = [...new Set(allReviews.map((r) => r.technicianId).filter(Boolean))];
    const techEntries = await Promise.all(
      techIds.map(async (tid) => {
        try {
          const t = await getDoc(doc(db, TECHS_COLLECTION, tid));
          return [tid, t.exists() ? { id: t.id, ...t.data() } : null];
        } catch {
          return [tid, null];
        }
      })
    );
    const techMap = Object.fromEntries(techEntries);

    return allReviews.map((review) => ({
      ...review,
      technicianData: techMap[review.technicianId] ?? null,
    }));
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
    
    // Enriquecer con el nombre del técnico
    const reviewsWithTechData = await Promise.all(
      snapshot.docs.map(async (reviewDoc) => {
        const reviewData = reviewDoc.data();
        let technicianName = "Técnico";
        try {
          if (reviewData.technicianId) {
            const techDoc = await getDoc(doc(db, TECHS_COLLECTION, reviewData.technicianId));
            if (techDoc.exists()) technicianName = techDoc.data().nombre || technicianName;
          }
        } catch {
          /* sin acceso al técnico: se deja el nombre genérico */
        }
        return { id: reviewDoc.id, ...reviewData, technicianName };
      })
    );

    return reviewsWithTechData;
  } catch (error) {
    console.error("Error fetching client reviews:", error);
    return [];
  }
}
