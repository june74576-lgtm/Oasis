# Oasis

<div>
  <img src="logo.png" width="120" />
</div><br>

Plataforma escolar con Vue 3 + Supabase. Cinco secciones:

- **Courses** (`index.html`) — horarios, tutor, estudiantes, galería, chat en vivo
- **Admin** (`admin.html`) — CRUD de cursos, estudiantes, profesores, materias, horarios, galería
- **Secrets** (`secrets.html`) — feed anónimo estilo Discord, con hilos y realtime
- **Store** (`store.html`) — feed público de emprendimientos
- **My Store** (`my-store.html`) — editor standalone del emprendimiento propio (también disponible como modal `MyStoreModal` desde cualquier página)

---

## Estructura

```
/
├── index.html Courses
├── admin.html Admin panel
├── secrets.html Secrets feed
├── store.html Store público
├── my-store.html My Store (standalone)
├── in-the-pool.mp3 🎵 Música del login (ver §Música)
├── reze.png Mascota del login
├── data/
│ └── supabase-config.js
├── css/
│ ├── identity.css tokens + animaciones compartidas
│ ├── base.css reset, body, botones, forms
│ ├── login.css login screen
│ ├── components.css drawer, modals, photo-slot, profile, image-viewer
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
│ └── ui.js eye-toggle, reze text, música, bootstrap
├── components/
│ ├── PhotoSlot.js foto con fallback
│ ├── ProfileModal.js perfil (ver / editar / archivos)
│ └── MyStoreModal.js editor de tienda (modal)
├── app.js
├── admin.js
├── secrets.js
├── store.js
└── my-store.js
```

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
    has_store boolean default false,
    instagram text default '',
    tiktok text default '',
    whatsapp text default '',
    spotify text default ''
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
-- ARCHIVOS (documentos de materia subidos por estudiantes)
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
-- PROFILE ARCHIVOS (documentos adjuntos al perfil del estudiante)
-- Usa el mismo bucket `archivos`, path: profiles/{id}/…
-- ============================================================
create table profile_archivos (
    id bigint generated always as identity primary key,
    estudiante_id bigint references estudiantes(id) on delete cascade,
    nombre text not null,
    storage_path text not null,
    fecha timestamptz default now()
);
alter table profile_archivos enable row level security;
create policy "profile_archivos - leer"   on profile_archivos for select using (true);
create policy "profile_archivos - subir"  on profile_archivos for insert with check (true);
create policy "profile_archivos - borrar" on profile_archivos for delete using (true);

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
-- CHAT (mensajes del curso + hilos)
-- ============================================================
create table chat_mensajes (
    id bigint generated always as identity primary key,
    curso text not null,
    autor_id bigint,
    autor_nombre text,
    mensaje text not null,
    comprimido boolean default false,
    reply_to_id bigint,
    parent_id bigint,                    -- id del mensaje raíz del hilo
    fecha timestamptz default now()
);
alter table chat_mensajes enable row level security;
create policy "cualquiera puede leer chat"   on chat_mensajes for select using (true);
create policy "cualquiera puede subir chat"  on chat_mensajes for insert with check (true);
create policy "cualquiera puede borrar chat" on chat_mensajes for delete using (true);

-- ============================================================
-- SECRETS (feed anónimo + hilos)
-- ============================================================
create table secrets (
    id bigint generated always as identity primary key,
    autor_id bigint,
    autor_nombre text,
    anonimo boolean default false,
    mensaje text not null,
    reply_to_id bigint,
    parent_id bigint,
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
create policy "cualquiera puede leer tareas"    on tareas for select using (true);
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
Si ya tenías el schema de una versión anterior
Ejecutá solo los ALTER TABLE que falten:

sql
alter table estudiantes    add column if not exists instagram text default '';
alter table estudiantes    add column if not exists tiktok    text default '';
alter table estudiantes    add column if not exists whatsapp  text default '';
alter table estudiantes    add column if not exists spotify   text default '';
alter table chat_mensajes  add column if not exists reply_to_id bigint;
alter table chat_mensajes  add column if not exists parent_id   bigint;
alter table secrets        add column if not exists reply_to_id bigint;
alter table secrets        add column if not exists parent_id   bigint;

-- Y correr el CREATE TABLE de `profile_archivos` de arriba.
3. Crear los buckets de Storage
Storage → New bucket → activar Public bucket → Create:

Bucket	Uso
archivos	documentos de materias y archivos de perfil (profiles/{id}/…)
galeria	fotos subidas por estudiantes
media	fotos de estudiantes y profesores
stores	imágenes de la tienda
Después, en SQL Editor, crear las políticas de Storage:

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
```

4. Configurar las credenciales
En Project Settings → Data API, copiar:

Project URL → pegar en SUPABASE_URL de data/supabase-config.js

anon public key → pegar en SUPABASE_ANON_KEY de data/supabase-config.js

Realtime
El chat y los secrets usan Supabase Realtime para actualizarse en vivo. Es un paso extra, una sola vez:

SQL Editor → New query → Run:

sql
alter publication supabase_realtime add table chat_mensajes;
alter publication supabase_realtime add table secrets;
alter publication supabase_realtime add table galeria_fotos;
Verificá en Database → Replication → supabase_realtime que aparezcan las 3 tablas. Sin esto, los canales conectan (SUBSCRIBED) pero no llega ningún evento.

🎵 Música del login
La pantalla de login reproduce "In the Pool" de kensuke ushio en loop:

Descargá el .mp3 de la canción.

Renombralo exactamente a in-the-pool.mp3.

Ponelo en la raíz del proyecto (al mismo nivel que index.html).

Los navegadores modernos bloquean el autoplay con sonido. El código lo intenta al cargar y, si falla, espera el primer click/tecla del usuario (que suele ser el propio botón de login). Hay un botoncito abajo a la derecha para pausar/reanudar, y la música se pausa automáticamente al entrar a la app y se reanuda al volver al login.

Si no ponés el archivo, el botón de música se oculta automáticamente y no rompe nada.

Notas de seguridad
Las políticas RLS son abiertas (using (true)) porque no hay backend verificando identidad: el login es puramente client-side (usuario derivado del nombre + fecha de nacimiento). Es un riesgo aceptable para un proyecto de compañeros de curso, pero:

Cualquiera con conocimientos técnicos puede leer/escribir/borrar en la DB.

El "botón de borrar" en el frontend solo se muestra al autor, pero no es una garantía.

Para producción real habría que migrar a Supabase Auth con email + contraseña.

Desarrollo
No hay build step. Se sirve como estático:

bash
# Cualquier servidor estático sirve
python3 -m http.server 8000
# o
npx serve .
Abrir http://localhost:8000.

⚠️ No abrir los HTML con file:// directamente: fetch/Supabase y el <audio> pueden fallar por CORS.

🧪 Cómo probar
Chat:

Abrí index.html en dos pestañas con la misma cuenta.

En ambas, entrá al mismo curso y abrí el chat.

En una, mandá un mensaje.

En la otra debe aparecer sin recargar, en menos de 1 segundo.

Borralo en una pestaña → desaparece en la otra.

En DevTools de cualquiera, buscá en consola: [Chat] Realtime conectado: <curso>.

Secrets:

Abrí secrets.html en dos pestañas.

Mandá un secret desde una.

Aparece en la otra al toque.

Borralo → desaparece en ambas.

Profile (archivos):

Abrí el perfil en modo edición (drawer → Profile).

En la sección Files podés:

Arrastrar uno o varios archivos al área → sube en serie.

Usar el botón Agregar archivo (acepta múltiples).

Ver la lista con descargar (click en el nombre) y borrar.

Al cerrar y abrir el perfil de otro usuario en vista, solo ves sus archivos (sin botones de edición).

Login + música:

Cerrá sesión o abrí sin sesión.

La tarjeta queda a la izquierda, Reze a la derecha centrada (≥ 900 px).

La música arranca sola si el navegador lo permite; si no, en el primer click.

El botón de música (esquina inferior derecha) alterna play/pausa.

Debug realtime si no llega:

La consola debe decir [Chat] Realtime conectado: X. Si dice CHANNEL_ERROR, no habilitaste la tabla en la publicación (§Realtime).

En Network → WS debe haber un WebSocket abierto a *.supabase.co/realtime/v1/websocket.

En Supabase → Realtime Inspector podés ver los eventos entrando en tiempo real.

⚠️ Lo que no cubre
Notificaciones: si el usuario está en otra página o pestaña, no se entera de mensajes nuevos. Requeriría un badge global o Web Notifications API.

Indicador de conexión: si se cae el WebSocket, Supabase intenta reconectar solo, pero no hay puntito visual de "conectado/desconectado" en el header del chat.

Galería en vivo: el SQL de Realtime la incluye, pero app.js no tiene el subscribe para galeria_fotos. Es un cambio de ~15 líneas si querés después.

✅ Próximos pasos posibles
Galería en vivo (subscribe a galeria_fotos).

Notificaciones en el topbar cuando alguien escribe.

Migración a Supabase Auth (login con email/contraseña real).

Adjuntar imágenes en el chat.

---

## Qué cambió respecto al README anterior

| Cambio | Motivo |
|---|---|
| `estudiantes` ahora tiene `instagram`, `tiktok`, `whatsapp`, `spotify` | `ProfileModal` los lee/escribe. Sin esas columnas falla el guardado. |
| `secrets` y `chat_mensajes` ahora tienen `reply_to_id` y `parent_id` | Ya los usaba el código (hilos y respuestas), pero el SQL del README no los creaba. |
| Nueva tabla `profile_archivos` | Feature nueva del perfil. |
| Sección de `ALTER TABLE` para migrar de la versión vieja | Para no tener que recrear la DB. |
| Bucket `archivos` documentado también para perfiles (`profiles/{id}/…`) | Reutilizamos el mismo bucket, no hace falta uno nuevo. |
| Nueva sección **Música del login** | Explica el `.mp3` y el comportamiento del autoplay. |
| Estructura actualizada con `ProfileModal.js` y `MyStoreModal.js` | Existían pero no estaban en el árbol. |
| Prueba nueva de **Profile (archivos)** y **Login + música** | Para verificar los features recién agregados. |
| `my-store.html` documentado como *standalone* + también disponible como `MyStoreModal` | Ambas formas existen en el proyecto. |
