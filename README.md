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

Toda ruta de "dueño" requiere el JWT de un usuario con `rol = 'dueño'`.

## Frontend

```bash
cd frontend
cp .env.example .env       # apuntá VITE_API_URL a tu backend
npm install
npm run dev                 # http://localhost:5173
```

- Rutas de cliente: `/`, `/turnos`, `/turnos/mios`, `/puntos`, `/pagos`, `/ubicacion`
- Rutas de dueño (protegidas por rol): `/admin`, `/admin/turnos`, `/admin/ingresos`,
  `/admin/servicios`, `/admin/productos`, `/admin/clientes`
- Al loguearse, el sistema redirige automáticamente según el rol del usuario.

### Sistema visual
La UI sigue la referencia de diseño en `frontend/src/assets/referencia.jpg`; los
colores están muestreados de ahí y las imágenes recortadas de la hoja de assets
`frontend/src/assets/image.png`.

- **Paleta** (`tailwind.config.js`): `negro #0A0A0A`, `panel #141414`,
  `borde #262626`, `dorado #C9AE8C` (arena: botones, chips activos, acentos),
  `crema #EDE7DC` (texto) y `papel #DFD8C6` (tarjetas claras).
- **Imágenes recortadas de la hoja**: `barberia-local.jpg` (fondo del login y
  foto de ambiente en Pagos), `banner-maquina.jpg` (banner del inicio),
  `mapa.jpg` (Ubicación, con el pin teñido al dorado de la marca),
  `pago-mercadopago.png` y `pago-naranjax.png` (logos oficiales), `qr.png`, y
  `producto-cera.png` / `producto-polvo.png` / `producto-aceite.png` (catálogo
  canjeable, con el fondo blanco ya removido).
  Los productos se emparejan con su foto por el nombre que cargues en
  `/admin/productos` (busca "cera", "polvo" o "aceite"); si no coincide, cae en
  un icono.
- **Iconos**: `src/components/Icono.jsx` — set propio de SVG de trazo fino que
  heredan el color con `currentColor`, siguiendo la hoja de iconos de la
  referencia. Uso: `<Icono nombre="tijera" size={20} />`. Props: `size`,
  `grosor`, `relleno` (macizo, se lee mejor por debajo de 16px) y `titulo`
  (lo vuelve accesible; sin él queda `aria-hidden`).
- **Animaciones**: tokens en `tailwind.config.js` (`animate-aparecer`,
  `animate-aparecer-escala`, `animate-sello`, `animate-destello`,
  `animate-latido`, `animate-flotar`, `animate-girar`, `animate-temblor`,
  `animate-tijeretazo`, `animate-acercar-foto`) más utilidades en
  `src/index.css`: `cascada` (entrada escalonada), `presionable`, `esqueleto`,
  `filete`, `rotulo`, `carrusel` y `poste-barbero`. Todo se apaga solo si el
  sistema pide `prefers-reduced-motion: reduce`.
- **Componentes de chrome**: `Encabezado` (flecha de volver + título centrado),
  `BottomNav`, `MedallonPuntos` (el sello con el saldo y el texto curvado),
  `Contador` (números que suben) y `Spinner` / `Esqueleto` / `Vacio`.

El login es una portada con la foto del local y los dos accesos: el formulario
se despliega sobre la misma pantalla (`/registro` abre directo el de registro).

Para volver a recortar los assets desde la hoja hay que tener Pillow
(`python -m pip install pillow`); los recortes están documentados arriba.

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
- Subir imágenes de productos canjeables desde el panel (hoy las fotos salen
  de los assets y se emparejan por nombre).
- Deploy sugerido: backend en Railway/Render (con volumen persistente para
  SQLite, o migrar a Postgres si crece mucho el tráfico), frontend en
  Vercel/Netlify o el mismo Railway.
