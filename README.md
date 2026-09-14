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
npm test                    # tests de los flujos de plata y puntos
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
- `GET /api/usuarios` — listado de clientes con puntos, cortes y última visita (dueño)
- `GET /api/usuarios/:id` — ficha de un cliente: turnos, canjes y cuánto gastó (dueño)
- `PUT /api/usuarios/perfil` — el cliente edita su nombre y su teléfono
- `POST /api/turnos/manual` — turno de mostrador; acepta cliente existente o lo
  crea en el momento (dueño)
- `GET /api/servicios?todos=1` y `GET /api/puntos/productos?todos=1` — incluyen
  los dados de baja, para poder reactivarlos (dueño)
- `POST /api/puntos/productos/:id/imagen` (multipart) y
  `DELETE /api/puntos/productos/:id/imagen` — foto del producto canjeable (dueño)
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
- `PUT /api/auth/password` — cambiar la contraseña estando logueado
- `POST /api/auth/recuperar` — pedir recuperación; `GET /api/auth/recuperaciones` y
  `POST /api/auth/recuperaciones/:id/enlace` (dueño) para generar el enlace;
  `POST /api/auth/recuperar/:token` para definir la contraseña nueva

Toda ruta de "dueño" requiere el JWT de un usuario con `rol = 'dueño'`.

## Frontend

```bash
cd frontend
cp .env.example .env       # apuntá VITE_API_URL a tu backend
npm install
npm run dev                 # http://localhost:5173
```

- Rutas de cliente: `/`, `/turnos`, `/turnos/mios`, `/puntos`, `/pagos`, `/ubicacion`,
  `/notificaciones`, `/perfil`
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
  `chip`, `carrusel` y `poste-barbero` (el poste gira como el de verdad: las
  franjas suben sin fin, con el salto vertical calculado para que el ciclo cierre
  sin costura).
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

## Panel del dueño
Todas las pantallas comparten el encabezado de `PanelPagina` (nav, título y
filete), así no hay tres variantes del mismo header.

- **Panel**: totales de hoy, semana y mes, más el **gráfico de ingresos por
  día** (7, 14 o 30 días). Es una sola serie a propósito: las tarjetas de arriba
  ya muestran ingresos, gastos y neto, y los gastos de una barbería son
  esporádicos — una segunda serie en cero casi todos los días es ruido. Los
  gastos aparecen en el globo al pasar por encima y en la tabla de números.
- **Turnos**: filtro por fecha y por estado, y alta de **turno de mostrador**
  para el que llamó o cayó sin turno. Se puede elegir un cliente existente o
  crearlo ahí mismo; nace confirmado y suma puntos igual que uno de la app.
- **Servicios y Canjes**: se editan (precio incluido) y se pueden **volver a
  activar**. Antes desactivar era irreversible desde la app: el listado sólo
  traía los activos, así que lo dado de baja desaparecía para siempre.
- **Foto de cada producto canjeable**: se sube tocando la miniatura en
  `/admin/productos`. Ver abajo.
- **Clientes**: buscador y ficha por cliente con sus turnos, sus canjes, cuánto
  gastó y cuándo vino por última vez.

## Fotos de los productos canjeables
El dueño sube la foto tocando la miniatura en `/admin/productos`. La imagen
reemplaza a la anterior y el archivo viejo se borra solo, así la carpeta no se
llena de fotos que ya nadie muestra.

- Se aceptan **JPG, PNG y WebP**, hasta 3 MB.
- **La foto se achica en el navegador antes de subirla** (700 px de lado mayor):
  una foto de celular pesa varios MB y se muestra en una tarjeta de 120 px.
  Achicarla antes ahorra datos, tiempo de subida y espacio en el servidor.
- El nombre del archivo lo genera el servidor; nunca se usa el que manda el
  cliente, porque puede traer rutas o extensiones engañosas.
- Los archivos viven en `backend/uploads/` (ignorado por git) y se sirven como
  estáticos en `/uploads`, cacheados por el navegador.
- En "Mis puntos" el cliente ve la foto subida. Si todavía no hay ninguna, cae
  en las fotos de respaldo emparejadas por nombre ("cera", "polvo", "aceite").

**Al deployar**: la carpeta `uploads/` necesita un volumen persistente, igual que
la base SQLite. Sin eso, las fotos se pierden en cada despliegue.

## Cuenta del cliente
En `/perfil` el cliente edita su nombre, carga o corrige su **teléfono** y cambia
su contraseña. El teléfono importa: sin él no se le puede mandar el recordatorio
de WhatsApp, y antes no había forma de agregarlo después de registrarse.

En "Mis puntos" ahora se ve tanto lo que sumó como lo que canjeó.

## Seguridad
- **CORS acotado**: sólo se aceptan los orígenes de `ORIGENES_PERMITIDOS` (lista
  separada por comas) más el Vite local. Un origen distinto recibe 403. La API
  viaja con el token del cliente: abierta a todos, cualquier sitio podría usarla
  en su nombre.
- **Límite de intentos**: 10 logins fallidos cada 10 minutos por IP (los
  exitosos no gastan cupo), 5 registros por hora y 5 pedidos de recuperación por
  hora. Detrás de un proxy hace falta `trust proxy`, que ya está puesto: si no,
  el límite vería a todos los clientes como uno solo.
- **Cabeceras** de `helmet`, y el cuerpo de las peticiones limitado a 100 kB.
- **Sesión vencida**: el token dura 30 días y el frontend ahora intercepta el
  401 — cierra la sesión y manda al login con un aviso. Antes las pantallas
  fallaban en silencio.
- **Mensajes que no filtran**: el login responde igual con email inexistente que
  con contraseña incorrecta, y el pedido de recuperación siempre contesta lo
  mismo exista o no la cuenta.

### Recuperación de contraseña
Todavía no hay servidor de mails, así que el enlace lo manda el dueño por
WhatsApp desde `/admin/recuperaciones`:

1. El cliente pide recuperar desde `/recuperar`.
2. El pedido aparece en el panel del dueño.
3. El dueño genera el enlace y se lo manda por WhatsApp.
4. El cliente define su contraseña desde `/recuperar/:token`.

El token se guarda **hasheado**, sirve una sola vez y vence en una hora. Para
pasar a mails, alcanza con enviar el enlace desde `POST /api/auth/recuperar`.

## Tests
```bash
cd backend
npm test
```

Cubren los flujos donde un error cuesta plata: que un horario no se reserve dos
veces, que un horario cancelado se pueda volver a tomar, que completar un turno
acredite los puntos y el ingreso **una sola vez**, que el canje descuente puntos
y stock (y que un canje rechazado no toque el stock), que la caja cuadre, y que
un cliente no pueda ver ni tocar lo del dueño.

Cada corrida usa una base nueva en un archivo temporal, así nunca tocan los
datos reales.

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
- La recuperación de contraseña depende de que el dueño mande el enlace por
  WhatsApp. Con un proveedor de mails pasa a ser automática.
- Backup de la base: hoy es un SQLite sin copia. En Railway/Render hace falta un
  volumen persistente —que también necesita `backend/uploads/`— o migrar a
  Postgres y un almacenamiento de archivos aparte.
- Subir imágenes de productos canjeables desde el panel (hoy las fotos salen
  de los assets y se emparejan por nombre).
- Deploy sugerido: backend en Railway/Render (con volumen persistente para
  SQLite, o migrar a Postgres si crece mucho el tráfico), frontend en
  Vercel/Netlify o el mismo Railway.
