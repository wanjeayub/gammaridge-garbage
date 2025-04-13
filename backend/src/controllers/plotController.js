const Plot = require("../models/Plot");
const Location = require("../models/Location");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// @desc    Get all plots
// @route   GET /api/plots
// @access  Private/Admin
const getPlots = asyncHandler(async (req, res) => {
  const plots = await Plot.find({})
    .populate("location", "name")
    .populate("users", "name email mobile");
  res.json(plots);
});

// @desc    Create a plot
// @route   POST /api/plots
// @access  Private/Admin
const createPlot = asyncHandler(async (req, res) => {
  const { plotNumber, bagsRequired, location } = req.body;

  const plotExists = await Plot.findOne({ plotNumber });
  if (plotExists) {
    res.status(400);
    throw new Error("Plot already exists");
  }

  const locationExists = await Location.findById(location);
  if (!locationExists) {
    res.status(400);
    throw new Error("Location not found");
  }

  const plot = await Plot.create({
    plotNumber,
    bagsRequired,
    location,
  });

  if (plot) {
    // Add plot to location
    locationExists.plots.push(plot._id);
    await locationExists.save();

    res.status(201).json(plot);
  } else {
    res.status(400);
    throw new Error("Invalid plot data");
  }
});

// @desc    Update plot
// @route   PUT /api/plots/:id
// @access  Private/Admin
const updatePlot = asyncHandler(async (req, res) => {
  const plot = await Plot.findById(req.params.id);

  if (plot) {
    plot.plotNumber = req.body.plotNumber || plot.plotNumber;
    plot.bagsRequired = req.body.bagsRequired || plot.bagsRequired;
    plot.location = req.body.location || plot.location;

    const updatedPlot = await plot.save();
    res.json(updatedPlot);
  } else {
    res.status(404);
    throw new Error("Plot not found");
  }
});

// @desc    Delete plot
// @route   DELETE /api/plots/:id
// @access  Private/Admin
const deletePlot = asyncHandler(async (req, res) => {
  const plot = await Plot.findById(req.params.id);

  if (plot) {
    // Remove plot from location
    await Location.updateOne(
      { _id: plot.location },
      { $pull: { plots: plot._id } }
    );

    // Remove plot from users
    await User.updateMany(
      { _id: { $in: plot.users } },
      { $pull: { plots: plot._id } }
    );

    await plot.remove();
    res.json({ message: "Plot removed" });
  } else {
    res.status(404);
    throw new Error("Plot not found");
  }
});

// @desc    Assign users to plot
// @route   PUT /api/plots/:id/assign
// @access  Private/Admin
const assignUsersToPlot = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const plot = await Plot.findById(req.params.id);

  if (!plot) {
    res.status(404);
    throw new Error("Plot not found");
  }

  // Verify all users exist
  const users = await User.find({ _id: { $in: userIds } });
  if (users.length !== userIds.length) {
    res.status(400);
    throw new Error("One or more users not found");
  }

  // Remove plot from previously assigned users
  await User.updateMany(
    { _id: { $in: plot.users } },
    { $pull: { plots: plot._id } }
  );

  // Assign new users to plot
  plot.users = userIds;
  await plot.save();

  // Add plot to new users
  await User.updateMany(
    { _id: { $in: userIds } },
    { $addToSet: { plots: plot._id } }
  );

  res.json({ message: "Users assigned successfully" });
});

module.exports = {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  assignUsersToPlot,
};
