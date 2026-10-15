/* ============================================================
   Oasis · My Store (edición)
   ============================================================ */

const { createApp } = Vue;

const loginScreen = document.getElementById("loginScreen");
const loginUserInput = document.getElementById("loginUserInput");
const loginPassInput = document.getElementById("loginPassInput");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const root = document.getElementById("myStoreApp");

window.__myStoreShowLogin = function () {
    root.classList.add("hidden-app");
    loginScreen.classList.remove("hidden");
    loginUserInput.value = "";
    loginPassInput.value = "";
    loginErrorMsg.style.display = "none";
};
window.__myStoreHideLogin = function () {
    loginScreen.classList.add("hidden");
    root.classList.remove("hidden-app");
};

function normalize(str) {
    return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function shortName(full) {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 0) return "";
    const lastCount = parts.length >= 3 ? 2 : 1;
    return parts[0] + " " + (parts[parts.length - lastCount] || parts[parts.length - 1] || "");
}
function loginCredentials(student) {
    const parts = student.nombre.trim().split(/\s+/);
    const lastCount = parts.length >= 3 ? 2 : (parts.length === 2 ? 1 : 0);
    const first = parts[0] || "";
    const last = parts[parts.length - lastCount] || parts[parts.length - 1] || "";
    const day = student.fechaNacimiento ? student.fechaNacimiento.slice(8, 10) : "";
    return { username: normalize(first + last), password: normalize(last + first + day) };
}
function safePath(name) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

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
            sectionSwitcherOpen: false,
            userMenuOpen: false,
            profileOpen: false,
            profileStudent: null,
            profileSocials: { instagram: "", tiktok: "", whatsapp: "", spotify: "" },
        };
    },
    computed: {
        supabaseReady() {
            return typeof supabaseClient !== "undefined" && supabaseClient && typeof supabaseClient.from === "function";
        },
        cardImageUrl() {
            if (!this.cardImagePath) return "";
            if (/^https?:\/\//i.test(this.cardImagePath)) return this.cardImagePath;
            const { data } = supabaseClient.storage.from("stores").getPublicUrl(this.cardImagePath);
            return data.publicUrl;
        },
        canAccessAdmin() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            if (me && me.is_admin) return true;
            return this.currentUser.id === this.OWNER_ID;
        },
        currentUserPhoto() {
            if (!this.currentUser) return "";
            return this.studentFoto(this.currentUser.id);
        },
        currentUserInitial() {
            return (this.currentUser && this.currentUser.nombre ? this.currentUser.nombre[0] : "?").toUpperCase();
        },
        hasStore() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return !!(me && (me.has_store || me.is_admin));
        },
        canAccessAdmin() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return !!(me && me.is_admin);
        }
    },
    methods: {
        async init() {
            const saved = sessionStorage.getItem("oasis_session") || localStorage.getItem("oasis_session");
            if (!saved) { window.__myStoreShowLogin(); return; }
            try { this.currentUser = JSON.parse(saved); } catch { window.__myStoreShowLogin(); return; }

            await this.loadAll();
            if (!this.hasAccess()) {
                alert("You don't have a store enabled. Ask the admin.");
                window.location.href = "index.html";
                return;
            }

            await this.loadOrCreateStore();
            window.__myStoreHideLogin();
        },

        hasAccess() {
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return !!(me && (me.has_store || me.is_admin));
        },

        async loadAll() {
            const { data } = await supabaseClient.from("estudiantes").select("*");
            this.estudiantes = data || [];
        },

        async loadOrCreateStore() {
            this.loading = true;
            const { data: existing } = await supabaseClient.from("stores")
                .select("*").eq("owner_id", this.currentUser.id).maybeSingle();

            let store = existing;
            if (!store) {
                const { data: created, error } = await supabaseClient.from("stores").insert({
                    owner_id: this.currentUser.id,
                    nombre: `${this.currentUser.nombre}'s store`,
                    descripcion: "",
                    card_image: "",
                    enabled: true
                }).select().single();
                if (error) { console.error(error); this.loading = false; return; }
                store = created;
            }

            this.storeId = store.id;
            this.nombre = store.nombre || "";
            this.descripcion = store.descripcion || "";
            this.cardImagePath = store.card_image || "";
            this.enabled = !!store.enabled;

            await this.loadPhotos();
            this.loading = false;
        },

        async loadPhotos() {
            const { data } = await supabaseClient.from("store_photos")
                .select("*").eq("store_id", this.storeId).order("orden", { ascending: true });
            this.photos = (data || []).map(p => ({
                id: p.id,
                path: p.storage_path,
                url: supabaseClient.storage.from("stores").getPublicUrl(p.storage_path).data.publicUrl
            }));
        },

        async saveStore() {
            if (!this.storeId) return;
            const { error } = await supabaseClient.from("stores").update({
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
            const path = `card_${this.storeId}_${Date.now()}_${safePath(file.name)}`;
            const { error } = await supabaseClient.storage.from("stores").upload(path, file, { upsert: true });
            if (error) { console.error(error); return; }
            this.cardImagePath = path;
            await this.saveStore();
            e.target.value = "";
        },

        async uploadPhotos(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            for (const file of Array.from(files)) {
                const path = `store_${this.storeId}/${Date.now()}_${safePath(file.name)}`;
                const { error: upErr } = await supabaseClient.storage.from("stores").upload(path, file);
                if (upErr) { console.error(upErr); continue; }
                await supabaseClient.from("store_photos").insert({
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
            await supabaseClient.storage.from("stores").remove([p.path]);
            await supabaseClient.from("store_photos").delete().eq("id", p.id);
            await this.loadPhotos();
        },
        goToMyStore() { window.location.href = "my-store.html"; },

        toggleUserMenu() {
            this.userMenuOpen = !this.userMenuOpen;
            this.sectionSwitcherOpen = false;
        },

        openProfile() {
            if (!this.currentUser) return;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            if (!me) return;
            this.profileStudent = {
                id: me.id,
                nombre: me.nombre,
                foto: this.mediaUrl(me.foto),
                curso: me.curso || ""
            };
            this.profileOpen = true;
            this.userMenuOpen = false;
            try {
                const raw = localStorage.getItem("oasis_socials_" + this.currentUser.id);
                if (raw) this.profileSocials = { ...this.profileSocials, ...JSON.parse(raw) };
            } catch {}
        },
        closeProfile() { this.profileOpen = false; this.profileStudent = null; },
        saveProfile() {
            if (!this.currentUser) return;
            localStorage.setItem("oasis_socials_" + this.currentUser.id, JSON.stringify(this.profileSocials));
            this.closeProfile();
        },

        signOut() {
            sessionStorage.removeItem("oasis_session");
            localStorage.removeItem("oasis_session");
            window.location.href = "index.html";
        },
    },
    mounted() {
        this.init();
        document.addEventListener("click", (e) => {
            if (this.sectionSwitcherOpen && !e.target.closest(".fs-section-switcher")) {
                this.sectionSwitcherOpen = false;
            }
            if (this.userMenuOpen && !e.target.closest(".store-user")) {   // ← agregar
                this.userMenuOpen = false;
            }
        });
        loginSubmitBtn.addEventListener("click", async () => {
            await this.loadAll();
            const u = normalize(loginUserInput.value);
            const p = normalize(loginPassInput.value);
            const match = this.estudiantes.find(e => {
                const c = loginCredentials(e);
                return c.username === u && c.password === p;
            });
            if (!match) { loginErrorMsg.style.display = "block"; return; }
            this.currentUser = { id: match.id, nombre: shortName(match.nombre) };
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
            await this.loadOrCreateStore();
            window.__myStoreHideLogin();
        });
        loginPassInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginSubmitBtn.click();
        });
    }
}).mount("#myStoreApp");