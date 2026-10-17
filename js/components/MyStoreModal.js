/* ============================================================
   Oasis · MyStoreModal
   ------------------------------------------------------------
   Reemplaza a my-store.html. Modal flotante con todo el editor
   del emprendimiento propio.
   ============================================================ */

window.Oasis = window.Oasis || {};
window.Oasis.components = window.Oasis.components || {};

window.Oasis.components.MyStoreModal = {
    name: "MyStoreModal",

    props: {
        open:        { type: Boolean, default: false },
        currentUser: { type: Object,  default: null }
    },

    emits: ["close"],

    data() {
        return {
            storeId:       null,
            nombre:        "",
            descripcion:   "",
            cardImagePath: "",
            enabled:       true,
            photos:        [],
            loading:       true
        };
    },

    computed: {
        supabaseReady() {
            const sb = window.supabaseClient;
            return !!sb && typeof sb.from === "function";
        },
        cardImageUrl() {
            if (!this.cardImagePath) return "";
            return window.Oasis.data.storePhotoUrl(window.supabaseClient, this.cardImagePath);
        }
    },

    watch: {
        open: {
            immediate: true,
            handler(isOpen) {
                if (isOpen && this.currentUser) {
                    this.loadOrCreateStore();
                }
            }
        }
    },

    methods: {
        close() { this.$emit("close"); },
        triggerCardImage() { this.$refs.cardImageInput.click(); },
        triggerPhotoUpload() { this.$refs.photoInput.click(); },

        async loadOrCreateStore() {
            if (!this.supabaseReady) return;
            const sb = window.supabaseClient;
            const data = window.Oasis.data;
            this.loading = true;
            try {
                let store = await data.loadUserStore(sb, this.currentUser.id);
                if (!store) {
                    const { data: created, error } = await sb.from("stores").insert({
                        owner_id:    this.currentUser.id,
                        nombre:      `${this.currentUser.nombre}'s store`,
                        descripcion: "",
                        card_image:  "",
                        enabled:     true
                    }).select().single();
                    if (error) throw error;
                    store = data.mapStore(sb, created);
                }
                this.storeId       = store.id;
                this.nombre        = store.nombre || "";
                this.descripcion   = store.descripcion || "";
                this.cardImagePath = store.cardImagePath || "";
                this.enabled       = !!store.enabled;
                await this.loadPhotos();
            } catch (err) {
                console.error("[MyStoreModal] Error:", err);
            } finally {
                this.loading = false;
            }
        },

        async loadPhotos() {
            const sb = window.supabaseClient;
            try {
                this.photos = await window.Oasis.data.loadStorePhotos(sb, this.storeId);
            } catch (err) {
                console.error("[MyStoreModal] Error photos:", err);
                this.photos = [];
            }
        },

        async saveStore() {
            if (!this.storeId) return;
            const { error } = await window.supabaseClient.from("stores").update({
                nombre:      this.nombre,
                descripcion: this.descripcion,
                card_image:  this.cardImagePath,
                enabled:     this.enabled
            }).eq("id", this.storeId);
            if (error) { console.error(error); return; }
        },

        async toggleEnabled() {
            this.enabled = !this.enabled;
            await this.saveStore();
        },

        async uploadCardImage(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const sb = window.supabaseClient;
            const { utils, config } = window.Oasis;
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
            const sb = window.supabaseClient;
            const { utils, config } = window.Oasis;
            for (const file of Array.from(files)) {
                const path = `store_${this.storeId}/${Date.now()}_${utils.safePath(file.name)}`;
                const { error: upErr } = await sb.storage.from(config.BUCKETS.STORES).upload(path, file);
                if (upErr) { console.error(upErr); continue; }
                await sb.from("store_photos").insert({
                    store_id:     this.storeId,
                    storage_path: path,
                    orden:        this.photos.length
                });
            }
            await this.loadPhotos();
            e.target.value = "";
        },

        async deletePhoto(p) {
            if (!confirm("Delete this photo?")) return;
            const sb = window.supabaseClient;
            const { config } = window.Oasis;
            await sb.storage.from(config.BUCKETS.STORES).remove([p.path]);
            await sb.from("store_photos").delete().eq("id", p.id);
            await this.loadPhotos();
        }
    },

    template: `
        <div class="mini-overlay" :class="{ active: open }" @click.self="close">
            <div class="mini-modal my-store-modal">
                <button class="modal-close" @click="close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
                </button>
                <h3>My Store</h3>

                <p v-if="loading" class="my-store-loading">Loading…</p>

                <template v-else>
                    <div class="store-edit-section">
                        <label class="store-edit-label">Card image</label>
                        <div class="store-card-image-edit" @click="triggerCardImage">
                            <img v-if="cardImageUrl" :src="cardImageUrl" alt="">
                            <div v-else class="empty-hint">Click to upload a card image</div>
                        </div>
                        <input type="file" ref="cardImageInput" accept="image/*" hidden @change="uploadCardImage">
                    </div>

                    <div class="store-edit-section">
                        <label class="store-edit-label">Store name</label>
                        <input class="store-edit-input" v-model="nombre" @change="saveStore">
                    </div>

                    <div class="store-edit-section">
                        <label class="store-edit-label">Description</label>
                        <textarea class="store-edit-textarea" v-model="descripcion"
                                  placeholder="Describe your business…" @change="saveStore"></textarea>
                    </div>

                    <div class="store-edit-section">
                        <label class="store-edit-label">Photos</label>
                        <div class="store-photos-grid">
                            <div v-for="p in photos" :key="p.id" class="store-photo-item">
                                <img :src="p.url" alt="">
                                <button class="store-photo-delete" @click="deletePhoto(p)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
                                </button>
                            </div>
                            <button class="store-add-photo-btn" @click="triggerPhotoUpload">
                                <span class="material-icons">add_photo_alternate</span>
                                <span>Add photo</span>
                            </button>
                        </div>
                        <input type="file" ref="photoInput" accept="image/*" multiple hidden @change="uploadPhotos">
                    </div>

                    <div class="store-actions">
                        <button class="store-btn" @click="toggleEnabled">
                            {{ enabled ? 'Hide store' : 'Show store' }}
                        </button>
                        <button class="store-btn primary" @click="saveStore">Save</button>
                    </div>
                </template>
            </div>
        </div>
    `
};