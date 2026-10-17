/* ============================================================
   Oasis · Shared utils
   ------------------------------------------------------------
   Funciones puras reutilizables. Antes estaban duplicadas en
   cada app-level JS.
   ============================================================ */

window.Oasis = window.Oasis || {};

(function () {

    /* ---------- Normalización / nombres ---------- */

    /**
     * Quita tildes, minúsculas, solo [a-z0-9].
     * "María José" → "mariajose"
     */
    function normalize(str) {
        return String(str)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    /**
     * "Juan Carlos Pérez Gómez" → "Juan Pérez Gómez"
     * Nombre corto para mostrar.
     */
    function shortName(full) {
        const parts = String(full || "").trim().split(/\s+/);
        if (parts.length === 0 || !parts[0]) return "";
        const lastCount = parts.length >= 3 ? 2 : 1;
        return parts[0] + " " + (parts[parts.length - lastCount] || parts[parts.length - 1] || "");
    }

    /**
     * Devuelve el/los apellidos de un nombre completo.
     * "Juan Carlos Pérez Gómez" → "Pérez Gómez"
     * Usado para ordenar alfabéticamente.
     */
    function firstLastName(full) {
        const parts = String(full || "").trim().split(/\s+/);
        if (parts.length <= 1) return parts[0] || "";
        const lastCount = parts.length >= 3 ? 2 : 1;
        return parts[parts.length - lastCount] || "";
    }

    /**
     * Credenciales derivadas del nombre + día de nacimiento.
     * username = normalizado(primerNombre + apellido)
     * password = normalizado(apellido + primerNombre + DD)
     */
    function loginCredentials(student) {
        const parts = String(student.nombre || "").trim().split(/\s+/);
        const lastCount = parts.length >= 3 ? 2 : (parts.length === 2 ? 1 : 0);
        const first = parts[0] || "";
        const last = parts[parts.length - lastCount] || parts[parts.length - 1] || "";
        const day = student.fechaNacimiento ? student.fechaNacimiento.slice(8, 10) : "";
        return {
            username: normalize(first + last),
            password: normalize(last + first + day)
        };
    }

    /* ---------- Fechas ---------- */

    /**
     * "2024-03-15" → "15 de March de 2024" (formato en-US).
     * Devuelve "-" si viene vacío, el string original si falla el parse.
     */
    function formatDate(fecha) {
        if (!fecha) return "-";
        try {
            const d = new Date(fecha + "T00:00:00");
            return new Intl.DateTimeFormat("en-US", {
                day: "numeric", month: "long", year: "numeric"
            }).format(d);
        } catch {
            return fecha;
        }
    }

    /**
     * ISO timestamp → "15 Mar, 14:32".
     */
    function formatDateTime(iso) {
        if (!iso) return "";
        try {
            const d = new Date(iso);
            return new Intl.DateTimeFormat("en-US", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
            }).format(d);
        } catch {
            return "";
        }
    }

    /* ---------- Strings ---------- */

    /**
     * Escapa HTML para usar en innerHTML / v-html.
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Nombre seguro para paths de Storage: quita tildes y
     * cualquier caracter fuera de [a-zA-Z0-9._-].
     */
    function safePath(name) {
        return String(name)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "_");
    }

    /**
     * Recorta un label a `max` caracteres con "…".
     * "Matemáticas Avanzadas" (max 9) → "Matemát…"
     */
    function shortLabel(name, max = 9) {
        const s = String(name || "");
        if (s.length <= max) return s;
        return s.slice(0, max - 1).trimEnd() + "…";
    }

    /* ---------- Tiempo ---------- */

    /**
     * "07:00 - 07:40" → 420 (minutos desde las 00:00).
     * 99999 si no se puede parsear (para ordenar al final).
     */
    function horaAMinutos(horaStr) {
        if (!horaStr) return 99999;
        const m = String(horaStr).match(/(\d{1,2}):(\d{2})/);
        if (!m) return 99999;
        return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    }

    /* ---------- Exponer ---------- */

    window.Oasis.utils = Object.freeze({
        normalize,
        shortName,
        firstLastName,
        loginCredentials,
        formatDate,
        formatDateTime,
        escapeHtml,
        safePath,
        shortLabel,
        horaAMinutos
    });

})();