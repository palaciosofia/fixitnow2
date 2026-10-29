# Cambios de esta revisión

## Bugs corregidos

- **Pagos**: `updatePaymentStatus` escribía en `bookings` (la colección real es `reservas`) y buscaba por un campo `id` que no existe; el estado del pago nunca llegaba a la reserva. Se reescribió `services/payments.js`: el pago usa el mismo ID que la reserva y ambos documentos quedan sincronizados.
- **Monto de 1 peso**: la reserva usaba `tech.precioSugerido`, que no existe. Ahora el monto sale del perfil del técnico (`tarifaBase`, o el servicio más barato).
- **Horarios**: la página de reservar ofrecía siempre de 8:00 a 19:00. Ahora usa el horario de cada técnico, oculta las horas que ya pasaron y el técnico puede editar su horario por día en su panel.
- **Técnicos nuevos**: se creaban con `horarios: ""` y sin `slug` (perfil público inaccesible). Se crean bien y los perfiles antiguos se reparan solos al entrar al panel.
- **Registro con Google**: a un usuario existente le sobrescribía el rol y borraba su perfil de técnico. Ya no.
- **Admin**: la lista de usuarios salía vacía (leía la colección `usuarios`, que no existe). "Publicar" y "Bloquear" técnicos cambiaban un campo `estado` que la app no lee. Bloquear usuarios guardaba `bloqueado`, pero la app revisaba `blocked`. Todo usa ahora `publicado` y `blocked`, y se puede desbloquear.
- **Usuarios bloqueados**: no pueden iniciar sesión y ven un mensaje claro.
- **Reseñas**: en "Mis reseñas" el nombre del técnico salía siempre como "Técnico" (la variable `doc` tapaba la función). Además ya no se puede reseñar dos veces al mismo técnico.
- **Mensajes**: cada actualización abría un listener nuevo que nunca se cerraba, y el orden de las conversaciones fallaba. Los mensajes que llegan con el chat abierto se marcan como leídos.
- **AuthProvider**: el rol de admin podía mostrarse como "cliente" (closure obsoleta) y justo después de iniciar sesión el rol aún no era definitivo.
- **Moneda**: catálogo, filtros y perfil mostraban pesos argentinos o USD. Todo está en COP.
- **Estilos**: los badges de estado usaban clases dinámicas (`bg-${color}-100`) que Tailwind no genera, así que salían sin color. Había un typo `transición-all` y `<style jsx>`, que solo existe en Next.js.
- **Agenda**: "Marcar como pagada" no actualizaba el pago, cancelar dejaba el pago huérfano y no se podía marcar como pagado un servicio ya realizado.
- **Mis reservas**: tras pagar, la lista se vaciaba. El botón "Ver detalle" no hacía nada (ahora es "Ver técnico").
- **Footer**: 6 enlaces llevaban a páginas que no existían. Se crearon (Acerca de, Contacto, Términos, Privacidad, Cookies, Trabaja con nosotros).

## Seguridad

- **Nuevo flujo de pago**: el cliente *reporta* el pago ("En revisión") y el técnico lo *confirma*. Antes el cliente podía marcarse como pagado y cambiar el monto.
- **PayPal**: tenía un correo de ejemplo y cobraba el monto en pesos como si fueran dólares. Ahora solo aparece si configuras `VITE_PAYPAL_BUSINESS_ID` y `VITE_COP_PER_USD`.
- **Transferencias**: ya no se pide el número de cuenta del cliente, solo el número de referencia.
- **Reglas nuevas**: `firestore.rules` y `storage.rules`, más `firestore.indexes.json` y `firebase.json`.
- **`.env.example`**: tenía nombres de variables de Cloudinary que el código no lee.

## Limpieza

- Se eliminaron 7 archivos sin uso (servicios duplicados de reservas y técnicos, hooks y componentes muertos) y `public/index.html`, que tenía código JSX en lugar de HTML.
- ESLint pasa con 0 errores (antes: 64 errores y 8 advertencias).
- Carga por partes: cada página descarga solo su código y las librerías van en archivos aparte. El JS inicial bajó de 1,25 MB a unos 200 KB de código propio.
- Se quitaron `console.log` de depuración y se reemplazaron los `alert()` por mensajes dentro de la página.
- Fechas en español en toda la app, `lang="es"`, favicon propio y README con instrucciones.
- Dependencias sin uso eliminadas: `slider-carousel`, `react-big-calendar`, `daisyui`, `autoprefixer` y `postcss`.

## Pendiente (te toca a ti)

1. **Desplegar las reglas.** Primero pruébalas en el emulador o en el Rules Playground:
   `firebase deploy --only firestore:rules,firestore:indexes,storage`
2. **Pagos antiguos con monto de $1**: corrígelos desde la consola de Firebase (con las reglas nuevas, ni el cliente ni el técnico pueden cambiar el monto).
3. Si algún técnico tiene un ID de documento distinto a su UID (por ejemplo, datos de prueba creados a mano), las reglas no lo reconocerán como dueño de sus reservas.
4. Los datos de contacto del footer (teléfono y correo) parecen de ejemplo: revísalos.
