# Oasis

Plataforma escolar con Vue 3 + Supabase. Cinco secciones:

- **Courses** (`index.html`) — horarios, tutor, estudiantes, galería, chat
- **Admin** (`admin.html`) — CRUD de cursos, estudiantes, profesores, materias, horarios, galería
- **Secrets** (`secrets.html`) — feed anónimo estilo Discord
- **Store** (`store.html`) — feed público de emprendimientos
- **My Store** (`my-store.html`) — editor del emprendimiento propio

---

## Estructura
/
├── index.html, admin.html, secrets.html, store.html, my-store.html
├── data/supabase-config.js
├── css/
│ ├── identity.css tokens + animaciones compartidas
│ ├── base.css reset, body, botones, forms
│ ├── login.css login screen
│ ├── components.css drawer, modals, photo-slot, user-chips, image-viewer
│ ├── course.css tutor, horarios, students, gallery, student modal
│ ├── chat.css panel de chat
│ ├── admin.css panel de administración
│ ├── store.css store + my-store
│ └── secrets.css secrets feed
└── js/
├── shared/
│ ├── config.js constantes (OWNER_ID, buckets, días, límites)
│ ├── utils.js funciones puras (normalize, shortName, …)
│ ├── auth.js sesión + login/logout
│ ├── data.js mappers + loaders de Supabase
│ └── ui.js eye-toggle, GIF loader, bootstrap
├── components/
│ └── PhotoSlot.js componente Vue de foto con fallback
├── app.js
├── admin.js
├── secrets.js
├── store.js
└── my-store.js

text

---

## Setup de Supabase

### 1. Crear el proyecto

1. [supabase.com](https://supabase.com) → *Start your project* → cuenta (GitHub es más rápido)
2. *New project* → nombre `oasis` → contraseña de DB → región más cercana → *Create*
3. Esperar ~1-2 min

### 2. Crear las tablas

Ir a **SQL Editor** → *New query* → pegar todo y *Run*.

```sql
-- ============================================================
-- CURSOS
-- ============================================================
create table cursos (
    id text primary key,
    nombre text not null,
    disabled boolean default false,
    orden integer default 0
);
alter table cursos enable row level security;
create policy "cualquiera puede leer cursos"   on cursos for select using (true);
create policy "cualquiera puede editar cursos" on cursos for all    using (true) with check (true);

-- ============================================================
-- ESTUDIANTES
-- ============================================================
create table estudiantes (
    id bigint generated always as identity primary key,
    nombre text not null,
    foto text default '',
    curso text references cursos(id),
    fecha_nacimiento date,
    nivel_ingles text default '',
    cargo text default '',
    is_admin boolean default false,
    has_store boolean default false
);
alter table estudiantes enable row level security;
create policy "cualquiera puede leer estudiantes"   on estudiantes for select using (true);
create policy "cualquiera puede editar estudiantes" on estudiantes for all    using (true) with check (true);

-- ============================================================
-- PROFESORES
-- ============================================================
create table profesores (
    id bigint primary key,
    nombre text not null,
    foto text default '',
    tutor text default ''
);
alter table profesores enable row level security;
create policy "cualquiera puede leer profesores"   on profesores for select using (true);
create policy "cualquiera puede editar profesores" on profesores for all    using (true) with check (true);

-- ============================================================
-- MATERIAS
-- ============================================================
create table materias (
    id text primary key,
    nombre text not null,
    orden integer default 0
);
alter table materias enable row level security;
create policy "cualquiera puede leer materias"   on materias for select using (true);
create policy "cualquiera puede editar materias" on materias for all    using (true) with check (true);

-- ============================================================
-- NIVELES DE MATERIA (ej. inglés intermedio / avanzado)
-- ============================================================
create table materias_niveles (
    materia_id text references materias(id),
    nivel_id   text not null,
    nombre     text not null,
    profesor_id bigint,
    primary key (materia_id, nivel_id)
);
alter table materias_niveles enable row level security;
create policy "cualquiera puede leer niveles"   on materias_niveles for select using (true);
create policy "cualquiera puede editar niveles" on materias_niveles for all    using (true) with check (true);

-- ============================================================
-- HORARIOS
-- ============================================================
create table horarios (
    id bigint generated always as identity primary key,
    curso text not null,
    hora text not null,
    tipo text not null default 'clase',  -- 'clase' | 'recreo'
    dia text,                            -- Lunes…Viernes o null para recreo
    materia_id text,
    profesor_id bigint,
    orden integer default 0,
    label text default ''                -- para recreos ("Recreo", "Almuerzo", …)
);
alter table horarios enable row level security;
create policy "cualquiera puede leer horarios"   on horarios for select using (true);
create policy "cualquiera puede editar horarios" on horarios for all    using (true) with check (true);

-- ============================================================
-- NOTAS
-- ============================================================
create table notas (
    id bigint generated always as identity primary key,
    estudiante_id bigint references estudiantes(id),
    materia_id text references materias(id),
    valor numeric not null,
    orden integer default 0
);
alter table notas enable row level security;
create policy "cualquiera puede leer notas"   on notas for select using (true);
create policy "cualquiera puede editar notas" on notas for all    using (true) with check (true);

-- ============================================================
-- GALERÍA LOCAL (fotos administradas por el panel)
-- ============================================================
create table galeria_local (
    id bigint generated always as identity primary key,
    curso text not null,
    ruta text not null,
    orden integer default 0
);
alter table galeria_local enable row level security;
create policy "cualquiera puede leer galeria_local"   on galeria_local for select using (true);
create policy "cualquiera puede editar galeria_local" on galeria_local for all    using (true) with check (true);

-- ============================================================
-- ARCHIVOS (documentos subidos por estudiantes)
-- ============================================================
create table archivos (
    id bigint generated always as identity primary key,
    materia text not null,
    curso text not null,
    nombre text not null,
    storage_path text not null,
    subido_por_id bigint,
    subido_por_nombre text,
    fecha timestamptz default now()
);
alter table archivos enable row level security;
create policy "cualquiera puede leer archivos"   on archivos for select using (true);
create policy "cualquiera puede subir archivos"  on archivos for insert with check (true);
create policy "cualquiera puede borrar archivos" on archivos for delete using (true);

-- ============================================================
-- GALERÍA FOTOS (subidas por estudiantes desde Courses)
-- ============================================================
create table galeria_fotos (
    id bigint generated always as identity primary key,
    curso text not null,
    storage_path text not null,
    subido_por_id bigint,
    subido_por_nombre text,
    fecha timestamptz default now()
);
alter table galeria_fotos enable row level security;
create policy "cualquiera puede leer galeria_fotos"  on galeria_fotos for select using (true);
create policy "cualquiera puede subir galeria_fotos" on galeria_fotos for insert with check (true);

-- ============================================================
-- CHAT
-- ============================================================
create table chat_mensajes (
    id bigint generated always as identity primary key,
    curso text not null,
    autor_id bigint,
    autor_nombre text,
    mensaje text not null,
    comprimido boolean default false,
    fecha timestamptz default now()
);
alter table chat_mensajes enable row level security;
create policy "cualquiera puede leer chat"   on chat_mensajes for select using (true);
create policy "cualquiera puede subir chat"  on chat_mensajes for insert with check (true);
create policy "cualquiera puede borrar chat" on chat_mensajes for delete using (true);

-- ============================================================
-- SECRETS
-- ============================================================
create table secrets (
    id bigint generated always as identity primary key,
    autor_id bigint,
    autor_nombre text,
    anonimo boolean default false,
    mensaje text not null,
    fecha timestamptz default now()
);
alter table secrets enable row level security;
create policy "cualquiera puede leer secrets"   on secrets for select using (true);
create policy "cualquiera puede subir secrets"  on secrets for insert with check (true);
create policy "cualquiera puede borrar secrets" on secrets for delete using (true);

-- ============================================================
-- TAREAS (documentado originalmente en supabase-config.js)
-- ============================================================
create table tareas (
    id bigint generated always as identity primary key,
    curso text not null,
    dia text not null,
    materia text not null,
    titulo text not null,
    descripcion text,
    autor_id bigint,
    autor_nombre text,
    fecha timestamptz default now()
);
alter table tareas enable row level security;
create policy "cualquiera puede leer tareas"   on tareas for select using (true);
create policy "cualquiera puede agregar tareas" on tareas for insert with check (true);

-- ============================================================
-- CONFIG (panel de administración)
-- ============================================================
create table config (
    id text primary key,
    data jsonb not null,
    updated_at timestamptz default now()
);
alter table config enable row level security;
create policy "cualquiera puede leer config"    on config for select using (true);
create policy "cualquiera puede guardar config" on config for insert with check (true);
create policy "cualquiera puede editar config"  on config for update using (true);

-- ============================================================
-- STORES (emprendimientos)
-- ============================================================
create table stores (
    id bigint generated always as identity primary key,
    owner_id bigint references estudiantes(id),
    nombre text not null,
    descripcion text default '',
    card_image text default '',
    enabled boolean default true,
    created_at timestamptz default now()
);
alter table stores enable row level security;
create policy "cualquiera puede leer stores"   on stores for select using (true);
create policy "cualquiera puede editar stores" on stores for all    using (true) with check (true);

-- ============================================================
-- STORE PHOTOS
-- ============================================================
create table store_photos (
    id bigint generated always as identity primary key,
    store_id bigint references stores(id) on delete cascade,
    storage_path text not null,
    orden integer default 0
);
alter table store_photos enable row level security;
create policy "cualquiera puede leer store_photos"   on store_photos for select using (true);
create policy "cualquiera puede editar store_photos" on store_photos for all    using (true) with check (true);
3. Crear los buckets de Storage
En Storage → New bucket → activar Public bucket → Create:

Bucket	Uso
archivos	documentos de materias
galeria	fotos subidas por estudiantes
media	fotos de estudiantes y profesores
stores	imágenes de la tienda
Después, en SQL Editor, crear las políticas de Storage para cada bucket:

sql
-- archivos
create policy "archivos - leer"   on storage.objects for select using (bucket_id = 'archivos');
create policy "archivos - subir"  on storage.objects for insert with check (bucket_id = 'archivos');
create policy "archivos - borrar" on storage.objects for delete using (bucket_id = 'archivos');

-- galeria
create policy "galeria - leer"   on storage.objects for select using (bucket_id = 'galeria');
create policy "galeria - subir"  on storage.objects for insert with check (bucket_id = 'galeria');

-- media
create policy "media - leer"   on storage.objects for select using (bucket_id = 'media');
create policy "media - subir"  on storage.objects for insert with check (bucket_id = 'media');
create policy "media - borrar" on storage.objects for delete using (bucket_id = 'media');

-- stores
create policy "stores - leer"   on storage.objects for select using (bucket_id = 'stores');
create policy "stores - subir"  on storage.objects for insert with check (bucket_id = 'stores');
create policy "stores - borrar" on storage.objects for delete using (bucket_id = 'stores');
4. Configurar las credenciales
En Project Settings → Data API, copiar:

Project URL → pegar en SUPABASE_URL de data/supabase-config.js

anon public key → pegar en SUPABASE_ANON_KEY de data/supabase-config.js

Notas de seguridad
Las políticas RLS son abiertas (using (true)) porque no hay backend verificando identidad: el login es puramente client-side (usuario + fecha de nacimiento). Es un riesgo aceptable para un proyecto de compañeros de curso, pero:

Cualquiera con conocimientos técnicos puede leer/escribir/borrar en la DB

El "botón de borrar" en el frontend solo se muestra al autor, pero no es una garantía

Para producción real habría que migrar a Supabase Auth con email + contraseña.

Desarrollo
No hay build step. Se sirve como estático:

bash
# Cualquier servidor estático sirve
python3 -m http.server 8000
# o
npx serve .
Abrir http://localhost:8000.

text

---

## 📄 `data/supabase-config.js`

```javascript
/* ============================================================
   Oasis · Supabase client
   ------------------------------------------------------------
   Rellena SUPABASE_URL y SUPABASE_ANON_KEY con los valores de
   tu proyecto. El SQL de setup completo está en README.md.
   ============================================================ */

const SUPABASE_URL      = "https://mupdiqlibvhvckcoqprp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cGRpcWxpYnZodmNrY29xcHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDQ4NDksImV4cCI6MjEwMDMyMDg0OX0.KI1OdPh9dXKk2DGyNwb8Cfmu1usClbzbx8Zoy1X4V8A";

/**
 * Cliente compartido. La librería del CDN se auto-registra como
 * `window.supabase`. A NUESTRO cliente (ya instanciado) lo llamamos
 * `supabaseClient` para no pisarla.
 *
 * Es un binding léxico global: todos los scripts cargados después
 * pueden leerlo directamente con `supabaseClient`, sin pasar por
 * `window.supabaseClient`.
 */
let supabaseClient = null;

if (
    !SUPABASE_URL.includes("TU_PROYECTO") &&
    window.supabase &&
    typeof window.supabase.createClient === "function"
) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn(
        "[Oasis] Supabase no está configurado — revisá data/supabase-config.js"
    );
}

## Realtime

El chat y los secrets usan **Supabase Realtime** para actualizarse en vivo. Es un paso extra en Supabase, una sola vez:

**SQL Editor → New query → Run:**

```sql
alter publication supabase_realtime add table chat_mensajes;
alter publication supabase_realtime add table secrets;
alter publication supabase_realtime add table galeria_fotos;
Verificá en Database → Replication → supabase_realtime que aparezcan las 3 tablas.

Sin esto, los canales conectan (SUBSCRIBED) pero no llega ningún evento.

text

---

## 🧪 Cómo probar que funciona

**Chat:**
1. Abrí `index.html` en **dos pestañas** (o dos navegadores) con la **misma cuenta**.
2. En ambas, entrá al mismo curso y abrí el chat.
3. En una, mandá un mensaje.
4. En la otra, debe aparecer **sin recargar**, en menos de 1 segundo.
5. Borrá el mensaje en una pestaña → desaparece en la otra.
6. En DevTools de cualquiera, buscá en consola: `[Chat] Realtime conectado: <curso>`.

**Secrets:**
1. Abrí `secrets.html` en dos pestañas.
2. Mandá un secret desde una.
3. Aparece en la otra al toque.
4. Borralo → desaparece en ambas.

**Debug si no llega:**
- Consola del navegador debe decir `[Chat] Realtime conectado: X`. Si dice `CHANNEL_ERROR`, no habilitaste la tabla en la publicación (Paso 0).
- En **Network → WS**, debe haber un WebSocket abierto a `*.supabase.co/realtime/v1/websocket`.
- En **Supabase → Realtime Inspector** podés ver los eventos entrando en tiempo real.

---

## ⚠️ Lo que **no** cubre este cambio

- **Notificaciones**: si el usuario está en otra página o pestaña, no se entera. Eso requiere un badge global o Web Notifications API.
- **Reconnect visual**: si se cae la conexión, Supabase intenta reconectar solo, pero no hay indicador visual. Se puede agregar un puntito "conectado/desconectado" en el header del chat si querés.
- **Galería en vivo**: dejé la SQL para habilitarla, pero no implementé el `subscribe` en `app.js` para las fotos. Es un cambio de 15 líneas si querés después.

---

## ✅ Después de probar

Contame si el chat y secrets se actualizan en vivo. Si funciona → próximos pasos posibles:
- Galería en vivo (subscribe a `galeria_fotos`)
- Notificaciones en el topbar cuando alguien escribe
- Migración a Supabase Auth (login con email/contraseña real)