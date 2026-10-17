/* ============================================================
   Oasis · Store (feed público)
   ============================================================ */

const { createApp } = Vue;
const { utils, auth, data } = window.Oasis;
const sb = window.supabaseClient;

const storeRoot = document.getElementById("storeApp");
const loginCtrl = auth.createLoginController(storeRoot);

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
            profileOpen: false,
            profileStudent: null,
            profileSocials: { instagram: "", tiktok: "", whatsapp: "", spotify: "" }
        };
    },
    computed: {
        supabaseReady() {
            return !!sb && typeof sb.from === "function";
        },
        canAccessAdmin() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            if (!me) return false;
            return !!(me.isAdmin || (me.cargo && me.cargo.trim()));
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
            return !!(me && (me.hasStore || me.isAdmin));
        }
    },
    methods: {
        studentFoto(id) {
            const s = this.estudiantes.find(e => e.id === id);
            return s && s.foto ? s.foto : "";
        },
        studentName(id) {
            const s = this.estudiantes.find(e => e.id === id);
            return s ? utils.shortName(s.nombre) : "Unknown";
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
                foto: me.foto,
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

        signOut() { auth.signOut(); },

        async openStore(s) {
            this.selectedStore = s;
            this.modalOpen = true;
            this.storePhotos = [];
            if (!this.supabaseReady) return;
            try {
                this.storePhotos = await data.loadStorePhotos(sb, s.id);
            } catch (err) {
                console.error("[Store] Error loading photos:", err);
            }
        },
        closeStore() {
            this.modalOpen = false;
            this.selectedStore = null;
            this.storePhotos = [];
        },

        async loadData() {
            if (!this.supabaseReady) { this.loading = false; return; }

            try {
                const [estudiantes, stores] = await Promise.all([
                    data.loadEstudiantes(sb),
                    data.loadStores(sb)
                ]);
                this.estudiantes = estudiantes;
                this.stores = stores.map(s => ({
                    id: s.id,
                    owner_id: s.ownerId,
                    nombre: s.nombre,
                    descripcion: s.descripcion,
                    card_image: s.cardImage,
                    enabled: s.enabled,
                    created_at: s.createdAt
                }));
            } catch (err) {
                console.error("[Store] Error loading:", err);
            }
            this.loading = false;
        },

        async init() {
            const saved = auth.getSession();
            if (saved) this.currentUser = saved;
            if (!this.currentUser) { loginCtrl.show(); return; }

            await this.loadData();
            loginCtrl.hide();
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
        loginCtrl.elements.submitBtn.addEventListener("click", async () => {
            if (this.estudiantes.length === 0) {
                this.estudiantes = await data.loadEstudiantes(sb);
            }
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
            await this.loadData();
            loginCtrl.hide();
        });
        loginCtrl.elements.passInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginCtrl.elements.submitBtn.click();
        });
    }
}).mount("#storeApp");