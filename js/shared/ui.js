/* ============================================================
   Oasis · Shared UI bootstrap
   ============================================================ */

window.Oasis = window.Oasis || {};

(function () {

    /* ---------- Password eye toggle ---------- */

    function setupPasswordToggles() {
        document.querySelectorAll(".login-field-eye").forEach(btn => {
            btn.addEventListener("click", () => {
                const input = document.getElementById(btn.dataset.target);
                if (!input) return;
                const show = input.type === "password";
                input.type = show ? "text" : "password";
                btn.classList.toggle("is-visible", show);
                btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
            });
        });
    }

    /* ---------- Reze floating text ---------- */

    // Escribí acá los textos que quieras. Se muestran en orden aleatorio
    // debajo de reze.png en la pantalla de login.
    const REZE_TEXTS = [
        "Me cae mal Moyano",
        "Fun fact: no c programar",
        "No confiesen cosas mias, advertidos estan",
        "Vendo chupetes ^^",
        "Sylphie >>>>> Roxy"
    ];

    let _rezeInterval = null;

    function rotateRezeText() {
        const el = document.getElementById("loginRezeText");
        if (!el) return;
        el.style.opacity = "0";
        setTimeout(() => {
            el.textContent = REZE_TEXTS[Math.floor(Math.random() * REZE_TEXTS.length)];
            el.style.opacity = "1";
        }, 200);
    }

    function startRezeTextRotation() {
        rotateRezeText();
        if (_rezeInterval) clearInterval(_rezeInterval);
        _rezeInterval = setInterval(rotateRezeText, 5000);
    }

    /* ---------- Login music ---------- */

    function setupLoginMusic() {
        const audio = document.getElementById("loginMusic");
        const btn = document.getElementById("loginMusicBtn");
        if (!audio || !btn) return;

        // Intenta autoplay. Si el navegador lo bloquea, espera el primer click.
        const tryPlay = () => {
            audio.play().then(() => {
                btn.classList.add("playing");
            }).catch(() => {
                const startOnInteract = () => {
                    audio.play().then(() => btn.classList.add("playing")).catch(() => {});
                    document.removeEventListener("click", startOnInteract);
                    document.removeEventListener("keydown", startOnInteract);
                };
                document.addEventListener("click", startOnInteract, { once: true });
                document.addEventListener("keydown", startOnInteract, { once: true });
            });
        };
        tryPlay();

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (audio.paused) {
                audio.play().then(() => btn.classList.add("playing")).catch(() => {});
            } else {
                audio.pause();
                btn.classList.remove("playing");
            }
        });

        audio.addEventListener("error", () => {
            btn.style.display = "none";
        });
    }

    /* ---------- Bootstrap ---------- */

    function bootstrapLoginScreen() {
        setupPasswordToggles();
        startRezeTextRotation();
        setupLoginMusic();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrapLoginScreen);
    } else {
        bootstrapLoginScreen();
    }

    window.Oasis.ui = Object.freeze({
        setupPasswordToggles,
        startRezeTextRotation,
        setupLoginMusic,
        bootstrapLoginScreen
    });

})();