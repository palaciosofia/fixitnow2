# FixItNow

Marketplace para encontrar, reservar y pagar técnicos de confianza (plomería, electricidad, electrodomésticos y más).

**Demo:** https://fixitnowsdj.netlify.app/

## Funcionalidades

- **Catálogo** de técnicos con filtros por especialidad, ciudad, precio y calificación.
- **Perfil público** de cada técnico (`/tecnicos/:slug`) con servicios, precios y reseñas.
- **Reservas por franja horaria** según el horario que configura cada técnico. Una franja no se puede reservar dos veces.
- **Pagos**: el cliente reporta su pago (transferencia, efectivo con foto del comprobante o PayPal opcional), el pago queda "En revisión" y el técnico confirma que lo recibió.
- **Chat** entre cliente y técnico.
- **Reseñas** (una por cliente y técnico).
- **Panel del técnico**: perfil, horario, agenda y pagos recibidos.
- **Panel de administración**: publicar u ocultar técnicos y bloquear o desbloquear cuentas.

## Tecnologías

React 19 · Vite 6 · Tailwind CSS 4 · React Router 6 · Firebase (Auth, Firestore, Storage) · Cloudinary · Framer Motion · Day.js

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # y llena tus valores
npm run dev
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve la compilación localmente |
| `npm run lint` | Revisa el código con ESLint |

## Firebase

El repositorio incluye las reglas de seguridad y los índices:

- `firestore.rules`: quién puede leer y escribir cada colección.
- `storage.rules`: comprobantes de pago (solo los ven el cliente y el técnico).
- `firestore.indexes.json`: índices compuestos que usan las consultas.

Para desplegarlos (requiere `firebase-tools` y `firebase login`):

```bash
firebase use <tu-proyecto>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

> Prueba las reglas antes en el emulador (`firebase emulators:start`) o en el *Rules Playground* de la consola.

### Administradores

El rol de admin se da con un *custom claim* (`admin: true`) desde un entorno de servidor (Admin SDK), o poniendo `role: "admin"` a mano en `/users/{uid}` desde la consola. Los usuarios no pueden darse ese rol desde la app.

### Modelo de datos

| Colección | ID del documento | Notas |
| --- | --- | --- |
| `users` | UID | `role`: `cliente` \| `tecnico` \| `admin`; `blocked`: bloqueo por admin |
| `technicians` | UID del técnico | `publicado`, `horarios` por día, `servicios`, `tarifaBase` (precio "desde") |
| `reservas` | `{technicianId}_{YYYYMMDD}_{HH}` | Un documento por franja, lo que evita reservas dobles |
| `payments` | mismo ID de la reserva | `status`: `pending` → `reported` → `paid` (o `cancelled`) |
| `messages` | automático | `conversationId` = UIDs de los dos participantes, ordenados |
| `reviews` | automático | `rating` 1–5 |

## Estructura

```
src/
├── Components/     componentes reutilizables (Navbar, Footer, modales, tarjetas…)
├── Pages/          una carpeta por página
├── context/        AuthProvider (usuario, perfil y rol)
├── routing/        rutas protegidas por rol
├── services/       acceso a Firebase (auth, técnicos, pagos, mensajes, reseñas)
├── hooks/
└── utils/          formato de moneda, franjas horarias, estados de pago…
```
