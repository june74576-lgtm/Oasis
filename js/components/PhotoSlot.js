/* ============================================================
   Oasis · PhotoSlot
   ------------------------------------------------------------
   Componente Vue que muestra una foto con fallback "No Photo"
   cuando el src está vacío o la carga falla. Opcionalmente
   puede emitir "zoom" al hacer click.

   Antes vivía inline en app.js. Ahora se registra en
   window.Oasis.components.PhotoSlot y cada página lo monta:

       components: { PhotoSlot: window.Oasis.components.PhotoSlot }
   ============================================================ */

window.Oasis = window.Oasis || {};
window.Oasis.components = window.Oasis.components || {};

window.Oasis.components.PhotoSlot = {
    name: "PhotoSlot",

    props: {
        src:      { type: String,  default: "" },
        alt:      { type: String,  default: "" },
        zoomable: { type: Boolean, default: false }
    },

    emits: ["zoom"],

    data() {
        return { failed: false };
    },

    watch: {
        src() { this.failed = false; }
    },

    template: `
        <div class="photo-slot" :class="{ zoomable }">
            <img v-if="src && !failed"
                 :src="src" :alt="alt"
                 @error="failed = true"
                 @click="zoomable && $emit('zoom', src)">
            <div v-else class="no-photo">No Photo</div>
        </div>
    `
};