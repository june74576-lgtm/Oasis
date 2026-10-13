/* ============================================================
   Oasis · Secrets
   ============================================================ */

const { createApp } = Vue;

const loginScreen   = document.getElementById("loginScreen");
const loginUserInput = document.getElementById("loginUserInput");
const loginPassInput = document.getElementById("loginPassInput");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const secretsRoot   = document.getElementById("secretsApp");

window.__secretsShowLogin = function () {
    secretsRoot.classList.add("hidden-app");
    loginScreen.classList.remove("hidden");
    loginUserInput.value = "";
    loginPassInput.value = "";
    loginErrorMsg.style.display = "none";
    setTimeout(() => loginUserInput.focus(), 100);
};
window.__secretsHideLogin = function () {
    loginScreen.classList.add("hidden");
    secretsRoot.classList.remove("hidden-app");
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
function formatDateTime(iso) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
    } catch { return ""; }
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

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
            ANON_AVATAR
        };
    },
    computed: {
        supabaseReady() {
            return typeof supabaseClient !== "undefined"
                && supabaseClient !== null
                && typeof supabaseClient.from === "function";
        },
        currentUserPhoto() {
            if (!this.currentUser) return "";
            const me = this.estudiantes.find(e => e.id === this.currentUser.id);
            return (me && me.foto) || "";
        },
        currentUserInitial() {
            return (this.currentUser && this.currentUser.nombre ? this.currentUser.nombre[0] : "?").toUpperCase();
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
        studentFoto(id) {
            const s = this.estudiantes.find(e => e.id === id);
            return s && s.foto ? s.foto : "";
        },
        formatDateTime,
        renderMarkdown(text) {
            let safe = escapeHtml(text || "");
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
            if (m.anonimo) return m.autor_id === this.currentUser.id;
            return m.autor_id === this.currentUser.id;
        },
        async deleteMsg(m) {
            if (!confirm("Delete this secret?")) return;
            try {
                const { error } = await supabaseClient.from("secrets").delete().eq("id", m.id);
                if (error) throw error;
                this.messages = this.messages.filter(x => x.id !== m.id);
            } catch (e) { console.error(e); alert("Couldn't delete."); }
        },
        autoGrow(e) {
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 180) + "px";
        },
        async loadData() {
            const [est, msgs] = await Promise.all([
                supabaseClient.from("estudiantes").select("*"),
                supabaseClient.from("secrets").select("*").order("fecha", { ascending: true })
            ]);
            if (est.data) {
                this.estudiantes = est.data.map(e => ({
                    id: e.id,
                    nombre: e.nombre,
                    foto: this.mediaUrl(e.foto)
                }));
            }
            if (msgs.data) {
                this.messages = msgs.data;
                this.$nextTick(() => {
                    const f = this.$refs.feed;
                    if (f) f.scrollTop = f.scrollHeight;
                });
            }
            this.loading = false;
        },
        async send() {
            const txt = this.texto.trim();
            if (!txt || this.sending) return;
            if (!this.currentUser) return;
            this.sending = true;
            try {
                const { error } = await supabaseClient.from("secrets").insert({
                    autor_id: this.currentUser.id,
                    autor_nombre: this.currentUser.nombre,
                    anonimo: this.anonimo,
                    mensaje: txt,
                    fecha: new Date().toISOString()
                });
                if (error) throw error;
                this.texto = "";
                this.anonimo = false;
                if (this.$refs.ta) this.$refs.ta.style.height = "auto";
                await this.loadData();
            } catch (e) {
                console.error(e);
                alert("Couldn't send. Check console (F12).");
            } finally {
                this.sending = false;
            }
        },
        signOut() {
            sessionStorage.removeItem("oasis_session");
            window.location.href = "index.html";
        },
        async init() {
            if (!this.supabaseReady) { this.loading = false; return; }

            const saved = sessionStorage.getItem("oasis_session");
            if (!saved) { window.__secretsShowLogin(); return; }
            try { this.currentUser = JSON.parse(saved); }
            catch { window.__secretsShowLogin(); return; }

            await this.loadData();
            window.__secretsHideLogin();
        }
    },
    mounted() {
        this.init();

        loginSubmitBtn.addEventListener("click", async () => {
            await this.loadData();
            const u = normalize(loginUserInput.value);
            const p = normalize(loginPassInput.value);
            const match = this.estudiantes.find(e => {
                const c = loginCredentials(e);
                return c.username === u && c.password === p;
            });
            if (!match) {
                loginErrorMsg.style.display = "block";
                return;
            }
            this.currentUser = { id: match.id, nombre: shortName(match.nombre) };
            sessionStorage.setItem("oasis_session", JSON.stringify(this.currentUser));
            loginErrorMsg.style.display = "none";
            window.__secretsHideLogin();
        });
        loginPassInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loginSubmitBtn.click();
        });
    }
}).mount("#secretsApp");