/* ============================================================
   Oasis — Vue 3 (CDN, sin build)
   ============================================================ */

const { createApp } = Vue;

const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
const DAY_LABELS = { Lunes:"Monday", Martes:"Tuesday", Miercoles:"Wednesday", Jueves:"Thursday", Viernes:"Friday" };

const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/>
    <path d="M14 3.5V8h4"/>
</svg>`;

const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQQwtv1pKkVC9H4oYBWueNmh_69NrqJxsea1g_szh0gh_gyDrNA1Y5p1yxUB-h28QmyTm8nmTWqA2QC/pub";
const SHEET_GIDS = {
    cursos:      "1898434317",
    estudiantes: "1865962054",
    profesores:  "546336295",
    materias:    "1091567357",
    niveles:     "2018604320",
    horarios:    "1332361361",
    "2ITA":      "1075604004",
    "2ITB":      "2045168297",
    "2CNB":      "923150775"
};
function sheetUrl(gid) {
    return `${SHEET_BASE}?gid=${gid}&single=true&output=csv`;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_GALERIA_SIZE = 10 * 1024 * 1024;


/* ===== Markdown ===== */
if (window.marked) {
    window.marked.setOptions({
        breaks: true,       // saltos de línea simples → <br> (como GitHub / WhatsApp)
        gfm: true,          // tablas, ~~tachado~~, autolinks
        headerIds: false,   // sin id="..." en headings (no los usamos)
        mangle: false       // no ofuscar emails
    });
}

/* ============================================================
   Utilidades puras (no dependen del estado de Vue)
   ============================================================ */
function normalize(str) {
    return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function shortName(full) {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 0) return "";
    const lastCount = parts.length >= 3 ? 2 : 1;
    return parts[0] + " " + (parts[parts.length - lastCount] || parts[parts.length - 1] || "");
}
function firstLastName(full) {
    const parts = full.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] || "";
    const lastCount = parts.length >= 3 ? 2 : 1;
    return parts[parts.length - lastCount] || "";
}
function loginCredentials(student) {
    const parts = student.nombre.trim().split(/\s+/);
    const lastCount = parts.length >= 3 ? 2 : (parts.length === 2 ? 1 : 0);
    const first = parts[0] || "";
    const last = parts[parts.length - lastCount] || parts[parts.length - 1] || "";
    const day = student.fechaNacimiento ? student.fechaNacimiento.slice(8, 10) : "";
    return { username: normalize(first + last), password: normalize(last + first + day) };
}
function formatDate(fecha) {
    if (!fecha) return "-";
    try {
        const d = new Date(fecha + "T00:00:00");
        return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch { return fecha; }
}
function formatDateTime(iso) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
    } catch { return ""; }
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function safePath(name) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
}
function shortLabel(name, max = 9) {
    if (name.length <= max) return name;
    return name.slice(0, max - 1).trimEnd() + "…";
}

/* CSV helpers */
function parseCSVRows(text) {
    const rows = [];
    let row = [], cur = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQ) {
            if (c === '"') {
                if (text[i+1] === '"') { cur += '"'; i++; }
                else inQ = false;
            } else cur += c;
        } else {
            if (c === '"') inQ = true;
            else if (c === ",") { row.push(cur); cur = ""; }
            else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
            else if (c === "\r") {}
            else cur += c;
        }
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows;
}
function csvToObjects(text) {
    const rows = parseCSVRows(text.trim());
    if (rows.length === 0) return [];
    const header = rows[0].map(h => h.trim());
    return rows.slice(1)
        .filter(r => r.some(c => c !== ""))
        .map(r => {
            const obj = {};
            header.forEach((h, i) => { obj[h] = (r[i] || "").trim(); });
            return obj;
        });
}
async function loadSheet(name) {
    const gid = SHEET_GIDS[name];
    if (!gid || gid.startsWith("REEMPLAZAR")) return [];
    const res = await fetch(sheetUrl(gid));
    if (!res.ok) throw new Error("HTTP " + res.status + " en " + name);
    return csvToObjects(await res.text());
}

/* ============================================================
   Componente PhotoSlot (reutilizable)
   ============================================================ */
const PhotoSlot = {
    name: "PhotoSlot",
    props: {
        src: { type: String, default: "" },
        alt: { type: String, default: "" },
        zoomable: { type: Boolean, default: false }
    },
    emits: ["zoom"],
    data() { return { failed: false }; },
    watch: {
        src() { this.failed = false; }
    },
    template: `
        <div class="photo-slot" :class="{ zoomable }">
            <img v-if="src && !failed"
                 :src="src" :alt="alt"
                 @error="failed = true"
                 @click="zoomable && $emit('zoom', src)">
            <div v-else class="no-photo">No Photo</div>
        </div>
    `
};

/* ============================================================
   App principal
   ============================================================ */
createApp({
    components: { PhotoSlot },

    data() {
        return {
            /* Datos desde Sheets */
            cursos: [],
            estudiantes: [],
            profesores: [],
            materias: [],
            horarios: {},     // { cursoId: [ row, row, ... ] }
            notas: {},        // { studentId: { materiaId: [n1, n2, ...] } }

            /* Estado general */
            currentCourse: null,
            dayTab: 0,
            viewportWidth: window.innerWidth,

            /* Drawer */
            drawerOpen: false,
            drawerUserMenuOpen: false,

            /* Auth */
            currentUser: null,

            /* Login modal */
            loginOpen: false,
            loginUser: "",
            loginPass: "",
            loginError: false,

            /* Materia modal */
            materiaOpen: false,
            materiaBaseId: null,
            materiaNivelId: null,
            materiaNiveles: [],
            materiaArchivos: [],
            materiaArchivosLoading: false,
            materiaUploading: false,
            materiaProfFoto: "",
            materiaProfNombre: "",
            profPhotoFailed: false,

            /* Student modal */
            studentOpen: false,
            studentSelected: null,
            studentContrib: "-",
            studentPhotoFailed: false,
            radarOpen: false,

            /* Announcements */
            announcementsOpen: false,
            announcementsLoading: false,
            announcements: [],
            announcementsInput: "",
            editingAnnouncementId: null,
            announcementsSending: false,
            announcementsCount: 0,

            /* Gallery */
            galeriaExtra: [],
            galleryUploading: false,

            /* Dropzones */
            dropMateriaDragging: false,
            dropGaleriaDragging: false,

            /* Image viewer */
            imageViewerOpen: false,
            imageViewerSrc: "",

            /* Constantes expuestas al template */
            FILE_ICON_SVG,

            /* Timers internos (no reactivos, pero ok acá) */
            _galeriaTimer: null,
            _galeriaResume: null,
            _galeriaListeners: false
        };
    },

    computed: {
        /* ---------- Supabase disponible ---------- */
        supabaseReady() {
            return typeof supabaseClient !== "undefined"
                && supabaseClient !== null
                && typeof supabaseClient.from === "function";
        },

        /* ---------- Cursos ---------- */
        cursosDisponibles() {
            return this.cursos.filter(c => !c.disabled);
        },
        currentCourseObj() {
            return this.cursos.find(c => c.id === this.currentCourse) || null;
        },

        /* ---------- Tutor ---------- */
        tutor() {
            if (!this.currentCourse) return null;
            return this.profesores.find(p => p.tutor === this.currentCourse) || null;
        },

        /* ---------- Horario: tabla desktop ---------- */
        horarioRows() {
            if (!this.currentCourse) return [];
            return this.horarios[this.currentCourse] || [];
        },
        horarioTableRows() {
            const rows = this.horarioRows;
            const skip = new Set();
            const rowspan = {};
            days.forEach(day => {
                let i = 0;
                while (i < rows.length) {
                    if (rows[i].tipo !== "clase") { i++; continue; }
                    let j = i + 1;
                    while (j < rows.length && rows[j].tipo === "clase" &&
                        this.cellKey(rows[i][day]) && this.cellKey(rows[j][day]) === this.cellKey(rows[i][day])) {
                        skip.add(j + "|" + day);
                        j++;
                    }
                    rowspan[i + "|" + day] = j - i;
                    i = j;
                }
            });
            return rows.map((row, i) => ({
                row,
                index: i,
                cells: row.tipo === "recreo" ? null : days.map(day => {
                    if (skip.has(i + "|" + day)) return { skip: true };
                    const cell = row[day];
                    return { skip: false, span: rowspan[i + "|" + day] || 1, cell, day };
                })
            }));
        },

        /* ---------- Horario: timeline mobile ---------- */
        horarioMobilePanels() {
            const rows = this.horarioRows;
            return days.map(day => {
                const entries = [];
                let prevKey = null;
                rows.forEach(row => {
                    if (row.tipo === "recreo") {
                        entries.push({ type: "recreo", row, hour: row.hora });
                        prevKey = null;
                        return;
                    }
                    const cell = row[day];
                    if (!cell) {
                        entries.push({ type: "free", row, hour: row.hora.split(" - ")[0] });
                        prevKey = null;
                        return;
                    }
                    const key = this.cellKey(cell);
                    entries.push({
                        type: "subject", row, cell, key,
                        isContinuation: key === prevKey,
                        hour: row.hora.split(" - ")[0]
                    });
                    prevKey = key;
                });
                entries.forEach((entry, idx) => {
                    const next = entries[idx + 1];
                    const nextIsSame = entry.type === "subject" && next
                        && next.type === "subject" && next.key === entry.key;
                    entry.position = "solo";
                    if (entry.type === "subject") {
                        if (!entry.isContinuation && nextIsSame) entry.position = "start";
                        else if (entry.isContinuation && nextIsSame) entry.position = "middle";
                        else if (entry.isContinuation && !nextIsSame) entry.position = "end";
                    }
                });
                return { day, label: DAY_LABELS[day].slice(0, 3), entries };
            });
        },

        /* ---------- Estudiantes ---------- */
        studentsList() {
            if (!this.currentCourse) return [];
            return this.estudiantes.filter(e => e.curso === this.currentCourse);
        },

        /* ---------- Galería ---------- */
        galeriaLocal() {
            if (typeof galeriaDB === "undefined" || !this.currentCourse) return [];
            const g = galeriaDB[this.currentCourse] || [];
            return g.map(x => ({ ruta: x.ruta }));
        },
        galeriaAll() {
            return this.galeriaLocal.concat(this.galeriaExtra);
        },
        galeriaDoubled() {
            return this.galeriaAll.concat(this.galeriaAll);
        },
        galeriaTrackStyle() {
            if (this.galeriaAll.length === 0) return {};
            const duration = Math.max(this.galeriaAll.length * 5, 20);
            return { animation: `galeriaScroll ${duration}s linear infinite` };
        },
        canUploadGaleria() {
            return !!(this.currentUser && !this.currentUser.isAdmin
                && this.supabaseReady && this.currentCourse);
        },
        galeriaHint() {
            if (!this.supabaseReady) return "Supabase isn't configured yet.";
            return "Sign in to add photos to the gallery.";
        },

        /* ---------- Materia modal ---------- */
        materiaBase() {
            return this.findMateria(this.materiaBaseId);
        },
        materiaNombreActual() {
            return this.materiaBase ? this.materiaBase.nombre : (this.materiaBaseId || "");
        },
        materiaFullId() {
            if (!this.materiaBaseId) return null;
            return this.materiaNivelId
                ? this.materiaBaseId + "::" + this.materiaNivelId
                : this.materiaBaseId;
        },
        canUploadMateria() {
            if (!this.currentUser || !this.supabaseReady || !this.currentCourse) return false;
            const me = this.getStudentById(this.currentUser.id);
            if (!me) return false;
            if (me.curso !== this.currentCourse) return false;
            if (this.materiaNivelId && this.studentLevelId(me) !== this.materiaNivelId) return false;
            return true;
        },
        uploadHint() {
            if (!this.supabaseReady) return "Supabase isn't configured yet.";
            if (!this.currentUser) return "Sign in to upload files.";
            const me = this.getStudentById(this.currentUser.id);
            if (!me || me.curso !== this.currentCourse) return "Only students in this course can upload files here.";
            if (this.materiaNivelId && this.studentLevelId(me) !== this.materiaNivelId)
                return "This English level isn't yours — you can't upload files here.";
            return "Sign in to upload files.";
        },

        /* ---------- Student modal ---------- */
        bestWorst() {
            if (!this.studentSelected) return { best: null, worst: null };
            const avgs = this.getStudentAverages(this.studentSelected.id);
            if (!avgs) return { best: null, worst: null };
            const entries = Object.entries(avgs).filter(([id]) => !!this.findMateria(id));
            if (entries.length === 0) return { best: null, worst: null };
            entries.sort((a, b) => b[1] - a[1]);
            const best = entries[0];
            const worst = entries[entries.length - 1];
            return {
                best: { name: this.materiaNombre(best[0]), value: best[1] },
                worst: { name: this.materiaNombre(worst[0]), value: worst[1] }
            };
        },
        radarSvgHtml() {
            if (!this.studentSelected) return "";
            const id = this.studentSelected.id;

            const averages = this.getStudentAverages(id);
            if (averages) {
                const entries = Object.entries(averages)
                    .filter(([mid]) => !!this.findMateria(mid))
                    .sort((a, b) => this.materiaNombre(a[0]).localeCompare(this.materiaNombre(b[0]), "en"));
                if (entries.length >= 3) {
                    const subjects = entries.map(([mid]) => shortLabel(this.materiaNombre(mid)));
                    const values = entries.map(([, v]) => v);
                    return this.buildRadarSvg(subjects, values, true);
                }
            }

            const subjectIds = this.getStudentSubjects(id).filter(mid => !!this.findMateria(mid));
            if (subjectIds.length < 3) return "";
            const subjects = subjectIds
                .sort((a, b) => this.materiaNombre(a).localeCompare(this.materiaNombre(b), "en"))
                .map(mid => shortLabel(this.materiaNombre(mid)));
            return this.buildRadarSvg(subjects, subjects.map(() => 0), false);
        },
        roleMarqueeActive() {
            if (!this.studentSelected || !this.studentSelected.cargo) return false;
            return this.viewportWidth <= 800 && this.studentSelected.cargo.length > 18;
        },

        /* ---------- Announcements ---------- */
        canPostAnnouncement() {
            if (!this.currentUser || !this.supabaseReady || !this.currentCourse) return false;
            const me = this.getStudentById(this.currentUser.id);
            if (!me) return false;
            if (me.curso !== this.currentCourse) return false;
            return !!(me.cargo && me.cargo.trim());
        },
        announcementsHint() {
            if (!this.currentUser) return "Sign in to see announcements.";
            if (!this.canPostAnnouncement)
                return "Only students with a role (e.g. President, Vice President) can post announcements.";
            return "";
        },

        /* ---------- Auth ---------- */
        currentUserPhoto() {
            if (!this.currentUser) return "";
            const me = this.getStudentById(this.currentUser.id);
            return this.currentUser.foto || (me ? me.foto : "");
        },

        /* ---------- Scroll lock ---------- */
        scrollLocked() {
            return this.drawerOpen || this.materiaOpen || this.studentOpen
                || this.announcementsOpen || this.loginOpen || this.imageViewerOpen;
        }
    },

    watch: {
        scrollLocked(v) {
            document.body.style.overflow = v ? "hidden" : "";
        },
        "galeriaAll.length"() {
            this.$nextTick(() => this.setupGalleryAutoScroll());
        }
    },

    methods: {
        /* ========================================================
           Búsquedas / helpers
           ======================================================== */
        findMateria(id) { return this.materias.find(m => m.id === id); },
        findProfesor(id) { return this.profesores.find(p => p.id === id); },
        getStudentById(id) { return this.estudiantes.find(e => e.id === id); },
        materiaNombre(id) {
            const m = this.findMateria(id);
            return m ? m.nombre : id;
        },
        profesorDe(id) { return this.findProfesor(id); },
        studentFoto(id) {
            const s = this.getStudentById(id);
            return s ? (s.foto || "") : "";
        },
        firstLastName(v) { return firstLastName(v); },
        formatDate(v) { return formatDate(v); },
        formatDateTime(v) { return formatDateTime(v); },
        escapeHtml(v) { return escapeHtml(v); },
        cellKey(cell) {
            if (!cell) return null;
            return cell.materia + "|" + (cell.profesor || "");
        },
        studentLevelId(student) {
            if (!student || !student.nivelIngles) return null;
            return student.nivelIngles.toLowerCase().startsWith("advanced") ? "advanced" : "intermedio";
        },

        /* ========================================================
           Carga de datos (Google Sheets + Notas)
           ======================================================== */
        async loadAllData() {
            try {
                const [cursos, estudiantes, profesores, materias, niveles, horarios] = await Promise.all([
                    loadSheet("cursos"),
                    loadSheet("estudiantes"),
                    loadSheet("profesores"),
                    loadSheet("materias"),
                    loadSheet("niveles"),
                    loadSheet("horarios")
                ]);

                this.cursos = cursos.map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    disabled: (c.disabled || "").toLowerCase() === "true"
                }));

                this.estudiantes = estudiantes.map(e => ({
                    id: parseInt(e.id, 10),
                    nombre: e.nombre,
                    foto: e.foto,
                    curso: e.curso,
                    fechaNacimiento: e.fechaNacimiento,
                    nivelIngles: e.nivelIngles,
                    cargo: e.cargo
                }));

                this.profesores = profesores.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    foto: p.foto,
                    tutor: p.tutor || ""
                }));

                const nivelesPorMateria = {};
                niveles.forEach(n => {
                    if (!n.materia_id) return;
                    if (!nivelesPorMateria[n.materia_id]) nivelesPorMateria[n.materia_id] = [];
                    nivelesPorMateria[n.materia_id].push({
                        id: n.nivel_id,
                        nombre: n.nombre,
                        profesor: n.profesor || ""
                    });
                });
                this.materias = materias.map(m => {
                    const obj = { id: m.id, nombre: m.nombre };
                    if (nivelesPorMateria[m.id]) obj.niveles = nivelesPorMateria[m.id];
                    return obj;
                });

                const horariosMap = {};
                horarios.forEach(h => {
                    if (!horariosMap[h.curso]) horariosMap[h.curso] = [];
                    let row = horariosMap[h.curso].find(r => r.hora === h.hora);
                    if (!row) {
                        row = { tipo: h.tipo, hora: h.hora };
                        if (h.tipo === "recreo") row.label = h.label || "Recreo";
                        horariosMap[h.curso].push(row);
                    }
                    if (h.tipo === "clase" && h.dia && h.materia) {
                        row[h.dia] = { materia: h.materia, profesor: h.profesor || "" };
                    }
                });
                this.horarios = horariosMap;

                console.log(`[Oasis] Cargado: ${cursos.length} cursos, ${estudiantes.length} estudiantes, ${profesores.length} profesores, ${materias.length} materias, ${horarios.length} franjas`);
            } catch (err) {
                console.error("[Oasis] Error cargando datos desde Sheets:", err);
            }
        },

        async loadNotasFromCSV() {
            const urls = {
                "2ITA": sheetUrl(SHEET_GIDS["2ITA"]),
                "2CNB": sheetUrl(SHEET_GIDS["2CNB"]),
                "2ITB": sheetUrl(SHEET_GIDS["2ITB"])
            };
            const combined = {};
            for (const [courseId, url] of Object.entries(urls)) {
                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    const text = await res.text();
                    const lines = text.trim().split(/\r?\n/);
                    if (lines.length < 3) continue;

                    const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
                    const header = lines[0].split(sep).map(s => s.trim());

                    const colToSubject = [];
                    let currentSubject = null;
                    for (let i = 0; i < header.length; i++) {
                        const val = header[i];
                        if (i >= 2 && val) currentSubject = val;
                        colToSubject.push(currentSubject);
                    }

                    const subjectCols = {};
                    for (let i = 2; i < colToSubject.length; i++) {
                        const subj = colToSubject[i];
                        if (!subj) continue;
                        if (!subjectCols[subj]) subjectCols[subj] = [];
                        subjectCols[subj].push(i);
                    }

                    let count = 0;
                    for (let r = 2; r < lines.length; r++) {
                        const raw = lines[r];
                        if (!raw.trim()) continue;
                        const cols = raw.split(sep).map(s => s.trim());
                        const id = cols[0];
                        if (!id) continue;

                        combined[id] = {};
                        for (const [subj, indices] of Object.entries(subjectCols)) {
                            combined[id][subj] = indices.map(i => {
                                const v = parseFloat(cols[i]);
                                return isNaN(v) ? null : v;
                            });
                        }
                        count++;
                    }
                    console.log(`[Oasis] Notas ${courseId}: ${count} estudiantes`);
                } catch (err) {
                    console.warn(`[Oasis] Error cargando notas de ${courseId}:`, err);
                }
            }
            if (Object.keys(combined).length > 0) this.notas = combined;
        },

        /* ========================================================
           Cursos
           ======================================================== */
        async selectCourse(id, opts = {}) {
            const { push = true } = opts;
            const course = this.cursos.find(c => c.id === id);
            if (!course || course.disabled) return;

            this.currentCourse = id;
            this.dayTab = 0;
            this.galeriaExtra = [];

            if (this.drawerOpen) this.closeDrawer();

            if (push) {
                try { history.replaceState(null, "", "#" + id); } catch {}
                sessionStorage.setItem("oasis_last_course", id);
            }
            window.scrollTo({ top: 0, behavior: "instant" });

            await this.loadGallery();
            this.refreshAnnouncementsCount();
        },

        /* ========================================================
           Drawer
           ======================================================== */
        closeDrawer() { this.drawerOpen = false; this.drawerUserMenuOpen = false; },

        /* ========================================================
           Login / sesión
           ======================================================== */
        openLogin() {
            this.closeDrawer();
            this.loginError = false;
            this.loginUser = "";
            this.loginPass = "";
            this.loginOpen = true;
        },
        closeLoginModal() { this.loginOpen = false; },
        tryLogin() {
            const u = normalize(this.loginUser);
            const p = normalize(this.loginPass);
            const match = this.estudiantes.find(e => {
                const c = loginCredentials(e);
                return c.username === u && c.password === p;
            });
            if (!match) { this.loginError = true; return; }
            this.currentUser = { id: match.id, nombre: shortName(match.nombre) };
            sessionStorage.setItem("oasis_session", JSON.stringify(this.currentUser));
            this.closeLoginModal();
        },
        signOut() {
            this.currentUser = null;
            sessionStorage.removeItem("oasis_session");
            this.drawerUserMenuOpen = false;
            if (this.materiaOpen) this.materiaArchivos = this.materiaArchivos; // no-op
        },

        /* ========================================================
           Imagen ampliada
           ======================================================== */
        openImageViewer(src) {
            if (!src) return;
            this.imageViewerSrc = src;
            this.imageViewerOpen = true;
        },
        closeImageViewer() { this.imageViewerOpen = false; },

        /* ========================================================
           Materia: niveles + archivos
           ======================================================== */
        async openMateriaModal(materiaId, profesorId) {
            const materia = this.findMateria(materiaId);
            this.materiaBaseId = materiaId;
            this.materiaArchivos = [];
            this.materiaArchivosLoading = true;
            this.profPhotoFailed = false;

            if (materia && materia.niveles && materia.niveles.length > 0) {
                this.materiaNiveles = materia.niveles;
                this.showNivel(materia.niveles[0]);
            } else {
                this.materiaNiveles = [];
                this.materiaNivelId = null;
                const prof = this.findProfesor(profesorId);
                this.materiaProfFoto = prof ? (prof.foto || "") : "";
                this.materiaProfNombre = prof ? prof.nombre : "No teacher assigned";
                await this.loadMateriaArchivos(materiaId);
            }

            this.materiaOpen = true;
        },
        closeMateriaModal() {
            this.materiaOpen = false;
            this.materiaBaseId = null;
            this.materiaNivelId = null;
            this.materiaNiveles = [];
            this.materiaArchivos = [];
            this.materiaProfFoto = "";
            this.materiaProfNombre = "";
            this.materiaUploading = false;
            this.dropMateriaDragging = false;
        },
        showNivel(nivel) {
            this.materiaNivelId = nivel.id;
            this.profPhotoFailed = false;
            const prof = this.findProfesor(nivel.profesor);
            this.materiaProfFoto = prof ? (prof.foto || "") : "";
            this.materiaProfNombre = prof ? prof.nombre : "No teacher assigned";
            this.loadMateriaArchivos(this.materiaBaseId + "::" + nivel.id);
        },

        async loadMateriaArchivos(fullId) {
            this.materiaArchivosLoading = true;
            this.materiaArchivos = [];
            if (!this.supabaseReady) {
                this.materiaArchivosLoading = false;
                this.materiaArchivos = [{ id: "_err", nombre: "Supabase is not configured.", storage_path: "" }];
                return;
            }
            try {
                const { data, error } = await supabaseClient.from("archivos").select("*")
                    .eq("materia", fullId).order("fecha", { ascending: false });
                if (error) throw error;
                this.materiaArchivos = data || [];
            } catch (err) {
                console.error("Error loading files:", err);
                this.materiaArchivos = [];
            } finally {
                this.materiaArchivosLoading = false;
            }
        },

        fileUrl(f) {
            if (!f || !f.storage_path || !this.supabaseReady) return "#";
            const { data } = supabaseClient.storage.from("archivos").getPublicUrl(f.storage_path);
            return data.publicUrl;
        },
        canDeleteFile(f) {
            if (!this.currentUser) return false;
            return this.currentUser.id === f.subido_por_id;
        },

        async deleteFile(f) {
            if (!confirm(`Delete "${f.nombre}"?`)) return;
            try {
                await supabaseClient.storage.from("archivos").remove([f.storage_path]);
                const { error } = await supabaseClient.from("archivos").delete().eq("id", f.id);
                if (error) throw error;
                await this.loadMateriaArchivos(this.materiaFullId);
            } catch (err) {
                console.error(err);
                alert("Couldn't delete the file.");
            }
        },

        onMateriaFiles(e) { this.uploadFiles(e.target.files, "materia"); },
        onMateriaDrop(e) {
            this.dropMateriaDragging = false;
            if (e.dataTransfer.files.length) this.uploadFiles(e.dataTransfer.files, "materia");
        },

        async uploadFiles(files, kind) {
            if (!this.canUploadMateria || !this.materiaFullId) return;
            const tooBig = Array.from(files).filter(f => f.size > MAX_FILE_SIZE);
            if (tooBig.length > 0) { alert(`"${tooBig[0].name}" is too large (max 50 MB).`); return; }

            this.materiaUploading = true;
            try {
                for (const file of Array.from(files)) {
                    const path = `${this.materiaFullId}/${Date.now()}_${safePath(file.name)}`;
                    const { error: upErr } = await supabaseClient.storage.from("archivos").upload(path, file);
                    if (upErr) throw upErr;
                    const { error: insErr } = await supabaseClient.from("archivos").insert({
                        materia: this.materiaFullId,
                        curso: this.currentCourse,
                        nombre: file.name,
                        storage_path: path,
                        subido_por_id: this.currentUser.id,
                        subido_por_nombre: this.currentUser.nombre,
                        fecha: new Date().toISOString()
                    });
                    if (insErr) throw insErr;
                }
                await this.loadMateriaArchivos(this.materiaFullId);
            } catch (err) {
                console.error(err);
                alert("Upload error. Check the console (F12).");
            } finally {
                this.materiaUploading = false;
                if (this.$refs.materiaFileInput) this.$refs.materiaFileInput.value = "";
            }
        },

        /* ========================================================
           Galería
           ======================================================== */
        async loadGallery() {
            this.galeriaExtra = [];
            if (!this.supabaseReady || !this.currentCourse) return;
            try {
                const { data, error } = await supabaseClient.from("galeria_fotos")
                    .select("*").eq("curso", this.currentCourse);
                if (error) throw error;
                this.galeriaExtra = (data || []).map(row => {
                    const { data: urlData } = supabaseClient.storage.from("galeria").getPublicUrl(row.storage_path);
                    return { ruta: urlData.publicUrl, id: row.id, subido_por_id: row.subido_por_id };
                });
            } catch (err) {
                console.warn("Couldn't load gallery photos:", err);
            }
        },

        onGaleriaFiles(e) { this.uploadGalleryPhotos(e.target.files); },
        onGaleriaDrop(e) {
            this.dropGaleriaDragging = false;
            if (e.dataTransfer.files.length) this.uploadGalleryPhotos(e.dataTransfer.files);
        },
        async uploadGalleryPhotos(files) {
            if (!this.canUploadGaleria) return;
            const tooBig = Array.from(files).filter(f => f.size > MAX_GALERIA_SIZE);
            if (tooBig.length > 0) { alert(`"${tooBig[0].name}" is too large (max 10 MB).`); return; }

            this.galleryUploading = true;
            try {
                for (const file of Array.from(files)) {
                    const path = `${this.currentCourse}/${Date.now()}_${safePath(file.name)}`;
                    const { error: upErr } = await supabaseClient.storage.from("galeria").upload(path, file);
                    if (upErr) throw upErr;
                    const { error: insErr } = await supabaseClient.from("galeria_fotos").insert({
                        curso: this.currentCourse,
                        storage_path: path,
                        subido_por_id: this.currentUser.id,
                        subido_por_nombre: this.currentUser.nombre,
                        fecha: new Date().toISOString()
                    });
                    if (insErr) throw insErr;
                }
                await this.loadGallery();
            } catch (err) {
                console.error(err);
                alert("Error uploading photo. Check console (F12).");
            } finally {
                this.galleryUploading = false;
                if (this.$refs.galeriaFileInput) this.$refs.galeriaFileInput.value = "";
            }
        },

        /* ========================================================
           Galería auto-scroll (móvil)
           ======================================================== */
        isMobileGallery() { return window.matchMedia("(max-width:700px)").matches; },
        setupGalleryAutoScroll() {
            if (!this._galeriaListeners) {
                this._galeriaListeners = true;
                window.addEventListener("resize", () => {
                    if (this.isMobileGallery()) this.startGalleryAuto();
                    else this.stopGalleryAuto();
                });
            }
            this.startGalleryAuto();
        },
        startGalleryAuto() {
            this.stopGalleryAuto();
            if (!this.isMobileGallery()) return;
            const viewport = this.$refs.galeriaViewport;
            if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;
            this._galeriaTimer = setInterval(() => {
                const half = viewport.scrollWidth / 2;
                viewport.scrollLeft += 1;
                if (viewport.scrollLeft >= half) viewport.scrollLeft = 0;
            }, 25);
        },
        stopGalleryAuto() {
            if (this._galeriaTimer) { clearInterval(this._galeriaTimer); this._galeriaTimer = null; }
        },
        pauseGalleryTemporarily() {
            this.stopGalleryAuto();
            if (this._galeriaResume) clearTimeout(this._galeriaResume);
            this._galeriaResume = setTimeout(() => this.startGalleryAuto(), 2200);
        },

        /* ========================================================
           Students
           ======================================================== */
        scrollStudents(delta) {
            const track = this.$refs.studentsTrack;
            if (track) track.scrollBy({ left: delta, behavior: "smooth" });
        },

        openStudentModal(s) {
            this.studentSelected = s;
            this.studentContrib = "...";
            this.studentPhotoFailed = false;
            this.radarOpen = false;
            this.studentOpen = true;

            if (this.supabaseReady) {
                supabaseClient.from("archivos")
                    .select("*", { count: "exact", head: true })
                    .eq("subido_por_id", s.id)
                    .then(({ count }) => {
                        this.studentContrib = (count || 0) + ((count || 0) === 1 ? " file" : " files");
                    })
                    .catch(() => { this.studentContrib = "-"; });
            } else {
                this.studentContrib = "-";
            }
        },
        closeStudentModal() {
            this.studentOpen = false;
            this.studentSelected = null;
            this.radarOpen = false;
        },
        toggleRadarIfMobile() {
            if (this.viewportWidth > 800) return;
            if (!this.radarSvgHtml) return;
            this.radarOpen = !this.radarOpen;
        },

        getStudentSubjects(studentId) {
            const student = this.getStudentById(studentId);
            if (!student) return [];
            const rows = this.horarios[student.curso] || [];
            const ids = [];
            rows.forEach(row => {
                if (row.tipo !== "clase") return;
                days.forEach(day => {
                    const cell = row[day];
                    if (cell && cell.materia && !ids.includes(cell.materia)) ids.push(cell.materia);
                });
            });
            return ids;
        },
        getStudentAverages(studentId) {
            const raw = this.notas[studentId];
            if (!raw) return null;
            const out = {};
            for (const [materiaId, arr] of Object.entries(raw)) {
                if (!Array.isArray(arr)) continue;
                const valid = arr.filter(n => typeof n === "number" && !isNaN(n));
                if (valid.length === 0) continue;
                out[materiaId] = valid.reduce((a, b) => a + b, 0) / valid.length;
            }
            return Object.keys(out).length ? out : null;
        },

        buildRadarSvg(subjects, values, showData) {
            const size = 280, max = 10, danger = 7;
            const n = subjects.length;
            if (n < 3) return "";
            const cx = size / 2, cy = size / 2;
            const r = size / 2 - 46;
            const dangerRatio = danger / max;
            const angle = i => (Math.PI * 2 * i) / n - Math.PI / 2;
            const point = (i, ratio) => {
                const a = angle(i);
                return [cx + Math.cos(a) * r * ratio, cy + Math.sin(a) * r * ratio];
            };

            let out = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img">`;
            [0.25, 0.5, 0.75, 1].forEach(ratio => {
                const pts = subjects.map((_, i) => point(i, ratio).join(",")).join(" ");
                out += `<polygon points="${pts}" class="radar-grid"/>`;
            });
            const dangerPts = subjects.map((_, i) => point(i, dangerRatio).join(",")).join(" ");
            out += `<polygon points="${dangerPts}" class="radar-danger"/>`;
            subjects.forEach((_, i) => {
                const [x, y] = point(i, 1);
                out += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis"/>`;
            });
            if (showData) {
                const dataPts = values.map((v, i) =>
                    point(i, Math.max(0, Math.min(v / max, 1))).join(",")
                ).join(" ");
                out += `<polygon points="${dataPts}" class="radar-data"/>`;
                values.forEach((v, i) => {
                    const [x, y] = point(i, Math.max(0, Math.min(v / max, 1)));
                    out += `<circle cx="${x}" cy="${y}" r="3.5" class="radar-dot"/>`;
                });
            }
            subjects.forEach((s, i) => {
                const [x, y] = point(i, 1.20);
                const a = angle(i);
                let anchor = "middle";
                if (Math.cos(a) > 0.3) anchor = "start";
                else if (Math.cos(a) < -0.3) anchor = "end";
                out += `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" class="radar-label">${escapeHtml(s)}</text>`;
            });
            out += `</svg>`;
            return out;
        },

        /* ========================================================
           Announcements
           ======================================================== */
        openAnnouncementsModal() {
            this.announcementsOpen = true;
            this.loadAnnouncements();
        },
        closeAnnouncementsModal() {
            this.announcementsOpen = false;
            this.editingAnnouncementId = null;
            this.announcementsInput = "";
        },
        insertMention() {
            const ta = this.$refs.announcementsTextarea;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            this.announcementsInput = this.announcementsInput.slice(0, start) + "{}" + this.announcementsInput.slice(end);
            this.$nextTick(() => {
                ta.selectionStart = ta.selectionEnd = start + 1;
                ta.focus();
            });
        },
        renderAnnouncementMessage(text) {
            if (!text) return "";
        
            // 1. Reemplazamos {subjectId} por un placeholder raro que marked no toca
            const withPlaceholders = text.replace(/\{([a-zA-Z0-9_\-]+)\}/g, (match, id) => {
                const m = this.findMateria(id);
                if (!m) return match;
                return `%%MENTION_${id}%%`;
            });
        
            // 2. Markdown → HTML (si falla marked, cae al escape clásico)
            let html;
            try {
                html = window.marked ? window.marked.parse(withPlaceholders) : escapeHtml(withPlaceholders);
            } catch (err) {
                console.warn("[Oasis] Markdown falló, usando texto plano:", err);
                html = escapeHtml(withPlaceholders);
            }
        
            // 3. Sanitizamos (evita <script>, onclick, etc.)
            if (window.DOMPurify) {
                html = window.DOMPurify.sanitize(html, {
                    ADD_ATTR: ["target", "rel", "data-materia"]
                });
            }
        
            // 4. Ahora sí, convertimos los placeholders en chips de mención
            html = html.replace(/%%MENTION_([a-zA-Z0-9_\-]+)%%/g, (match, id) => {
                const m = this.findMateria(id);
                if (!m) return match;
                return `<span class="msg-mention" data-materia="${id}">${escapeHtml(m.nombre)}</span>`;
            });
        
            return html;
        },
        onMsgBodyClick(e) {
            const chip = e.target.closest(".msg-mention");
            if (!chip) return;
            const matId = chip.dataset.materia;
            if (matId && this.findMateria(matId)) {
                this.closeAnnouncementsModal();
                this.openMateriaModal(matId, null);
            }
        },
        async loadAnnouncements() {
            this.announcementsLoading = true;
            this.announcements = [];
            if (!this.supabaseReady) {
                this.announcementsLoading = false;
                return;
            }
            if (!this.currentCourse) {
                this.announcementsLoading = false;
                return;
            }
            try {
                const { data, error } = await supabaseClient.from("anuncios").select("*")
                    .eq("curso", this.currentCourse).order("fecha", { ascending: true });
                if (error) throw error;
                this.announcements = data || [];
                this.announcementsCount = this.announcements.length;
                this.$nextTick(() => {
                    const el = this.$refs.announcementsChat;
                    if (el) el.scrollTop = el.scrollHeight;
                });
            } catch (err) {
                console.error(err);
                this.announcements = [];
            } finally {
                this.announcementsLoading = false;
            }
        },
        async refreshAnnouncementsCount() {
            if (!this.supabaseReady || !this.currentCourse) { this.announcementsCount = 0; return; }
            try {
                const { count } = await supabaseClient.from("anuncios")
                    .select("*", { count: "exact", head: true })
                    .eq("curso", this.currentCourse);
                this.announcementsCount = count || 0;
            } catch { this.announcementsCount = 0; }
        },
        editAnnouncement(msg) {
            this.editingAnnouncementId = msg.id;
            this.announcementsInput = msg.mensaje || "";
            this.$nextTick(() => {
                const ta = this.$refs.announcementsTextarea;
                if (ta) ta.focus();
            });
        },
        async deleteAnnouncement(msg) {
            if (!confirm("Delete this announcement?")) return;
            if (!this.supabaseReady) return;
            try {
                const { error } = await supabaseClient.from("anuncios").delete().eq("id", msg.id);
                if (error) throw error;
                await this.loadAnnouncements();
                this.refreshAnnouncementsCount();
            } catch (err) {
                console.error(err);
                alert("Couldn't delete announcement.");
            }
        },
        async sendAnnouncement() {
            if (!this.canPostAnnouncement) return;
            const text = this.announcementsInput.trim();
            if (!text) return;

            this.announcementsSending = true;
            const me = this.getStudentById(this.currentUser.id);

            try {
                if (this.editingAnnouncementId) {
                    const { error } = await supabaseClient.from("anuncios")
                        .update({ mensaje: text, edited_at: new Date().toISOString() })
                        .eq("id", this.editingAnnouncementId);
                    if (error) throw error;
                    this.editingAnnouncementId = null;
                } else {
                    const { error } = await supabaseClient.from("anuncios").insert({
                        curso: this.currentCourse,
                        autor_id: this.currentUser.id,
                        autor_nombre: this.currentUser.nombre,
                        autor_cargo: me && me.cargo ? me.cargo : "",
                        mensaje: text,
                        fecha: new Date().toISOString()
                    });
                    if (error) throw error;
                }
                this.announcementsInput = "";
                await this.loadAnnouncements();
                this.refreshAnnouncementsCount();
            } catch (err) {
                console.error(err);
                alert("Couldn't save the announcement. Check the console (F12).");
            } finally {
                this.announcementsSending = false;
            }
        },

        /* ========================================================
           Keydown global (Esc)
           ======================================================== */
        onKeydown(e) {
            if (e.key !== "Escape") return;
            if (this.imageViewerOpen) this.closeImageViewer();
            else if (this.drawerOpen) this.closeDrawer();
            else if (this.materiaOpen) this.closeMateriaModal();
            else if (this.studentOpen) this.closeStudentModal();
            else if (this.announcementsOpen) this.closeAnnouncementsModal();
            else if (this.loginOpen) this.closeLoginModal();
        },
        onDocClick(e) {
            if (this.drawerUserMenuOpen && !e.target.closest(".drawer-user")) {
                this.drawerUserMenuOpen = false;
            }
        },

        /* ========================================================
           Boot
           ======================================================== */
        async init() {
            /* Restaurar sesión */
            const saved = sessionStorage.getItem("oasis_session");
            if (saved) {
                try { this.currentUser = JSON.parse(saved); } catch {}
            }

            await Promise.all([this.loadAllData(), this.loadNotasFromCSV()]);

            const available = this.cursosDisponibles;
            if (available.length === 0) return;

            const hashId = location.hash.replace("#", "");
            const lastId = sessionStorage.getItem("oasis_last_course");
            const chosen =
                available.find(c => c.id === hashId) ||
                available.find(c => c.id === lastId) ||
                available[0];

            await this.selectCourse(chosen.id, { push: false });
        }
    },

    mounted() {
        document.addEventListener("keydown", this.onKeydown);
        document.addEventListener("click", this.onDocClick);
        window.addEventListener("resize", () => { this.viewportWidth = window.innerWidth; });
        window.addEventListener("hashchange", () => {
            const id = location.hash.replace("#", "");
            if (id && id !== this.currentCourse) this.selectCourse(id, { push: false });
        });
        this.init();
    },

    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeydown);
        document.removeEventListener("click", this.onDocClick);
    }
}).mount("#app");