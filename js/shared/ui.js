/* ============================================================
   Oasis · Shared UI bootstrap
   ------------------------------------------------------------
   Comportamientos comunes a todas las páginas que antes estaban
   duplicados como <script> inline en cada HTML:
   - Password eye toggle
   - GIF loader para el fondo del login
   Se auto-ejecuta cuando el DOM está listo.
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

    /* ---------- Login background GIF ---------- */

    const GIFS = [
        "https://i.pinimg.com/originals/a2/15/16/a2151608a083bbfa3e5c8976112ec7c2.gif",
        "https://i.pinimg.com/originals/2d/e6/a0/2de6a0ff8360a7c6da4323c3d0a1bf9b.gif",
        "https://i.pinimg.com/originals/e4/c3/5f/e4c35f7646d0d7336a3e4cb50edf5c5c.gif",
        "https://i.redd.it/h8cnhm4y6waf1.gif",
        "https://i.pinimg.com/originals/e7/99/84/e79984d122840f899033d13b9ad31404.gif"
    ];

    function loadLoginGif() {
        const shuffled = [...GIFS].sort(() => Math.random() - 0.5);
        function tryLoad(i) {
            if (i >= shuffled.length) return;
            const img = new Image();
            img.onload = () => {
                document.documentElement.style.setProperty(
                    "--login-bg",
                    `url("${shuffled[i]}")`
                );
            };
            img.onerror = () => tryLoad(i + 1);
            img.src = shuffled[i];
        }
        tryLoad(0);
    }

    /* ---------- Bootstrap ---------- */

    function bootstrapLoginScreen() {
        setupPasswordToggles();
        loadLoginGif();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrapLoginScreen);
    } else {
        bootstrapLoginScreen();
    }

    /* ---------- Exponer ---------- */

    window.Oasis.ui = Object.freeze({
        setupPasswordToggles,
        loadLoginGif,
        bootstrapLoginScreen
    });

})();