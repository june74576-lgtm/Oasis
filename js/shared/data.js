/* ============================================================
   Oasis · Shared data layer
   ------------------------------------------------------------
   Todo el acceso a Supabase centralizado:
   - URLs públicas de Storage (media, archivos, galeria, stores)
   - Mappers row-DB → objeto UI (camelCase, URLs resueltas)
   - Groupers (horarios por curso, notas por alumno, …)
   - Loaders (queries agrupadas por caso de uso)

   Regla de oro: todo lo que sale de acá ya viene normalizado.
   Los app-level JS no tocan snake_case ni `getPublicUrl`.
   ============================================================ */

window.Oasis = window.Oasis || {};

(function () {

    const cfg = window.Oasis.config;
    const { horaAMinutos } = window.Oasis.utils;

    /* ============================================================
       URLs de Storage
       ============================================================ */

    function publicUrl(sb, bucket, path) {
        if (!path) return "";
        if (/^https?:\/\//i.test(path)) return path;
        if (!sb) return "";
        const { data } = sb.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }

    const mediaUrl      = (sb, p) => publicUrl(sb, cfg.BUCKETS.MEDIA,    p);
    const fileUrl       = (sb, p) => publicUrl(sb, cfg.BUCKETS.ARCHIVOS, p);
    const galeriaUrl    = (sb, p) => publicUrl(sb, cfg.BUCKETS.GALERIA,  p);
    const storePhotoUrl = (sb, p) => publicUrl(sb, cfg.BUCKETS.STORES,   p);

    /* ============================================================
       Mappers (fila de DB → objeto UI)
       ============================================================ */

    function mapCurso(row) {
        return {
            id:       row.id,
            nombre:   row.nombre,
            disabled: !!row.disabled,
            orden:    row.orden || 0
        };
    }

    function mapEstudiante(sb, row) {
        return {
            id:              row.id,
            nombre:          row.nombre,
            foto:            mediaUrl(sb, row.foto),
            curso:           row.curso || "",
            fechaNacimiento: row.fecha_nacimiento || "",
            nivelIngles:     row.nivel_ingles || "",
            cargo:           row.cargo || "",
            isAdmin:         !!row.is_admin,
            hasStore:        !!row.has_store
        };
    }

    function mapProfesor(sb, row) {
        return {
            id:     row.id,
            nombre: row.nombre,
            foto:   mediaUrl(sb, row.foto),
            tutor:  row.tutor || ""
        };
    }

    function mapMateria(row, niveles = []) {
        const m = {
            id:     row.id,
            nombre: row.nombre,
            orden:  row.orden || 0
        };
        if (niveles.length > 0) {
            m.niveles = niveles.map(n => ({
                id:       n.nivel_id,
                nombre:   n.nombre,
                profesor: n.profesor_id || ""
            }));
        }
        return m;
    }

    function mapHorario(row) {
        return {
            id:         row.id,
            curso:      row.curso,
            hora:       row.hora,
            tipo:       row.tipo,
            dia:        row.dia || "",
            materiaId:  row.materia_id || "",
            profesorId: row.profesor_id || "",
            orden:      row.orden || 0,
            label:      row.label || ""
        };
    }

    function mapArchivo(row) {
        return {
            id:              row.id,
            materia:         row.materia,
            curso:           row.curso,
            nombre:          row.nombre,
            storagePath:     row.storage_path,
            subidoPorId:     row.subido_por_id,
            subidoPorNombre: row.subido_por_nombre,
            fecha:           row.fecha
        };
    }

    function mapChatMensaje(row) {
        return {
            id:          row.id,
            curso:       row.curso,
            autorId:     row.autor_id,
            autorNombre: row.autor_nombre,
            mensaje:     row.mensaje,
            comprimido:  !!row.comprimido,
            fecha:       row.fecha
        };
    }

    function mapSecret(row) {
        return {
            id:          row.id,
            autorId:     row.autor_id,
            autorNombre: row.autor_nombre,
            anonimo:     !!row.anonimo,
            mensaje:     row.mensaje,
            fecha:       row.fecha
        };
    }

    function mapGaleriaLocal(sb, row) {
        return {
            id:    row.id,
            curso: row.curso,
            ruta:  mediaUrl(sb, row.ruta),
            orden: row.orden || 0
        };
    }

    function mapGaleriaFoto(sb, row) {
        return {
            id:              row.id,
            curso:           row.curso,
            url:             galeriaUrl(sb, row.storage_path),
            storagePath:     row.storage_path,
            subidoPorId:     row.subido_por_id,
            subidoPorNombre: row.subido_por_nombre,
            fecha:           row.fecha
        };
    }

    function mapStore(sb, row) {
        return {
            id:            row.id,
            ownerId:       row.owner_id,
            nombre:        row.nombre,
            descripcion:   row.descripcion || "",
            cardImage:     storePhotoUrl(sb, row.card_image),   // URL lista
            cardImagePath: row.card_image || "",                // path crudo (para editar)
            enabled:       !!row.enabled,
            createdAt:     row.created_at || null
        };
    }

    function mapStorePhoto(sb, row) {
        return {
            id:    row.id,
            path:  row.storage_path,
            url:   storePhotoUrl(sb, row.storage_path),
            orden: row.orden || 0
        };
    }

    /* ============================================================
       Groupers
       ============================================================ */

    /**
     * Toma el array plano de horarios y devuelve
     *   { [cursoId]: [{ tipo, hora, _min, label?, [dia]: { materia, profesor } }] }
     * ordenado por hora. Formato que consume index.html.
     */
    function groupHorariosByCurso(horarios) {
        const map = {};
        (horarios || []).forEach(h => {
            if (!map[h.curso]) map[h.curso] = [];
            let row = map[h.curso].find(r => r.hora === h.hora);
            if (!row) {
                row = {
                    tipo: h.tipo,
                    hora: h.hora,
                    _min: horaAMinutos(h.hora)
                };
                if (h.tipo === "recreo") row.label = h.label || "Recreo";
                map[h.curso].push(row);
            }
            if (h.tipo === "clase" && h.dia) {
                row[h.dia] = {
                    materia:  h.materiaId,
                    profesor: h.profesorId || ""
                };
            }
        });
        for (const curso of Object.keys(map)) {
            map[curso].sort((a, b) => a._min - b._min);
        }
        return map;
    }

    /**
     * { [estudianteId]: { [materiaId]: [valores...] } }
     */
    function groupNotasByStudent(notas) {
        const map = {};
        (notas || []).forEach(n => {
            if (!map[n.estudiante_id]) map[n.estudiante_id] = {};
            if (!map[n.estudiante_id][n.materia_id]) map[n.estudiante_id][n.materia_id] = [];
            if (typeof n.valor === "number") {
                map[n.estudiante_id][n.materia_id].push(n.valor);
            }
        });
        return map;
    }

    /**
     * { [materiaId]: [nivelesRows...] }
     */
    function groupNivelesByMateria(niveles) {
        const map = {};
        (niveles || []).forEach(n => {
            if (!map[n.materia_id]) map[n.materia_id] = [];
            map[n.materia_id].push(n);
        });
        return map;
    }

    /* ============================================================
       Loaders
       ============================================================ */

    /**
     * Carga todo lo que necesita index.html (y admin.html):
     * cursos, estudiantes, profesores, materias (con niveles),
     * horarios (flat, para agrupar), notas (agrupadas), galería.
     */
    async function loadCoreData(sb) {
        const [
            { data: cursos,      error: e1 },
            { data: estudiantes, error: e2 },
            { data: profesores,  error: e3 },
            { data: materias,    error: e4 },
            { data: niveles,     error: e5 },
            { data: horarios,    error: e6 },
            { data: notas,       error: e7 },
            { data: galeria,     error: e8 }
        ] = await Promise.all([
            sb.from("cursos").select("*").order("orden"),
            sb.from("estudiantes").select("*"),
            sb.from("profesores").select("*").order("id"),
            sb.from("materias").select("*").order("orden"),
            sb.from("materias_niveles").select("*"),
            sb.from("horarios").select("*").order("curso").order("hora"),
            sb.from("notas").select("*").order("orden"),
            sb.from("galeria_local").select("*").order("orden")
        ]);

        const firstErr = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8;
        if (firstErr) throw firstErr;

        const nivelesMap = groupNivelesByMateria(niveles);

        return {
            cursos:      (cursos      || []).map(mapCurso),
            estudiantes: (estudiantes || []).map(e => mapEstudiante(sb, e)),
            profesores:  (profesores  || []).map(p => mapProfesor(sb, p)),
            materias:    (materias    || []).map(m => mapMateria(m, nivelesMap[m.id] || [])),
            horarios:    (horarios    || []).map(mapHorario),
            notas:       groupNotasByStudent(notas || []),
            galeria:     (galeria     || []).map(g => mapGaleriaLocal(sb, g))
        };
    }

    async function loadEstudiantes(sb) {
        const { data, error } = await sb.from("estudiantes").select("*");
        if (error) throw error;
        return (data || []).map(e => mapEstudiante(sb, e));
    }

    async function loadCourseGalleryFotos(sb, cursoId) {
        const { data, error } = await sb.from("galeria_fotos")
            .select("*").eq("curso", cursoId);
        if (error) throw error;
        return (data || []).map(row => mapGaleriaFoto(sb, row));
    }

    async function loadCourseChat(sb, cursoId) {
        const { data, error } = await sb.from("chat_mensajes")
            .select("*").eq("curso", cursoId).order("fecha", { ascending: true });
        if (error) throw error;
        return (data || []).map(mapChatMensaje);
    }

    async function loadCourseArchivos(sb, fullMateriaId) {
        const { data, error } = await sb.from("archivos")
            .select("*").eq("materia", fullMateriaId).order("fecha", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapArchivo);
    }

    async function loadSecrets(sb) {
        const { data, error } = await sb.from("secrets")
            .select("*").order("fecha", { ascending: true });
        if (error) throw error;
        return (data || []).map(mapSecret);
    }

    async function loadStores(sb) {
        const { data, error } = await sb.from("stores")
            .select("*").eq("enabled", true).order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(row => mapStore(sb, row));
    }

    async function loadStorePhotos(sb, storeId) {
        const { data, error } = await sb.from("store_photos")
            .select("*").eq("store_id", storeId).order("orden", { ascending: true });
        if (error) throw error;
        return (data || []).map(row => mapStorePhoto(sb, row));
    }

    async function loadUserStore(sb, ownerId) {
        const { data, error } = await sb.from("stores")
            .select("*").eq("owner_id", ownerId).maybeSingle();
        if (error) throw error;
        return data ? mapStore(sb, data) : null;
    }

    /* ============================================================
       Exponer
       ============================================================ */

    window.Oasis.data = Object.freeze({
        /* URLs */
        mediaUrl, fileUrl, galeriaUrl, storePhotoUrl,
        /* Mappers */
        mapCurso, mapEstudiante, mapProfesor, mapMateria,
        mapHorario, mapArchivo, mapChatMensaje, mapSecret,
        mapGaleriaLocal, mapGaleriaFoto, mapStore, mapStorePhoto,
        /* Groupers */
        groupHorariosByCurso, groupNotasByStudent, groupNivelesByMateria,
        /* Loaders */
        loadCoreData, loadEstudiantes,
        loadCourseGalleryFotos, loadCourseChat, loadCourseArchivos,
        loadSecrets, loadStores, loadStorePhotos, loadUserStore
    });

})();