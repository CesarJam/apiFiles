const express = require("express");
const seccionesRoutes = require("./secciones");
const seriesRoutes = require("./series");
const inventarioRoutes = require("./inventario");

const router = express.Router();

// Definir rutas
router.use("/secciones", seccionesRoutes);
router.use("/series", seriesRoutes);
router.use("/inventario", inventarioRoutes);

module.exports = router;
