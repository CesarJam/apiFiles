const express = require("express");
const router = express.Router();
const { db } = require("./firebaseConfig");

/**
 * DEPENDENCIAS
 */
// Ruta para crear dependencias
router.post("/dependencias", async (req, res) => {
    try {
        console.log("Cuerpo de la solicitud:", req.body);
        const { nombre } = req.body;

        // Validar entrada
        if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
            return res.status(400).json({ error: "El nombre es obligatorio." });
        }

        // Crear documento en la colección "dependencias" con ID automático
        const nuevaDependenciaRef = await db.collection("dependencias").add({ nombre });

        return res.status(201).json({ 
            message: "Dependencia registrada con éxito", 
            id: nuevaDependenciaRef.id 
        });
    } catch (error) {
        console.error("Error al registrar la dependencia:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//Obtener las dependencias
router.get("/dependencias", async (req, res) => {
    try {
        const dependenciasSnapshot = await db.collection("dependencias").get();

        if (dependenciasSnapshot.empty) {
            return res.status(200).json({ message: "No hay dependencias registradas", data: [] });
        }

        const dependencias = dependenciasSnapshot.docs.map(doc => ({
            id: doc.id,
            nombre: doc.data().nombre || "Sin nombre"
        }));

        return res.status(200).json(dependencias);
    } catch (error) {
        console.error("Error al obtener dependencias:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//obtener la dependencia por id
router.get("/dependencias/:idDependencia", async (req, res) => {
    try {
        const { idDependencia } = req.params;

        if (!idDependencia || typeof idDependencia !== "string" || idDependencia.trim() === "") {
            return res.status(400).json({ error: "El parámetro 'idDependencia' es obligatorio y debe ser una cadena no vacía." });
        }

        // Obtener el documento de la dependencia por su ID
        const dependenciaRef = db.collection("dependencias").doc(idDependencia);
        const dependenciaDoc = await dependenciaRef.get();

        if (!dependenciaDoc.exists) {
            return res.status(404).json({ error: "Dependencia no encontrada" });
        }

        return res.status(200).json({ id: dependenciaDoc.id, ...dependenciaDoc.data() });

    } catch (error) {
        console.error("Error al obtener la dependencia:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Modificar una dependencia
router.put("/dependencias/:idDependencia", async (req, res) => {
    try {
        const { idDependencia } = req.params;
        const { nombre } = req.body;

        // Validar datos requeridos
        if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
            return res.status(400).json({ error: "Debes proporcionar un nombre válido para la dependencia." });
        }

        // Referencia al documento de la dependencia
        const dependenciaRef = db.collection("dependencias").doc(idDependencia);
        const dependenciaDoc = await dependenciaRef.get();

        if (!dependenciaDoc.exists) {
            return res.status(404).json({ error: "Dependencia no encontrada" });
        }

        // Actualizar los datos de la dependencia
        await dependenciaRef.update({ nombre });

        return res.status(200).json({ 
            message: "Dependencia actualizada con éxito", 
            id: idDependencia,
            nuevoNombre: nombre
        });

    } catch (error) {
        console.error("Error al actualizar la dependencia:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Eliminar una dependencia
router.delete("/dependencias/:idDependencia", async (req, res) => {
    try {
        const { idDependencia } = req.params;

        // Referencia al documento de la dependencia
        const dependenciaRef = db.collection("dependencias").doc(idDependencia);
        const dependenciaDoc = await dependenciaRef.get();

        if (!dependenciaDoc.exists) {
            return res.status(404).json({ error: "Dependencia no encontrada" });
        }

        // Eliminar la dependencia
        await dependenciaRef.delete();

        return res.status(200).json({ message: "Dependencia eliminada con éxito", id: idDependencia });
    } catch (error) {
        console.error("Error al eliminar la dependencia:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;