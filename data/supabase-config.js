/* ============================================================
   Oasis · Supabase client
   ------------------------------------------------------------
   Rellena SUPABASE_URL y SUPABASE_ANON_KEY con los valores de
   tu proyecto. El SQL de setup completo está en README.md.
   ============================================================ */

const SUPABASE_URL      = "https://mupdiqlibvhvckcoqprp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cGRpcWxpYnZodmNrY29xcHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDQ4NDksImV4cCI6MjEwMDMyMDg0OX0.KI1OdPh9dXKk2DGyNwb8Cfmu1usClbzbx8Zoy1X4V8A";

/**
 * Cliente compartido.
 *
 * La librería del CDN se auto-registra como `window.supabase`.
 * A NUESTRO cliente instanciado lo exponemos como
 * `window.supabaseClient` para que todos los app-level JS
 * puedan leerlo con `const sb = window.supabaseClient;`.
 *
 * (También queda accesible como binding léxico `supabaseClient`
 * por si algún script viejo lo usa bare.)
 */
window.supabaseClient = null;

if (
    !SUPABASE_URL.includes("TU_PROYECTO") &&
    window.supabase &&
    typeof window.supabase.createClient === "function"
) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn(
        "[Oasis] Supabase no está configurado — revisá data/supabase-config.js " +
        "(URL, ANON_KEY, o el CDN no cargó)"
    );
}