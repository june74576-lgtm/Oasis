/* ============================================================
   Oasis — Vue 3 + Supabase (todo desde DB, sin Sheets)
   ============================================================ */

const { createApp } = Vue;

const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
const DAY_LABELS = { Lunes:"Monday", Martes:"Tuesday", Miercoles:"Wednesday", Jueves:"Thursday", Viernes:"Friday" };

const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/>
    <path d="M14 3.5V8h4"/>
</svg>`;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_GALERIA_SIZE = 10 * 1024 * 1024;

/* ===== Owner-only admin ===== */
/* Poné acá tu ID (el que está en la tabla `estudiantes`) */
const OWNER_ID = 11;


/* Markdown */
if (window.marked) {
    window.marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
}

/* ============================================================
   Utilidades
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

/* ============================================================
   PhotoSlot
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
    watch: { src() { this.failed = false; } },
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
   Login screen (fuera de Vue, HTML puro)
   ============================================================ */
const loginScreen = document.getElementById("loginScreen");
const loginUserInput = document.getElementById("loginUserInput");
const loginPassInput = document.getElementById("loginPassInput");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const appRoot = document.getElementById("app");

/* Expuesto globalmente para que Vue pueda llamar desde adentro */
window.__oasisShowLogin = function () {
    appRoot.classList.add("hidden-app");
    loginScreen.classList.remove("hidden");
    loginUserInput.value = "";
    loginPassInput.value = "";
    loginErrorMsg.style.display = "none";
    setTimeout(() => loginUserInput.focus(), 100);
};

window.__oasisHideLogin = function () {
    loginScreen.classList.add("hidden");
    appRoot.classList.remove("hidden-app");
};

/* ============================================================
   App
   ============================================================ */
const app = createApp({
    components: { PhotoSlot },

    data() {
        return {
            cursos: [],
            estudiantes: [],
            profesores: [],
            materias: [],
            horarios: {},
            notas: {},
            galeriaLocal: [],

            currentCourse: null,
            dayTab: 0,
            viewportWidth: window.innerWidth,

            drawerOpen: false,
            drawerUserMenuOpen: false,

            drawerOpen: false,
            drawerUserMenuOpen: false,
            sectionSwitcherOpen: false,

            currentUser: null,
            currentUserIsAdmin: false,

            loginOpen: false,
            loginUser: "",
            loginPass: "",
            loginError: false,

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

            studentOpen: false,
            studentSelected: null,
            studentContrib: "-",
            studentPhotoFailed: false,
            radarOpen: false,

            galeriaExtra: [],
            galleryUploading: false,

            dropMateriaDragging: false,
            dropGaleriaDragging: false,

            imageViewerOpen: false,
            imageViewerSrc: "",

            FILE_ICON_SVG,

            _galeriaTimer: null,
            _galeriaResume: null,
            _galeriaListeners: false,
            _dataLoaded: false,

            profileOpen: false,
            profileStudent: null,
            profileSocials: { instagram: "", tiktok: "", whatsapp: "", spotify: "" },
            trimestres: [
                { id: "t1", label: "Trimestre 1", n1: 0, n2: 0, n3: 0 },
                { id: "t2", label: "Trimestre 2", n1: 0, n2: 0, n3: 0 },
                { id: "t3", label: "Trimestre 3", n1: 0, n2: 0, n3: 0 }
            ],
            copiedPhone: false,
            chatOpen: false,
            chatMessages: [],
            chatLoading: false,
            chatSending: false,
            chatTexto: "",
            chatComprimido: false,
            compressedOpen: false,
            compressedText: "",
            compressedCopied: false,
        };
    },

    computed: {
        supabaseReady() {
            return typeof supabaseClient !== "undefined"
                && supabaseClient !== null
                && typeof supabaseClient.from === "function";
        },
        cursosDisponibles() { return this.cursos.filter(c => !c.disabled); },
        currentCourseObj() { return this.cursos.find(c => c.id === this.currentCourse) || null; },

        tutor() {
            if (!this.currentCourse) return null;
            return this.profesores.find(p => p.tutor === this.currentCourse) || null;
        },

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

        studentsList() {
            if (!this.currentCourse) return [];
            return this.estudiantes
                .filter(e => e.curso === this.currentCourse)
                .slice()
                .sort((a, b) =>
                    firstLastName(a.nombre).localeCompare(firstLastName(b.nombre), "es", { sensitivity: "base" })
                );
        },

        galeriaLocalCurso() {
            if (!this.currentCourse) return [];
            return this.galeriaLocal
                .filter(g => g.curso === this.currentCourse)
                .map(g => ({ ruta: g.ruta }));
        },
        galeriaAll() {
            return this.galeriaLocalCurso.concat(this.galeriaExtra);
        },
        galeriaDoubled() {
            return this.galeriaAll.concat(this.galeriaAll);
        },
        galeriaTrackStyle() {
            if (this.galeriaAll.length === 0) return {};
            const duration = Math.max(this.galeriaAll.length * 12, 60);
            return { animationDuration: `${duration}s` };
        },
        canUploadGaleria() {
            return !!(this.currentUser && this.supabaseReady && this.currentCourse);
        },
        galeriaHint() {
            if (!this.supabaseReady) return "Supabase isn't configured yet.";
            if (!this.currentUser) return "Sign in to add photos to the gallery.";
            return "";
        },
        canWriteChat() {
            if (!this.currentUser || !this.supabaseReady || !this.currentCourse) return false;
            // El owner puede escribir en cualquier curso
            if (this.canAccessAdmin) return true;
            const me = this.getStudentById(this.currentUser.id);
            if (!me) return false;
            return me.curso === this.currentCourse;
        },
        chatWriteHint() {
            if (!this.currentUser) return "Sign in to write.";
            if (!this.canWriteChat) return "You can only write in your own course. Here you can just read.";
            return "";
        },
        materiaBase() { return this.findMateria(this.materiaBaseId); },
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

        currentUserPhoto() {
            if (!this.currentUser) return "";
            const me = this.getStudentById(this.currentUser.id);
            return this.currentUser.foto || (me ? me.foto : "");
        },

        canAccessAdmin() {
            return !!(this.currentUser && this.currentUser.id === OWNER_ID);
        },

        scrollLocked() {
            return this.drawerOpen || this.materiaOpen || this.studentOpen
                || this.loginOpen || this.imageViewerOpen || this.chatOpen;
        },
        hasStore() {
            if (!this.currentUser) return false;
            const me = this.getStudentById(this.currentUser.id);
            return !!(me && (me.hasStore || me.isAdmin));
        },
    },

    watch: {
        scrollLocked(v) { document.body.style.overflow = v ? "hidden" : ""; },
        "galeriaAll.length"() { this.$nextTick(() => this.setupGalleryAutoScroll()); }
    },

    methods: {
        /* ---------- Helpers ---------- */
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

        mediaUrl(pathOrUrl) {
            if (!pathOrUrl) return "";
            // Si ya es una URL completa (http/https), la devolvemos tal cual.
            if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
            // Si es un path relativo, lo resolvemos contra el bucket "media".
            if (!this.supabaseReady) return "";
            const { data } = supabaseClient.storage.from("media").getPublicUrl(pathOrUrl);
            return data.publicUrl;
        },

        /* ---------- Admin ---------- */
        goToAdmin() {
            window.location.href = "admin.html";
        },

        /* ---------- Carga de datos desde Supabase ---------- */
        async loadAllData() {
            if (!this.supabaseReady) {
                console.warn("[Oasis] Supabase no configurado");
                return;
            }
            try {
                const [
                    { data: cursos, error: e1 },
                    { data: estudiantes, error: e2 },
                    { data: profesores, error: e3 },
                    { data: materias, error: e4 },
                    { data: niveles, error: e5 },
                    { data: horarios, error: e6 },
                    { data: notas, error: e7 },
                    { data: galeria, error: e8 }
                ] = await Promise.all([
                    supabaseClient.from("cursos").select("*").order("orden"),
                    supabaseClient.from("estudiantes").select("*"),
                    supabaseClient.from("profesores").select("*"),
                    supabaseClient.from("materias").select("*").order("orden"),
                    supabaseClient.from("materias_niveles").select("*"),
                    supabaseClient.from("horarios").select("*").order("curso").order("hora"),
                    supabaseClient.from("notas").select("*").order("orden"),
                    supabaseClient.from("galeria_local").select("*").order("orden")
                ]);

                const firstErr = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8;
                if (firstErr) throw firstErr;

                this.cursos = (cursos || []).map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    disabled: !!c.disabled
                }));

                this.profesores = (profesores || []).map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    foto: this.mediaUrl(p.foto),
                    tutor: p.tutor || ""
                }));

                this.estudiantes = (estudiantes || []).map(e => ({
                    id: e.id,
                    nombre: e.nombre,
                    foto: this.mediaUrl(e.foto),
                    curso: e.curso,
                    fechaNacimiento: e.fecha_nacimiento || "",
                    nivelIngles: e.nivel_ingles || "",
                    cargo: e.cargo || "",
                    isAdmin: !!e.is_admin,
                    hasStore: !!e.has_store
                }));

                const nivelesPorMateria = {};
                (niveles || []).forEach(n => {
                    if (!nivelesPorMateria[n.materia_id]) nivelesPorMateria[n.materia_id] = [];
                    nivelesPorMateria[n.materia_id].push({
                        id: n.nivel_id,
                        nombre: n.nombre,
                        profesor: n.profesor_id || ""
                    });
                });
                this.materias = (materias || []).map(m => {
                    const obj = { id: m.id, nombre: m.nombre };
                    if (nivelesPorMateria[m.id]) obj.niveles = nivelesPorMateria[m.id];
                    return obj;
                });

                /* Helper: "07:00 - 07:40" → 420 (minutos desde las 00:00) */
                function horaAMinutos(horaStr) {
                    if (!horaStr) return 99999;
                    const m = String(horaStr).match(/(\d{1,2}):(\d{2})/);
                    if (!m) return 99999;
                    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
                }

                const horariosMap = {};
                (horarios || []).forEach(h => {
                    if (!horariosMap[h.curso]) horariosMap[h.curso] = [];
                    let row = horariosMap[h.curso].find(r => r.hora === h.hora);
                    if (!row) {
                        row = { tipo: h.tipo, hora: h.hora, _min: horaAMinutos(h.hora) };
                        if (h.tipo === "recreo") row.label = h.label || "Recreo";
                        horariosMap[h.curso].push(row);
                    }
                    if (h.tipo === "clase" && h.dia && h.materia_id) {
                        row[h.dia] = { materia: h.materia_id, profesor: h.profesor_id || "" };
                    }
                });

                /* Ordenar cada curso por hora */
                for (const curso of Object.keys(horariosMap)) {
                    horariosMap[curso].sort((a, b) => a._min - b._min);
                }

                this.horarios = horariosMap;

                const notasMap = {};
                (notas || []).forEach(n => {
                    if (!notasMap[n.estudiante_id]) notasMap[n.estudiante_id] = {};
                    if (!notasMap[n.estudiante_id][n.materia_id]) notasMap[n.estudiante_id][n.materia_id] = [];
                    if (typeof n.valor === "number") {
                        notasMap[n.estudiante_id][n.materia_id].push(n.valor);
                    }
                });
                this.notas = notasMap;

                this.galeriaLocal = (galeria || []).map(g => ({
                    curso: g.curso,
                    ruta: this.mediaUrl(g.ruta),
                    orden: g.orden || 0
                }));

                /* Actualizar datos del usuario actual */
                if (this.currentUser) {
                    const me = this.getStudentById(this.currentUser.id);
                    if (me) {
                        this.currentUserIsAdmin = !!me.isAdmin;
                    }
                }

                console.log(`[Oasis] Cargado: ${this.cursos.length} cursos, ${this.estudiantes.length} estudiantes, ${this.profesores.length} profesores, ${this.materias.length} materias, ${(horarios || []).length} franjas, ${(notas || []).length} notas, ${this.galeriaLocal.length} fotos locales`);

                this._dataLoaded = true;
            } catch (err) {
                console.error("[Oasis] Error cargando datos desde Supabase:", err);
            }
        },

        /* ---------- Cursos ---------- */
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

            if (this.chatOpen) await this.loadChatMessages();
        },

        closeDrawer() { this.drawerOpen = false; this.drawerUserMenuOpen = false; },

        /* ---------- Login (modal fallback) ---------- */
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
            this.currentUserIsAdmin = !!match.isAdmin;
            sessionStorage.setItem("oasis_session", JSON.stringify(this.currentUser));
            this.closeLoginModal();
        },
        signOut() {
            this.currentUser = null;
            this.currentUserIsAdmin = false;
            sessionStorage.removeItem("oasis_session");
            localStorage.removeItem("oasis_session");        // ← esto limpia "keep me signed in"
            this.drawerUserMenuOpen = false;
            if (typeof window.__oasisShowLogin === "function") window.__oasisShowLogin();
        },

        /* ---------- Image viewer ---------- */
        openImageViewer(src) {
            if (!src) return;
            this.imageViewerSrc = src;
            this.imageViewerOpen = true;
        },
        closeImageViewer() { this.imageViewerOpen = false; },

        /* ---------- Materia ---------- */
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
            return this.currentUserIsAdmin || this.currentUser.id === f.subido_por_id;
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

        onMateriaFiles(e) { this.uploadFiles(e.target.files); },
        onMateriaDrop(e) {
            this.dropMateriaDragging = false;
            if (e.dataTransfer.files.length) this.uploadFiles(e.dataTransfer.files);
        },
        async uploadFiles(files) {
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

        /* ---------- Galería ---------- */
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

        onGalleryImgError(e) {
            e.target.style.opacity = "0.15";
        },

        /* ---------- Auto-scroll galería ---------- */
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

        /* ---------- Students ---------- */
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

        onKeydown(e) {
            if (e.key !== "Escape") return;
            if (this.sectionSwitcherOpen) { this.sectionSwitcherOpen = false; return; }
            if (this.compressedOpen) { this.closeCompressed(); return; }   // ← nuevo
            if (this.chatOpen) { this.closeChat(); return; }               // ← nuevo
            if (this.imageViewerOpen) this.closeImageViewer();
            else if (this.drawerOpen) this.closeDrawer();
            else if (this.materiaOpen) this.closeMateriaModal();
            else if (this.studentOpen) this.closeStudentModal();
            else if (this.loginOpen) this.closeLoginModal();
        },
        onDocClick(e) {
            if (this.drawerUserMenuOpen && !e.target.closest(".drawer-user")) {
                this.drawerUserMenuOpen = false;
            }
            if (this.sectionSwitcherOpen && !e.target.closest(".fs-section-switcher")) {
                this.sectionSwitcherOpen = false;
            }
        },

        async afterLogin() {
            if (!this._dataLoaded) {
                await this.loadAllData();
            }
            const available = this.cursosDisponibles;
            if (available.length === 0) return;

            /* 1. Prioridad: el curso propio del estudiante logueado */
            if (this.currentUser) {
                const me = this.getStudentById(this.currentUser.id);
                if (me && me.curso) {
                    const ownCourse = available.find(c => c.id === me.curso);
                    if (ownCourse) {
                        await this.selectCourse(ownCourse.id, { push: false });
                        return;
                    }
                }
            }

            /* 2. Fallback: hash en URL / último curso visto / primero disponible */
            const hashId = location.hash.replace("#", "");
            const lastId = sessionStorage.getItem("oasis_last_course");
            const chosen =
                available.find(c => c.id === hashId) ||
                available.find(c => c.id === lastId) ||
                available[0];

            await this.selectCourse(chosen.id, { push: false });
        },

        async init() {
            const saved = sessionStorage.getItem("oasis_session") || localStorage.getItem("oasis_session");
            if (saved) {
                try {
                    this.currentUser = JSON.parse(saved);
                    await this.loadAllData();
                    const me = this.getStudentById(this.currentUser.id);
                    if (me) this.currentUserIsAdmin = !!me.isAdmin;
                } catch (e) {
                    sessionStorage.removeItem("oasis_session");
                    localStorage.removeItem("oasis_session");
                    this.currentUser = null;
                }
            }

            if (this.currentUser) {
                window.__oasisHideLogin();
                await this.afterLogin();
            } else {
                window.__oasisShowLogin();
            }
        },

        openProfile() {
            const me = this.getStudentById(this.currentUser.id);
            if (!me) {
                console.warn("[Oasis] No student found for id", this.currentUser.id);
                return;
            }
            this.profileStudent = me;
            this.profileOpen = true;
            try {
                const raw = localStorage.getItem("oasis_socials_" + this.currentUser.id);
                if (raw) this.profileSocials = { ...this.profileSocials, ...JSON.parse(raw) };
            } catch {}
            try {
                const raw = localStorage.getItem("oasis_grades_" + this.currentUser.id);
                if (raw) this.trimestres = JSON.parse(raw);
            } catch {}
        },
        closeProfile() { this.profileOpen = false; this.profileStudent = null; },
        saveProfile() {
            if (!this.currentUser) return;
            localStorage.setItem("oasis_socials_" + this.currentUser.id, JSON.stringify(this.profileSocials));
            localStorage.setItem("oasis_grades_" + this.currentUser.id, JSON.stringify(this.trimestres));
            this.closeProfile();
        },
        copySupportPhone() {
            const phone = "+593 98 027 1168";
            navigator.clipboard.writeText(phone).then(() => {
                this.copiedPhone = true;
                setTimeout(() => this.copiedPhone = false, 1600);
            });
        },
        /* ---------- Chat ---------- */
        async openChat() {
            this.chatOpen = true;
            await this.loadChatMessages();
        },
        closeChat() { this.chatOpen = false; },

        async loadChatMessages() {
            if (!this.supabaseReady || !this.currentCourse) return;
            this.chatLoading = true;
            try {
                const { data, error } = await supabaseClient
                    .from("chat_mensajes")
                    .select("*")
                    .eq("curso", this.currentCourse)
                    .order("fecha", { ascending: true });
                if (error) throw error;
                this.chatMessages = data || [];
                this.$nextTick(() => {
                    const f = this.$refs.chatFeed;
                    if (f) f.scrollTop = f.scrollHeight;
                });
            } catch (err) {
                console.warn("[Chat] Error loading:", err);
                this.chatMessages = [];
            } finally {
                this.chatLoading = false;
            }
        },

        async sendChatMessage() {
            if (!this.currentUser || !this.currentCourse) return;
            const txt = this.chatTexto.trim();
            if (!txt || this.chatSending) return;
            this.chatSending = true;
            try {
                const { error } = await supabaseClient.from("chat_mensajes").insert({
                    curso: this.currentCourse,
                    autor_id: this.currentUser.id,
                    autor_nombre: this.currentUser.nombre,
                    mensaje: txt,
                    comprimido: this.chatComprimido,
                    fecha: new Date().toISOString()
                });
                if (error) throw error;
                this.chatTexto = "";
                this.chatComprimido = false;
                if (this.$refs.chatTextarea) this.$refs.chatTextarea.style.height = "auto";
                await this.loadChatMessages();
            } catch (err) {
                console.error(err);
                alert("Couldn't send message. Check console (F12).");
            } finally {
                this.chatSending = false;
            }
        },

        autoGrowChat(e) {
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 140) + "px";
        },

        compressMessage(text) {
            if (!text) return "";
            const clean = String(text).replace(/\s+/g, " ").trim();
            return clean.length <= 10 ? clean : clean.slice(0, 10) + "...";
        },

        renderChatMarkdown(text) {
            if (!text) return "";
            let safe = escapeHtml(text);
            if (window.marked) {
                try { safe = window.marked.parse(safe); } catch {}
            }
            if (window.DOMPurify) {
                safe = window.DOMPurify.sanitize(safe);
            }
            return safe;
        },

        openCompressed(m) {
            this.compressedText = m.mensaje || "";
            this.compressedCopied = false;
            this.compressedOpen = true;
        },
        closeCompressed() {
            this.compressedOpen = false;
            this.compressedText = "";
            this.compressedCopied = false;
        },
        copyCompressed() {
            if (!this.compressedText) return;
            navigator.clipboard.writeText(this.compressedText).then(() => {
                this.compressedCopied = true;
                setTimeout(() => this.compressedCopied = false, 1600);
            });
        },
        async deleteChatMessage(m) {
            if (!confirm("Delete this message?")) return;
            try {
                const { error } = await supabaseClient.from("chat_mensajes").delete().eq("id", m.id);
                if (error) throw error;
                this.chatMessages = this.chatMessages.filter(x => x.id !== m.id);
            } catch (err) {
                console.error(err);
                alert("Couldn't delete message.");
            }
        },
        goToMyStore() { window.location.href = "my-store.html"; },
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

        /* Botón de login screen: primero carga data si hace falta */
        loginSubmitBtn.addEventListener("click", async () => {
            if (!this._dataLoaded) await this.loadAllData();

            const u = normalize(loginUserInput.value);
            const p = normalize(loginPassInput.value);
            const match = this.estudiantes.find(e => {
                const c = loginCredentials(e);
                return c.username === u && c.password === p;
            });
            if (!match) {
                loginErrorMsg.style.display = "block";
                return;
            }

            this.currentUser = { id: match.id, nombre: shortName(match.nombre) };
            this.currentUserIsAdmin = !!match.isAdmin;

            // Persistencia según "Keep me signed in"
            const remember = document.getElementById("loginRemember");
            const payload = JSON.stringify(this.currentUser);
            if (remember && remember.checked) {
                localStorage.setItem("oasis_session", payload);
                sessionStorage.removeItem("oasis_session");
            } else {
                sessionStorage.setItem("oasis_session", payload);
                localStorage.removeItem("oasis_session");
            }

            loginErrorMsg.style.display = "none";
            window.__oasisHideLogin();
            await this.afterLogin();
        });

        loginPassInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginSubmitBtn.click();
        });
        loginUserInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginPassInput.focus();
        });
    },

    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeydown);
        document.removeEventListener("click", this.onDocClick);
    }
});

app.mount("#app");