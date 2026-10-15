/* ============================================================
   Oasis · Store (feed público)
   ============================================================ */

const { createApp } = Vue;

const loginScreen = document.getElementById("loginScreen");
const loginUserInput = document.getElementById("loginUserInput");
const loginPassInput = document.getElementById("loginPassInput");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const storeRoot = document.getElementById("storeApp");

window.__storeShowLogin = function () {
    storeRoot.classList.add("hidden-app");
    loginScreen.classList.remove("hidden");
    loginUserInput.value = "";
    loginPassInput.value = "";
    loginErrorMsg.style.display = "none";
    setTimeout(() => loginUserInput.focus(), 100);
};
window.__storeHideLogin = function () {
    loginScreen.classList.add("hidden");
    storeRoot.classList.remove("hidden-app");
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

createApp({
    data() {
        return {
            currentUser: null,
            currentUserIsAdmin: false,
            estudiantes: [],
            stores: [],
            loading: true,
            modalOpen: false,
            selectedStore: null,
            storePhotos: [],
            imageViewerOpen: false,
            imageViewerSrc: "",
            sectionSwitcherOpen: false,
            userMenuOpen: false,
            userMenuOpen: false,
            profileOpen: false,
            profileStudent: null,
            profileSocials: { instagram: "", tiktok: "", whatsapp: "", spotify: "" },
            OWNER_ID: 11
        };
    },
    computed: {
        supabaseReady() {
            return typeof supabaseClient !== "undefined" && supabaseClient && typeof supabaseClient.from === "function";
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
        }
    },
    methods: {
        mediaUrl(pathOrUrl) {
            if (!pathOrUrl) return "";
            if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
            if (!this.supabaseReady) return "";
            const { data } = supabaseClient.storage.from("media").getPublicUrl(pathOrUrl);
            return data.publicUrl;
        },
        storePhotoUrl(pathOrUrl) {
            if (!pathOrUrl) return "";
            if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
            if (!this.supabaseReady) return "";
            const { data } = supabaseClient.storage.from("stores").getPublicUrl(pathOrUrl);
            return data.publicUrl;
        },
        studentFoto(id) {
            const s = this.estudiantes.find(e => e.id === id);
            return s && s.foto ? this.mediaUrl(s.foto) : "";
        },
        studentName(id) {
            const s = this.estudiantes.find(e => e.id === id);
            return s ? shortName(s.nombre) : "Unknown";
        },
        goToAdmin() { window.location.href = "admin.html"; },
        goToMyStore() { window.location.href = "my-store.html"; },
        openImageViewer(src) { this.imageViewerSrc = src; this.imageViewerOpen = true; },
        closeImageViewer() { this.imageViewerOpen = false; this.imageViewerSrc = ""; },

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

        async openStore(s) {
            this.selectedStore = s;
            this.modalOpen = true;
            this.storePhotos = [];
            if (!this.supabaseReady) return;
            const { data } = await supabaseClient.from("store_photos").select("*")
                .eq("store_id", s.id).order("orden", { ascending: true });
            this.storePhotos = (data || []).map(p => ({
                id: p.id,
                url: this.storePhotoUrl(p.storage_path)
            }));
        },
        closeStore() {
            this.modalOpen = false;
            this.selectedStore = null;
            this.storePhotos = [];
        },

        async loadData() {
            if (!this.supabaseReady) { this.loading = false; return; }

            const [est, st] = await Promise.all([
                supabaseClient.from("estudiantes").select("*"),
                supabaseClient.from("stores").select("*").eq("enabled", true).order("created_at", { ascending: false })
            ]);
            if (est.data) this.estudiantes = est.data;
            if (st.data) {
                this.stores = st.data.map(s => ({
                    ...s,
                    card_image: this.storePhotoUrl(s.card_image)
                }));
            }
            this.loading = false;
        },

        async init() {
            const saved = sessionStorage.getItem("oasis_session") || localStorage.getItem("oasis_session");
            if (saved) {
                try { this.currentUser = JSON.parse(saved); } catch {}
            }
            if (!this.currentUser) { window.__storeShowLogin(); return; }

            await this.loadData();
            window.__storeHideLogin();
        }
    },
    mounted() {
        this.init();
        document.addEventListener("click", (e) => {
            if (this.sectionSwitcherOpen && !e.target.closest(".fs-section-switcher")) {
                this.sectionSwitcherOpen = false;
            }
            if (this.userMenuOpen && !e.target.closest(".store-user")) {
                this.userMenuOpen = false;
            }
        });
        loginSubmitBtn.addEventListener("click", async () => {
            if (this.estudiantes.length === 0) {
                const { data } = await supabaseClient.from("estudiantes").select("*");
                this.estudiantes = data || [];
            }
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
            await this.loadData();
            window.__storeHideLogin();
        });
        loginPassInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginSubmitBtn.click();
        });
    }
}).mount("#storeApp");