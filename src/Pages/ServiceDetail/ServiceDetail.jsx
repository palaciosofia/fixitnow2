import { useParams, Link } from "react-router-dom";

export default function ServiceDetail() {
  const { id } = useParams();
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Detalle del servicio</h1>
      <p className="text-gray-600 mb-4">ID: {id}</p>
      <p className="mb-6">Aquí va la información del servicio seleccionado.</p>
      <Link to={`/agendar/${id}`} className="underline">Agendar este servicio</Link>
    </div>
  );
}
