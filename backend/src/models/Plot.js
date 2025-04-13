const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema(
  {
    plotNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bagsRequired: {
      type: Number,
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    paymentSchedules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Plot", plotSchema);
