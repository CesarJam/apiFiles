const express = require("express"); 
const router = express.Router();
const { db } = require("./firebaseConfig");

/**
 * Inventarios
 */
// Ruta para registrar en el inventario
// Ruta para registrar en el inventario con ID automático
router.post("/inventario", async (req, res) => {
    try {
        console.log("Cuerpo de la solicitud:", req.body);
        const {
            numeroExpediente,
            asunto,
            tipo,
            numeroFojas,
            soporteDocumental,
            aniosTramite,
            aniosConcentracion,
            condicionesAcceso,
            aniosReserva,
            tradicionDocumental,
            fechaApertura,
            fechaCierre,
            inmueble,
            ubicacion,
            codigoSerie,
            anio,
            codigoSeccion
        } = req.body;

        // Validar campos obligatorios
        if (
            !numeroExpediente || typeof numeroExpediente !== "string" || numeroExpediente.trim() === "" ||
            !codigoSerie || typeof codigoSerie !== "string" || codigoSerie.trim() === "" ||
            !asunto || typeof asunto !== "string" || asunto.trim() === "" ||
            !codigoSeccion || typeof codigoSeccion !== "string" || codigoSeccion.trim() === "" 
        ) {
            return res.status(400).json({ error: "Número de expediente, código de serie, asunto y codigoSeccion son obligatorios." });
        }

        // Generar un ID automático para el documento en la colección "inventario"
        const serieRef = db.collection("inventario").doc(); // ID generado automáticamente
        await serieRef.set({
            numeroExpediente,
            asunto,
            tipo,
            numeroFojas,
            soporteDocumental,
            aniosTramite,
            aniosConcentracion,
            condicionesAcceso,
            aniosReserva,
            tradicionDocumental,
            fechaApertura,
            fechaCierre,
            inmueble,
            ubicacion,
            codigoSerie,
            anio,
            codigoSeccion
        });

        return res.status(201).json({ message: "Inventario registrado con éxito", id: serieRef.id });
    } catch (error) {
        console.error("Error al registrar el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

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
router.post("/inventarioStatus", async (req, res) => {
    try {
        console.log("Cuerpo de la solicitud:", req.body);
        const {
            numeroExpediente,
            asunto,
            tipo,
            numeroFojas,
            soporteDocumental,
            condicionesAcceso,
            aniosReserva,
            tradicionDocumental,
            fechaApertura,
            fechaCierre,
            inmueble,
            ubicacion,
            codigoSerie,
            nombreSerie,
            valorDocumental,
            aniosTramite,
            aniosConcentracion,
            anio,
            codigoSeccion,
            status
        } = req.body;

        // Validar campos obligatorios
        if (
            !numeroExpediente || typeof numeroExpediente !== "string" || numeroExpediente.trim() === "" ||
            !codigoSerie || typeof codigoSerie !== "string" || codigoSerie.trim() === "" ||
            !asunto || typeof asunto !== "string" || asunto.trim() === "" ||
            !codigoSeccion || typeof codigoSeccion !== "string" || codigoSeccion.trim() === "" 
        ) {
            return res.status(400).json({ error: "Número de expediente, código de serie, asunto y código de sección son obligatorios." });
        }

        // Validar estructura de "status" si existe
        const statusData = status && typeof status === "object" ? status : {};
        const { recibido = {}, tramite = {}, concluido = {} } = statusData;

        // Validar "recibido"
        if (!recibido.fecha || !Array.isArray(recibido.areaTurnado) || recibido.areaTurnado.length === 0) {
            return res.status(400).json({ error: "El estado 'recibido' debe contener una fecha y al menos un área asignada." });
        }

        // Generar un ID automático para el documento en la colección "inventario"
        const serieRef = db.collection("inventario").doc(); // ID generado automáticamente
        await serieRef.set({
            numeroExpediente,
            asunto,
            tipo,
            numeroFojas,
            soporteDocumental,
            condicionesAcceso,
            aniosReserva: aniosReserva || "0",
            tradicionDocumental,
            fechaApertura,
            fechaCierre: fechaCierre || "AAAA-MM-DD",
            inmueble,
            ubicacion,
            codigoSerie,
            nombreSerie,
            valorDocumental,
            aniosTramite,
            aniosConcentracion,
            anio,
            codigoSeccion,
            status: {
                recibido: {
                    fecha: recibido.fecha,
                    areaTurnado: recibido.areaTurnado,
                    observaciones: recibido.observaciones || "Sin observaciones"
                },
                tramite: {
                    fecha: tramite.fecha || "AAAA-MM-DD",
                    observaciones: tramite.observaciones || "Sin observaciones"
                },
                concluido: {
                    fecha: concluido.fecha || "AAAA-MM-DD",
                    observaciones: concluido.observaciones || "Sin observaciones"
                }
            }
        });

        return res.status(201).json({ message: "Inventario registrado con éxito", id: serieRef.id });
    } catch (error) {
        console.error("Error al registrar el inventario:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});


module.exports = router;
