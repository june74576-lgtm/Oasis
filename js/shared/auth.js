/* ============================================================
   Oasis · Shared auth
   ------------------------------------------------------------
   Manejo de sesión + login screen.
   Todas las páginas comparten los mismos elementos de login
   (#loginScreen, #loginUserInput, #loginPassInput,
   #loginErrorMsg, #loginSubmitBtn) y el mismo flujo de
   persistencia (sessionStorage vs localStorage según el
   checkbox "Keep me signed in").
   ============================================================ */

window.Oasis = window.Oasis || {};

(function () {

    const SESSION_KEY = window.Oasis.config.SESSION_KEY;

    /* ---------- Sesión ---------- */

    /**
     * Lee la sesión cruda (string JSON) desde sessionStorage
     * o localStorage. sessionStorage gana si existen ambas.
     */
    function getSessionRaw() {
        return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    }

    /**
     * Lee y parsea la sesión. Devuelve `{ id, nombre }` o `null`.
     * Si el JSON está corrupto, limpia el storage y devuelve null.
     */
    function getSession() {
        const raw = getSessionRaw();
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            clearSession();
            return null;
        }
    }

    /**
     * Guarda la sesión. Si `remember` es true → localStorage;
     * si es false → sessionStorage. Nunca en ambos.
     */
    function saveSession(user, remember) {
        const payload = JSON.stringify(user);
        if (remember) {
            localStorage.setItem(SESSION_KEY, payload);
            sessionStorage.removeItem(SESSION_KEY);
        } else {
            sessionStorage.setItem(SESSION_KEY, payload);
            localStorage.removeItem(SESSION_KEY);
        }
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
    }

    /* ---------- Login screen controller ---------- */

    /**
     * Crea un controlador show/hide para la pantalla de login de
     * una página concreta. Usa los IDs estándar:
     *
     *   #loginScreen   — wrapper con clase "login-screen"
     *   #loginUserInput
     *   #loginPassInput
     *   #loginErrorMsg
     *   #loginSubmitBtn
     *
     * @param {HTMLElement} rootEl — el `#app`/`#adminApp`/… que se oculta
     */
    function createLoginController(rootEl) {
        const loginScreen  = document.getElementById("loginScreen");
        const userInput    = document.getElementById("loginUserInput");
        const passInput    = document.getElementById("loginPassInput");
        const errorMsg     = document.getElementById("loginErrorMsg");
        const submitBtn    = document.getElementById("loginSubmitBtn");

        function show() {
            rootEl.classList.add("hidden-app");
            loginScreen.classList.remove("hidden");
            userInput.value = "";
            passInput.value = "";
            errorMsg.style.display = "none";
            errorMsg.textContent = "Wrong username or password";
            setTimeout(() => userInput.focus(), 100);

            const audio = document.getElementById("loginMusic");
            if (audio) {
                audio.play().then(() => {
                    const btn = document.getElementById("loginMusicBtn");
                    if (btn) btn.classList.add("playing");
                }).catch(() => {});
            }
        }

        function hide() {
            loginScreen.classList.add("hidden");
            rootEl.classList.remove("hidden-app");

            const audio = document.getElementById("loginMusic");
            if (audio) {
                audio.pause();
                const btn = document.getElementById("loginMusicBtn");
                if (btn) btn.classList.remove("playing");
            }
        }

        return {
            show,
            hide,
            // Referencias útiles para que cada app.js enganche su submit handler
            elements: { loginScreen, userInput, passInput, errorMsg, submitBtn }
        };
    }

    /* ---------- Helpers de login ---------- */

    /**
     * Busca en `estudiantes` el que matchea con las credenciales
     * ingresadas. Devuelve el estudiante o `undefined`.
     */
    function findStudentByCredentials(estudiantes, username, password) {
        const u = window.Oasis.utils.normalize(username);
        const p = window.Oasis.utils.normalize(password);
        return estudiantes.find(e => {
            const c = window.Oasis.utils.loginCredentials(e);
            return c.username === u && c.password === p;
        });
    }

    /* ---------- Sign out ---------- */

    /**
     * Limpia la sesión y redirige al index.
     */
    function signOut() {
        clearSession();
        window.location.href = "index.html";
    }

    /* ---------- Exponer ---------- */

    window.Oasis.auth = Object.freeze({
        getSessionRaw,
        getSession,
        saveSession,
        clearSession,
        createLoginController,
        findStudentByCredentials,
        signOut
    });

})();