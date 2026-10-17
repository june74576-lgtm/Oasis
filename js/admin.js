/* ============================================================
   Oasis · Admin panel
   ============================================================ */

const { createApp } = Vue;
const { utils, auth, data, config } = window.Oasis;
const sb = window.supabaseClient;

const adminRoot = document.getElementById("adminApp");
const loginCtrl = auth.createLoginController(adminRoot);

createApp({
    data() {
        return {
            /* Sesión */
            currentUser: null,
            currentUserIsAdmin: false,

            /* Datos */
            cursos: [],
            estudiantes: [],
            profesores: [],
            materias: [],
            horarios: [],           // flat mapped rows
            galeriaLocal: [],

            /* Constantes */
            days: config.DAYS,
            dayLabels: config.DAY_LABELS,

            cellEditor: { open: false, franja: null, day: null, materia: "", profesor: "" },

            /* UI */
            currentSection: "courses",
            selectedCourse: null,
            drawerOpen: false,
            sectionSwitcherOpen: false,

            sidebarItems: [
                { id: "courses",   label: "Courses",   icon: "school" },
                { id: "students",  label: "Students",  icon: "group" },
                { id: "teachers",  label: "Teachers",  icon: "person" },
                { id: "subjects",  label: "Subjects",  icon: "menu_book" },
                { id: "schedules", label: "Schedules", icon: "calendar_month" },
                { id: "gallery",   label: "Gallery",   icon: "photo_library" }
            ],

            /* Snackbar */
            snackbar: { visible: false, message: "", type: "success" }
        };
    },

    computed: {
        supabaseReady() { return !!sb && typeof sb.from === "function"; },
        isAdmin() { return this.currentUserIsAdmin; },
        cursosDisponibles() { return this.cursos.filter(c => !c.disabled); },
        currentCourseObj() { return this.cursos.find(c => c.id === this.selectedCourse) || null; },

        currentUserPhoto() {
            if (!this.currentUser) return "";
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return (me && me.foto) || "";
        },
        currentUserInitial() {
            return (this.currentUser && this.currentUser.nombre ? this.currentUser.nombre[0] : "?").toUpperCase();
        },

        estudiantesFiltrados() {
            let lista;
            if (this.isAdmin) {
                lista = this.selectedCourse
                    ? this.estudiantes.filter(e => e.curso === this.selectedCourse)
                    : this.estudiantes.slice();
            } else {
                const me = this.estudiantes.find(e => e.id === this.currentUser.id);
                if (!me) return [];
                lista = this.estudiantes.filter(e => e.curso === me.curso);
            }
            return lista.slice().sort((a, b) =>
                utils.firstLastName(a.nombre).localeCompare(utils.firstLastName(b.nombre), "es", { sensitivity: "base" })
            );
        },
        galeriaDelCurso() {
            if (!this.selectedCourse) return this.galeriaLocal;
            return this.galeriaLocal.filter(g => g.curso === this.selectedCourse);
        },
        franjasDelCurso() {
            if (!this.selectedCourse) return [];
            const filas = this.horarios.filter(h => h.curso === this.selectedCourse);
            const map = {};
            filas.forEach(h => {
                const key = h.hora;
                if (!map[key]) {
                    map[key] = {
                        horaKey: key, hora: h.hora, tipo: h.tipo,
                        label: h.label || "", ids: [],
                        _min: utils.horaAMinutos(h.hora)
                    };
                }
                map[key].ids.push(h.id);
                if (h.tipo === "clase" && h.dia) {
                    map[key][h.dia] = {
                        id: h.id,
                        materia: h.materiaId || "",
                        profesor: h.profesorId || ""
                    };
                }
            });
            return Object.values(map).sort((a, b) => a._min - b._min);
        }
    },

    methods: {
        /* ---------- Helpers ---------- */
        mediaUrl(pathOrUrl) { return data.mediaUrl(sb, pathOrUrl); },
        horaAMinutos(s) { return utils.horaAMinutos(s); },
        materiaNombre(id) {
            const m = this.materias.find(x => x.id === id);
            return m ? m.nombre : id;
        },
        findProfesor(id) { return this.profesores.find(p => p.id === id); },

        /* ---------- Snackbar ---------- */
        showSnackbar(message, type = "success") {
            this.snackbar = { visible: true, message, type };
            clearTimeout(this._snackT);
            this._snackT = setTimeout(() => { this.snackbar.visible = false; }, 2600);
        },

        /* ---------- Permisos ---------- */
        canEditThisCourse(courseId) {
            if (this.isAdmin) return true;
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            if (!me) return false;
            if (!me.cargo || !me.cargo.trim()) return false;
            return me.curso === courseId;
        },
        canEditStudent(student) {
            return this.canEditThisCourse(student.curso);
        },

        /* ---------- Load data ---------- */
        async loadAllData() {
            if (!this.supabaseReady) return;
            try {
                const core = await data.loadCoreData(sb);
                this.cursos = core.cursos;
                this.estudiantes = core.estudiantes;
                this.profesores = core.profesores;
                this.materias = core.materias;
                this.horarios = core.horarios;         // flat, camelCase
                this.galeriaLocal = core.galeria;

                if (this.currentUser) {
                    const me = this.estudiantes.find(e => e.id === this.currentUser.id);
                    if (me) this.currentUserIsAdmin = !!me.isAdmin;
                }
            } catch (err) {
                console.error("[Admin] Error loading:", err);
                this.showSnackbar("Error loading data", "error");
            }
        },

        /* ---------- Navegación ---------- */
        goTo(section) {
            this.currentSection = section;
            if (section === "students" || section === "schedules" || section === "gallery") {
                if (!this.selectedCourse && this.cursosDisponibles.length > 0) {
                    if (!this.isAdmin && this.currentUser) {
                        const me = this.estudiantes.find(e => e.id === this.currentUser.id);
                        if (me) { this.selectedCourse = me.curso; return; }
                    }
                    this.selectedCourse = this.cursosDisponibles[0].id;
                }
            }
        },
        selectCourse(id) {
            this.selectedCourse = id;
            this.drawerOpen = false;
        },

        /* ---------- CURSOS ---------- */
        async saveCurso(c) {
            try {
                const { error } = await sb.from("cursos").update({
                    nombre: c.nombre, disabled: c.disabled, orden: c.orden
                }).eq("id", c.id);
                if (error) throw error;
                this.showSnackbar("Course saved");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error saving course", "error");
            }
        },
        async deleteCurso(c) {
            if (!confirm(`Delete course "${c.nombre}"?`)) return;
            try {
                const { error } = await sb.from("cursos").delete().eq("id", c.id);
                if (error) throw error;
                this.cursos = this.cursos.filter(x => x.id !== c.id);
                this.showSnackbar("Course deleted");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error deleting course", "error");
            }
        },
        async openAddCourse() {
            const nombre = prompt("Course name (e.g. 11A):");
            if (!nombre || !nombre.trim()) return;
            const id = utils.normalize(nombre);
            if (this.cursos.some(c => c.id === id)) { alert("That course already exists."); return; }
            try {
                const { error } = await sb.from("cursos").insert({
                    id, nombre: nombre.trim(), disabled: false, orden: this.cursos.length
                });
                if (error) throw error;
                await this.loadAllData();
                this.showSnackbar("Course added");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error adding course", "error");
            }
        },

        /* ---------- ESTUDIANTES ---------- */
        async saveStudent(s) {
            try {
                const { error } = await sb.from("estudiantes").update({
                    nombre: s.nombre, curso: s.curso, cargo: s.cargo,
                    nivel_ingles: s.nivelIngles, fecha_nacimiento: s.fechaNacimiento,
                    has_store: !!s.hasStore
                }).eq("id", s.id);
                if (error) throw error;
                this.showSnackbar("Student saved");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error saving student", "error");
            }
        },
        async deleteStudent(s) {
            if (!confirm(`Delete "${s.nombre}"?`)) return;
            try {
                const { error } = await sb.from("estudiantes").delete().eq("id", s.id);
                if (error) throw error;
                this.estudiantes = this.estudiantes.filter(x => x.id !== s.id);
                this.showSnackbar("Student deleted");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error deleting student", "error");
            }
        },
        async openAddStudent() {
            const course = this.selectedCourse || (this.cursosDisponibles[0] && this.cursosDisponibles[0].id);
            if (!course) { alert("Pick a course first."); return; }
            const nombre = prompt(`Student full name (adds to ${course}):`);
            if (!nombre || !nombre.trim()) return;
            try {
                const { error } = await sb.from("estudiantes").insert({
                    nombre: nombre.trim(), curso: course,
                    cargo: "", nivel_ingles: "", fecha_nacimiento: ""
                });
                if (error) throw error;
                await this.loadAllData();
                this.showSnackbar("Student added");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error adding student", "error");
            }
        },
        async uploadStudentPhoto(s, event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            if (!this.canEditStudent(s)) return;
            try {
                const path = `estudiantes/${s.id}_${Date.now()}_${utils.safePath(file.name)}`;
                const { error: upErr } = await sb.storage.from(config.BUCKETS.MEDIA).upload(path, file, { upsert: true });
                if (upErr) throw upErr;
                const { error: updErr } = await sb.from("estudiantes").update({ foto: path }).eq("id", s.id);
                if (updErr) throw updErr;
                s._fotoFailed = false;
                s.foto = data.mediaUrl(sb, path);
                this.showSnackbar("Photo updated");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error uploading photo", "error");
            }
        },

        /* ---------- PROFESORES ---------- */
        async saveProfesor(p) {
            try {
                const { error } = await sb.from("profesores").update({
                    nombre: p.nombre, tutor: p.tutor
                }).eq("id", p.id);
                if (error) throw error;
                this.showSnackbar("Teacher saved");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error saving teacher", "error");
            }
        },
        async deleteProfesor(p) {
            if (!confirm(`Delete "${p.nombre}"?`)) return;
            try {
                const { error } = await sb.from("profesores").delete().eq("id", p.id);
                if (error) throw error;
                this.profesores = this.profesores.filter(x => x.id !== p.id);
                this.showSnackbar("Teacher deleted");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error deleting teacher", "error");
            }
        },
        async openAddTeacher() {
            const nombre = prompt("Teacher full name:");
            if (!nombre || !nombre.trim()) return;
            const id = Date.now();
            try {
                const { error } = await sb.from("profesores").insert({
                    id, nombre: nombre.trim(), tutor: "", foto: ""
                });
                if (error) throw error;
                await this.loadAllData();
                this.showSnackbar("Teacher added");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error adding teacher", "error");
            }
        },
        async uploadProfesorPhoto(p, event) {
            const file = event.target.files && event.target.files[0];
            if (!file || !this.isAdmin) return;
            try {
                const path = `profesores/${p.id}_${Date.now()}_${utils.safePath(file.name)}`;
                const { error: upErr } = await sb.storage.from(config.BUCKETS.MEDIA).upload(path, file, { upsert: true });
                if (upErr) throw upErr;
                const { error: updErr } = await sb.from("profesores").update({ foto: path }).eq("id", p.id);
                if (updErr) throw updErr;
                p._fotoFailed = false;
                p.foto = data.mediaUrl(sb, path);
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error uploading photo", "error");
            }
        },

        /* ---------- MATERIAS ---------- */
        async saveMateria(m) {
            try {
                const { error } = await sb.from("materias").update({
                    nombre: m.nombre, orden: m.orden
                }).eq("id", m.id);
                if (error) throw error;
                this.showSnackbar("Subject saved");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error saving subject", "error");
            }
        },
        async deleteMateria(m) {
            if (!confirm(`Delete subject "${m.nombre}"?`)) return;
            try {
                const { error } = await sb.from("materias").delete().eq("id", m.id);
                if (error) throw error;
                this.materias = this.materias.filter(x => x.id !== m.id);
                this.showSnackbar("Subject deleted");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error deleting subject", "error");
            }
        },
        async openAddSubject() {
            const id = prompt("Subject ID (e.g. matematicas):");
            if (!id) return;
            const cleanId = utils.normalize(id);
            const nombre = prompt("Subject name:", id) || id;
            try {
                const { error } = await sb.from("materias").insert({
                    id: cleanId, nombre: nombre.trim(), orden: this.materias.length
                });
                if (error) throw error;
                await this.loadAllData();
                this.showSnackbar("Subject added");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error adding subject", "error");
            }
        },

        /* ---------- SCHEDULE ---------- */
        onCellClick(franja, day) {
            if (!this.canEditThisCourse(this.selectedCourse)) return;
            if (franja.tipo === "recreo") return;
            const cell = franja[day];
            this.cellEditor = {
                open: true, franja, day,
                materia: cell ? cell.materia : "",
                profesor: cell ? cell.profesor : ""
            };
        },
        closeCellEditor() { this.cellEditor.open = false; },
        async saveCellEditor() {
            const f = this.cellEditor.franja;
            const day = this.cellEditor.day;
            const materia = this.cellEditor.materia;
            const profesor = this.cellEditor.profesor;
            const existing = f[day];
            try {
                if (!materia) {
                    if (existing && existing.id) {
                        const { error } = await sb.from("horarios").delete().eq("id", existing.id);
                        if (error) throw error;
                        f[day] = null;
                        this.horarios = this.horarios.filter(h => h.id !== existing.id);
                    }
                } else if (existing && existing.id) {
                    const { error } = await sb.from("horarios").update({
                        materia_id: materia, profesor_id: profesor
                    }).eq("id", existing.id);
                    if (error) throw error;
                    existing.materia = materia;
                    existing.profesor = profesor;
                } else {
                    const { data: row, error } = await sb.from("horarios").insert({
                        curso: this.selectedCourse, hora: f.hora, tipo: "clase",
                        dia: day, materia_id: materia, profesor_id: profesor, orden: 0
                    }).select().single();
                    if (error) throw error;
                    this.horarios.push(data.mapHorario(row));
                    f[day] = { id: row.id, materia, profesor };
                }
                this.closeCellEditor();
                this.showSnackbar("Cell saved");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error saving cell", "error");
            }
        },
        async updateFranjaHora(franja, event) {
            const newHora = event.target.value;
            try {
                for (const id of franja.ids) {
                    const { error } = await sb.from("horarios").update({ hora: newHora }).eq("id", id);
                    if (error) throw error;
                }
                this.horarios.forEach(h => { if (franja.ids.includes(h.id)) h.hora = newHora; });
                franja.horaKey = newHora;
                franja._min = utils.horaAMinutos(newHora);
                this.showSnackbar("Time updated");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error updating time", "error");
            }
        },
        async moveFranja(idx, delta) {
            const list = this.franjasDelCurso;
            const target = idx + delta;
            if (target < 0 || target >= list.length) return;
            const a = list[idx], b = list[target];
            const tmpHora = a.hora, tmpKey = a.horaKey;
            a.hora = b.hora; a.horaKey = b.horaKey;
            b.hora = tmpHora; b.horaKey = tmpKey;
            try {
                for (const id of a.ids) await sb.from("horarios").update({ hora: a.hora }).eq("id", id);
                for (const id of b.ids) await sb.from("horarios").update({ hora: b.hora }).eq("id", id);
                this.showSnackbar("Reordered");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error reordering", "error");
            }
        },
        async addFranja() {
            const nueva = prompt("New time slot (e.g. 14:00 - 14:40):");
            if (!nueva) return;
            try {
                const { data: row, error } = await sb.from("horarios").insert({
                    curso: this.selectedCourse, hora: nueva, tipo: "clase",
                    dia: "", materia_id: "", profesor_id: "", orden: 0
                }).select().single();
                if (error) throw error;
                this.horarios.push(data.mapHorario(row));
                this.showSnackbar("Slot added");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error adding slot", "error");
            }
        },
        async deleteFranja(franja) {
            if (!confirm(`Delete time slot "${franja.hora}"?`)) return;
            try {
                const { error } = await sb.from("horarios").delete().in("id", franja.ids);
                if (error) throw error;
                this.horarios = this.horarios.filter(h => !franja.ids.includes(h.id));
                this.showSnackbar("Slot deleted");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error deleting slot", "error");
            }
        },

        /* ---------- GALERÍA ---------- */
        async saveGaleriaFoto(g) {
            try {
                const { error } = await sb.from("galeria_local").update({
                    ruta: g.ruta, orden: g.orden
                }).eq("id", g.id);
                if (error) throw error;
                this.showSnackbar("Photo saved");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error saving photo", "error");
            }
        },
        async deleteGaleriaFoto(g) {
            if (!confirm("Delete this photo?")) return;
            try {
                const { error } = await sb.from("galeria_local").delete().eq("id", g.id);
                if (error) throw error;
                this.galeriaLocal = this.galeriaLocal.filter(x => x.id !== g.id);
                this.showSnackbar("Photo deleted");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error deleting photo", "error");
            }
        },
        async openAddGalleryPhoto() {
            if (!this.selectedCourse) { alert("Pick a course first."); return; }
            const url = prompt("Image URL:");
            if (!url || !url.trim()) return;
            try {
                const { error } = await sb.from("galeria_local").insert({
                    curso: this.selectedCourse, ruta: url.trim(), orden: this.galeriaLocal.length
                });
                if (error) throw error;
                await this.loadAllData();
                this.showSnackbar("Photo added");
            } catch (err) {
                console.error(err);
                this.showSnackbar("Error adding photo", "error");
            }
        },

        /* ---------- Logout ---------- */
        signOut() { auth.signOut(); },

        /* ---------- Init ---------- */
        async init() {
            const saved = auth.getSession();
            if (!saved) { loginCtrl.show(); return; }
            this.currentUser = saved;

            await this.loadAllData();

            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            if (!me || (!me.isAdmin && (!me.cargo || !me.cargo.trim()))) {
                alert("You don't have permission to access the admin panel.");
                window.location.href = "index.html";
                return;
            }
            this.currentUserIsAdmin = !!me.isAdmin;

            if (this.cursosDisponibles.length > 0) {
                this.selectedCourse = this.cursosDisponibles[0].id;
            }

            loginCtrl.hide();
            this.goTo("courses");
        }
    },

    mounted() {
        this.init();

        document.addEventListener("click", (e) => {
            if (this.sectionSwitcherOpen && !e.target.closest(".fs-section-switcher")) {
                this.sectionSwitcherOpen = false;
            }
        });

        loginCtrl.elements.submitBtn.addEventListener("click", async () => {
            await this.loadAllData();
            const match = auth.findStudentByCredentials(
                this.estudiantes,
                loginCtrl.elements.userInput.value,
                loginCtrl.elements.passInput.value
            );
            if (!match) {
                loginCtrl.elements.errorMsg.style.display = "block";
                return;
            }
            if (!match.isAdmin && (!match.cargo || !match.cargo.trim())) {
                loginCtrl.elements.errorMsg.textContent = "You don't have admin permissions.";
                loginCtrl.elements.errorMsg.style.display = "block";
                return;
            }
            this.currentUser = { id: match.id, nombre: utils.shortName(match.nombre) };
            this.currentUserIsAdmin = !!match.isAdmin;

            const remember = document.getElementById("loginRemember");
            auth.saveSession(this.currentUser, remember && remember.checked);

            loginCtrl.elements.errorMsg.style.display = "none";
            loginCtrl.hide();
            if (this.cursosDisponibles.length > 0) {
                this.selectedCourse = this.cursosDisponibles[0].id;
            }
            this.goTo("courses");
        });
        loginCtrl.elements.passInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginCtrl.elements.submitBtn.click();
        });
    }
}).mount("#adminApp");