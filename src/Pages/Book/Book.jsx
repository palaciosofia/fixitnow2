// src/Pages/Book/Book.jsx
// Reservar con un técnico (/agendar/:tid). Usa el mismo cuadro de reserva del perfil.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, UserX } from "lucide-react";
import { db } from "../../firebase";
import BookingPanel from "../../Components/BookingPanel";
import { Avatar, Button, Card, EmptyState, Loader, Rating, SpecialtyCover } from "../../ui";
import { formatCOP } from "../../utils/money";
import { priceFrom, techPath } from "../../utils/catalog";

export default function Book() {
  const { tid } = useParams();
  const [tech, setTech] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tid) {
      setErr("Falta el técnico.");
      setLoading(false);
      return;
    }
    let alive = true;
    getDoc(doc(db, "technicians", tid))
      .then((snap) => {
        if (!alive) return;
        if (!snap.exists()) setErr("Este técnico no existe o ya no está disponible.");
        else setTech({ id: snap.id, ...snap.data() });
      })
      .catch((e) => {
        console.error(e);
        if (alive) setErr("No pudimos cargar el perfil del técnico. Intenta de nuevo en unos minutos.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tid]);

  if (loading) return <Loader label="Cargando técnico…" />;
  if (err) {
    return <EmptyState icon={UserX} title="No se puede reservar" text={err} action={<Button to="/tecnicos">Ver otros técnicos</Button>} />;
  }

  const precio = priceFrom(tech);

  return (
    <div className="mx-auto max-w-[920px]">
      <Link to={techPath(tech)} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al perfil
      </Link>
      <div className="flex flex-wrap items-start gap-5">
        <Card className="flex-[1_1_280px] overflow-hidden">
          <SpecialtyCover specialty={(tech.especialidades || [])[0]} src={tech.fotoURL} className="h-[120px] rounded-none" iconSize={48} />
          <div className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={tech.nombre} src={tech.fotoURL} size={48} />
              <div>
                <h1 className="text-lg font-semibold">{tech.nombre}</h1>
                <p className="text-[13px] text-muted">{(tech.especialidades || []).slice(0, 2).join(" · ") || "Técnico"}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-[#F0F0F3] pt-3 text-sm">
              <Rating value={tech.ratingPromedio} count={tech["reseñasCount"]} />
              <span className="font-semibold">{precio ? `Desde ${formatCOP(precio)}` : "Precio a convenir"}</span>
            </div>
          </div>
        </Card>
        <BookingPanel tech={tech} className="flex-[1_1_360px]" />
      </div>
    </div>
  );
}
