# OASIS

<div align="center">
  <img src="logo.png" alt="OASIS" width="140" />
  <p><em>Segundo Bachillerato · Cursos</em></p>
</div>

**OASIS** es una aplicación web para consultar y compartir todo lo relacionado a los cursos de Segundo Bachillerato: horarios, tutor, estudiantes, materiales de cada materia, tareas por día y galería de fotos. Todo en una sola pantalla, con un diseño oscuro inspirado en Material You.

---

## Características

- **Carrusel de cursos** con imagen aleatoria de la galería.
- **Vista a pantalla completa por curso** con:
  - Tutor asignado (con foto ampliable).
  - Horario de Lunes a Viernes (tabla en escritorio, timeline tipo Material You en móvil).
  - Carrusel de estudiantes con modal de perfil (nacimiento, nivel de inglés, contribuciones).
  - Galería con auto-scroll infinito (se desliza sola en escritorio y es arrastrable en móvil).
- **Tareas por día**: cada materia del día tiene su sección; cualquier estudiante del curso puede agregar tareas.
- **Materiales por materia** (Supabase Storage):
  - Materias divididas por nivel de inglés (ej. *Intermedio* / *Advanced*) con profesor y archivos propios.
  - Subida por *drag & drop* o clic (máx. 50 MB).
  - Borrado por quien subió el archivo o por el admin.
- **Login** con usuario/contraseña (derivados de los datos del estudiante) o **Google Sign-In**.
- **Panel de administración** para editar cursos, estudiantes, profesores, materias y horarios (JSON → Supabase).
- **Visor de imágenes** a pantalla completa.
- **Diseño responsive** y bloqueo de scroll inteligente para modales.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | HTML5 + CSS3 + JavaScript (vanilla) |
| Base de datos / Storage | [Supabase](https://supabase.com/) |
| Autenticación Google | Google Identity Services |
| Tipografía | Google Fonts (Raleway, Roboto Flex, Anton) |

Sin frameworks, sin bundler, sin build step. Se abre directamente en el navegador.

---

## Estructura del proyecto

```
oasis/
├── index.html              # Página principal
├── script.js               # Lógica de la app
├── style.css               # Estilos (Material You dark)
├── logo.png                # Logo
├── favicon.svg             # Ícono de pestaña
└── data/
    ├── supabase-config.js  # Cliente de Supabase + Client ID de Google
    ├── cursos.js           # Cursos locales
    ├── profesores.js       # Profesores locales
    ├── materias.js         # Materias y niveles
    ├── horarios.js         # Horarios por curso
    ├── galeria.js          # Fotos locales por curso
    └── estudiantes.js      # Estudiantes y credenciales
```

> Los archivos `data/*.js` actúan como **fallback local**: si Supabase está configurado y tiene los datos en la tabla `config`, esos sobrescriben a los locales.

---

## Puesta en marcha

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/oasis.git
   cd oasis
   ```

2. **Sirve la carpeta** con cualquier servidor estático, por ejemplo:
   ```bash
   npx serve .
   # o
   python -m http.server 8000
   ```

3. Abre `http://localhost:8000` en el navegador. Listo

---

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/).
2. Crea las siguientes tablas:

   **`config`** — datos editables desde el panel admin:
   | Columna | Tipo |
   |---------|------|
   | `id` | text (PK) — `cursos`, `estudiantes`, `profesores`, `materias`, `horarios` |
   | `data` | jsonb |
   | `updated_at` | timestamptz |

   **`archivos`** — materiales subidos:
   | Columna | Tipo |
   |---------|------|
   | `id` | uuid (PK) |
   | `materia` | text |
   | `curso` | text |
   | `nombre` | text |
   | `storage_path` | text |
   | `subido_por_id` | text |
   | `subido_por_nombre` | text |
   | `fecha` | timestamptz |

   **`tareas`** — tareas por día:
   | Columna | Tipo |
   |---------|------|
   | `id` | uuid (PK) |
   | `curso` | text |
   | `dia` | text |
   | `materia` | text |
   | `titulo` | text |
   | `descripcion` | text |
   | `autor_id` | text |
   | `autor_nombre` | text |
   | `fecha` | timestamptz |

   **`galeria_fotos`** — fotos subidas por los estudiantes:
   | Columna | Tipo |
   |---------|------|
   | `id` | uuid (PK) |
   | `curso` | text |
   | `storage_path` | text |
   | `subido_por_id` | text |
   | `subido_por_nombre` | text |
   | `fecha` | timestamptz |

3. Crea dos **buckets públicos** en Storage:
   - `archivos` (materiales, límite 50 MB)
   - `galeria` (fotos, límite 10 MB)

4. Edita `data/supabase-config.js`:
   ```js
   const SUPABASE_URL = "https://tu-proyecto.supabase.co";
   const SUPABASE_ANON_KEY = "tu-anon-key";
   const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

   const GOOGLE_CLIENT_ID = "TU_CLIENT_ID.apps.googleusercontent.com";
   const ADMIN_EMAIL = "tu-correo-admin@gmail.com";
   ```

---

## Google Sign-In

1. Entra a [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Crea un **OAuth Client ID** de tipo *Web application*.
3. Agrega el origen donde sirves la app (ej. `http://localhost:8000`) en *Authorized JavaScript origins*.
4. Pega el Client ID en `GOOGLE_CLIENT_ID` dentro de `data/supabase-config.js`.

El admin (según `ADMIN_EMAIL`) entra directo. Los estudiantes deben iniciar sesión primero con usuario/contraseña y luego conectar su cuenta Google desde el menú de perfil.

---

## Credenciales de estudiantes

Se generan automáticamente a partir del nombre y la fecha de nacimiento:

- **Usuario**: primer nombre + primer apellido (sin tildes ni espacios).
- **Contraseña**: primer apellido + primer nombre + día de nacimiento.

Ejemplo: `Juan Quichimbo`, nacido el `07/03/2008`
→ usuario: `juanquichimbo`
→ contraseña: `quichimbojuan07`

---

## Panel de administración

Solo visible para el usuario con `ADMIN_EMAIL`. Permite editar en vivo:

- Cursos, estudiantes, profesores, materias y horarios.
- Los cambios se guardan como JSON en la tabla `config` de Supabase y se aplican a todos los usuarios al recargar.

---

## Paleta de colores

| Variable | Valor |
|----------|-------|
| `--bg` | `#131316` |
| `--primary` | `#c6b8ff` |
| `--tertiary` | `#f0b7d0` |
| `--surface-1` | `#211f26` |
| `--on-surface` | `#e6e1e9` |

---

## Licencia

Proyecto personal creado por **Juan Quichimbo**.

Hecho con ❤︎ para los estudiantes de Segundo Bachillerato.

Los archivos `data/*.js` actúan como **fallback local**: si Supabase está configurado y tiene los datos en la tabla `config`, esos sobrescriben a los locales.
