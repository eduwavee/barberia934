# Barbería 9 ¾ — Sistema de gestión

App móvil web para clientes + panel de administración para el dueño, con turnos,
sistema de puntos canjeables y control de ingresos.

## Estructura
```
barberia-9-3-4/
├── backend/     API REST (Node.js + Express + SQLite)
└── frontend/    App web mobile-first (React + Vite + Tailwind)
```

## Backend

```bash
cd backend
cp .env.example .env      # completá JWT_SECRET con algo random en producción
npm install
npm run seed               # crea servicios, horarios, productos y el usuario dueño
npm run dev                 # http://localhost:4000
```

Usuario dueño de prueba creado por el seed:
- email: `jacob@barberia93cuartos.com`
- password: `barberia123`
(**cambiá esta contraseña o borrá el usuario antes de producción**)

### Endpoints principales
- `POST /api/auth/register` / `POST /api/auth/login` / `GET /api/auth/me`
- `GET /api/servicios` — catálogo de servicios (dueño puede crear/editar/desactivar)
- `GET /api/turnos/disponibilidad?fecha=YYYY-MM-DD` — horarios libres
- `POST /api/turnos` — reservar (cliente)
- `GET /api/turnos/mios` — turnos del cliente logueado
- `GET /api/turnos` — listado completo, con filtros `?fecha=&estado=` (dueño)
- `PUT /api/turnos/:id/estado` — cambiar estado; al pasar a `completado` otorga
  puntos automáticamente y registra el ingreso en caja (dueño)
- `GET /api/puntos/mis-puntos` / `GET /api/puntos/productos` / `POST /api/puntos/canjear`
- `GET /api/ingresos/resumen` — totales hoy/semana/mes (dueño)
- `GET /api/ingresos/serie?dias=14` — serie diaria para gráficos (dueño)
- `POST /api/ingresos` — cargar gasto o ingreso extra manual (dueño)
- `GET /api/usuarios` — listado de clientes con sus puntos (dueño)
- `GET /api/agenda/horarios` / `PUT /api/agenda/horarios/:dia` — horarios de
  atención de cada día de la semana (dueño)
- `GET|POST /api/agenda/bloqueos` / `DELETE /api/agenda/bloqueos/:id` — cerrar un
  día entero o un horario suelto; al cerrar se cancelan los turnos de ahí y se
  avisa a cada cliente (dueño)
- `GET /api/turnos/recordatorios?dias=1` — turnos del día siguiente con el
  mensaje de WhatsApp ya armado (dueño)
- `GET /api/notificaciones` / `PUT /api/notificaciones/:id/leida` /
  `PUT /api/notificaciones/leer-todas` — avisos del cliente
- `POST /api/notificaciones/suscribir` — alta del navegador en las push

Toda ruta de "dueño" requiere el JWT de un usuario con `rol = 'dueño'`.

## Frontend

```bash
cd frontend
cp .env.example .env       # apuntá VITE_API_URL a tu backend
npm install
npm run dev                 # http://localhost:5173
```

- Rutas de cliente: `/`, `/turnos`, `/turnos/mios`, `/puntos`, `/pagos`, `/ubicacion`,
  `/notificaciones`
- Rutas de dueño (protegidas por rol): `/admin`, `/admin/turnos`, `/admin/ingresos`,
  `/admin/servicios`, `/admin/productos`, `/admin/clientes`, `/admin/agenda`,
  `/admin/recordatorios`
- Al loguearse, el sistema redirige automáticamente según el rol del usuario.

### Sistema visual
La UI sigue la referencia de diseño en `frontend/src/assets/referencia.jpg`; los
colores están muestreados de ahí y las imágenes recortadas de la hoja de assets
`frontend/src/assets/image.png`.

- **Paleta** (`tailwind.config.js`): `negro #0A0A0A`, `panel #141414`,
  `borde #262626`, `dorado #C9AE8C` (arena: botones, chips activos, acentos),
  `crema #EDE7DC` (texto) y `papel #DFD8C6` (tarjetas claras).
- **Imágenes**: salen de la hoja `src/assets/image.png` y las genera
  `frontend/scripts/preparar-assets.py`. Como los recortes de la hoja son chicos
  (la hoja entera mide 1024 px de ancho), se agrandan con super-resolución
  **EDSR x4** vía OpenCV en vez de un reescalado común — sobre fotos deja bastante
  menos ruido y bordes más limpios que LANCZOS. Para volver a generarlas:

  ```bash
  cd frontend
  python -m pip install pillow opencv-contrib-python qrcode
  mkdir -p scripts/modelos && curl -sSL -o scripts/modelos/EDSR_x4.pb     https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb
  python scripts/preparar-assets.py
  ```

  El modelo (38 MB) está en `.gitignore`: se baja una sola vez y no viaja en el repo.

  Salen: `barberia-local.jpg` (fondo del login y foto de ambiente en Pagos),
  `banner-maquina.jpg` (banner del inicio), `mapa.jpg` (Ubicación, con el pin
  teñido al dorado de la marca), `pago-mercadopago.png` y `pago-naranjax.png`,
  `qr.png` y `producto-cera.png` / `producto-polvo.png` / `producto-aceite.png`
  (con el fondo blanco ya removido).
  Los productos se emparejan con su foto por el nombre que cargues en
  `/admin/productos` (busca "cera", "polvo" o "aceite"); si no coincide, cae en
  un icono.
- **Código QR**: el de la hoja era decorativo (no codificaba nada). El de la app
  se genera de verdad y apunta a la constante `URL_APP` de
  `scripts/preparar-assets.py` — cambiala por la URL de la app publicada y volvé
  a correr el script.
- **Iconos**: `src/components/Icono.jsx` — set propio de SVG de trazo fino que
  heredan el color con `currentColor`, siguiendo la hoja de iconos de la
  referencia. Uso: `<Icono nombre="tijera" size={20} />`. Props: `size`,
  `grosor`, `relleno` (macizo, se lee mejor por debajo de 16px) y `titulo`
  (lo vuelve accesible; sin él queda `aria-hidden`).
- **Animaciones**: tokens en `tailwind.config.js` (`animate-aparecer`,
  `animate-aparecer-escala`, `animate-entrar-pantalla`, `animate-subir-panel`,
  `animate-sello`, `animate-destello`, `animate-latido`, `animate-flotar`,
  `animate-rebote`, `animate-girar`, `animate-temblor`, `animate-tijeretazo`,
  `animate-deriva`, `animate-acercar-foto`) más utilidades en `src/index.css`:
  `cascada` (entrada escalonada), `revelable` (revelado al hacer scroll),
  `presionable`, `onda-toque`, `esqueleto`, `filete`, `filete-tijera`, `rotulo`,
  `chip`, `carrusel` y `poste-barbero`.
  Todo se apaga solo si el sistema pide `prefers-reduced-motion: reduce`.
- **Componentes de chrome**: `Pantalla` (transición al cambiar de ruta),
  `Encabezado` (flecha de volver + título centrado), `BottomNav`,
  `MedallonPuntos` (el sello con el saldo), `BotonOnda` (onda al tocar),
  `Contador` (números que suben) y `Spinner` / `Esqueleto` / `Vacio`.
- **`useRevelar`** (`src/hooks/useRevelar.js`): revela un bloque cuando entra en
  pantalla. Es un *callback ref*, así que también sirve en bloques que se montan
  después de cargar datos. El estado final se declara con propiedades y no con
  una animación —en una pestaña en segundo plano las animaciones no corren— y
  tiene respaldo por scroll y un temporizador, para que el contenido nunca pueda
  quedar invisible.

### Datos del local
Dirección, coordenadas, WhatsApp, Instagram y horarios viven en un solo lugar:
`frontend/src/config/local.js`. La pantalla de Ubicación, el mapa y los enlaces
de contacto salen todos de ahí.

Para sacar las coordenadas exactas: abrí Google Maps, clic derecho sobre la
puerta del local → "¿Qué hay aquí?" y copiá los dos números de abajo.

El mapa es un Leaflet real con tiles de OpenStreetMap (libres, sin API key),
oscurecidos por CSS para que combinen con el diseño. Se carga bajo demanda
—sólo al abrir Ubicación— así no suma peso al arranque de la app. El zoom con
la rueda está apagado a propósito para no robarle el scroll a la página en el
celular.

El login es una portada con la foto del local y los dos accesos: el formulario
se despliega sobre la misma pantalla (`/registro` abre directo el de registro).

Para volver a recortar los assets desde la hoja hay que tener Pillow
(`python -m pip install pillow`); los recortes están documentados arriba.

## Agenda del dueño
Desde `/admin/agenda` se maneja la atención sin tocar código:

- **Horarios por día**: abrir o cerrar cada día de la semana, cambiar la hora de
  apertura y cierre, y cada cuánto sale un turno.
- **Bloqueos**: cerrar un día entero (feriado, vacaciones) o un horario suelto.
  Si ya había turnos reservados ahí, se cancelan y le llega el aviso a cada
  cliente. Al reabrir, se avisa a los clientes que no tienen turno.

## Notificaciones
Cada aviso se guarda siempre en la base —así aparece en la campanita del inicio
aunque el cliente nunca haya dado permiso— y además se intenta mandar como
notificación del sistema a los navegadores suscriptos.

Se disparan solos: turno reservado, turno confirmado, turno cancelado, horario
liberado, puntos sumados, puntos que ya alcanzan para canjear, y producto nuevo
en el catálogo.

Para las push hacen falta las claves VAPID en `backend/.env`:

```bash
cd backend
node -e "console.log(require('web-push').generateVAPIDKeys())"
# pegar el par en VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY
```

Sin esas claves la app funciona igual: los avisos quedan sólo dentro de la app.

## Recordatorios por WhatsApp
`/admin/recordatorios` lista los turnos de mañana (o de hoy, o de pasado) con el
teléfono de cada cliente y un botón que abre el chat con el mensaje ya escrito.
No usa la API paga de WhatsApp: abre `wa.me` y el dueño sólo aprieta enviar.

## App instalable (PWA)
La app se puede agregar a la pantalla de inicio del teléfono y abre sin la barra
del navegador. El service worker (`frontend/public/sw.js`) cachea el envoltorio
para que abra con mala conexión y recibe las notificaciones push.

**No se cachean las llamadas a la API**: los turnos y los puntos tienen que verse
siempre al día, servir una versión vieja sería peor que mostrar un error.

En desarrollo el service worker no se registra, porque el caché estorba al hot
reload; se activa recién en el build de producción.

## Cómo suma y canjea puntos un cliente
1. El cliente reserva un turno (queda en estado `pendiente`).
2. Vos (dueño) lo pasás a `confirmado` y, cuando lo atendés, a `completado`.
3. Al completarlo, el backend le suma automáticamente los puntos configurados en
   ese servicio y registra el cobro en el control de ingresos.
4. El cliente puede canjear sus puntos por productos desde "Mis puntos" — vos
   administrás el catálogo y el stock desde `/admin/productos`.

## Pendiente para producción
- Los pagos (Mercado Pago / Naranja X) hoy son solo selección de método al
  reservar — falta integrar los checkouts reales de cada plataforma.
- Los recordatorios de WhatsApp son manuales (el dueño aprieta enviar). Para que
  salgan solos hace falta la API de WhatsApp Business, que es paga.
- Seguridad: el CORS está abierto a cualquier origen y el login no tiene límite
  de intentos; tampoco hay recuperación de contraseña.
- No hay tests. Los flujos de plata y puntos son los que más los necesitan.
- Subir imágenes de productos canjeables desde el panel (hoy las fotos salen
  de los assets y se emparejan por nombre).
- Deploy sugerido: backend en Railway/Render (con volumen persistente para
  SQLite, o migrar a Postgres si crece mucho el tráfico), frontend en
  Vercel/Netlify o el mismo Railway.
