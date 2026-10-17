/* ============================================================
   Oasis · Secrets
   ============================================================ */

const { createApp } = Vue;
const { utils, auth, data, config, components } = window.Oasis;
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

    components: { ProfileModal: components.ProfileModal, MyStoreModal: components.MyStoreModal },

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
            profileEditable: false,
            myStoreOpen: false,
            sectionSwitcherOpen: false,
            replyTo: null,
            contextMenu: { open: false, x: 0, y: 0, message: null },
            threadOpen: false,
            threadRoot: null,
            threadMessages: [],
            threadTexto: "",
            threadReplyTo: null,
            threadSending: false,
            _threadParents: [],
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
        },
        isSuperAdmin() {
            if (!this.currentUser) return false;
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return !!(me && (me.isAdmin || me.id === config.OWNER_ID));
        },
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
            if (this.isSuperAdmin) return true;
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
            try {
                const [estudiantes, all] = await Promise.all([
                    data.loadEstudiantes(sb),
                    data.loadSecrets(sb)
                ]);
                this.estudiantes = estudiantes;
                this.messages = all.filter(m => !m.parentId);
                this._threadParents = [...new Set(all.filter(m => m.parentId).map(m => m.parentId))];
                this.$nextTick(() => {
                    const f = this.$refs.feed;
                    if (f) f.scrollTop = f.scrollHeight;
                });
            } catch (err) {
                console.error("[Secrets] Error loading:", err);
                this.estudiantes = [];
                this.messages = [];
                this._threadParents = [];
            } finally {
                this.loading = false;
            }
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
                        reply_to_id: this.replyTo ? this.replyTo.id : null,
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
                this.replyTo = null;
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
                const idx = this.estudiantes.findIndex(e => e.id === this.profileStudent.id);
                if (idx !== -1) this.estudiantes[idx].foto = payload.foto;
            }
            if (payload.socials) {
                Object.assign(this.profileStudent, payload.socials);
                const idx = this.estudiantes.findIndex(e => e.id === this.profileStudent.id);
                if (idx !== -1) Object.assign(this.estudiantes[idx], payload.socials);
            }
        },
        toggleSwitcher() {
            this.sectionSwitcherOpen = !this.sectionSwitcherOpen;
            this.userMenuOpen = false;
        },
        toggleUserMenu() {
            this.userMenuOpen = !this.userMenuOpen;
            this.sectionSwitcherOpen = false;
        },
        /* ---------- Context menu + Reply ---------- */
        openContextMenu(e, m) {
            if (e) e.preventDefault();
            if (e) e.stopPropagation();
            const x = Math.min((e && e.clientX) || 0, window.innerWidth  - 200);
            const y = Math.min((e && e.clientY) || 0, window.innerHeight - 160);
            this.contextMenu = { open: true, x, y, message: m };
        },
        closeContextMenu() {
            this.contextMenu.open = false;
        },
        startReply(m) {
            this.replyTo = m;
            this.closeContextMenu();
            this.$nextTick(() => {
                if (this.$refs.ta) this.$refs.ta.focus();
            });
        },
        cancelReply() {
            this.replyTo = null;
        },
        findMessageById(id) {
            return this.messages.find(x => x.id === id) || null;
        },
        /* ---------- Threads ---------- */
        hasThreadForMessage(m) {
            if (!m) return false;
            return this._threadParents.includes(m.id);
        },
        openThread(m) {
            this.threadRoot = m;
            this.threadMessages = [];
            this.threadTexto = "";
            this.threadReplyTo = null;
            this.threadOpen = true;
            this.closeContextMenu();
            this.loadThreadMessages();
        },
        closeThread() {
            this.threadOpen = false;
            this.threadRoot = null;
            this.threadMessages = [];
            this.threadTexto = "";
            this.threadReplyTo = null;
        },
        async loadThreadMessages() {
            if (!this.supabaseReady || !this.threadRoot) return;
            try {
                const { data: rows, error } = await sb.from("secrets")
                    .select("*")
                    .eq("parent_id", this.threadRoot.id)
                    .order("fecha", { ascending: true });
                if (error) throw error;
                this.threadMessages = (rows || []).map(data.mapSecret);
                this.$nextTick(() => {
                    const f = this.$refs.threadFeed;
                    if (f) f.scrollTop = f.scrollHeight;
                });
            } catch (err) {
                console.error("[Thread] Error:", err);
                this.threadMessages = [];
            }
        },
        startThreadReply(m) {
            this.threadReplyTo = m;
        },
        cancelThreadReply() {
            this.threadReplyTo = null;
        },
        findThreadMessageById(id) {
            return this.threadMessages.find(x => x.id === id) || null;
        },
        async sendThreadMessage() {
            if (!this.threadRoot || !this.currentUser) return;
            const txt = this.threadTexto.trim();
            if (!txt || this.threadSending) return;
            this.threadSending = true;
            try {
                const { data: inserted, error } = await sb.from("secrets")
                    .insert({
                        autor_id:     this.currentUser.id,
                        autor_nombre: this.currentUser.nombre,
                        anonimo:      false,
                        mensaje:      txt,
                        parent_id:    this.threadRoot.id,
                        reply_to_id:  this.threadReplyTo ? this.threadReplyTo.id : null,
                        fecha:        new Date().toISOString()
                    }).select().single();
                if (error) throw error;
                const uiMsg = data.mapSecret(inserted);
                if (!this.threadMessages.some(x => x.id === uiMsg.id)) {
                    this.threadMessages.push(uiMsg);
                }
                if (!this._threadParents.includes(this.threadRoot.id)) {
                    this._threadParents.push(this.threadRoot.id);
                }
                this.threadTexto = "";
                this.threadReplyTo = null;
                this.$nextTick(() => {
                    const f = this.$refs.threadFeed;
                    if (f) f.scrollTop = f.scrollHeight;
                });
            } catch (err) {
                console.error(err);
                alert("Couldn't send thread message");
            } finally {
                this.threadSending = false;
            }
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
                        if (m.parentId) {
                            if (!this._threadParents.includes(m.parentId)) {
                                this._threadParents.push(m.parentId);
                            }
                            if (this.threadOpen && this.threadRoot && m.parentId === this.threadRoot.id) {
                                if (!this.threadMessages.some(x => x.id === m.id)) {
                                    this.threadMessages.push(m);
                                    this.$nextTick(() => {
                                        const f = this.$refs.threadFeed;
                                        if (f) f.scrollTop = f.scrollHeight;
                                    });
                                }
                            }
                            return;
                        }
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
        onAuthorClick(m) {
            if (m.anonimo) {
                this.showToast("Sent as Anonymous");
                return;
            }
            this.openProfile(m.autorId);
        },
        showToast(msg) {
            let el = document.getElementById("oasis-toast");
            if (!el) {
                el = document.createElement("div");
                el.id = "oasis-toast";
                el.className = "oasis-toast";
                document.body.appendChild(el);
            }
            el.textContent = msg;
            el.classList.add("show");
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
        },
        async resetSecrets() {
            if (!confirm("Delete ALL secrets? This cannot be undone.")) return;
            try {
                const { error } = await sb.from("secrets").delete().gt("id", 0);
                if (error) throw error;
                this.messages = [];
                this._threadParents = [];
                this.showToast("All secrets deleted");
            } catch (err) {
                console.error(err);
                alert("Couldn't reset");
            }
        },
        async deleteThreadMessage(m) {
            if (!confirm("Delete this message?")) return;
            try {
                const { error } = await sb.from("secrets").delete().eq("id", m.id);
                if (error) throw error;
                this.threadMessages = this.threadMessages.filter(x => x.id !== m.id);
            } catch (err) {
                console.error(err);
                alert("Couldn't delete message.");
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.threadOpen) {
                this.closeThread();
            }
        });
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
            if (this.contextMenu.open && !e.target.closest(".context-menu")) {
                this.contextMenu.open = false;
            }
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