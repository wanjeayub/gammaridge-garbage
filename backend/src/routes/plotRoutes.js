const express = require("express");
const { protect, admin } = require("../middleware/auth");
const {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  assignUsersToPlot,
} = require("../controllers/plotController");

const router = express.Router();

router
  .route("/")
  .get(protect, admin, getPlots)
  .post(protect, admin, createPlot);

router
  .route("/:id")
  .put(protect, admin, updatePlot)
  .delete(protect, admin, deletePlot);

router.route("/:id/assign").put(protect, admin, assignUsersToPlot);

module.exports = router;
