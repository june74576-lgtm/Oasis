// Internal keys (must match horariosDB keys)
const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

// Display labels (English)
const DAY_LABELS = {
    Lunes: "Monday",
    Martes: "Tuesday",
    Miercoles: "Wednesday",
    Jueves: "Thursday",
    Viernes: "Friday"
};

const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/>
    <path d="M14 3.5V8h4"/>
</svg>`;

let currentCourse = null;
let currentMateriaId = null;
let currentMateriaBaseId = null;
let currentNivelId = null;
const materiaNiveles = document.getElementById("materiaNiveles");

/* ===== Scroll lock ===== */

let openOverlays = 0;
function lockScroll() {
    openOverlays++;
    document.body.style.overflow = "hidden";
}
function unlockScroll() {
    openOverlays = Math.max(0, openOverlays - 1);
    if (openOverlays === 0) document.body.style.overflow = "";
}

/* ===== Photo slot ===== */

function buildPhotoSlot(url, altText) {
    const wrap = document.createElement("div");
    wrap.classList.add("photo-slot");
    if (url) {
        const img = document.createElement("img");
        img.alt = altText;
        img.onerror = () => {
            wrap.innerHTML = "";
            const fallback = document.createElement("div");
            fallback.classList.add("no-photo");
            fallback.textContent = "No Photo";
            wrap.appendChild(fallback);
        };
        img.src = url;
        wrap.appendChild(img);
    } else {
        const fallback = document.createElement("div");
        fallback.classList.add("no-photo");
        fallback.textContent = "No Photo";
        wrap.appendChild(fallback);
    }
    return wrap;
}

/* ===== Elements ===== */

const courseFullscreen = document.getElementById("courseFullscreen");
const fsTopbarTitle = document.getElementById("fsTopbarTitle");
const horarioBody = document.getElementById("horarioBody");
const dayTabs = document.getElementById("dayTabs");
const dayTrack = document.getElementById("dayTrack");
const galeriaTrack = document.getElementById("galeriaTrack");

const drawerUser = document.getElementById("drawerUser");
const drawerUserBtn = document.getElementById("drawerUserBtn");
const drawerUserAvatar = document.getElementById("drawerUserAvatar");
const drawerUserName = document.getElementById("drawerUserName");
const drawerSignOutBtn = document.getElementById("drawerSignOutBtn");
const drawerFooter = document.getElementById("drawerFooter");
const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");
const drawerCourses = document.getElementById("drawerCourses");
const drawerSignInBtn = document.getElementById("drawerSignInBtn");
const fsMenuBtn = document.getElementById("fsMenuBtn");

const studentsTrack = document.getElementById("studentsTrack");
const studentsPrevBtn = document.getElementById("studentsPrevBtn");
const studentsNextBtn = document.getElementById("studentsNextBtn");

const studentModalOverlay = document.getElementById("studentModalOverlay");
const studentModalClose = document.getElementById("studentModalClose");
const studentModalPhoto = document.getElementById("studentModalPhoto");
const studentPhotoFallback = document.getElementById("studentPhotoFallback");
const studentModalName = document.getElementById("studentModalName");
const studentModalBirth = document.getElementById("studentModalBirth");
const studentModalIngles = document.getElementById("studentModalIngles");
const studentModalContrib = document.getElementById("studentModalContrib");
const studentModalRole = document.getElementById("studentModalRole");
const studentModalRoleText = document.getElementById("studentModalRoleText");

const materiaModalOverlay = document.getElementById("materiaModalOverlay");
const materiaModalClose = document.getElementById("materiaModalClose");
const materiaModalNombre = document.getElementById("materiaModalNombre");
const materiaModalProfFoto = document.getElementById("materiaModalProfFoto");
const profPhotoFallback = document.getElementById("profPhotoFallback");
const materiaModalProfNombre = document.getElementById("materiaModalProfNombre");
const materiaArchivosList = document.getElementById("materiaArchivosList");
const dropzone = document.getElementById("dropzone");
const materiaFileInput = document.getElementById("materiaFileInput");
const uploadLoginHint = document.getElementById("uploadLoginHint");

const loginBtn = document.getElementById("loginBtn");
const userChip = document.getElementById("userChip");
const userChipBtn = document.getElementById("userChipBtn");
const userChipAvatar = document.getElementById("userChipAvatar");
const userChipName = document.getElementById("userChipName");
const userMenuPerfil = document.getElementById("userMenuPerfil");
const userMenuConectar = document.getElementById("userMenuConectar");
const userMenuLogout = document.getElementById("userMenuLogout");

const loginModalOverlay = document.getElementById("loginModalOverlay");
const loginModalClose = document.getElementById("loginModalClose");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");

/* ===== Utilities ===== */

function findMateria(id) {
    const list = typeof materiasDB !== "undefined" ? materiasDB : [];
    return list.find(m => m.id === id);
}
function findProfesor(id) {
    const list = typeof profesoresDB !== "undefined" ? profesoresDB : [];
    return list.find(p => p.id === id);
}
function getCourseById(id) {
    return (typeof cursosDB !== "undefined" ? cursosDB : []).find(c => c.id === id);
}
function getStudentById(id) {
    return (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).find(e => e.id === id);
}
function shortName(full) {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 0) return "";
    const lastCount = parts.length >= 3 ? 2 : 1;
    const first = parts[0];
    const last = parts[parts.length - lastCount] || parts[parts.length - 1] || "";
    return first + " " + last;
}
function normalize(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function loginCredentials(student) {
    const parts = student.nombre.trim().split(/\s+/);
    const lastCount = parts.length >= 3 ? 2 : (parts.length === 2 ? 1 : 0);
    const first = parts[0] || "";
    const last = parts[parts.length - lastCount] || parts[parts.length - 1] || "";
    const day = student.fechaNacimiento ? student.fechaNacimiento.slice(8, 10) : "";
    return {
        username: normalize(first + last),
        password: normalize(last + first + day)
    };
}
function firstLastName(full) {
    const parts = full.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] || "";
    const lastCount = parts.length >= 3 ? 2 : 1;
    return parts[parts.length - lastCount] || "";
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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* ===== Supabase ===== */

function supabaseListo() {
    return typeof supabaseClient !== "undefined" && supabaseClient !== null && typeof supabaseClient.from === "function";
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

async function loadMateriaArchivos(materiaId) {
    materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Loading…</p>`;
    if (!supabaseListo()) {
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Supabase is not configured.</p>`;
        return;
    }
    try {
        const { data, error } = await supabaseClient
            .from("archivos")
            .select("*")
            .eq("materia", materiaId)
            .order("fecha", { ascending: false });
        if (error) throw error;
        renderMateriaArchivos(data || []);
    } catch (err) {
        console.error("Error loading files:", err);
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Error loading files.</p>`;
    }
}

function renderMateriaArchivos(files) {
    materiaArchivosList.innerHTML = "";
    if (files.length === 0) {
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">No files yet</p>`;
        return;
    }
    files.forEach(file => {
        const { data: urlData } = supabaseClient.storage.from("archivos").getPublicUrl(file.storage_path);
        const url = urlData.publicUrl;
        const row = document.createElement("div");
        row.classList.add("archivo-row");
        const uploadedBy = file.subido_por_nombre ? `Uploaded by ${file.subido_por_nombre}` : "";
        const canDelete = isAdmin || (currentUser && currentUser.id === file.subido_por_id);

        row.innerHTML = `
            <span class="archivo-icon">${FILE_ICON_SVG}</span>
            <div class="archivo-info">
                <a class="archivo-nombre" href="${url}" target="_blank" rel="noopener">${escapeHtml(file.nombre)}</a>
                ${uploadedBy ? `<div class="archivo-meta">${escapeHtml(uploadedBy)}</div>` : ""}
            </div>
            ${canDelete ? `<button class="archivo-delete" aria-label="Delete file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>` : ""}
        `;
        if (canDelete) {
            row.querySelector(".archivo-delete").addEventListener("click", () => deleteFile(file));
        }
        materiaArchivosList.appendChild(row);
    });
}

async function deleteFile(file) {
    if (!confirm(`Delete "${file.nombre}"?`)) return;
    try {
        await supabaseClient.storage.from("archivos").remove([file.storage_path]);
        const { error } = await supabaseClient.from("archivos").delete().eq("id", file.id);
        if (error) throw error;
        await loadMateriaArchivos(currentMateriaId);
    } catch (err) {
        console.error(err);
        alert("Couldn't delete the file.");
    }
}

function safePath(name) {
    return name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function studentLevelId(student) {
    if (!student || !student.nivelIngles) return null;
    return student.nivelIngles.toLowerCase().startsWith("advanced") ? "advanced" : "intermedio";
}

function canUploadHere() {
    if (!currentUser || !supabaseListo() || !currentCourse) return { ok: false, reason: "session" };
    const me = getStudentById(currentUser.id);
    if (!me) return { ok: false, reason: "session" };
    if (me.curso !== currentCourse) return { ok: false, reason: "course" };
    if (currentNivelId && studentLevelId(me) !== currentNivelId) {
        return { ok: false, reason: "level" };
    }
    return { ok: true };
}

async function uploadFiles(files) {
    if (!canUploadHere().ok || !currentMateriaId) return;
    const tooBig = Array.from(files).filter(f => f.size > MAX_FILE_SIZE);
    if (tooBig.length > 0) {
        alert(`"${tooBig[0].name}" is too large (max 50 MB).`);
        return;
    }
    dropzone.classList.add("dragging");
    dropzone.querySelector("p").textContent = "Uploading…";
    try {
        for (const file of Array.from(files)) {
            const path = `${currentMateriaId}/${Date.now()}_${safePath(file.name)}`;
            const { error: uploadError } = await supabaseClient.storage.from("archivos").upload(path, file);
            if (uploadError) throw uploadError;
            const { error: insertError } = await supabaseClient.from("archivos").insert({
                materia: currentMateriaId,
                curso: currentCourse,
                nombre: file.name,
                storage_path: path,
                subido_por_id: currentUser.id,
                subido_por_nombre: currentUser.nombre,
                fecha: new Date().toISOString()
            });
            if (insertError) throw insertError;
        }
        await loadMateriaArchivos(currentMateriaId);
    } catch (err) {
        console.error(err);
        alert("Upload error. Check the console (F12).");
    } finally {
        dropzone.classList.remove("dragging");
        dropzone.querySelector("p").innerHTML = `Drag a file here, or <span class="dropzone-link">click</span> (max. 50 MB)`;
        materiaFileInput.value = "";
    }
}

function updateUploadUI() {
    const state = canUploadHere();
    if (state.ok) {
        dropzone.style.display = "block";
        uploadLoginHint.style.display = "none";
    } else {
        dropzone.style.display = "none";
        uploadLoginHint.style.display = "block";
        if (!supabaseListo()) {
            uploadLoginHint.textContent = "Supabase isn't configured yet.";
        } else if (state.reason === "course") {
            uploadLoginHint.textContent = "Only students in this course can upload files here.";
        } else if (state.reason === "level") {
            uploadLoginHint.textContent = "This English level isn't yours — you can't upload files here.";
        } else {
            uploadLoginHint.textContent = "Sign in to upload files.";
        }
    }
}

/* ===== Courses ===== */

function getCourseCardImage(course) {
    const gal = (typeof galeriaDB !== "undefined" ? galeriaDB[course.id] : null) || [];
    if (gal.length > 0) {
        const pick = gal[Math.floor(Math.random() * gal.length)];
        return pick.ruta;
    }
    return course.imagen || "";
}

function setCourse(courseId, { push = true } = {}) {
    const course = getCourseById(courseId);
    if (!course || course.disabled) return;

    currentCourse = courseId;
    fsTopbarTitle.textContent = course.nombre;

    renderTutor(courseId);
    renderSchedule(courseId);
    renderStudentsTrack(courseId);
    renderGallery(courseId);
    refreshAnnouncementsCount();

    document.querySelectorAll(".drawer-course-item").forEach(el => {
        el.classList.toggle("active", el.dataset.courseId === courseId);
    });

    if (push) {
        try { history.replaceState(null, "", "#" + courseId); } catch {}
        sessionStorage.setItem("oasis_last_course", courseId);
    }
    courseFullscreen.scrollTop = 0;
}

/* ===== Drawer ===== */

function openDrawer() {
    drawer.classList.add("active");
    drawerOverlay.classList.add("active");
    lockScroll();
}
function closeDrawer() {
    drawer.classList.remove("active");
    drawerOverlay.classList.remove("active");
    unlockScroll();
}

fsMenuBtn.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

drawerSignInBtn.addEventListener("click", () => {
    closeDrawer();
    openLoginModal();
});

drawerUserBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    drawerUser.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!drawerUser.contains(e.target)) drawerUser.classList.remove("open");
});

drawerSignOutBtn.addEventListener("click", () => {
    currentUser = null;
    isAdmin = false;
    sessionStorage.removeItem("oasis_session");
    drawerUser.classList.remove("open");
    updateAuthUI();
});

function renderDrawerCourses() {
    const courses = typeof cursosDB !== "undefined" ? cursosDB : [];
    drawerCourses.innerHTML = "";

    courses.forEach(course => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "drawer-course-item";
        item.dataset.courseId = course.id;

        const name = document.createElement("span");
        name.className = "drawer-course-name";
        name.textContent = course.nombre;
        item.appendChild(name);

        if (course.disabled) {
            item.classList.add("disabled");
            const badge = document.createElement("span");
            badge.className = "drawer-course-badge";
            badge.textContent = "Soon";
            item.appendChild(badge);
            item.disabled = true;
        } else {
            item.addEventListener("click", () => {
                setCourse(course.id);
                closeDrawer();
            });
        }

        drawerCourses.appendChild(item);
    });
}

/* ===== ESC key ===== */

document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (imageViewer.classList.contains("active")) closeImageViewer();
    else if (drawer.classList.contains("active")) closeDrawer();
    else if (materiaModalOverlay.classList.contains("active")) closeMateriaModal();
    else if (studentModalOverlay.classList.contains("active")) closeStudentModal();
    else if (announcementsModalOverlay.classList.contains("active")) closeAnnouncementsModal();
    else if (loginModalOverlay.classList.contains("active")) closeLoginModal();
});

/* ===== Tutor ===== */

function renderTutor(courseId) {
    const tutorCard = document.getElementById("tutorCard");
    const profs = typeof profesoresDB !== "undefined" ? profesoresDB : [];
    const tutor = profs.find(p => p.tutor === courseId);

    tutorCard.innerHTML = "";
    if (!tutor) {
        tutorCard.innerHTML = `<p class="materia-archivos-empty">No tutor assigned</p>`;
        return;
    }

    const photoWrap = document.createElement("div");
    photoWrap.classList.add("tutor-photo-wrap");
    const photoSlot = buildPhotoSlot(tutor.foto, tutor.nombre);
    photoWrap.appendChild(photoSlot);

    const tutorImg = photoSlot.querySelector("img");
    if (tutorImg) {
        tutorImg.addEventListener("click", () => openImageViewer(tutor.foto));
        tutorImg.style.cursor = "zoom-in";
    }
    tutorCard.appendChild(photoWrap);

    const name = document.createElement("span");
    name.className = "tutor-name";
    name.textContent = tutor.nombre;
    tutorCard.appendChild(name);
}

/* ===== Schedule ===== */

function materiaNombre(id) {
    const m = findMateria(id);
    return m ? m.nombre : id;
}

function cellKey(cell) {
    if (!cell) return null;
    return cell.materia + "|" + (cell.profesor || "");
}

function renderSchedule(courseId) {
    const dbAll = typeof horariosDB !== "undefined" ? horariosDB : {};
    const rows = dbAll[courseId] || [];
    renderScheduleTable(rows);
    renderScheduleMobile(rows);
}

function renderScheduleTable(rows) {
    horarioBody.innerHTML = "";
    const skip = new Set();
    const rowspan = {};

    days.forEach(day => {
        let i = 0;
        while (i < rows.length) {
            if (rows[i].tipo !== "clase") { i++; continue; }
            let j = i + 1;
            while (
                j < rows.length &&
                rows[j].tipo === "clase" &&
                cellKey(rows[i][day]) &&
                cellKey(rows[j][day]) === cellKey(rows[i][day])
            ) {
                skip.add(j + "|" + day);
                j++;
            }
            rowspan[i + "|" + day] = j - i;
            i = j;
        }
    });

    rows.forEach((row, i) => {
        const tr = document.createElement("tr");
        const tdHora = document.createElement("td");
        tdHora.textContent = row.hora;
        tdHora.classList.add("hora-cell");
        tr.appendChild(tdHora);

        if (row.tipo === "recreo") {
            const td = document.createElement("td");
            td.textContent = row.label || "Break";
            td.colSpan = days.length;
            td.classList.add("recreo-cell");
            tr.appendChild(td);
        } else {
            days.forEach(day => {
                if (skip.has(i + "|" + day)) return;
                const cell = row[day];
                const td = document.createElement("td");
                const span = rowspan[i + "|" + day] || 1;
                if (span > 1) td.rowSpan = span;
                if (cell) {
                    td.textContent = materiaNombre(cell.materia);
                    td.classList.add("materia-cell");
                    td.addEventListener("click", () => openMateriaModal(cell.materia, cell.profesor));
                } else {
                    td.textContent = "Free";
                    td.classList.add("libre-cell");
                }
                tr.appendChild(td);
            });
        }
        horarioBody.appendChild(tr);
    });
}

function renderScheduleMobile(rows) {
    dayTabs.innerHTML = "";
    dayTrack.innerHTML = "";

    days.forEach((day, dayIdx) => {
        const tab = document.createElement("button");
        tab.classList.add("day-tab");
        if (dayIdx === 0) tab.classList.add("active");
        tab.textContent = DAY_LABELS[day].slice(0, 3);
        tab.addEventListener("click", () => showDay(dayIdx));
        dayTabs.appendChild(tab);

        const panel = document.createElement("div");
        panel.classList.add("day-panel");
        if (dayIdx === 0) panel.classList.add("active");

        const entries = [];
        let prevKey = null;
        rows.forEach(row => {
            if (row.tipo === "recreo") {
                entries.push({ type: "recreo", row });
                prevKey = null;
                return;
            }
            const cell = row[day];
            if (!cell) {
                entries.push({ type: "free", row });
                prevKey = null;
                return;
            }
            const key = cellKey(cell);
            entries.push({ type: "subject", row, cell, key, isContinuation: key === prevKey });
            prevKey = key;
        });

        entries.forEach((entry, idx) => {
            const next = entries[idx + 1];
            const nextIsSame = entry.type === "subject" && next && next.type === "subject" && next.key === entry.key;

            let position = "solo";
            if (entry.type === "subject") {
                if (!entry.isContinuation && nextIsSame) position = "start";
                else if (entry.isContinuation && nextIsSame) position = "middle";
                else if (entry.isContinuation && !nextIsSame) position = "end";
            }

            let cardEl, hourLabel;
            if (entry.type === "recreo") {
                cardEl = buildBreakCard(entry.row);
                hourLabel = entry.row.hora;
            } else if (entry.type === "free") {
                cardEl = buildFreeCard();
                hourLabel = entry.row.hora.split(" - ")[0];
            } else {
                cardEl = buildSubjectCard(entry.cell);
                hourLabel = entry.row.hora.split(" - ")[0];
            }

            panel.appendChild(buildTimelineItem(hourLabel, cardEl, position));
        });

        dayTrack.appendChild(panel);
    });
}

function buildTimelineItem(hourLabel, cardEl, position) {
    const item = document.createElement("div");
    item.classList.add("timeline-item");
    if (position !== "solo") item.classList.add("chain-" + position);

    const timeCol = document.createElement("div");
    timeCol.classList.add("timeline-time-col");
    timeCol.textContent = hourLabel;
    item.appendChild(timeCol);

    const connector = document.createElement("div");
    connector.classList.add("timeline-connector");
    const dotEl = document.createElement("span");
    dotEl.classList.add("timeline-dot");
    if (position === "middle" || position === "end") dotEl.classList.add("hollow");
    const lineEl = document.createElement("span");
    lineEl.classList.add("timeline-line");
    if (position === "start" || position === "middle") lineEl.classList.add("connected");
    connector.appendChild(dotEl);
    connector.appendChild(lineEl);
    item.appendChild(connector);
    item.appendChild(cardEl);
    return item;
}

function buildBreakCard(row) {
    const card = document.createElement("div");
    card.classList.add("timeline-card", "recreo-card");
    card.textContent = row.label || "Break";
    return card;
}
function buildFreeCard() {
    const card = document.createElement("div");
    card.classList.add("timeline-card", "libre-card");
    card.textContent = "Free";
    return card;
}
function buildSubjectCard(cell) {
    const card = document.createElement("div");
    card.classList.add("timeline-card", "clickable");
    const prof = findProfesor(cell.profesor);
    card.innerHTML = `
        <div class="materia-name">${escapeHtml(materiaNombre(cell.materia))}</div>
        ${prof ? `<div class="prof-name">${escapeHtml(prof.nombre)}</div>` : ""}
    `;
    card.addEventListener("click", () => openMateriaModal(cell.materia, cell.profesor));
    return card;
}
function showDay(idx) {
    document.querySelectorAll(".day-tab").forEach((t, i) => t.classList.toggle("active", i === idx));
    document.querySelectorAll(".day-panel").forEach((p, i) => p.classList.toggle("active", i === idx));
}

/* ===== Announcements (chat) ===== */

const announcementsModalOverlay = document.getElementById("announcementsModalOverlay");
const announcementsModalClose = document.getElementById("announcementsModalClose");
const announcementsChat = document.getElementById("announcementsChat");
const announcementsInputWrap = document.getElementById("announcementsInputWrap");
const announcementsInput = document.getElementById("announcementsInput");
const announcementsSendBtn = document.getElementById("announcementsSendBtn");
const announcementsMentionBtn = document.getElementById("announcementsMentionBtn");
const announcementsHint = document.getElementById("announcementsHint");
const openAnnouncementsBtn = document.getElementById("openAnnouncementsBtn");
const announcementsCount = document.getElementById("announcementsCount");

let editingAnnouncementId = null;

function canPostAnnouncement() {
    if (!currentUser || !supabaseListo() || !currentCourse) return false;
    const me = getStudentById(currentUser.id);
    if (!me) return false;
    if (me.curso !== currentCourse) return false;
    return !!(me.cargo && me.cargo.trim());
}

function renderAnnouncementMessage(text) {
    // Replace {materiaId} with clickable chips
    let safe = escapeHtml(text);
    safe = safe.replace(/\{([a-zA-Z0-9_\-]+)\}/g, (match, id) => {
        const m = findMateria(id);
        if (!m) return match;
        return `<span class="msg-mention" data-materia="${id}">${escapeHtml(m.nombre)}</span>`;
    });
    return safe;
}

async function openAnnouncementsModal() {
    announcementsModalOverlay.classList.add("active");
    lockScroll();
    await loadAnnouncements();
}

function closeAnnouncementsModal() {
    announcementsModalOverlay.classList.remove("active");
    unlockScroll();
    editingAnnouncementId = null;
    announcementsInput.value = "";
    announcementsSendBtn.textContent = "Send";
}

openAnnouncementsBtn.addEventListener("click", openAnnouncementsModal);
const openAnnouncementsMobileBtn = document.getElementById("openAnnouncementsMobileBtn");
if (openAnnouncementsMobileBtn) {
    openAnnouncementsMobileBtn.addEventListener("click", openAnnouncementsModal);
}
announcementsModalClose.addEventListener("click", closeAnnouncementsModal);
announcementsModalOverlay.addEventListener("click", e => {
    if (e.target === announcementsModalOverlay) closeAnnouncementsModal();
});

announcementsMentionBtn.addEventListener("click", () => {
    const ta = announcementsInput;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    ta.value = before + "{}" + after;
    ta.selectionStart = ta.selectionEnd = start + 1;
    ta.focus();
});

async function loadAnnouncements() {
    announcementsChat.innerHTML = `<p class="announcements-empty">Loading…</p>`;

    if (!supabaseListo()) {
        announcementsChat.innerHTML = `<p class="announcements-empty">Supabase isn't configured.</p>`;
        updateAnnouncementsInputUI();
        return;
    }
    if (!currentCourse) {
        announcementsChat.innerHTML = `<p class="announcements-empty">No course selected.</p>`;
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("anuncios")
            .select("*")
            .eq("curso", currentCourse)
            .order("fecha", { ascending: true });
        if (error) throw error;
        renderAnnouncements(data || []);
        updateAnnouncementsInputUI();
        updateAnnouncementsCount(data || []);
    } catch (err) {
        console.error(err);
        announcementsChat.innerHTML = `<p class="announcements-empty">Error loading announcements.</p>`;
    }
}

function updateAnnouncementsCount(messages) {
    if (!announcementsCount) return;
    const n = messages.length;
    announcementsCount.textContent = n > 0 ? String(n) : "";
}

async function refreshAnnouncementsCount() {
    if (!announcementsCount) return;
    if (!supabaseListo() || !currentCourse) {
        announcementsCount.textContent = "";
        return;
    }
    try {
        const { count } = await supabaseClient
            .from("anuncios")
            .select("*", { count: "exact", head: true })
            .eq("curso", currentCourse);
        announcementsCount.textContent = count ? String(count) : "";
    } catch {
        announcementsCount.textContent = "";
    }
}

function updateAnnouncementsInputUI() {
    if (!currentUser) {
        announcementsInputWrap.style.display = "none";
        announcementsHint.style.display = "block";
        announcementsHint.textContent = "Sign in to see announcements.";
        return;
    }
    if (!canPostAnnouncement()) {
        announcementsInputWrap.style.display = "none";
        announcementsHint.style.display = "block";
        announcementsHint.textContent = "Only students with a role (e.g. President, Vice President) can post announcements.";
        return;
    }
    announcementsInputWrap.style.display = "flex";
    announcementsHint.style.display = "none";
}

function renderAnnouncements(messages) {
    announcementsChat.innerHTML = "";
    if (messages.length === 0) {
        announcementsChat.innerHTML = `<p class="announcements-empty">No announcements yet.</p>`;
        return;
    }

    messages.forEach(msg => {
        announcementsChat.appendChild(buildAnnouncementEl(msg));
    });
    announcementsChat.scrollTop = announcementsChat.scrollHeight;
}

function buildAnnouncementEl(msg) {
    const wrap = document.createElement("div");
    wrap.classList.add("msg");
    wrap.dataset.id = msg.id;

    const head = document.createElement("div");
    head.classList.add("msg-head");

    const author = document.createElement("span");
    author.classList.add("msg-author");
    author.textContent = msg.autor_nombre || "Someone";
    head.appendChild(author);

    if (msg.autor_cargo) {
        const role = document.createElement("span");
        role.classList.add("msg-role");
        role.textContent = msg.autor_cargo;
        head.appendChild(role);
    }

    const dateEl = document.createElement("span");
    dateEl.classList.add("msg-date");
    dateEl.textContent = formatDateTime(msg.fecha);
    head.appendChild(dateEl);

    wrap.appendChild(head);

    const body = document.createElement("div");
    body.classList.add("msg-body");
    body.innerHTML = renderAnnouncementMessage(msg.mensaje || "");
    wrap.appendChild(body);

    if (msg.edited_at) {
        const edited = document.createElement("div");
        edited.classList.add("msg-edited");
        edited.textContent = "(edited)";
        wrap.appendChild(edited);
    }

    // Mentions click -> open subject
    body.querySelectorAll(".msg-mention").forEach(chip => {
        chip.addEventListener("click", () => {
            const matId = chip.dataset.materia;
            if (matId && findMateria(matId)) {
                closeAnnouncementsModal();
                openMateriaModal(matId, null);
            }
        });
    });

    // Actions if author
    const canEdit = currentUser && currentUser.id === msg.autor_id;
    if (canEdit) {
        const actions = document.createElement("div");
        actions.classList.add("msg-actions");

        const editBtn = document.createElement("button");
        editBtn.classList.add("msg-action-btn");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
            editingAnnouncementId = msg.id;
            announcementsInput.value = msg.mensaje || "";
            announcementsSendBtn.textContent = "Save";
            announcementsInput.focus();
        });
        actions.appendChild(editBtn);

        const delBtn = document.createElement("button");
        delBtn.classList.add("msg-action-btn", "danger");
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteAnnouncement(msg));
        actions.appendChild(delBtn);

        wrap.appendChild(actions);
    }

    return wrap;
}

async function deleteAnnouncement(msg) {
    if (!confirm("Delete this announcement?")) return;
    if (!supabaseListo()) return;
    try {
        const { error } = await supabaseClient.from("anuncios").delete().eq("id", msg.id);
        if (error) throw error;
        await loadAnnouncements();
        refreshAnnouncementsCount();
    } catch (err) {
        console.error(err);
        alert("Couldn't delete announcement.");
    }
}

announcementsSendBtn.addEventListener("click", async () => {
    if (!canPostAnnouncement()) return;
    const text = announcementsInput.value.trim();
    if (!text) return;

    announcementsSendBtn.disabled = true;
    const originalLabel = announcementsSendBtn.textContent;
    announcementsSendBtn.textContent = "…";

    const me = getStudentById(currentUser.id);

    try {
        if (editingAnnouncementId) {
            const { error } = await supabaseClient
                .from("anuncios")
                .update({ mensaje: text, edited_at: new Date().toISOString() })
                .eq("id", editingAnnouncementId);
            if (error) throw error;
            editingAnnouncementId = null;
            announcementsSendBtn.textContent = "Send";
        } else {
            const { error } = await supabaseClient.from("anuncios").insert({
                curso: currentCourse,
                autor_id: currentUser.id,
                autor_nombre: currentUser.nombre,
                autor_cargo: me && me.cargo ? me.cargo : "",
                mensaje: text,
                fecha: new Date().toISOString()
            });
            if (error) throw error;
        }
        announcementsInput.value = "";
        await loadAnnouncements();
        refreshAnnouncementsCount();
    } catch (err) {
        console.error(err);
        alert("Couldn't save the announcement. Check the console (F12).");
    } finally {
        announcementsSendBtn.disabled = false;
        if (announcementsSendBtn.textContent === "…") {
            announcementsSendBtn.textContent = originalLabel;
        }
    }
});

/* ===== Subject modal ===== */

function setProfPhoto(url) {
    if (url) {
        materiaModalProfFoto.onerror = () => {
            materiaModalProfFoto.style.display = "none";
            profPhotoFallback.style.display = "flex";
        };
        materiaModalProfFoto.src = url;
        materiaModalProfFoto.style.cursor = "zoom-in";
        materiaModalProfFoto.onclick = () => openImageViewer(url);
        materiaModalProfFoto.style.display = "block";
        profPhotoFallback.style.display = "none";
    } else {
        materiaModalProfFoto.style.display = "none";
        profPhotoFallback.style.display = "flex";
    }
}

function renderNivelTabs(niveles) {
    materiaNiveles.style.display = "flex";
    materiaNiveles.innerHTML = "";
    niveles.forEach((nivel, idx) => {
        const tab = document.createElement("button");
        tab.classList.add("nivel-tab");
        if (idx === 0) tab.classList.add("active");
        tab.textContent = nivel.nombre;
        tab.addEventListener("click", () => {
            document.querySelectorAll(".nivel-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            showNivel(nivel);
        });
        materiaNiveles.appendChild(tab);
    });
}

function showNivel(nivel) {
    currentNivelId = nivel.id;
    currentMateriaId = currentMateriaBaseId + "::" + nivel.id;

    const profesor = findProfesor(nivel.profesor);
    if (profesor) {
        setProfPhoto(profesor.foto || "");
        materiaModalProfNombre.textContent = profesor.nombre;
    } else {
        setProfPhoto("");
        materiaModalProfNombre.textContent = "No teacher assigned";
    }

    loadMateriaArchivos(currentMateriaId);
    updateUploadUI();
}

function openMateriaModal(materiaId, profesorId) {
    const materia = findMateria(materiaId);
    currentMateriaBaseId = materiaId;
    materiaModalNombre.textContent = materia ? materia.nombre : materiaId;

    if (materia && materia.niveles && materia.niveles.length > 0) {
        renderNivelTabs(materia.niveles);
        showNivel(materia.niveles[0]);
    } else {
        materiaNiveles.style.display = "none";
        currentNivelId = null;
        currentMateriaId = materiaId;

        const profesor = findProfesor(profesorId);
        if (profesor) {
            setProfPhoto(profesor.foto || "");
            materiaModalProfNombre.textContent = profesor.nombre;
        } else {
            setProfPhoto("");
            materiaModalProfNombre.textContent = "No teacher assigned";
        }

        loadMateriaArchivos(currentMateriaId);
        updateUploadUI();
    }

    materiaModalOverlay.classList.add("active");
    lockScroll();
}

function closeMateriaModal() {
    materiaModalOverlay.classList.remove("active");
    currentMateriaId = null;
    currentMateriaBaseId = null;
    currentNivelId = null;
    unlockScroll();
}

materiaModalClose.addEventListener("click", closeMateriaModal);
materiaModalOverlay.addEventListener("click", e => { if (e.target === materiaModalOverlay) closeMateriaModal(); });

dropzone.addEventListener("click", () => materiaFileInput.click());
materiaFileInput.addEventListener("change", e => uploadFiles(e.target.files));
["dragenter", "dragover"].forEach(evt =>
    dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add("dragging"); })
);
["dragleave", "drop"].forEach(evt =>
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        if (evt === "dragleave") dropzone.classList.remove("dragging");
    })
);
dropzone.addEventListener("drop", e => {
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
});

/* ===== Gallery ===== */

async function renderGallery(courseId) {
    const dbAll = typeof galeriaDB !== "undefined" ? galeriaDB : {};
    let list = (dbAll[courseId] || []).map(item => ({ ruta: item.ruta }));

    if (supabaseListo()) {
        try {
            const { data, error } = await supabaseClient
                .from("galeria_fotos")
                .select("*")
                .eq("curso", courseId);
            if (error) throw error;
            (data || []).forEach(row => {
                const { data: urlData } = supabaseClient.storage.from("galeria").getPublicUrl(row.storage_path);
                list.push({ ruta: urlData.publicUrl });
            });
        } catch (err) {
            console.warn("Couldn't load uploaded gallery photos:", err);
        }
    }

    galeriaTrack.innerHTML = "";
    galeriaTrack.style.animation = "none";

    if (list.length === 0) {
        galeriaTrack.innerHTML = `<p class="galeria-empty">No photos in the gallery yet</p>`;
    } else {
        const sizeClasses = ["size-a", "size-b", "size-c"];
        const doubled = list.concat(list);

        doubled.forEach((item, i) => {
            const div = document.createElement("div");
            div.classList.add("galeria-item", sizeClasses[i % sizeClasses.length]);
            const img = document.createElement("img");
            img.src = item.ruta;
            img.alt = "";
            img.loading = "lazy";
            img.style.cursor = "zoom-in";
            img.addEventListener("click", () => openImageViewer(item.ruta));
            div.appendChild(img);
            galeriaTrack.appendChild(div);
        });

        const duration = Math.max(list.length * 5, 20);
        galeriaTrack.style.animation = `galeriaScroll ${duration}s linear infinite`;
    }

    updateGaleriaUploadUI();
    setupGalleryAutoScroll();
}

const galeriaDropzone = document.getElementById("galeriaDropzone");
const galeriaFileInput = document.getElementById("galeriaFileInput");
const galeriaLoginHint = document.getElementById("galeriaLoginHint");
const MAX_GALERIA_SIZE = 10 * 1024 * 1024;

function updateGaleriaUploadUI() {
    if (currentUser && !currentUser.isAdmin && supabaseListo()) {
        galeriaDropzone.style.display = "block";
        galeriaLoginHint.style.display = "none";
    } else {
        galeriaDropzone.style.display = "none";
        galeriaLoginHint.style.display = "block";
        galeriaLoginHint.textContent = supabaseListo()
            ? "Sign in to add photos to the gallery."
            : "Supabase isn't configured yet.";
    }
}

async function uploadGalleryPhotos(files) {
    if (!currentUser || currentUser.isAdmin || !supabaseListo() || !currentCourse) return;
    const tooBig = Array.from(files).filter(f => f.size > MAX_GALERIA_SIZE);
    if (tooBig.length > 0) {
        alert(`"${tooBig[0].name}" is too large (max 10 MB).`);
        return;
    }
    galeriaDropzone.classList.add("dragging");
    galeriaDropzone.querySelector("p").textContent = "Uploading…";
    try {
        for (const file of Array.from(files)) {
            const path = `${currentCourse}/${Date.now()}_${safePath(file.name)}`;
            const { error: upErr } = await supabaseClient.storage.from("galeria").upload(path, file);
            if (upErr) throw upErr;
            const { error: insErr } = await supabaseClient.from("galeria_fotos").insert({
                curso: currentCourse,
                storage_path: path,
                subido_por_id: currentUser.id,
                subido_por_nombre: currentUser.nombre,
                fecha: new Date().toISOString()
            });
            if (insErr) throw insErr;
        }
        await renderGallery(currentCourse);
    } catch (err) {
        console.error(err);
        alert("Error uploading photo. Check console (F12).");
    } finally {
        galeriaDropzone.classList.remove("dragging");
        galeriaDropzone.querySelector("p").innerHTML = `Drag a photo here, or <span class="dropzone-link">click</span> (max. 10 MB each)`;
        galeriaFileInput.value = "";
    }
}

galeriaDropzone.addEventListener("click", () => galeriaFileInput.click());
galeriaFileInput.addEventListener("change", e => uploadGalleryPhotos(e.target.files));
["dragenter", "dragover"].forEach(evt =>
    galeriaDropzone.addEventListener(evt, e => { e.preventDefault(); galeriaDropzone.classList.add("dragging"); })
);
["dragleave", "drop"].forEach(evt =>
    galeriaDropzone.addEventListener(evt, e => {
        e.preventDefault();
        if (evt === "dragleave") galeriaDropzone.classList.remove("dragging");
    })
);
galeriaDropzone.addEventListener("drop", e => {
    if (e.dataTransfer.files.length) uploadGalleryPhotos(e.dataTransfer.files);
});

/* ===== Gallery auto-scroll (mobile) ===== */

let galeriaAutoTimer = null;
let galeriaResumeTimer = null;
let galeriaListenersListos = false;

function isMobileGallery() {
    return window.matchMedia("(max-width:700px)").matches;
}

function startGalleryAuto() {
    stopGalleryAuto();
    if (!isMobileGallery()) return;
    const viewport = galeriaTrack.parentElement;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;

    galeriaAutoTimer = setInterval(() => {
        const half = viewport.scrollWidth / 2;
        viewport.scrollLeft += 1;
        if (viewport.scrollLeft >= half) viewport.scrollLeft = 0;
    }, 25);
}

function stopGalleryAuto() {
    if (galeriaAutoTimer) { clearInterval(galeriaAutoTimer); galeriaAutoTimer = null; }
}

function pauseGalleryTemporarily() {
    stopGalleryAuto();
    if (galeriaResumeTimer) clearTimeout(galeriaResumeTimer);
    galeriaResumeTimer = setTimeout(startGalleryAuto, 2200);
}

function setupGalleryAutoScroll() {
    const viewport = galeriaTrack.parentElement;
    if (!viewport) return;

    if (!galeriaListenersListos) {
        viewport.addEventListener("touchstart", pauseGalleryTemporarily, { passive: true });
        viewport.addEventListener("touchend", pauseGalleryTemporarily, { passive: true });
        window.addEventListener("resize", () => {
            if (isMobileGallery()) startGalleryAuto();
            else stopGalleryAuto();
        });
        galeriaListenersListos = true;
    }
    startGalleryAuto();
}

/* ===== Login ===== */

let currentUser = null;
let isAdmin = false;

function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = "none";
        drawerFooter.style.display = "none";
        drawerUser.style.display = "block";

        userChip.style.display = "flex";
        userChipName.textContent = currentUser.nombre;

        const me = getStudentById(currentUser.id);
        const photoUrl = currentUser.foto || (me ? me.foto : "");

        userChipAvatar.innerHTML = "";
        userChipAvatar.appendChild(buildPhotoSlot(photoUrl, currentUser.nombre));

        drawerUserAvatar.innerHTML = "";
        drawerUserAvatar.appendChild(buildPhotoSlot(photoUrl, currentUser.nombre));
        drawerUserName.textContent = currentUser.nombre;

        userMenuAdmin.style.display = isAdmin ? "flex" : "none";
        userMenuPerfil.style.display = currentUser.isAdmin ? "none" : "flex";
        userMenuConectar.style.display = currentUser.isAdmin ? "none" : "flex";
    } else {
        loginBtn.style.display = "inline-flex";
        drawerFooter.style.display = "block";
        drawerUser.style.display = "none";
        drawerUser.classList.remove("open");

        userChip.style.display = "none";
        userChip.classList.remove("open");
    }
    if (materiaModalOverlay.classList.contains("active")) updateUploadUI();
    if (courseFullscreen.classList.contains("active")) updateGaleriaUploadUI();
    updateAnnouncementsInputUI();
}

function openLoginModal() {
    loginError.style.display = "none";
    loginUsername.value = "";
    loginPassword.value = "";
    loginModalOverlay.classList.add("active");
    lockScroll();
}

loginBtn.addEventListener("click", openLoginModal);

function closeLoginModal() {
    loginModalOverlay.classList.remove("active");
    unlockScroll();
}

loginModalClose.addEventListener("click", closeLoginModal);
loginModalOverlay.addEventListener("click", e => { if (e.target === loginModalOverlay) closeLoginModal(); });

loginSubmitBtn.addEventListener("click", tryLogin);
loginPassword.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

function tryLogin() {
    const u = normalize(loginUsername.value);
    const p = normalize(loginPassword.value);
    const list = typeof estudiantesDB !== "undefined" ? estudiantesDB : [];
    const match = list.find(e => {
        const creds = loginCredentials(e);
        return creds.username === u && creds.password === p;
    });
    if (!match) {
        loginError.style.display = "block";
        return;
    }
    isAdmin = false;
    currentUser = { id: match.id, nombre: shortName(match.nombre) };
    sessionStorage.setItem("oasis_session", JSON.stringify(currentUser));
    updateAuthUI();
    closeLoginModal();
}

userChipBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userChip.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!userChip.contains(e.target)) userChip.classList.remove("open");
});

userMenuPerfil.addEventListener("click", () => {
    userChip.classList.remove("open");
    if (!currentUser) return;
    const me = getStudentById(currentUser.id);
    if (me) openStudentModal(me);
});

userMenuLogout.addEventListener("click", () => {
    currentUser = null;
    isAdmin = false;
    sessionStorage.removeItem("oasis_session");
    updateAuthUI();
});

const savedSession = sessionStorage.getItem("oasis_session");
if (savedSession) {
    currentUser = JSON.parse(savedSession);
    isAdmin = !!currentUser.isAdmin;
}
updateAuthUI();

/* ===== Google Sign-In ===== */

let conectandoGoogle = false;

function parseJwt(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(jsonPayload);
}

function handleGoogleCredential(response) {
    const payload = parseJwt(response.credential);
    const email = payload.email;

    if (email === ADMIN_EMAIL) {
        isAdmin = true;
        currentUser = { id: "admin", nombre: payload.name, isAdmin: true, foto: payload.picture };
        sessionStorage.setItem("oasis_session", JSON.stringify(currentUser));
        updateAuthUI();
        closeLoginModal();
        return;
    }

    if (conectandoGoogle && currentUser && !currentUser.isAdmin) {
        const links = JSON.parse(localStorage.getItem("oasis_google_links") || "{}");
        links[email] = currentUser.id;
        localStorage.setItem("oasis_google_links", JSON.stringify(links));
        conectandoGoogle = false;
        alert("Your Google account is now linked. Next time use \"Continue with Google\".");
        return;
    }

    const links = JSON.parse(localStorage.getItem("oasis_google_links") || "{}");
    const studentId = links[email];
    const est = studentId ? getStudentById(studentId) : null;

    if (est) {
        isAdmin = false;
        currentUser = { id: est.id, nombre: shortName(est.nombre) };
        sessionStorage.setItem("oasis_session", JSON.stringify(currentUser));
        updateAuthUI();
        closeLoginModal();
    } else {
        alert("This Google account isn't linked to any student yet. Sign in with username/password, then link it from your profile menu.");
    }
}

function initGoogleAuth() {
    if (!window.google || !google.accounts || !google.accounts.id) return;
    if (GOOGLE_CLIENT_ID.includes("TU_CLIENT_ID")) {
        console.warn("GOOGLE_CLIENT_ID missing in data/supabase-config.js");
        return;
    }
    try {
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
        const div = document.getElementById("googleSignInDiv");
        if (div) google.accounts.id.renderButton(div, { theme: "filled_black", shape: "pill", size: "large", width: 260 });
    } catch (err) {
        console.error("Error initializing Google Sign-In:", err);
    }
}
window.addEventListener("load", initGoogleAuth);

userMenuConectar.addEventListener("click", () => {
    userChip.classList.remove("open");
    if (GOOGLE_CLIENT_ID.includes("TU_CLIENT_ID")) {
        alert("Google Sign-In isn't configured yet.");
        return;
    }
    if (!window.google || !google.accounts || !google.accounts.id) {
        alert("Google Sign-In isn't available yet. Try reloading.");
        return;
    }
    conectandoGoogle = true;
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            conectandoGoogle = false;
            alert("Google didn't show the popup. Try signing out and using \"Continue with Google\" from the login modal.");
        }
    });
});

/* ===== Admin panel ===== */

const adminModalOverlay = document.getElementById("adminModalOverlay");
const adminModalClose = document.getElementById("adminModalClose");
const adminDataType = document.getElementById("adminDataType");
const adminDataTextarea = document.getElementById("adminDataTextarea");
const adminSaveBtn = document.getElementById("adminSaveBtn");
const adminSaveStatus = document.getElementById("adminSaveStatus");
const userMenuAdmin = document.getElementById("userMenuAdmin");

function getGlobalFor(kind) {
    if (kind === "cursos") return cursosDB;
    if (kind === "estudiantes") return estudiantesDB;
    if (kind === "profesores") return profesoresDB;
    if (kind === "materias") return materiasDB;
    if (kind === "horarios") return horariosDB;
}
function setGlobalFor(kind, data) {
    if (kind === "cursos") cursosDB = data;
    else if (kind === "estudiantes") estudiantesDB = data;
    else if (kind === "profesores") profesoresDB = data;
    else if (kind === "materias") materiasDB = data;
    else if (kind === "horarios") horariosDB = data;
}

function loadAdminTextarea() {
    adminDataTextarea.value = JSON.stringify(getGlobalFor(adminDataType.value), null, 4);
    adminSaveStatus.textContent = "";
}

adminDataType.addEventListener("change", loadAdminTextarea);

userMenuAdmin.addEventListener("click", () => {
    userChip.classList.remove("open");
    loadAdminTextarea();
    adminModalOverlay.classList.add("active");
    lockScroll();
});

adminModalClose.addEventListener("click", () => {
    adminModalOverlay.classList.remove("active");
    unlockScroll();
});
adminModalOverlay.addEventListener("click", e => {
    if (e.target === adminModalOverlay) {
        adminModalOverlay.classList.remove("active");
        unlockScroll();
    }
});

adminSaveBtn.addEventListener("click", async () => {
    const kind = adminDataType.value;
    let parsed;
    try {
        parsed = JSON.parse(adminDataTextarea.value);
    } catch (err) {
        adminSaveStatus.style.color = "#ff8a8a";
        adminSaveStatus.textContent = "Text isn't valid JSON: " + err.message;
        return;
    }
    if (!supabaseListo()) {
        adminSaveStatus.style.color = "#ff8a8a";
        adminSaveStatus.textContent = "Supabase isn't configured.";
        return;
    }
    adminSaveBtn.disabled = true;
    adminSaveBtn.textContent = "Saving…";
    try {
        const { error } = await supabaseClient
            .from("config")
            .upsert({ id: kind, data: parsed, updated_at: new Date().toISOString() });
        if (error) throw error;
        setGlobalFor(kind, parsed);
        adminSaveStatus.style.color = "";
        adminSaveStatus.textContent = "Saved. Now visible to everyone.";
        renderDrawerCourses();
        if (currentCourse) setCourse(currentCourse, { push: false });
    } catch (err) {
        console.error(err);
        adminSaveStatus.style.color = "#ff8a8a";
        adminSaveStatus.textContent = "Error saving: " + err.message;
    } finally {
        adminSaveBtn.disabled = false;
        adminSaveBtn.textContent = "Save changes";
    }
});

async function loadConfigsFromSupabase() {
    if (!supabaseListo()) return;
    try {
        const { data, error } = await supabaseClient.from("config").select("*");
        if (error) throw error;
        (data || []).forEach(row => {
            if (["cursos", "estudiantes", "profesores", "materias", "horarios"].includes(row.id) && row.data) {
                setGlobalFor(row.id, row.data);
            }
        });
    } catch (err) {
        console.warn("Couldn't load from Supabase, using local files:", err);
    }
}

/* ===== Students ===== */

function renderStudentsTrack(courseId) {
    const list = (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).filter(e => e.curso === courseId);
    studentsTrack.innerHTML = "";
    if (list.length === 0) {
        studentsTrack.innerHTML = `<p class="students-empty">No students yet</p>`;
        return;
    }
    list.forEach(s => {
        const card = document.createElement("div");
        card.classList.add("card-estudiante");
        const thumb = document.createElement("div");
        thumb.classList.add("thumb");
        thumb.appendChild(buildPhotoSlot(s.foto, s.nombre));
        card.appendChild(thumb);

        if (s.cargo) {
            const badge = document.createElement("span");
            badge.classList.add("badge-cargo");
            badge.textContent = s.cargo;
            card.appendChild(badge);
        }

        const lastNameEl = document.createElement("div");
        lastNameEl.classList.add("apellido");
        lastNameEl.textContent = firstLastName(s.nombre);
        card.appendChild(lastNameEl);

        card.addEventListener("click", () => openStudentModal(s));
        studentsTrack.appendChild(card);
    });
}

studentsPrevBtn.addEventListener("click", () => studentsTrack.scrollBy({ left: -320, behavior: "smooth" }));
studentsNextBtn.addEventListener("click", () => studentsTrack.scrollBy({ left: 320, behavior: "smooth" }));

function openStudentModal(s) {
    if (s.foto) {
        studentModalPhoto.onerror = () => {
            studentModalPhoto.style.display = "none";
            studentPhotoFallback.style.display = "flex";
        };
        studentModalPhoto.src = s.foto;
        studentModalPhoto.style.cursor = "zoom-in";
        studentModalPhoto.onclick = () => openImageViewer(s.foto);
        studentModalPhoto.style.display = "block";
        studentPhotoFallback.style.display = "none";
    } else {
        studentModalPhoto.style.display = "none";
        studentPhotoFallback.style.display = "flex";
    }

    studentModalName.textContent = s.nombre;
    if (s.cargo) {
        studentModalRole.style.display = "inline-flex";
        studentModalRoleText.textContent = s.cargo;
    } else {
        studentModalRole.style.display = "none";
    }
    studentModalBirth.textContent = formatDate(s.fechaNacimiento);
    studentModalIngles.textContent = s.nivelIngles || "-";
    studentModalContrib.textContent = "...";

    // Reset radar open state
    const fsRoot = studentModalOverlay.querySelector(".student-fs");
    if (fsRoot) fsRoot.classList.remove("radar-open");

    studentModalOverlay.classList.add("active");
    lockScroll();

    if (supabaseListo()) {
        supabaseClient
            .from("archivos")
            .select("*", { count: "exact", head: true })
            .eq("subido_por_id", s.id)
            .then(({ count }) => {
                studentModalContrib.textContent = (count || 0) + ((count || 0) === 1 ? " file" : " files");
            })
            .catch(() => { studentModalContrib.textContent = "-"; });
    } else {
        studentModalContrib.textContent = "-";
    }

    renderStudentRadar(s.id);
}

function closeStudentModal() {
    studentModalOverlay.classList.remove("active");
    const fsRoot = studentModalOverlay.querySelector(".student-fs");
    if (fsRoot) fsRoot.classList.remove("radar-open");
    unlockScroll();
}

studentModalClose.addEventListener("click", closeStudentModal);
studentModalOverlay.addEventListener("click", e => { if (e.target === studentModalOverlay) closeStudentModal(); });

/* ===== Radar ===== */

function getStudentAverages(studentId) {
    const raw = (typeof notasDB !== "undefined" ? notasDB[studentId] : null);
    if (!raw) return null;
    const out = {};
    for (const [materiaId, arr] of Object.entries(raw)) {
        if (!Array.isArray(arr)) continue;
        const valid = arr.filter(n => typeof n === "number" && !isNaN(n));
        if (valid.length === 0) continue;
        out[materiaId] = valid.reduce((a, b) => a + b, 0) / valid.length;
    }
    return Object.keys(out).length ? out : null;
}

function shortLabel(name, max = 9) {
    if (name.length <= max) return name;
    return name.slice(0, max - 1).trimEnd() + "…";
}

function buildRadarChart(subjects, values, { size = 280, max = 10 } = {}) {
    const n = subjects.length;
    if (n < 3) return null;

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 46;

    const angle = i => (Math.PI * 2 * i) / n - Math.PI / 2;
    const point = (i, ratio) => {
        const a = angle(i);
        return [cx + Math.cos(a) * r * ratio, cy + Math.sin(a) * r * ratio];
    };

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("role", "img");

    [0.25, 0.5, 0.75, 1].forEach(ratio => {
        const pts = subjects.map((_, i) => point(i, ratio).join(",")).join(" ");
        const poly = document.createElementNS(NS, "polygon");
        poly.setAttribute("points", pts);
        poly.setAttribute("class", "radar-grid");
        svg.appendChild(poly);
    });

    subjects.forEach((_, i) => {
        const [x, y] = point(i, 1);
        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", cx);
        line.setAttribute("y1", cy);
        line.setAttribute("x2", x);
        line.setAttribute("y2", y);
        line.setAttribute("class", "radar-axis");
        svg.appendChild(line);
    });

    const dataPts = values.map((v, i) => point(i, Math.max(0, Math.min(v / max, 1))).join(",")).join(" ");
    const dataPoly = document.createElementNS(NS, "polygon");
    dataPoly.setAttribute("points", dataPts);
    dataPoly.setAttribute("class", "radar-data");
    svg.appendChild(dataPoly);

    values.forEach((v, i) => {
        const [x, y] = point(i, Math.max(0, Math.min(v / max, 1)));
        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
        dot.setAttribute("r", 3.5);
        dot.setAttribute("class", "radar-dot");
        svg.appendChild(dot);
    });

    subjects.forEach((s, i) => {
        const [x, y] = point(i, 1.20);
        const a = angle(i);
        let anchor = "middle";
        if (Math.cos(a) > 0.3) anchor = "start";
        else if (Math.cos(a) < -0.3) anchor = "end";

        const text = document.createElementNS(NS, "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("text-anchor", anchor);
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("class", "radar-label");
        text.textContent = s;
        svg.appendChild(text);
    });

    return svg;
}

function renderStudentRadar(studentId) {
    const cont = document.getElementById("studentModalRadar");
    if (!cont) return;
    cont.innerHTML = "";

    const averages = getStudentAverages(studentId);
    if (!averages) {
        cont.innerHTML = `<p class="student-radar-empty">No grades recorded</p>`;
        return;
    }

    const entries = Object.entries(averages)
        .filter(([id]) => !!findMateria(id))
        .sort((a, b) => materiaNombre(a[0]).localeCompare(materiaNombre(b[0]), "en"));

    if (entries.length < 3) {
        cont.innerHTML = `<p class="student-radar-empty">At least 3 subjects with grades are needed</p>`;
        return;
    }

    const subjects = entries.map(([id]) => shortLabel(materiaNombre(id)));
    const values = entries.map(([, v]) => v);

    const chart = buildRadarChart(subjects, values, { size: 280, max: 10 });
    if (chart) cont.appendChild(chart);
}

/* Radar expand on mobile — click inside the radar area only */
document.addEventListener("click", (e) => {
    if (!window.matchMedia("(max-width:800px)").matches) return;

    const radar = e.target.closest(".student-fs-radar");
    if (!radar) return;
    if (!radar.querySelector("svg")) return;

    const fsRoot = radar.closest(".student-fs");
    if (!fsRoot) return;

    fsRoot.classList.toggle("radar-open");
});

/* ===== Image viewer ===== */

const imageViewer = document.getElementById("imageViewer");
const imageViewerImg = document.getElementById("imageViewerImg");
const imageViewerClose = document.getElementById("imageViewerClose");

function openImageViewer(src) {
    if (!src) return;
    imageViewerImg.src = src;
    imageViewer.classList.add("active");
    lockScroll();
}
function closeImageViewer() {
    imageViewer.classList.remove("active");
    unlockScroll();
}
imageViewerClose.addEventListener("click", closeImageViewer);
imageViewer.addEventListener("click", e => { if (e.target === imageViewer) closeImageViewer(); });

/* ===== Boot ===== */

async function initApp() {
    await loadConfigsFromSupabase();
    renderDrawerCourses();

    const courses = typeof cursosDB !== "undefined" ? cursosDB : [];
    const available = courses.filter(c => !c.disabled);

    if (available.length === 0) {
        fsTopbarTitle.textContent = "No courses available";
        return;
    }

    const hashId = location.hash.replace("#", "");
    const lastId = sessionStorage.getItem("oasis_last_course");

    const chosen =
        available.find(c => c.id === hashId) ||
        available.find(c => c.id === lastId) ||
        available[0];

    setCourse(chosen.id, { push: false });
}

initApp();

window.addEventListener("hashchange", () => {
    const id = location.hash.replace("#", "");
    if (id && id !== currentCourse) setCourse(id, { push: false });
});