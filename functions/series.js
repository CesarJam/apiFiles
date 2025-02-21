const express = require("express");
const router = express.Router();
const { db } = require("./firebaseConfig");


/**
 * SERIES DOCUMENTALES
 */
// Ruta para crear series y subseries
router.post("/series", async (req, res) => {
    try {
        console.log("Cuerpo de la solicitud:", req.body);
        const { codigo, nombre, codigoSeccion, subseries } = req.body;

        // Validar entrada
        if (!codigo || typeof codigo !== "string" || codigo.trim() === "" ||
            !nombre || typeof nombre !== "string" || nombre.trim() === "" ||
            !Array.isArray(subseries) || subseries.length === 0) {
            return res.status(400).json({ error: "Código, nombre y al menos una subserie son obligatorios." });
        }

        // Crear documento en la colección "Series"
        const serieRef = db.collection("series").doc(codigo);
        await serieRef.set({ nombre,codigoSeccion });

        // Agregar subseries a la subcolección "Subseries"
        const subseriesRef = serieRef.collection("subseries");
        for (const sub of subseries) {
            if (!sub.codigo || !sub.nombre) {
                return res.status(400).json({ error: "Cada subserie debe tener un código y un nombre." });
            }
            await subseriesRef.doc(sub.codigo).set({ nombre: sub.nombre });
        }

        return res.status(201).json({ message: "Serie y subseries registradas con éxito", id: codigo });
    } catch (error) {
        console.error("Error al registrar la serie:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//Obtener las series y subseries (todas)
router.get("/series", async (req, res) => {
    try {
        const seriesSnapshot = await db.collection("series").get();

        if (seriesSnapshot.empty) {
            return res.status(200).json({ message: "No hay series registradas", data: [] });
        }

        const series = [];

        for (const serieDoc of seriesSnapshot.docs) {
            const serieData = serieDoc.data();
            const serieId = serieDoc.id;

            // Obtener subseries de la subcolección
            const subseriesSnapshot = await db.collection("series").doc(serieId).collection("subseries").get();
            const subseries = subseriesSnapshot.docs.map(sub => ({
                id: sub.id,
                ...sub.data()
            }));

            series.push({
                id: serieId,
                ...serieData,
                subseries
            });
        }

        return res.status(200).json(series);
    } catch (error) {
        console.error("Error al obtener series:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//obtener las series y subseries especificas de una seccion(area)
router.get("/series/codigoSeccion/:codigoSeccion", async (req, res) => {
    try {
        const { codigoSeccion } = req.params;

        if (!codigoSeccion || typeof codigoSeccion !== "string" || codigoSeccion.trim() === "") {
            return res.status(400).json({ error: "El parámetro 'codigoSeccion' es obligatorio y debe ser una cadena no vacía." });
        }

        // Realizar la consulta para obtener las series que coincidan con el 'codigoSeccion'
        const seriesSnapshot = await db.collection("series").where("codigoSeccion", "==", codigoSeccion).get();

        if (seriesSnapshot.empty) {
            return res.status(200).json({ message: "No se encontraron series con ese 'codigoSeccion'", data: [] });
        }

        // Crear una lista con los resultados de la consulta
        const series = [];

        for (const serieDoc of seriesSnapshot.docs) {
            const serieData = {
                id: serieDoc.id,
                ...serieDoc.data()
            };

            // Consultar las subseries de la subcolección "Subseries" de cada serie
            const subseriesSnapshot = await serieDoc.ref.collection("subseries").get();
            if (!subseriesSnapshot.empty) {
                const subseries = subseriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                serieData.subseries = subseries;
            } else {
                serieData.subseries = [];  // Si no hay subseries, asignamos un array vacío
            }

            series.push(serieData);
        }

        return res.status(200).json(series);
    } catch (error) {
        console.error("Error al consultar las series por 'codigoSeccion':", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//obtener todos los datos de una serie en especifica
// Obtener una serie específica por su ID
router.get("/series/:idSerie", async (req, res) => {
    try {
        const { idSerie } = req.params; // Obtener el ID de la serie desde la URL

        // Verificar si la serie existe
        const serieRef = db.collection("series").doc(idSerie);
        const serieDoc = await serieRef.get();

        if (!serieDoc.exists) {
            return res.status(404).json({ message: "Serie no encontrada" });
        }

        // Obtener los datos de la serie
        const serieData = serieDoc.data();

        // Obtener las subseries de la subcolección
        const subseriesSnapshot = await serieRef.collection("subseries").get();
        const subseries = subseriesSnapshot.docs.map(sub => ({
            id: sub.id,
            ...sub.data()
        }));

        // Construir la respuesta
        const serie = {
            id: serieDoc.id,
            ...serieData,
            subseries
        };

        return res.status(200).json(serie);
    } catch (error) {
        console.error("Error al obtener la serie:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Modificar la serie y sus subseries
router.put("/series/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, codigoSeccion, subseries } = req.body;

        // Validar datos requeridos
        if (!nombre || !codigoSeccion) {
            return res.status(400).json({ error: "Debes proporcionar un nombre y un código de sección para la serie." });
        }

        // Referencia al documento de la serie
        const serieRef = db.collection("series").doc(id);
        const serieDoc = await serieRef.get();

        if (!serieDoc.exists) {
            return res.status(404).json({ error: "Serie no encontrada" });
        }

        // Actualizar los datos de la serie
        await serieRef.update({ nombre, codigoSeccion });

        // Si se proporcionan subseries, actualizarlas
        if (subseries && Array.isArray(subseries)) {
            const subseriesRef = serieRef.collection("subseries");

            // Eliminar todas las subseries existentes
            const subseriesSnapshot = await subseriesRef.get();
            const batch = db.batch();
            subseriesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Agregar las nuevas subseries
            for (const sub of subseries) {
                if (sub.codigo && sub.nombre) {
                    await subseriesRef.doc(sub.codigo).set({
                        nombre: sub.nombre
                    });
                }
            }
        }

        return res.status(200).json({ 
            message: "Serie y subseries actualizadas con éxito", 
            serieId: id, 
            nuevoNombre: nombre,
            nuevoCodigoSeccion: codigoSeccion,
            subseriesActualizadas: subseries || []
        });
    } catch (error) {
        console.error("Error al actualizar la serie y subseries:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Modificar la serie y subseries desde el CADIDO
router.put("/seriesCADIDO/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, codigoSeccion, subseries } = req.body;

        // Validar datos requeridos
        if (!nombre || !codigoSeccion) {
            return res.status(400).json({ error: "Debes proporcionar un nombre y un código de sección para la serie." });
        }

        // Referencia al documento de la serie
        const serieRef = db.collection("series").doc(id);
        const serieDoc = await serieRef.get();

        if (!serieDoc.exists) {
            return res.status(404).json({ error: "Serie no encontrada" });
        }

        // Actualizar los datos de la serie
        await serieRef.update({ nombre, codigoSeccion });

        // Si se proporcionan subseries, actualizarlas
        if (subseries && Array.isArray(subseries)) {
            const subseriesRef = serieRef.collection("subseries");

            // Eliminar todas las subseries existentes
            const subseriesSnapshot = await subseriesRef.get();
            const batchDelete = db.batch();
            subseriesSnapshot.forEach(doc => {
                batchDelete.delete(doc.ref);
            });
            await batchDelete.commit();

            // Agregar las nuevas subseries
            for (const sub of subseries) {
                if (sub.codigo && sub.nombre && sub.aniosTramite && sub.datosPersonales && sub.valoresDocumentales &&
                    sub.aniosConcentracion && sub.tecnicaSeleccion && sub.observaciones) {
                    await subseriesRef.doc(sub.codigo).set({
                        nombre: sub.nombre, 
                        aniosTramite: sub.aniosTramite,
                        datosPersonales: sub.datosPersonales,
                        valoresDocumentales: sub.valoresDocumentales,
                        aniosConcentracion: sub.aniosConcentracion,
                        tecnicaSeleccion: sub.tecnicaSeleccion,
                        observaciones: sub.observaciones
                    });
                }
            }
        }

        return res.status(200).json({ 
            message: "Serie y subseries actualizadas con éxito", 
            serieId: id, 
            nuevoNombre: nombre,
            nuevoCodigoSeccion: codigoSeccion,
            subseriesActualizadas: subseries || []
        });
    } catch (error) {
        console.error("Error al actualizar la serie y subseries:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//Agregar mas subseries a la serie especifica agregada anteriormente
router.put("/series/:id/subseries", async (req, res) => {
    try {
        const { id } = req.params;
        const { subseries } = req.body;

        if (!Array.isArray(subseries) || subseries.length === 0) {
            return res.status(400).json({ error: "Debes proporcionar al menos una subserie en un array." });
        }

        // Verificar si la serie existe
        const serieRef = db.collection("series").doc(id);
        const serieDoc = await serieRef.get();

        if (!serieDoc.exists) {
            return res.status(404).json({ error: "Serie no encontrada" });
        }

        // Agregar nuevas subseries a la subcolección "Subseries"
        const subseriesRef = serieRef.collection("subseries");
        for (const sub of subseries) {
            if (!sub.codigo || !sub.nombre) {
                return res.status(400).json({ error: "Cada subserie debe tener un código y un nombre." });
            }
            await subseriesRef.doc(sub.codigo).set({ nombre: sub.nombre });
        }

        return res.status(200).json({ message: "Subseries agregadas con éxito a la serie", serieId: id });
    } catch (error) {
        console.error("Error al agregar subseries:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//Eliminar la serie con todas sus subseries
router.delete("/series/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Referencia al documento de la serie
        const serieRef = db.collection("series").doc(id);
        const serieDoc = await serieRef.get();

        if (!serieDoc.exists) {
            return res.status(404).json({ error: "Serie no encontrada" });
        }

        // Referencia a la subcolección de subseries
        const subseriesRef = serieRef.collection("subseries");
        const subseriesSnapshot = await subseriesRef.get();

        // Eliminar todas las subseries de la serie
        const batch = db.batch();
        subseriesSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Eliminar la serie principal
        batch.delete(serieRef);

        // Ejecutar la eliminación en batch
        await batch.commit();

        return res.status(200).json({ message: "Serie y sus subseries eliminadas con éxito", serieId: id });
    } catch (error) {
        console.error("Error al eliminar la serie:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

//Eliminar una subserie especifica a partir del id de la serie y el id de la subserie
router.delete("/series/:serieId/subseries/:subserieId", async (req, res) => {
    try {
        const { serieId, subserieId } = req.params;

        // Referencia a la serie
        const serieRef = db.collection("series").doc(serieId);
        const serieDoc = await serieRef.get();

        if (!serieDoc.exists) {
            return res.status(404).json({ error: "Serie no encontrada" });
        }

        // Referencia a la subserie específica dentro de la serie
        const subserieRef = serieRef.collection("subseries").doc(subserieId);
        const subserieDoc = await subserieRef.get();

        if (!subserieDoc.exists) {
            return res.status(404).json({ error: "Subserie no encontrada" });
        }

        // Eliminar la subserie
        await subserieRef.delete();

        return res.status(200).json({ 
            message: "Subserie eliminada con éxito", 
            serieId, 
            subserieId 
        });

    } catch (error) {
        console.error("Error al eliminar la subserie:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});


module.exports = router;