export default function ReviewsStrip({ data = [], loading = false }) {
  if (loading || !data.length) return null;

  return (
    <section className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold mb-4">Lo que dicen nuestros clientes</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {data.map((r) => (
            <article key={r.id} className="border rounded-md p-4">
              <p className="text-sm">⭐ {r.rating}/5</p>
              <p className="mt-2">{r.comentario}</p>
              <p className="mt-2 text-xs opacity-70">— {r.clienteNombre}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
