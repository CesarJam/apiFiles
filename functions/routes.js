const express = require("express");
const seccionesRoutes = require("./secciones");
const seriesRoutes = require("./series");

const router = express.Router();

// Definir rutas
router.use("/secciones", seccionesRoutes);
router.use("/series", seriesRoutes);

module.exports = router;
