const express = require("express");
const router = express.Router();
const { db, FieldValue } = require("./firebaseConfig");

router.post("/oficialia", async (req, res) => {
  const {
    numeroExpediente,
    asunto,
    areaDeRegistro,
    listaDeDependencias,
    datosGenerales,
    registro
  } = req.body;

  // 1. Validar solo lo esencial de Oficialía
  if (
    !numeroExpediente ||
    !asunto ||
    !areaDeRegistro ||
    !listaDeDependencias ||
    !datosGenerales ||
    !registro ||
    !registro.areaDestino ||
    !registro.fecha ||
    !registro.hora ||
    !registro.usuario
  ) {
    return res
      .status(400)
      .json({ error: "Faltan campos requeridos para registro en Oficialía." });
  }

  // 2. Marcar un estado intermedio
  const statusActual = "enOficialia";
  const anioRegistro = parseInt(registro.fecha.split("-")[0]);

  // 3. Construir y guardar
  const docRef = db.collection("inventario").doc();
  await docRef.set({
    numeroExpediente,
    asunto,
    listaDeDependencias,
    anioRegistro,
    statusActual,
    areaDeRegistro,
    areasInvolucradas: [ ...registro.areaDestino ],
    datosGenerales,
    historialMovimientos: [{
      ...registro,
      tipo: "registroOficialia",
      areaOrigen: areaDeRegistro
    }]
    // <-- Sin subserie aquí
  });

  res.status(201).json({ message: "Registrado en Oficialía", id: docRef.id });
});


module.exports = router;
