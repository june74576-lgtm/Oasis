/* ============================================================
   Oasis · Shared config
   ------------------------------------------------------------
   Constantes compartidas entre todas las páginas. Todo lo que
   antes estaba hardcodeado en cada app.js va acá.
   ============================================================ */

window.Oasis = window.Oasis || {};

window.Oasis.config = Object.freeze({
    /* ---------- Identidad ---------- */
    OWNER_ID: 11,

    /* ---------- Storage keys ---------- */
    SESSION_KEY:     "oasis_session",
    LAST_COURSE_KEY: "oasis_last_course",

    /* ---------- Límites de archivos ---------- */
    MAX_FILE_SIZE:    50 * 1024 * 1024,   // 50 MB — documentos de materia
    MAX_GALERIA_SIZE: 10 * 1024 * 1024,   // 10 MB — fotos de galería

    /* ---------- Días de la semana ---------- */
    DAYS: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
    DAY_LABELS: {
        Lunes:     "Monday",
        Martes:    "Tuesday",
        Miercoles: "Wednesday",
        Jueves:    "Thursday",
        Viernes:   "Friday"
    },

    /* ---------- Buckets de Storage ---------- */
    BUCKETS: Object.freeze({
        MEDIA:    "media",
        ARCHIVOS: "archivos",
        GALERIA:  "galeria",
        STORES:   "stores"
    })
});