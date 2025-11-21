// src/Components/CalendarioReservas/CalendarioReservas.jsx
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, Clock, MapPin, User, Wrench } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function CalendarioReservas({ reservas = [] }) {
  const [currentDate, setCurrentDate] = useState(dayjs());

  // Obtener días del mes
  const daysInMonth = currentDate.daysInMonth();
  const firstDay = currentDate.startOf("month").day(); // 0 = domingo, 6 = sábado
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Mapear reservas por día
  const reservasPorDia = useMemo(() => {
    const map = {};
    reservas.forEach((r) => {
      if (r.scheduledAt) {
        const fecha = dayjs(r.scheduledAt.toDate?.()).format("YYYY-MM-DD");
        if (!map[fecha]) map[fecha] = [];
        map[fecha].push(r);
      }
    });
    return map;
  }, [reservas]);

  // Crear array de celdas (incluyendo días vacios del mes anterior)
  const cells = Array(firstDay).fill(null).concat(days);

  const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));
  const handleNextMonth = () => setCurrentDate(currentDate.add(1, "month"));

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black" style={{ fontFamily: "Space Grotesk" }}>
          📅 Calendario de Reservas
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-xl font-bold min-w-[240px] text-center">
            {currentDate.format("MMMM YYYY")}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Días de semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"].map((day) => (
          <div
            key={day}
            className="text-center font-bold text-gray-600 py-3"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const fecha = currentDate.date(day).format("YYYY-MM-DD");
          const reservasDelDia = reservasPorDia[fecha] || [];
          const isToday = dayjs().format("YYYY-MM-DD") === fecha;
          const isPast = currentDate.date(day).isBefore(dayjs(), "day");

          return (
            <div
              key={day}
              className={`aspect-square rounded-xl p-3 border-2 transition-all ${
                isToday
                  ? "border-emerald-500 bg-emerald-50"
                  : isPast
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`font-bold text-lg mb-1 ${isToday ? "text-emerald-600" : "text-gray-700"}`}>
                {day}
              </div>

              {reservasDelDia.length > 0 && (
                <div className="space-y-1">
                  {reservasDelDia.slice(0, 2).map((r, i) => (
                    <div
                      key={i}
                      className={`text-xs p-1 rounded text-white truncate ${
                        r.status === "confirmada"
                          ? "bg-emerald-500"
                          : r.status === "cancelada"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                      title={`${r.technicianName || "Técnico"} - ${
                        r.scheduledAt
                          ? dayjs(r.scheduledAt.toDate?.()).format("HH:mm")
                          : ""
                      }`}
                    >
                      {r.status === "confirmada" && <Check className="w-3 h-3 inline mr-1" />}
                      {r.technicianName?.split(" ")[0] || "Técnico"}
                    </div>
                  ))}
                  {reservasDelDia.length > 2 && (
                    <div className="text-xs text-gray-600 font-semibold">
                      +{reservasDelDia.length - 2} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-sm text-gray-700">Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-sm text-gray-700">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-gray-700">Cancelada</span>
        </div>
      </div>

      {/* Lista de eventos del mes */}
      {Object.keys(reservasPorDia).length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-bold mb-4">Eventos próximos</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(reservasPorDia)
              .filter(([fecha]) => !dayjs(fecha).isBefore(currentDate.startOf("month")))
              .filter(([fecha]) => !dayjs(fecha).isAfter(currentDate.endOf("month")))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([fecha, reservasDelDia]) =>
                reservasDelDia.map((r, i) => (
                  <div
                    key={`${fecha}-${i}`}
                    className={`p-3 rounded-lg border-l-4 ${
                      r.status === "confirmada"
                        ? "border-emerald-500 bg-emerald-50"
                        : r.status === "cancelada"
                        ? "border-red-500 bg-red-50"
                        : "border-yellow-500 bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">
                          {dayjs(fecha).format("dddd, D MMMM")}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span>
                            {r.scheduledAt
                              ? dayjs(r.scheduledAt.toDate?.()).format("HH:mm")
                              : "Sin hora"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                          <User className="w-4 h-4" />
                          <span>{r.technicianName || "Técnico"}</span>
                        </div>
                        {r.serviceType && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                            <Wrench className="w-4 h-4" />
                            <span>{r.serviceType}</span>
                          </div>
                        )}
                        {r.address && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                            <MapPin className="w-4 h-4" />
                            <span>{r.address}</span>
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.status === "confirmada"
                            ? "bg-emerald-200 text-emerald-800"
                            : r.status === "cancelada"
                            ? "bg-red-200 text-red-800"
                            : "bg-yellow-200 text-yellow-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>
      )}

      {Object.keys(reservasPorDia).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-semibold">No hay reservas en este mes</p>
          <p className="text-sm">¡Las reservas que hagas aparecerán aquí!</p>
        </div>
      )}
    </div>
  );
}
