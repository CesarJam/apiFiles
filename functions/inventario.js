const express = require("express");
const router = express.Router();
const { db, FieldValue } = require("./firebaseConfig");

/**
 * Inventarios
 */

// MÉTODO POST ACTUALIZADO 2025/07/02 PARA REGISTRAR INVENTARIO ok

router.post("/inventario", async (req, res) => {
    try {
        // --- 1. Desestructuración Simplificada ---
        // Asumimos que el body ya viene con la estructura anidada.
        const {
            numeroExpediente,
            asunto,
            areaDeRegistro,
            listaDeDependencias,
            datosGenerales,
            subserie,
            registro 
        } = req.body;

        // La validación se puede hacer más específica sobre los objetos.
        if (!numeroExpediente || !asunto || !datosGenerales || !subserie || !registro || !areaDeRegistro) {
            return res.status(400).json({ error: "Faltan campos u objetos principales." });
        }

        // --- 2. statusActual se define en el servidor ---
        const statusActual = "registro";

        const { fecha } = registro;
        const anioRegistro = parseInt(fecha?.split("-")[0]);
        if (!fecha || isNaN(anioRegistro)) {
            return res.status(400).json({ error: "El campo 'fecha' de registro es obligatorio y válido." });
        }

        const docRef = db.collection("inventario").doc();

        // El objeto que se guarda en la DB ahora es mucho más directo
        await docRef.set({
            numeroExpediente,
            asunto,
            listaDeDependencias,
            anioRegistro,
            statusActual,
            areaDeRegistro,
            areasInvolucradas: registro.areaDestino || [],
            datosGenerales, // Se pasa el objeto directamente
            subserie,       // Se pasa el objeto directamente
            historialMovimientos: [
                {
                    ...registro, // Usamos spread para copiar todas las propiedades del objeto registro
                    tipo: "registro", // Nos aseguramos que el tipo sea 'registro'
                    areaOrigen: areaDeRegistro,
                    areaDestino: Array.isArray(registro.areaDestino) ? registro.areaDestino : [registro.areaDestino]
                }
            ]
        });

        return res.status(201).json({
            message: "Inventario registrado con éxito",
            id: docRef.id
        });

    } catch (error) {
        console.error("Error al registrar el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * Endpoint para añadir un nuevo movimiento a un expediente existente.
 * Actualiza el historial y el estado actual del documento.
 */
// 1. Cambiamos el método a PATCH para una mejor semántica RESTful.
router.patch("/inventario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const nuevoMovimiento = req.body;

        // 2. Tu validación es buena, la mantenemos.
        const tiposValidos = ["tramite", "concluido"];
        if (!nuevoMovimiento.tipo || !tiposValidos.includes(nuevoMovimiento.tipo) || !nuevoMovimiento.areaCanalizado || !nuevoMovimiento.fecha || !nuevoMovimiento.usuario) {
            return res.status(400).json({ error: "Petición inválida. Faltan campos obligatorios o el tipo es incorrecto." });
        }

        const docRef = db.collection("inventario").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: "No se encontró el expediente con ese ID." });
        }

        // 3. Preparamos el objeto completo para la actualización.
        const updatePayload = {
            // Añade el nuevo objeto al array del historial.
            historialMovimientos: FieldValue.arrayUnion(nuevoMovimiento),
            
            // ¡LA CLAVE! Actualiza el campo principal con el nuevo estado.
            statusActual: nuevoMovimiento.tipo 
        };

        // Si el nuevo movimiento tiene un área, la añadimos al array de búsqueda
        if (nuevoMovimiento.areaCanalizado) {
            updatePayload.areasInvolucradas = FieldValue.arrayUnion(nuevoMovimiento.areaCanalizado);
        }

        // 4. Actualizamos AMBOS campos en una sola operación atómica.
        await docRef.update(updatePayload);

        return res.status(200).json({ 
            message: "Expediente actualizado con éxito.",
            id: docRef.id 
        });

    } catch (error) {
        console.error("Error al agregar movimiento:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

// Consultar inventario por fechaRegistrado y areaRegistrado
/**
 * Consulta el inventario de forma eficiente usando un índice compuesto.
 * Creado el 03 de julio de 2025, en Chilpancingo.
 */
// 1. (Sugerencia) Adecuamos la ruta para que el parámetro coincida con el campo de la base de datos.
router.get("/consultaInventario/anio/:anio/areaDeRegistro/:codigoSeccion", async (req, res) => {
    try {
        const { anio, codigoSeccion } = req.params;

        // Tu validación sigue siendo perfecta.
        if (!anio || isNaN(anio) || !codigoSeccion) {
            return res.status(400).json({ error: "El año y el área de registro son obligatorios." });
        }

        // 2. ¡LA CONSULTA OPTIMIZADA! Filtramos por ambos campos directamente en la base de datos.
        const snapshot = await db
            .collection("inventario")
            .where("anioRegistro", "==", parseInt(anio))
            .where("areaDeRegistro", "==", codigoSeccion)
            .get();

        if (snapshot.empty) {
            // Este mensaje de error ahora es más preciso.
            return res.status(404).json({
                message: `No se encontraron registros para el año ${anio} y el área ${codigoSeccion}.`
            });
        }

        // 3. Simplificamos el procesamiento. Ya no es necesario filtrar manualmente en JavaScript.
        // Directamente mapeamos los documentos encontrados a un array de resultados.
        const resultados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return res.status(200).json(resultados);

    } catch (error) {
        console.error("Error al consultar inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

/*
router.get("/consultaInventario/anio/:anio/areaOrigen/:codigoSeccion", async (req, res) => {
    try {
        const { anio, codigoSeccion } = req.params;

        if (!anio || isNaN(anio)) {
            return res.status(400).json({ error: "El año es obligatorio y debe ser numérico." });
        }

        if (!codigoSeccion) {
            return res.status(400).json({ error: "El área de origen es obligatoria." });
        }

        const snapshot = await db
            .collection("inventario")
            .where("anioRegistro", "==", parseInt(anio))
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                message: `No hay registros en el inventario para el año ${anio}.`
            });
        }

        const resultados = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const primerMovimiento = data.historialMovimientos?.[0];

            if (primerMovimiento?.areaOrigen === codigoSeccion) {
                resultados.push({ id: doc.id, ...data });
            }
        });

        if (resultados.length === 0) {
            return res.status(404).json({
                message: `No hay registros en el inventario para el año ${anio} con área de origen ${codigoSeccion}.`
            });
        }

        return res.status(200).json(resultados);

    } catch (error) {
        console.error("Error al consultar inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});*/

//consulta de expedientes turnados
/**
 * Consulta los expedientes turnados a un área específica en un año dado.
 * Utiliza un índice compuesto y el operador 'array-contains'.
 */
router.get("/consultaTurnados/anio/:anio/areaDestino/:codigoEnviado", async (req, res) => {
    try {
        const { anio, codigoEnviado } = req.params;

        if (!anio || isNaN(anio) || !codigoEnviado) {
            return res.status(400).json({ error: "El año y el código de área son obligatorios." });
        }

        // --- ¡LA NUEVA CONSULTA SÚPER EFICIENTE! ---
        const snapshot = await db
            .collection("inventario")
            .where("anioRegistro", "==", parseInt(anio))
            .where("areasInvolucradas", "array-contains", codigoEnviado)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                message: `No se encontraron expedientes turnados al área ${codigoEnviado} en el año ${anio}.`
            });
        }

        // El procesamiento es directo, ya no hay que filtrar en el servidor.
        const resultados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return res.status(200).json(resultados);

    } catch (error) {
        console.error("Error al consultar expedientes turnados:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});
/*
router.get("/consultaTurnados/anio/:anio/areaDestino/:codigoEnviado", async (req, res) => {
    try {
        const { anio, codigoEnviado } = req.params;

        if (!anio || isNaN(anio)) {
            return res.status(400).json({ error: "El año es obligatorio y debe ser numérico." });
        }

        if (!codigoEnviado) {
            return res.status(400).json({ error: "El código de área destino es obligatorio." });
        }

        const snapshot = await db
            .collection("inventario")
            .where("anioRegistro", "==", parseInt(anio))
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                message: `No hay registros en el inventario para el año ${anio}.`
            });
        }

        const resultados = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const movimientos = data.historialMovimientos || [];

            // Recorremos todos los movimientos
            for (const movimiento of movimientos) {
                if (Array.isArray(movimiento.areaDestino)) {
                    if (movimiento.areaDestino.includes(codigoEnviado)) {
                        resultados.push({ id: doc.id, ...data });
                        break; // Ya encontramos coincidencia, salimos del loop
                    }
                }
            }
        });

        if (resultados.length === 0) {
            return res.status(404).json({
                message: `No hay registros con área destino ${codigoEnviado} en el año ${anio}.`
            });
        }

        return res.status(200).json(resultados);

    } catch (error) {
        console.error("Error al consultar inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});*/

////////////////////////////////////////////////

//consultar inventario 
router.get("/inventario", async (req, res) => {
    try {
        const inventarioRef = db.collection("inventario"); // Referencia a la colección "codigo"
        const snapshot = await inventarioRef.get();

        // Verificar si hay datos en la colección
        if (snapshot.empty) {
            return res.status(404).json({ message: "No hay registros en el inventario." });
        }

        // Convertir los documentos a un array de objetos
        const inventarios = [];
        snapshot.forEach(doc => {
            inventarios.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json(inventarios);
    } catch (error) {
        console.error("Error al obtener el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//Consultar inventario por id
router.get("/inventario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const inventarioRef = db.collection("inventario").doc(id);
        const doc = await inventarioRef.get();

        // Verificar si el documento existe
        if (!doc.exists) {
            return res.status(404).json({ message: "No se encontró el registro en el inventario." });
        }

        return res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error al obtener el inventario por ID:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//consultar inventario por año y sección
router.get("/inventario/anio/:anio/codigoSeccion/:codigoSeccion", async (req, res) => {
    try {
        const { anio, codigoSeccion } = req.params;

        // Validamos que se proporcione el año y que sea numérico
        if (!anio || isNaN(anio)) {
            return res.status(400).json({ error: "El año es obligatorio y debe ser numérico." });
        }
        // Validamos que se proporcione el código de sección
        if (!codigoSeccion) {
            return res.status(400).json({ error: "El codigoSeccion es obligatorio." });
        }

        const inventarioRef = db.collection("inventario");
        // Consulta usando ambas condiciones: anio y codigoSeccion
        const snapshot = await inventarioRef
            .where("anio", "==", anio)
            .where("codigoSeccion", "==", codigoSeccion)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                message: `No hay registros en el inventario para el año ${anio} y codigoSeccion ${codigoSeccion}.`
            });
        }

        const inventarios = [];
        snapshot.forEach(doc => {
            inventarios.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json(inventarios);
    } catch (error) {
        console.error("Error al obtener el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});


/*
router.get("/consultaInventario/anio/:anio/codigoSeccion/:codigoSeccion", async (req, res) => {
    try {
        const { anio, codigoSeccion } = req.params;

        // Validamos que se proporcione el año y que sea numérico
        if (!anio || isNaN(anio)) {
            return res.status(400).json({ error: "El año es obligatorio y debe ser numérico." });
        }

        // Validamos que se proporcione el código de sección (areaRecibido)
        if (!codigoSeccion) {
            return res.status(400).json({ error: "El codigoSeccion es obligatorio." });
        }

        console.log(anio + " - " + codigoSeccion);

        const inventarioRef = db.collection("inventario");

        // Consulta usando ambas condiciones: fechaRecibido y areaRecibido
        const snapshot = await inventarioRef
            .where("status.creado.fecha", ">=", `${anio}-01-01`)  // Filtra por año
            .where("status.creado.fecha", "<=", `${anio}-12-31`)  // Filtra por año
            .where("status.creado.areaCreado", "==", codigoSeccion)  // Filtra por areaRecibido (campo de tipo cadena)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ 
                message: `No hay registros en el inventario para el año ${anio} y el área recibido ${codigoSeccion}.` 
            });
        }

        const inventarios = [];
        snapshot.forEach(doc => {
            inventarios.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json(inventarios);
    } catch (error) {
        console.error("Error al obtener el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});*/

// Consultar inventario por año y área turnada
router.get("/consultaInventarioTurnado/anio/:anio/areaTurnado/:areaTurnado", async (req, res) => {
    try {
        const { anio, areaTurnado } = req.params;

        // Validamos que se proporcione el año y sea numérico
        if (!anio || isNaN(anio)) {
            return res.status(400).json({ error: "El año es obligatorio y debe ser numérico." });
        }

        // Validamos que se proporcione el área turnada
        if (!areaTurnado) {
            return res.status(400).json({ error: "El área turnada es obligatoria." });
        }

        console.log(`Consultando inventario para el año ${anio} y área turnada ${areaTurnado}`);

        const inventarioRef = db.collection("inventario");

        // Realizamos la consulta
        const snapshot = await inventarioRef
            .where("status.creado.fecha", ">=", `${anio}-01-01`)  // Filtra desde el inicio del año
            .where("status.creado.fecha", "<=", `${anio}-12-31`)  // Filtra hasta el final del año
            .where("status.creado.areaTurnado", "array-contains", areaTurnado)  // Filtra por área turnada en un array
            .get();

        // Verificamos si hay resultados
        if (snapshot.empty) {
            return res.status(404).json({
                message: `No hay registros en el inventario para el año ${anio} y el área turnada ${areaTurnado}.`
            });
        }

        const inventarios = [];
        snapshot.forEach(doc => {
            inventarios.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json(inventarios);
    } catch (error) {
        console.error("Error al obtener el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});


//Metódo para eliminar
router.delete("/inventario/:numeroExpediente", async (req, res) => {
    try {
        const { numeroExpediente } = req.params;

        // Referencia al documento en Firestore
        const serieRef = db.collection("inventario").doc(numeroExpediente);
        const doc = await serieRef.get();

        // Verificar si el documento existe
        if (!doc.exists) {
            return res.status(404).json({ error: "El registro no existe." });
        }

        // Eliminar el documento
        await serieRef.delete();

        return res.status(200).json({ message: "Inventario eliminado correctamente." });
    } catch (error) {
        console.error("Error al eliminar el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// MÉTODO DE PRUEBA POST
/*
router.post("/inventarioStatus", async (req, res) => {
    try {
        console.log("Cuerpo de la solicitud:", req.body);

        const {
            numeroExpediente,
            asunto,
            dependencias,
            numeroFojas,
            soporteDocumental,
            condicionesAcceso,
            aniosReserva,
            tradicionDocumental,
            inmueble,
            ubicacion,
            codigoSubserie,
            nombreSerie,
            valorDocumental,
            aniosTramite,
            aniosConcentracion,
            status
        } = req.body;

        // Validar campos obligatorios
        if (
            !numeroExpediente || typeof numeroExpediente !== "string" || numeroExpediente.trim() === "" ||
            !asunto || typeof asunto !== "string" || asunto.trim() === "" ||
            !dependencias || typeof dependencias !== "string" || dependencias.trim() === "" ||
            !numeroFojas || typeof numeroFojas !== "string" || numeroFojas.trim() === "" ||
            !soporteDocumental || typeof soporteDocumental !== "string" || soporteDocumental.trim() === "" ||
            !condicionesAcceso || typeof condicionesAcceso !== "string" || condicionesAcceso.trim() === "" ||
            !aniosReserva || typeof aniosReserva !== "string" || aniosReserva.trim() === "" ||
            !tradicionDocumental || typeof tradicionDocumental !== "string" || tradicionDocumental.trim() === "" ||
            !inmueble || typeof inmueble !== "string" || inmueble.trim() === "" ||
            !ubicacion || typeof ubicacion !== "string" || ubicacion.trim() === "" ||
            !codigoSubserie || typeof codigoSubserie !== "string" || codigoSubserie.trim() === "" ||
            !nombreSerie || typeof nombreSerie !== "string" || nombreSerie.trim() === "" ||
            !valorDocumental || typeof valorDocumental !== "string" || valorDocumental.trim() === "" ||
            !aniosTramite || typeof aniosTramite !== "string" || aniosTramite.trim() === "" ||
            !aniosConcentracion || typeof aniosConcentracion !== "string" || aniosConcentracion.trim() === ""
        ) {
            return res.status(400).json({ error: "Todos los campos son obligatorios." });
        }

        // Validar estructura de "status" si existe
        const statusData = status && typeof status === "object" ? status : {};
        const { creado = {}, tramite = {}, concluido = {} } = statusData;

        
        // Generar un ID automático para el documento en la colección "inventario"
        const serieRef = db.collection("inventario").doc(); // ID generado automáticamente
        await serieRef.set({
            numeroExpediente,
            asunto,
            dependencias,
            numeroFojas,
            soporteDocumental,
            condicionesAcceso,
            aniosReserva,
            tradicionDocumental,
            inmueble,
            ubicacion,
            codigoSubserie,  // Usé el campo correcto "codigoSubserie"
            nombreSerie,
            valorDocumental,
            aniosTramite,
            aniosConcentracion,
            status: {
                creado: {
                    tipo: creado.tipo, //Ya sea enviado o recibido
                    fecha: creado.fecha,
                    hora: creado.hora || new Date().toLocaleTimeString(),
                    areaCreado: creado.areaCreado,
                    areaTurnado: creado.areaTurnado,
                    observaciones: creado.observaciones || "Sin observaciones",
                    usuario: creado.usuario || "Administrador"
                },
                tramite: {
                    fecha: tramite.fecha || "AAAA-MM-DD",
                    hora: tramite.hora || "Sin asignar",
                    observaciones: tramite.observaciones || "Sin observaciones",
                    usuario: tramite.usuario || "Administrador"
                },
                concluido: {
                    fecha: concluido.fecha || "AAAA-MM-DD",
                    hora: concluido.hora || "Sin asignar",
                    observaciones: concluido.observaciones || "Sin observaciones",
                    usuario: concluido.usuario || "Administrador"
                }
            }
        });

        return res.status(201).json({ message: "Inventario registrado con éxito", id: serieRef.id });
    } catch (error) {
        console.error("Error al registrar el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});
*/



//METODO PARA MODIFICAR
// MÉTODO PARA MODIFICAR INVENTARIO
router.put("/inventario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Datos recibidos en la petición PUT:", JSON.stringify(req.body, null, 2));

        // Verificar si req.body está vacío
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "No se recibieron datos para actualizar." });
        }

        const {
            numeroExpediente,
            asunto,
            dependencias,
            status,
            numeroFojas,
            inmueble,
            ubicacion,
            codigoSubserie,
            nombreSerie,
            valorDocumental,
            aniosTramite,
            aniosConcentracion,
            soporteDocumental,
            tradicionDocumental,
            condicionesAcceso,
            aniosReserva
        } = req.body;

        // Validar datos requeridos
        if (!numeroExpediente || !asunto || !numeroFojas || !inmueble || !ubicacion || !codigoSubserie ||
            !nombreSerie || !valorDocumental || !aniosTramite || !aniosConcentracion ||
            !soporteDocumental || !tradicionDocumental || !condicionesAcceso || !aniosReserva) {
            return res.status(400).json({ error: "Debes proporcionar los campos requeridos." });
        }

        // Referencia al documento del inventario
        const serieRef = db.collection("inventario").doc(id);
        const serieDoc = await serieRef.get();

        if (!serieDoc.exists) {
            return res.status(404).json({ error: "Expediente del inventario no encontrado" });
        }

        // Construir objeto con datos actualizados
        const dataActualizada = {
            numeroExpediente,
            asunto,
            dependencias,
            status,
            numeroFojas,
            inmueble,
            ubicacion,
            codigoSubserie,
            nombreSerie,
            valorDocumental,
            aniosTramite,
            aniosConcentracion,
            soporteDocumental,
            tradicionDocumental,
            condicionesAcceso,
            aniosReserva
        };

        // Actualizar la serie en Firestore
        await serieRef.update(dataActualizada);

        return res.status(200).json({
            message: "Expediente actualizado con éxito",
            serieId: id
        });

    } catch (error) {
        console.error("Error al actualizar el expediente:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});



module.exports = router;
