const express = require("express");
const { protect, admin } = require("../middleware/auth");
const {
  getPaymentsByPlot,
  createPayment,
  updatePayment,
  deletePayment,
  transferPayments,
  getMonthlySummary,
} = require("../controllers/paymentController");

const router = express.Router();

router.route("/plot/:plotId").get(protect, admin, getPaymentsByPlot);

router.route("/").post(protect, admin, createPayment);

router
  .route("/:id")
  .put(protect, admin, updatePayment)
  .delete(protect, admin, deletePayment);

router.route("/transfer/:plotId").post(protect, admin, transferPayments);

router.route("/summary/:month/:year").get(protect, admin, getMonthlySummary);

module.exports = router;
