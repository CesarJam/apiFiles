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

// Consultar inventario por fechaRecibido y areaRecibido
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
});

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
router.post("/inventarioStatus", async (req, res) => {
  try {
    console.log("Cuerpo de la solicitud:", req.body);

    const {
      numeroExpediente,
      asunto,
      listaDeDependencias,
      numeroFojas,
      soporteDocumental,
      condicionesAcceso,
      aniosReserva,
      tradicionDocumental,
      inmueble,
      ubicacion,
      subserie,
      status
    } = req.body;

    // Validar campos obligatorios básicos
    if (
      !numeroExpediente || !asunto || !Array.isArray(listaDeDependencias) || listaDeDependencias.length === 0 ||
      !numeroFojas || !soporteDocumental || !condicionesAcceso || !aniosReserva ||
      !tradicionDocumental || !inmueble || !ubicacion ||
      !subserie || typeof subserie !== "object" ||
      !subserie.codigoSubserie || !subserie.nombreSubserie || !subserie.valorDocumental ||
      !subserie.aniosTramite || !subserie.aniosConcentracion
    ) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben estar completos y correctos." });
    }

    // Validar status
    const statusData = status && typeof status === "object" ? status : {};
    const registro = statusData.registro || {};
    const tramite = statusData.tramite || {};
    const concluido = statusData.concluido || {};

    const docRef = db.collection("inventario").doc();

    await docRef.set({
      numeroExpediente,
      asunto,
      listaDeDependencias,
      status: {
        registro: {
          tipo: registro.tipo || "Desconocido",
          areaCreado: registro.areaCreado || "Sin asignar",
          fechaRegistro: registro.fechaRegistro || new Date().toISOString().split("T")[0],
          horaRegistro: registro.horaRegistro || new Date().toLocaleTimeString(),
          areaTurnado: Array.isArray(registro.areaTurnado) ? registro.areaTurnado : [],
          observacionesRegistro: registro.observacionesRegistro || "Sin observaciones",
          usuario: registro.usuario || "Administrador"
        },
        tramite: {
          fechaTramite: tramite.fechaTramite || "AAAA-MM-DD",
          horaTramite: tramite.horaTramite || "Sin asignar",
          observacionesTramite: tramite.observacionesTramite || "Sin observaciones",
          usuario: tramite.usuario || "Administrador"
        },
        concluido: {
          fechaConcluido: concluido.fechaConcluido || "AAAA-MM-DD",
          horaConcluido: concluido.horaConcluido || "Sin asignar",
          observacionesConcluido: concluido.observacionesConcluido || "Sin observaciones",
          usuario: concluido.usuario || "Administrador"
        }
      },
      numeroFojas,
      soporteDocumental,
      condicionesAcceso,
      aniosReserva,
      tradicionDocumental,
      inmueble,
      ubicacion,
      subserie: {
        codigoSubserie: subserie.codigoSubserie,
        nombreSubserie: subserie.nombreSubserie,
        valorDocumental: subserie.valorDocumental,
        aniosTramite: subserie.aniosTramite,
        aniosConcentracion: subserie.aniosConcentracion
      }
    });

    return res.status(201).json({ message: "Inventario registrado con éxito", id: docRef.id });

  } catch (error) {
    console.error("Error al registrar el inventario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});



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
