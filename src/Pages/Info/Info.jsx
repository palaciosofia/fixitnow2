// src/Pages/Info/Info.jsx
// Páginas informativas enlazadas desde el footer.
import { Link, Navigate } from "react-router-dom";

const PAGES = {
  about: {
    title: "Acerca de FixItNow",
    body: (
      <>
        <p>
          FixItNow conecta a personas que necesitan un arreglo en casa con técnicos
          independientes: plomería, electricidad, carpintería, electrodomésticos y más.
        </p>
        <p>
          Puedes buscar técnicos por especialidad y ciudad, revisar su perfil y reseñas,
          reservar una franja horaria, escribirles por chat y registrar el pago del servicio.
        </p>
      </>
    ),
  },
  contacto: {
    title: "Contacto y soporte",
    body: (
      <>
        <p>¿Tienes un problema con una reserva o con tu cuenta? Escríbenos:</p>
        <ul>
          <li>Correo: soporte@fixitnow.co</li>
          <li>Teléfono: +57 (324) 123-4567</li>
          <li>Horario: lunes a sábado, 9:00 a 18:00</li>
        </ul>
        <p>
          Si el problema es con un servicio puntual, también puedes escribirle al técnico
          desde <Link to="/mis-reservas">Mis reservas</Link>.
        </p>
      </>
    ),
  },
  carreras: {
    title: "Trabaja con nosotros",
    body: (
      <>
        <p>
          ¿Eres técnico? Crea tu cuenta como técnico, completa tu perfil y publícalo en el
          catálogo para empezar a recibir reservas.
        </p>
        <p>
          <Link to="/auth/register">Registrarme como técnico</Link>
        </p>
      </>
    ),
  },
  terminos: {
    title: "Términos y condiciones",
    body: (
      <>
        <p>
          FixItNow es un intermediario: los servicios los prestan técnicos independientes,
          que fijan sus precios y horarios. El acuerdo del servicio es entre el cliente y el técnico.
        </p>
        <p>
          Las reservas quedan "solicitadas" hasta que el técnico las confirma. El técnico puede
          cancelar una reserva antes de que inicie.
        </p>
        <p>
          Los pagos que registra el cliente quedan "en revisión" hasta que el técnico confirma
          que los recibió. Los reembolsos se coordinan directamente con el técnico.
        </p>
        <p>
          Una cuenta puede ser bloqueada si se usa para fraude, suplantación o abuso.
        </p>
      </>
    ),
  },
  privacidad: {
    title: "Política de privacidad",
    body: (
      <>
        <p>Guardamos los datos necesarios para que la plataforma funcione:</p>
        <ul>
          <li>Datos de cuenta: nombre, correo, ciudad, barrio y teléfono (si los das).</li>
          <li>Reservas, mensajes del chat, reseñas y registros de pago.</li>
          <li>Comprobantes de pago en imagen, visibles solo para el cliente y el técnico de ese pago.</li>
        </ul>
        <p>
          El técnico de una reserva ve tu nombre y los datos de la reserva. No vendemos tus datos.
          Para pedir que se borre tu cuenta, escríbenos desde <Link to="/contacto">Contacto</Link>.
        </p>
      </>
    ),
  },
  cookies: {
    title: "Cookies y almacenamiento",
    body: (
      <>
        <p>
          No usamos cookies de publicidad ni de seguimiento. El navegador guarda solo lo
          necesario para mantener tu sesión iniciada (Firebase Authentication) y una preferencia
          interna de la interfaz.
        </p>
      </>
    ),
  },
};

export default function Info({ page: pageKey }) {
  const page = PAGES[pageKey];
  if (!page) return <Navigate to="/404" replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold sm:text-4xl">{page.title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted [&_a]:font-medium [&_a]:text-brand-ink [&_a]:underline [&_li]:text-muted [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {page.body}
      </div>
    </div>
  );
}
