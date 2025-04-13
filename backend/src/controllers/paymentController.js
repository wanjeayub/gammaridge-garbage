const Payment = require("../models/Payment");
const Plot = require("../models/Plot");
const asyncHandler = require("express-async-handler");
const moment = require("moment");

// @desc    Get all payments for a plot
// @route   GET /api/payments/plot/:plotId
// @access  Private/Admin
const getPaymentsByPlot = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ plot: req.params.plotId }).sort({
    dueDate: 1,
  });
  res.json(payments);
});

// @desc    Create a payment schedule
// @route   POST /api/payments
// @access  Private/Admin
const createPayment = asyncHandler(async (req, res) => {
  const { plot, expectedAmount, dueDate } = req.body;

  const plotExists = await Plot.findById(plot);
  if (!plotExists) {
    res.status(400);
    throw new Error("Plot not found");
  }

  const month = moment(dueDate).format("MMMM");
  const year = moment(dueDate).format("YYYY");

  const payment = await Payment.create({
    plot,
    expectedAmount,
    paidAmount: 0,
    dueDate,
    month,
    year,
  });

  if (payment) {
    // Add payment to plot
    plotExists.paymentSchedules.push(payment._id);
    await plotExists.save();

    res.status(201).json(payment);
  } else {
    res.status(400);
    throw new Error("Invalid payment data");
  }
});

// @desc    Update payment schedule
// @route   PUT /api/payments/:id
// @access  Private/Admin
const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    payment.expectedAmount = req.body.expectedAmount || payment.expectedAmount;
    payment.paidAmount = req.body.paidAmount || payment.paidAmount;
    payment.dueDate = req.body.dueDate || payment.dueDate;
    payment.isPaid =
      req.body.isPaid !== undefined ? req.body.isPaid : payment.isPaid;

    if (req.body.dueDate) {
      payment.month = moment(req.body.dueDate).format("MMMM");
      payment.year = moment(req.body.dueDate).format("YYYY");
    }

    const updatedPayment = await payment.save();

    res.json(updatedPayment);
  } else {
    res.status(404);
    throw new Error("Payment not found");
  }
});

// @desc    Delete payment schedule
// @route   DELETE /api/payments/:id
// @access  Private/Admin
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    // Remove payment from plot
    await Plot.updateOne(
      { _id: payment.plot },
      { $pull: { paymentSchedules: payment._id } }
    );

    await payment.remove();
    res.json({ message: "Payment removed" });
  } else {
    res.status(404);
    throw new Error("Payment not found");
  }
});

// @desc    Transfer unpaid payments to next month
// @route   POST /api/payments/transfer/:plotId
// @access  Private/Admin
const transferPayments = asyncHandler(async (req, res) => {
  const plot = await Plot.findById(req.params.plotId);
  if (!plot) {
    res.status(404);
    throw new Error("Plot not found");
  }

  // Get unpaid payments for this plot
  const unpaidPayments = await Payment.find({
    plot: plot._id,
    isPaid: false,
  });

  if (unpaidPayments.length === 0) {
    res.status(400);
    throw new Error("No unpaid payments to transfer");
  }

  // Create new payments for next month
  const nextMonth = moment().add(1, "month");
  const newPayments = await Promise.all(
    unpaidPayments.map(async (payment) => {
      const newPayment = await Payment.create({
        plot: plot._id,
        expectedAmount: payment.expectedAmount,
        paidAmount: 0,
        dueDate: nextMonth.toDate(),
        month: nextMonth.format("MMMM"),
        year: nextMonth.format("YYYY"),
        carriedOver: true,
      });

      // Add new payment to plot
      plot.paymentSchedules.push(newPayment._id);
      return newPayment;
    })
  );

  await plot.save();

  res.json(newPayments);
});

// @desc    Get monthly summary
// @route   GET /api/payments/summary/:month/:year
// @access  Private/Admin
const getMonthlySummary = asyncHandler(async (req, res) => {
  const { month, year } = req.params;

  const payments = await Payment.find({
    month,
    year,
  });

  const totalExpected = payments.reduce(
    (sum, payment) => sum + payment.expectedAmount,
    0
  );
  const totalPaid = payments.reduce(
    (sum, payment) => sum + payment.paidAmount,
    0
  );

  res.json({
    totalExpected,
    totalPaid,
    paymentCount: payments.length,
    paidCount: payments.filter((p) => p.isPaid).length,
  });
});

module.exports = {
  getPaymentsByPlot,
  createPayment,
  updatePayment,
  deletePayment,
  transferPayments,
  getMonthlySummary,
};
