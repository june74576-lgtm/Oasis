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

Los archivos `data/*.js` actúan como **fallback local**: si Supabase está configurado y tiene los datos en la tabla `config`, esos sobrescriben a los locales.
