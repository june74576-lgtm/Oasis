/* ============================================================
   Oasis · Store (feed público)
   ============================================================ */

const { createApp } = Vue;
const { utils, auth, data, components } = window.Oasis;
const sb = window.supabaseClient;

const storeRoot = document.getElementById("storeApp");
const loginCtrl = auth.createLoginController(storeRoot);

createApp({

    components: {
        ProfileModal: components.ProfileModal,
        MyStoreModal: components.MyStoreModal
    },

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
            profileEditable: false,
            myStoreOpen: false,
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
        openImageViewer(src) { this.imageViewerSrc = src; this.imageViewerOpen = true; },
        closeImageViewer() { this.imageViewerOpen = false; this.imageViewerSrc = ""; },

        toggleUserMenu() {
            this.userMenuOpen = !this.userMenuOpen;
            this.sectionSwitcherOpen = false;
        },
        openProfile(studentId = null, editable = false) {
            if (!this.currentUser) return;
            const targetId = studentId || this.currentUser.id;
            const target = this.estudiantes.find(e => e.id === targetId);
            if (!target) return;
            this.profileStudent = target;
            this.profileEditable = editable && target.id === this.currentUser.id;
            this.profileOpen = true;
        },
        closeProfile() {
            this.profileOpen = false;
            this.profileStudent = null;
            this.profileEditable = false;
        },
        onProfileSaved(payload) {
            if (!this.profileStudent) return;
            if (payload.foto) {
                this.profileStudent.foto = payload.foto;
                // Refrescar en la lista global
                const idx = this.estudiantes.findIndex(e => e.id === this.profileStudent.id);
                if (idx !== -1) this.estudiantes[idx].foto = payload.foto;
            }
            if (payload.socials) {
                Object.assign(this.profileStudent, payload.socials);
                const idx = this.estudiantes.findIndex(e => e.id === this.profileStudent.id);
                if (idx !== -1) Object.assign(this.estudiantes[idx], payload.socials);
            }
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