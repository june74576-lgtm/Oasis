/* ============================================================
   Oasis · My Store (edición)
   ============================================================ */

const { createApp } = Vue;
const { utils, auth, data, config } = window.Oasis;
const sb = window.supabaseClient;

const root = document.getElementById("myStoreApp");
const loginCtrl = auth.createLoginController(root);

createApp({
    data() {
        return {
            currentUser: null,
            estudiantes: [],
            storeId: null,
            nombre: "",
            descripcion: "",
            cardImagePath: "",
            enabled: true,
            photos: [],
            loading: true,
            sectionSwitcherOpen: false
        };
    },
    computed: {
        supabaseReady() {
            return !!sb && typeof sb.from === "function";
        },
        cardImageUrl() {
            if (!this.cardImagePath) return "";
            return data.storePhotoUrl(sb, this.cardImagePath);
        },
        canAccessAdmin() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            if (!me) return false;
            return !!(me.isAdmin || (me.cargo && me.cargo.trim()));
        }
    },
    methods: {
        async init() {
            const saved = auth.getSession();
            if (!saved) { loginCtrl.show(); return; }
            this.currentUser = saved;

            await this.loadAll();
            if (!this.hasAccess()) {
                alert("You don't have a store enabled. Ask the admin.");
                window.location.href = "index.html";
                return;
            }

            await this.loadOrCreateStore();
            loginCtrl.hide();
        },

        hasAccess() {
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return !!(me && (me.hasStore || me.isAdmin));
        },

        async loadAll() {
            try {
                this.estudiantes = await data.loadEstudiantes(sb);
            } catch (err) {
                console.error("[MyStore] Error loading estudiantes:", err);
                this.estudiantes = [];
            }
        },

        async loadOrCreateStore() {
            this.loading = true;
            try {
                let store = await data.loadUserStore(sb, this.currentUser.id);

                if (!store) {
                    const { data: created, error } = await sb.from("stores").insert({
                        owner_id: this.currentUser.id,
                        nombre: `${this.currentUser.nombre}'s store`,
                        descripcion: "",
                        card_image: "",
                        enabled: true
                    }).select().single();
                    if (error) throw error;
                    store = data.mapStore(sb, created);
                }

                this.storeId = store.id;
                this.nombre = store.nombre || "";
                this.descripcion = store.descripcion || "";
                this.cardImagePath = store.cardImagePath || "";
                this.enabled = !!store.enabled;

                await this.loadPhotos();
            } catch (err) {
                console.error("[MyStore] Error loading store:", err);
            } finally {
                this.loading = false;
            }
        },

        async loadPhotos() {
            try {
                this.photos = await data.loadStorePhotos(sb, this.storeId);
            } catch (err) {
                console.error("[MyStore] Error loading photos:", err);
                this.photos = [];
            }
        },

        async saveStore() {
            if (!this.storeId) return;
            const { error } = await sb.from("stores").update({
                nombre: this.nombre,
                descripcion: this.descripcion,
                card_image: this.cardImagePath,
                enabled: this.enabled
            }).eq("id", this.storeId);
            if (error) { console.error(error); return; }
            this.$el.dispatchEvent(new CustomEvent("show-saved"));
        },

        async toggleEnabled() {
            this.enabled = !this.enabled;
            await this.saveStore();
        },

        triggerCardImage() { this.$refs.cardImageInput.click(); },
        triggerPhotoUpload() { this.$refs.photoInput.click(); },

        async uploadCardImage(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const path = `card_${this.storeId}_${Date.now()}_${utils.safePath(file.name)}`;
            const { error } = await sb.storage.from(config.BUCKETS.STORES).upload(path, file, { upsert: true });
            if (error) { console.error(error); return; }
            this.cardImagePath = path;
            await this.saveStore();
            e.target.value = "";
        },

        async uploadPhotos(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            for (const file of Array.from(files)) {
                const path = `store_${this.storeId}/${Date.now()}_${utils.safePath(file.name)}`;
                const { error: upErr } = await sb.storage.from(config.BUCKETS.STORES).upload(path, file);
                if (upErr) { console.error(upErr); continue; }
                await sb.from("store_photos").insert({
                    store_id: this.storeId,
                    storage_path: path,
                    orden: this.photos.length
                });
            }
            await this.loadPhotos();
            e.target.value = "";
        },

        async deletePhoto(p) {
            if (!confirm("Delete this photo?")) return;
            await sb.storage.from(config.BUCKETS.STORES).remove([p.path]);
            await sb.from("store_photos").delete().eq("id", p.id);
            await this.loadPhotos();
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
            await this.loadAll();
            const match = auth.findStudentByCredentials(
                this.estudiantes,
                loginCtrl.elements.userInput.value,
                loginCtrl.elements.passInput.value
            );
            if (!match) {
                loginCtrl.elements.errorMsg.style.display = "block";
                return;
            }
            this.currentUser = { id: match.id, nombre: utils.shortName(match.nombre) };

            const remember = document.getElementById("loginRemember");
            auth.saveSession(this.currentUser, remember && remember.checked);

            loginCtrl.elements.errorMsg.style.display = "none";
            await this.loadOrCreateStore();
            loginCtrl.hide();
        });
        loginCtrl.elements.passInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginCtrl.elements.submitBtn.click();
        });
    }
}).mount("#myStoreApp");