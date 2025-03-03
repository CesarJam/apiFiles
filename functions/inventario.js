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
            anio
        } = req.body;

        // Validar campos obligatorios
        if (
            !numeroExpediente || typeof numeroExpediente !== "string" || numeroExpediente.trim() === "" ||
            !codigoSerie || typeof codigoSerie !== "string" || codigoSerie.trim() === "" ||
            !asunto || typeof asunto !== "string" || asunto.trim() === ""
        ) {
            return res.status(400).json({ error: "Número de expediente, código de serie y asunto son obligatorios." });
        }

        // Generar un ID automático para el documento en la colección "inventario"
        const serieRef = db.collection("inventario").doc(); // ID generado automáticamente
        await serieRef.set({
            id: serieRef.id, // Guardar el ID generado
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
            anio
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

//consultar inventario por año
router.get("/inventario/anio/:anio", async (req, res) => {
    try {
        const { anio } = req.params;

        if (!anio || isNaN(anio)) {
            return res.status(400).json({ error: "El año es obligatorio y debe ser numérico." });
        }

        const inventarioRef = db.collection("inventario");
        const snapshot = await inventarioRef.where("anio", "==", anio).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: `No hay registros en el inventario para el año ${anio}.` });
        }

        const inventarios = [];
        snapshot.forEach(doc => {
            inventarios.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json(inventarios);
    } catch (error) {
        console.error("Error al obtener el inventario por año:", error);
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



module.exports = router;
