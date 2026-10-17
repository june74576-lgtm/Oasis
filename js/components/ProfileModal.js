/* ============================================================
   Oasis · ProfileModal
   ============================================================ */

window.Oasis = window.Oasis || {};
window.Oasis.components = window.Oasis.components || {};

window.Oasis.components.ProfileModal = {
    name: "ProfileModal",

    props: {
        open:     { type: Boolean, default: false },
        student:  { type: Object,  default: null },
        editable: { type: Boolean, default: false }
    },

    emits: ["close", "saved"],

    data() {
        return {
            socials: { instagram: "", tiktok: "", whatsapp: "", spotify: "" },
            uploading: false,
            saving: false,
            zoomOpen: false,
            zoomSrc: "",
            courses: [],
            files: [],
            filesLoading: false,
            uploadingFile: false,
            dragOver: false
        };
    },

    computed: {
        socialList() {
            return [
                {
                    key: "instagram",
                    placeholder: "Instagram username",
                    svg: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'
                },
                {
                    key: "tiktok",
                    placeholder: "TikTok username",
                    svg: '<path d="M16 3.5a5 5 0 0 1-4 4.5v3h3a1 1 0 0 1 0 2h-3v6a1 1 0 0 1-2 0v-6H7a1 1 0 0 1 0-2h3v-3a1 1 0 0 1 1-1 3 3 0 0 0 3-3.5Z"/>'
                },
                {
                    key: "whatsapp",
                    placeholder: "+593 98 000 0000",
                    svg: '<path d="M21 11.5a8.5 8.5 0 1 1-3.5-6.8L21 4l-1.5 3.5A8.5 8.5 0 0 1 21 11.5Z"/><path d="M8 10h.01M16 10h.01M9 14c1 1 5 1 6 0"/>'
                },
                {
                    key: "spotify",
                    placeholder: "Spotify username",
                    svg: '<circle cx="12" cy="12" r="10"/><path d="M7 15c2-1 3-2 3-3M14 6c1.5.5 3 2 4 4M6 10c1-2 3-3 5-4"/>'
                }
            ];
        },
        /* En vista solo mostramos cuentas con valor; en edición mostramos todas */
        visibleSocials() {
            if (this.editable) return this.socialList;
            return this.socialList.filter(s => {
                const v = this.socials[s.key];
                return v && String(v).trim();
            });
        },
        courseName() {
            if (!this.student || !this.student.curso) return "";
            const c = this.courses.find(x => x.id === this.student.curso);
            return c ? c.nombre : this.student.curso;
        }
    },

    watch: {
        student: {
            immediate: true,
            handler(s) {
                if (!s) { this.files = []; return; }
                this.socials = {
                    instagram: s.instagram || "",
                    tiktok:    s.tiktok    || "",
                    whatsapp:  s.whatsapp  || "",
                    spotify:   s.spotify   || ""
                };
                this.loadFiles();
            }
        }
    },

    async mounted() {
        await this.loadCourses();
    },

    methods: {
        async loadCourses() {
            const sb = window.supabaseClient;
            if (!sb || typeof sb.from !== "function") return;
            try {
                const { data, error } = await sb.from("cursos").select("*");
                if (error) throw error;
                this.courses = data || [];
            } catch (err) {
                console.warn("[ProfileModal] No pude cargar cursos:", err);
            }
        },

        async loadFiles() {
            const sb = window.supabaseClient;
            if (!sb || !this.student) { this.files = []; return; }
            this.filesLoading = true;
            try {
                this.files = await window.Oasis.data.loadProfileFiles(sb, this.student.id);
            } catch (err) {
                console.warn("[ProfileModal] No pude cargar archivos:", err);
                this.files = [];
            } finally {
                this.filesLoading = false;
            }
        },

        triggerFileUpload() {
            if (!this.editable || this.uploadingFile) return;
            this.$refs.fileInput.click();
        },

        async uploadFile(e) {
            const files = e.target.files;
            if (!files || !files.length) return;
            await this.uploadFiles(Array.from(files));
            e.target.value = "";
        },

        async uploadFiles(fileArray) {
            if (!this.editable || !this.student || this.uploadingFile) return;
            const sb = window.supabaseClient;
            if (!sb) return;
            const { utils, config } = window.Oasis;

            const MAX = config.MAX_FILE_SIZE || 50 * 1024 * 1024;
            const valid = fileArray.filter(f => f.size <= MAX);
            if (valid.length < fileArray.length) {
                alert("Algunos archivos superan el tamaño máximo (50 MB) y no se subirán.");
            }
            if (!valid.length) return;

            this.uploadingFile = true;
            try {
                for (const file of valid) {
                    const path = `profiles/${this.student.id}/${Date.now()}_${utils.safePath(file.name)}`;
                    const { error: upErr } = await sb.storage.from(config.BUCKETS.ARCHIVOS).upload(path, file);
                    if (upErr) { console.error(upErr); continue; }
                    const { error: insErr } = await sb.from("profile_archivos").insert({
                        estudiante_id: this.student.id,
                        nombre: file.name,
                        storage_path: path
                    });
                    if (insErr) {
                        await sb.storage.from(config.BUCKETS.ARCHIVOS).remove([path]);
                        console.error(insErr);
                    }
                }
                await this.loadFiles();
            } finally {
                this.uploadingFile = false;
            }
        },

        /* ---------- Drag & drop ---------- */

        onDragOver(e) {
            if (!this.editable || this.uploadingFile) return;
            this.dragOver = true;
        },

        onDragLeave(e) {
            if (e && e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
            this.dragOver = false;
        },

        async onDropFiles(e) {
            this.dragOver = false;
            if (!this.editable || this.uploadingFile) return;
            const files = e.dataTransfer && e.dataTransfer.files;
            if (!files || !files.length) return;
            await this.uploadFiles(Array.from(files));
        },

        async deleteFile(f) {
            if (!confirm(`¿Borrar "${f.nombre}"?`)) return;
            const sb = window.supabaseClient;
            if (!sb) return;
            const { config } = window.Oasis;
            try {
                await sb.storage.from(config.BUCKETS.ARCHIVOS).remove([f.storagePath]);
                const { error } = await sb.from("profile_archivos").delete().eq("id", f.id);
                if (error) throw error;
                await this.loadFiles();
            } catch (err) {
                console.error(err);
                alert("No se pudo borrar el archivo");
            }
        },

        close() { this.$emit("close"); },

        triggerPhotoUpload() {
            if (!this.editable || this.uploading) return;
            this.$refs.photoInput.click();
        },

        async uploadPhoto(e) {
            const file = e.target.files && e.target.files[0];
            if (!file || !this.editable) return;
            const sb = window.supabaseClient;
            const { utils, data, config } = window.Oasis;
            this.uploading = true;
            try {
                const path = `estudiantes/${this.student.id}_${Date.now()}_${utils.safePath(file.name)}`;
                const { error: upErr } = await sb.storage.from(config.BUCKETS.MEDIA).upload(path, file, { upsert: true });
                if (upErr) throw upErr;
                const { error: updErr } = await sb.from("estudiantes").update({ foto: path }).eq("id", this.student.id);
                if (updErr) throw updErr;
                const url = data.mediaUrl(sb, path);
                this.$emit("saved", { foto: url });
            } catch (err) {
                console.error(err);
                alert("No se pudo subir la foto");
            } finally {
                this.uploading = false;
                e.target.value = "";
            }
        },

        async save() {
            if (!this.editable || this.saving) return;
            const sb = window.supabaseClient;
            this.saving = true;
            try {
                const { error } = await sb.from("estudiantes").update({
                    instagram: this.socials.instagram,
                    tiktok:    this.socials.tiktok,
                    whatsapp:  this.socials.whatsapp,
                    spotify:   this.socials.spotify
                }).eq("id", this.student.id);
                if (error) throw error;
                this.$emit("saved", { socials: { ...this.socials } });
                this.close();
            } catch (err) {
                console.error(err);
                alert("No se pudo guardar el perfil");
            } finally {
                this.saving = false;
            }
        },

        socialHref(key) {
            const v = (this.socials[key] || "").trim().replace(/^@/, "");
            if (!v) return "#";
            switch (key) {
                case "instagram": return `https://instagram.com/${v}`;
                case "tiktok":    return `https://tiktok.com/@${v}`;
                case "whatsapp":  return `https://wa.me/${v.replace(/\D/g, "")}`;
                case "spotify":   return `https://open.spotify.com/user/${v}`;
                default:          return "#";
            }
        },

        handlePhotoClick() {
            if (this.uploading) return;
            if (this.editable) { this.triggerPhotoUpload(); return; }
            if (this.student && this.student.foto) {
                this.zoomSrc = this.student.foto;
                this.zoomOpen = true;
            }
        }
    },

    template: `
        <div class="profile-overlay" :class="{ active: open }" @click.self="close">
            <div class="profile-modal" v-if="student">
                <button class="profile-modal-close" @click="close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
                </button>

                <div class="profile-modal-head">
                    <div class="profile-modal-photo"
                        :class="{ editable: editable, uploading: uploading, 'can-zoom': !editable && student.foto }"
                        @click="handlePhotoClick">
                        <img v-if="student.foto" :src="student.foto" alt="">
                        <div v-else class="no-photo"></div>
                        <svg v-if="editable && !uploading" class="profile-modal-camera" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span v-if="uploading" class="profile-modal-uploading">Subiendo…</span>
                    </div>
                    <div class="profile-modal-info">
                        <h2 class="profile-modal-name">{{ student.nombre }}</h2>
                        <p class="profile-modal-course">{{ courseName }}</p>
                    </div>
                    <input type="file" ref="photoInput" accept="image/*" hidden @change="uploadPhoto">
                </div>

                <div class="profile-modal-body">

                    <!-- SOCIAL: en vista solo los que existen; si no hay ninguno, no se muestra -->
                    <template v-if="editable || visibleSocials.length > 0">
                        <p class="profile-section-label">Social</p>
                        <div class="profile-socials-list">
                            <div v-for="s in visibleSocials" :key="s.key"
                                 class="profile-social-item"
                                 :class="{ muted: !socials[s.key] }">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="s.svg"></svg>
                                <input v-if="editable"
                                       type="text"
                                       v-model="socials[s.key]"
                                       :placeholder="s.placeholder">
                                <a v-else
                                   :href="socialHref(s.key)"
                                   target="_blank"
                                   rel="noopener">
                                    {{ socials[s.key] }}
                                </a>
                            </div>
                        </div>
                    </template>

                    <!-- PASSWORD placeholder (solo edición) -->
                    <template v-if="editable">
                        <p class="profile-section-label" style="margin-top: 24px;">Password</p>
                        <div class="profile-social-item muted">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                            <span>Disponible tras migrar a OAuth</span>
                        </div>
                    </template>

                    <!-- FILES: en vista solo si hay; en edición siempre (subir/borrar + drag & drop) -->
                    <template v-if="editable || files.length > 0">
                        <div class="profile-files-dropzone"
                            :class="{ dragging: dragOver && editable }"
                            @dragenter.prevent="onDragOver"
                            @dragover.prevent="onDragOver"
                            @dragleave.prevent="onDragLeave"
                            @drop.prevent="onDropFiles">
                            <p class="profile-section-label">Files</p>
                            <div class="profile-files-list">
                                <div v-for="f in files" :key="f.id" class="profile-file-item">
                                    <svg class="profile-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/>
                                        <path d="M14 3.5V8h4"/>
                                    </svg>
                                    <a class="profile-file-name" :href="f.url" target="_blank" rel="noopener" :title="f.nombre">{{ f.nombre }}</a>
                                    <button v-if="editable" class="profile-file-delete" @click="deleteFile(f)" aria-label="Delete file">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
                                    </button>
                                </div>
                                <p v-if="filesLoading" class="profile-files-empty">Cargando…</p>
                                <p v-else-if="editable && files.length === 0" class="profile-files-empty">
                                    Sin archivos todavía — arrastrá o usá el botón
                                </p>
                            </div>
                            <button v-if="editable" class="profile-file-upload" @click="triggerFileUpload" :disabled="uploadingFile">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 4v16M4 12h16"/>
                                </svg>
                                <span>{{ uploadingFile ? 'Subiendo…' : 'Agregar archivo' }}</span>
                            </button>
                            <input type="file" ref="fileInput" multiple hidden @change="uploadFile">
                        </div>
                    </template>
                </div>

                <div class="profile-modal-actions" v-if="editable">
                    <button class="profile-btn" @click="close">Cancelar</button>
                    <button class="profile-btn primary" @click="save" :disabled="saving">
                        {{ saving ? 'Guardando…' : 'Guardar' }}
                    </button>
                </div>
                <teleport to="body">
                    <div class="image-viewer" :class="{ active: zoomOpen }" @click.self="zoomOpen = false">
                        <button class="image-viewer-close" @click="zoomOpen = false" aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
                        </button>
                        <img :src="zoomSrc" alt="">
                    </div>
                </teleport>
            </div>
        </div>
    `
};