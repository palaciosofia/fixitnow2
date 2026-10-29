// src/Components/ReviewModal.jsx
// Dejar una reseña (1 a 5 estrellas + comentario) a un técnico.
import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { createReview } from "../services/reviews";
import { Alert, Button, Field, Modal, Textarea } from "../ui";
import { cx } from "../ui/cx";

const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export default function ReviewModal({ isOpen, onClose, technician, userId, userName, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setSubmitted(false);
    setComment("");
    setRating(5);
    setError("");
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return setError("Escribe un comentario corto sobre el servicio.");
    setError("");
    setLoading(true);
    try {
      await createReview(technician.id, userId, userName, rating, comment.trim());
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      console.error("Error enviando reseña:", err);
      setError(err?.message || "No pudimos enviar la reseña.");
    } finally {
      setLoading(false);
    }
  };

  const shown = hover || rating;

  return (
    <Modal open={isOpen && !!technician} onClose={close} title={submitted ? "¡Gracias!" : `Calificar a ${technician?.nombre || "tu técnico"}`}>
      {submitted ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-ok" aria-hidden="true" />
          <p className="mt-3 text-base font-semibold">Publicamos tu reseña</p>
          <p className="mt-1 text-sm text-muted">Ayudas a otros vecinos a elegir bien.</p>
          <Button className="mt-5" onClick={close}>Listo</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium">Tu calificación</legend>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} de 5 estrellas`}
                  aria-pressed={rating === n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  className="rounded-lg p-1"
                >
                  <Star className={cx("h-8 w-8", n <= shown ? "fill-star text-star" : "text-line")} aria-hidden="true" />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-muted">{LABELS[shown]}</span>
            </div>
          </fieldset>
          <Field label="Comentario" hint={`${comment.length}/500`}>
            {(id) => (
              <Textarea
                id={id}
                rows={4}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Llegó a tiempo? ¿Quedó bien el trabajo?"
              />
            )}
          </Field>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" loading={loading}>Publicar reseña</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
