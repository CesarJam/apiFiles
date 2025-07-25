const express = require("express");
const seccionesRoutes = require("./secciones");
const seriesRoutes = require("./series");
const inventarioRoutes = require("./inventario");
const dependenciasRoutes = require("./dependencias");
const oficialiaRoutes = require("./oficialia");

const router = express.Router();

// Definir rutas
router.use("/secciones", seccionesRoutes);
router.use("/series", seriesRoutes);
router.use("/inventario", inventarioRoutes);
router.use("/dependencias", dependenciasRoutes);
router.use("/oficialia", oficialiaRoutes);

module.exports = router;
