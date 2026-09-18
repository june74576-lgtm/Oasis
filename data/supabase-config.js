// Reemplazá estos dos valores con los de tu proyecto de Supabase.
//
// Pasos para crear el proyecto (gratis, SIN tarjeta):
// 1. supabase.com → Start your project → crea una cuenta (con GitHub es más rápido)
// 2. "New project" → nombre "oasis" → contraseña de base de datos (guárdala,
//    no la vas a necesitar en el código, pero por las dudas) → región más
//    cercana (ej. East US) → Create new project (tarda ~1-2 min en armarse)
//
// 3. Ve a "SQL Editor" (ícono de la izquierda) → "New query" → pega esto
//    completo y presiona Run:
//
//    create table archivos (
//      id bigint generated always as identity primary key,
//      materia text not null,
//      curso text not null,
//      nombre text not null,
//      storage_path text not null,
//      subido_por_id bigint,
//      subido_por_nombre text,
//      fecha timestamptz default now()
//    );
//
//    alter table archivos enable row level security;
//
//    create policy "cualquiera puede leer" on archivos
//      for select using (true);
//
//    create policy "cualquiera puede subir" on archivos
//      for insert with check (true);
//
//    create policy "cualquiera puede borrar" on archivos
//      for delete using (true);
//
// 4. Andá a "Storage" (ícono de la izquierda) → "New bucket" → nombre
//    "archivos" → activa "Public bucket" → Create bucket
//
//    OJO: "Public bucket" solo habilita LEER archivos. Para poder SUBIR,
//    hace falta agregar políticas aparte. Ve a "SQL Editor" → "New query"
//    → pégalo y presiona Run:
//
//    create policy "acceso publico archivos - leer"
//    on storage.objects for select
//    using ( bucket_id = 'archivos' );
//
//    create policy "acceso publico archivos - subir"
//    on storage.objects for insert
//    with check ( bucket_id = 'archivos' );
//
//    create policy "acceso publico archivos - borrar"
//    on storage.objects for delete
//    using ( bucket_id = 'archivos' );
//
// 5. Andá a "Project Settings" (ícono de tuerca abajo) → "Data API" →
//    copia la "Project URL" y pégala en SUPABASE_URL más abajo
//
// 6. En la misma pantalla (o en "API Keys") copia la "anon public" key
//    y pégala en SUPABASE_ANON_KEY
//
// Nota sobre seguridad: estas reglas son abiertas (cualquiera puede
// leer/subir/borrar) porque no hay backend real verificando quién sos.
// El botón de borrar solo se MUESTRA si eres quien subió el archivo,
// pero alguien con conocimientos técnicos podría saltarse eso. Para
// este proyecto (compañeros de curso) es un riesgo aceptable.

// ===== Tabla de TAREAS =====
// Corré esto también en el SQL Editor para que funcione la sección
// de Tareas (clic en un día del horario):
//
//    create table tareas (
//      id bigint generated always as identity primary key,
//      curso text not null,
//      dia text not null,
//      materia text not null,
//      titulo text not null,
//      descripcion text,
//      autor_id bigint,
//      autor_nombre text,
//      fecha timestamptz default now()
//    );
//
//    alter table tareas enable row level security;
//
//    create policy "cualquiera puede leer tareas" on tareas
//      for select using (true);
//
//    create policy "cualquiera puede agregar tareas" on tareas
//      for insert with check (true);

// ===== Google Sign-In (para el panel de administración) =====
//
// Pasos para crear tu Client ID (gratis):
// 1. console.cloud.google.com → creá un proyecto (o usá uno existente)
// 2. "APIs & Services" → "Credentials" → "Create Credentials" →
//    "OAuth client ID" → tipo "Web application"
// 3. En "Authorized JavaScript origins" agregá la URL desde donde
//    abrís la página (ej. https://tu-usuario.github.io)
// 4. Copiá el Client ID (termina en .apps.googleusercontent.com) y
//    pegalo abajo
//
// ADMIN_EMAIL es el único correo que va a tener acceso al panel de
// administración cuando entre con "Continuar con Google".

// ===== Tabla de CONFIGURACIÓN (panel de administración) =====
//
//    create table config (
//      id text primary key,
//      data jsonb not null,
//      updated_at timestamptz default now()
//    );
//
//    alter table config enable row level security;
//
//    create policy "cualquiera puede leer config" on config
//      for select using (true);
//
//    create policy "cualquiera puede guardar config" on config
//      for insert with check (true);
//
//    create policy "cualquiera puede actualizar config" on config
//      for update using (true);

// ===== Fotos de galería subidas por estudiantes =====
//
//    create table galeria_fotos (
//      id bigint generated always as identity primary key,
//      curso text not null,
//      storage_path text not null,
//      subido_por_id bigint,
//      subido_por_nombre text,
//      fecha timestamptz default now()
//    );
//
//    alter table galeria_fotos enable row level security;
//
//    create policy "cualquiera puede leer galeria_fotos" on galeria_fotos
//      for select using (true);
//
//    create policy "cualquiera puede subir galeria_fotos" on galeria_fotos
//      for insert with check (true);
//
// Y en Storage → New bucket → nombre "galeria" → Public bucket → Create.
// Después, en el SQL Editor:
//
//    create policy "acceso publico galeria - leer"
//    on storage.objects for select
//    using ( bucket_id = 'galeria' );
//
//    create policy "acceso publico galeria - subir"
//    on storage.objects for insert
//    with check ( bucket_id = 'galeria' );

const SUPABASE_URL = "https://mupdiqlibvhvckcoqprp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cGRpcWxpYnZodmNrY29xcHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDQ4NDksImV4cCI6MjEwMDMyMDg0OX0.KI1OdPh9dXKk2DGyNwb8Cfmu1usClbzbx8Zoy1X4V8A";

// OJO: la librería del CDN se llama a sí misma "supabase" en window.
// Por eso a NUESTRO cliente (ya conectado a tu proyecto) lo llamamos
// distinto: supabaseClient. Todo script.js usa ese nombre, no "supabase"
// a secas, para no pisarse con la librería.

let supabaseClient = null;

if (!SUPABASE_URL.includes("TU_PROYECTO") && window.supabase && typeof window.supabase.createClient === "function") {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("[Oasis] Supabase no está configurado todavía — revisá data/supabase-config.js");
}