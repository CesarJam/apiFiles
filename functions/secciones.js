const express = require("express");
const router = express.Router();
const { db } = require("./firebaseConfig");

/*---------------SECCIONES---------------- */
// Ruta para crear secciones

router.post("/cuadroGeneral", async (req, res) => {
    try {
        console.log("Cuerpo de la solicitud:", req.body);
        const { codigo, seccion, funcion } = req.body;       
        // Validar entrada
        if (!codigo || typeof codigo !== "string" || codigo.trim() === "" ||
        !seccion || typeof seccion !== "string" || seccion.trim() === "" ||
        !funcion || typeof funcion !== "string" || funcion.trim() === "") {
            return res.status(400).json({ error: "'código' 'sección' y 'función' es obligatorio y debe ser una cadena no vacía." });
        }
       // Crear documento con un ID personalizado (codigo)
       await db.collection('seccion').doc(codigo).set({ seccion, funcion });
       return res.status(201).json({ message: "Registro creado con éxito", id: codigo });
    } catch (error) {
        console.error("Error al crear el registro de código de archivo:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//consultas de get
// Obtener todos los registros
router.get("/cuadroGeneral", async (req, res) => {
    try {
        const snapshot = await db.collection('seccion').get();
        if (snapshot.empty) {
            return res.status(200).json({ message: "No hay registros encontrados", data: [] });
        }
        const documentos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json(documentos);
    } catch (error) {
        console.error("Error al obtener registros:", error);
        res.status(500).json({ 
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtener un registro específico por ID
router.get("/cuadroGeneral/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('seccion').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }
        res.status(200).json({
            id: doc.id,
            ...doc.data()
        });
    } catch (error) {
        console.error("Error al obtener registro:", error);
        res.status(500).json({ 
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

//Modificar registro
router.put("/cuadroGeneral/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {seccion } = req.body;
        //const FieldValue = admin.firestore.FieldValue; // Referencia correcta
        console.log("Cuerpo de la solicitud:", req.body);
        // Validar que al menos un campo sea proporcionado
        if (!seccion) {
            return res.status(400).json({ 
                error: "Debe proporcionar al menos uno de los campos:  'seccion'" 
            });
        }
        // Objeto para almacenar las actualizaciones
        const actualizaciones = {};
        // Validar y sanitizar 'seccion' si está presente
        if (seccion) {
            if (typeof seccion !== "string" || seccion.trim() === "") {
                return res.status(400).json({ 
                    error: "'seccion' debe ser una cadena no vacía" 
                });
            }
            actualizaciones.seccion = seccion.trim();
        }
        // Verificar existencia del documento
        const docRef = db.collection('seccion').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }
        console.log("Actualizaciones a aplicar:", actualizaciones);
        await docRef.update({
            ...actualizaciones,  // Solo las actualizaciones que quieras aplicar
            actualizadoEl: new Date().toLocaleString('es-MX')
        });
        // Obtener documento actualizado
        const documentoActualizado = await docRef.get();
        res.status(200).json({
            message: "Registro actualizado con éxito",
            data: {
                id: documentoActualizado.id,
                ...documentoActualizado.data()
            }
        });
    } catch (error) {
        console.error("Error al actualizar el registro:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Eliminar un registro por ID
router.delete("/cuadroGeneral/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Referencia al documento en Firestore
        const docRef = db.collection('seccion').doc(id);
        const doc = await docRef.get();

        // Verificar si el documento existe
        if (!doc.exists) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        // Eliminar el documento
        await docRef.delete();
        res.status(200).json({ message: "Registro eliminado con éxito", id });
    } catch (error) {
        console.error("Error al eliminar el registro:", error);
        res.status(500).json({ 
            error: "Error interno del servidor",
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
