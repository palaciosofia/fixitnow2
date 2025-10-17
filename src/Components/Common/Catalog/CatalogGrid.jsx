import TechnicianCard from "./TechnicianCard";

export default function CatalogGrid({ data = [], loading = false }) {
  if (loading) return <div className="p-6">Cargando técnicos…</div>;
  if (!data.length) return <div className="p-6">No hay técnicos publicados por ahora.</div>;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((t) => (
        <TechnicianCard key={t.id} t={t} />
      ))}
    </div>
  );
}
