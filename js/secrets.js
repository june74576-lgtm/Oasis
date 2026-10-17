/* ============================================================
   Oasis · Secrets
   ============================================================ */

const { createApp } = Vue;
const { utils, auth, data } = window.Oasis;
const sb = window.supabaseClient;

const secretsRoot = document.getElementById("secretsApp");
const loginCtrl = auth.createLoginController(secretsRoot);

const ANON_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
        <rect width="80" height="80" fill="#3a3a42"/>
        <circle cx="40" cy="30" r="13" fill="#8f8f9c"/>
        <path d="M12 80 Q12 52 40 52 Q68 52 68 80 Z" fill="#8f8f9c"/>
    </svg>`
);

createApp({
    data() {
        return {
            currentUser: null,
            estudiantes: [],
            messages: [],
            loading: true,
            sending: false,
            texto: "",
            anonimo: false,
            ANON_AVATAR,
            userMenuOpen: false,
            profileOpen: false,
            profileStudent: null,
            profileSocials: { instagram: "", tiktok: "", whatsapp: "", spotify: "" },
            sectionSwitcherOpen: false
        };
    },
    computed: {
        supabaseReady() {
            return !!sb && typeof sb.from === "function";
        },
        currentUserPhoto() {
            if (!this.currentUser) return "";
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return (me && me.foto) || "";
        },
        currentUserInitial() {
            return (this.currentUser && this.currentUser.nombre ? this.currentUser.nombre[0] : "?").toUpperCase();
        },
        canAccessAdmin() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            if (!me) return false;
            return !!(me.isAdmin || (me.cargo && me.cargo.trim()));
        },
        messagesWithSeparators() {
            const out = [];
            let lastDay = null;
            const fmt = new Intl.DateTimeFormat("en-US", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            });
            this.messages.forEach(m => {
                const d = new Date(m.fecha);
                const dayKey = d.toDateString();
                if (dayKey !== lastDay) {
                    out.push({ type: "separator", key: "sep-" + dayKey, label: fmt.format(d) });
                    lastDay = dayKey;
                }
                out.push({ type: "message", key: "msg-" + m.id, data: m });
            });
            return out;
        },
        hasStore() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return !!(me && me.hasStore);
        }
    },
    methods: {
        studentFoto(id) {
            const s = this.estudiantes.find(e => e.id === id);
            return s && s.foto ? s.foto : "";
        },
        formatDateTime(iso) { return utils.formatDateTime(iso); },
        renderMarkdown(text) {
            let safe = utils.escapeHtml(text || "");
            if (window.marked) {
                try { safe = window.marked.parse(safe); } catch {}
            }
            if (window.DOMPurify) {
                safe = window.DOMPurify.sanitize(safe);
            }
            return safe.replace(/\n/g, "<br>");
        },
        canDelete(m) {
            if (!this.currentUser) return false;
            return m.autorId === this.currentUser.id;
        },
        async deleteMsg(m) {
            if (!confirm("Delete this secret?")) return;
            try {
                const { error } = await sb.from("secrets").delete().eq("id", m.id);
                if (error) throw error;
                this.messages = this.messages.filter(x => x.id !== m.id);
            } catch (e) {
                console.error(e);
                alert("Couldn't delete.");
            }
        },
        autoGrow(e) {
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 180) + "px";
        },
        async loadData() {
            const [estudiantes, msgs] = await Promise.all([
                data.loadEstudiantes(sb),
                data.loadSecrets(sb)
            ]);
            this.estudiantes = estudiantes;
            this.messages = msgs;              // ya viene camelCase del mapper
            this.$nextTick(() => {
                const f = this.$refs.feed;
                if (f) f.scrollTop = f.scrollHeight;
            });
            this.loading = false;
        },
        async send() {
            const txt = this.texto.trim();
            if (!txt || this.sending) return;
            if (!this.currentUser) return;
            this.sending = true;
            try {
                const { data: inserted, error } = await sb.from("secrets")
                    .insert({
                        autor_id: this.currentUser.id,
                        autor_nombre: this.currentUser.nombre,
                        anonimo: this.anonimo,
                        mensaje: txt,
                        fecha: new Date().toISOString()
                    })
                    .select()
                    .single();
                if (error) throw error;

                const uiMsg = data.mapSecret(inserted);
                if (!this.messages.some(x => x.id === uiMsg.id)) {
                    this.messages.push(uiMsg);
                }

                this.texto = "";
                this.anonimo = false;
                if (this.$refs.ta) this.$refs.ta.style.height = "auto";

                this.$nextTick(() => {
                    const f = this.$refs.feed;
                    if (f) f.scrollTop = f.scrollHeight;
                });
            } catch (e) {
                console.error(e);
                alert("Couldn't send. Check console (F12).");
            } finally {
                this.sending = false;
            }
        },
        signOut() { auth.signOut(); },
        async init() {
            if (!this.supabaseReady) { this.loading = false; return; }

            // Subscribirse SIEMPRE (aunque no haya sesión) — la RLS es abierta
            // y así los mensajes ya están en cola cuando el usuario entre.
            this.subscribeSecrets();

            const saved = auth.getSession();
            if (!saved) { loginCtrl.show(); return; }
            this.currentUser = saved;

            await this.loadData();
            loginCtrl.hide();
        },
        goToAdmin() { window.location.href = "admin.html"; },
        goToMyStore() { window.location.href = "my-store.html"; },
        openProfile() {
            this.profileStudent = this.estudiantes.find(e => e.id === this.currentUser.id) || null;
            this.profileOpen = true;
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
        toggleSwitcher() {
            this.sectionSwitcherOpen = !this.sectionSwitcherOpen;
            this.userMenuOpen = false;
        },
        toggleUserMenu() {
            this.userMenuOpen = !this.userMenuOpen;
            this.sectionSwitcherOpen = false;
        },
        /* ---------- Realtime secrets ---------- */
        subscribeSecrets() {
            this.unsubscribeSecrets();
            if (!this.supabaseReady) return;

            this._channel = sb
                .channel("secrets:all")
                .on("postgres_changes",
                    { event: "INSERT", schema: "public", table: "secrets" },
                    (payload) => {
                        const m = data.mapSecret(payload.new);
                        if (this.messages.some(x => x.id === m.id)) return;
                        this.messages.push(m);
                        this.$nextTick(() => {
                            const f = this.$refs.feed;
                            if (f) f.scrollTop = f.scrollHeight;
                        });
                    }
                )
                .on("postgres_changes",
                    { event: "DELETE", schema: "public", table: "secrets" },
                    (payload) => {
                        const id = payload.old && payload.old.id;
                        if (!id) return;
                        this.messages = this.messages.filter(x => x.id !== id);
                    }
                )
                .subscribe((status) => {
                    if (status === "SUBSCRIBED") {
                        console.log("[Secrets] Realtime conectado");
                    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                        console.warn("[Secrets] Realtime error:", status);
                    }
                });
        },

        unsubscribeSecrets() {
            if (this._channel) {
                try { sb.removeChannel(this._channel); } catch (e) { /* noop */ }
                this._channel = null;
            }
        },
    },
    mounted() {
        this.init();

        loginCtrl.elements.submitBtn.addEventListener("click", async () => {
            if (!this.supabaseReady) { this.loading = false; return; }
            if (this.estudiantes.length === 0) await this.loadData();

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
            loginCtrl.hide();
        });

        loginCtrl.elements.passInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginCtrl.elements.submitBtn.click();
        });
        document.addEventListener("click", (e) => {
            if (this.sectionSwitcherOpen && !e.target.closest(".fs-section-switcher")) {
                this.sectionSwitcherOpen = false;
            }
            if (this.userMenuOpen && !e.target.closest(".secrets-user")) {
                this.userMenuOpen = false;
            }
        });
    },
    beforeUnmount() {
        this.unsubscribeSecrets();
    },
}).mount("#secretsApp");