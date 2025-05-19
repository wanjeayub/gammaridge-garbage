import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  addUsersToPlot,
  removeUserFromPlot,
  reset as resetPlot,
} from "../../features/plots/plotSlice";
import {
  getPaymentsByPlot,
  createPayment,
  updatePayment,
  deletePayment,
  transferPayments,
  getMonthlySummary,
  getPaymentsByMonth,
  reset as resetPayment,
} from "../../features/payments/paymentSlice";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  reset as resetLocation,
} from "../../features/locations/locationSlice";

// UI Components
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Fab,
  Select,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  DatePicker,
  LocalizationProvider,
  MobileDatePicker,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  AttachMoney,
  LocationOn,
  Home,
  People,
  CalendarToday,
  Add,
  Edit,
  Delete,
  TransferWithinAStation,
  Refresh,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  BarChart,
  Receipt,
  Search,
  ExpandMore,
  FilterList,
  Sort,
  ChevronRight,
  Payment,
} from "@mui/icons-material";
import GroupedPaymentsTable from "../UI/GroupedPaymentsTable";

// Custom Components
const StatCard = ({ icon, title, value, color, onClick }) => (
  <Card
    sx={{
      height: "100%",
      borderRadius: 3,
      boxShadow: 3,
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        transform: onClick ? "translateY(-4px)" : "none",
        boxShadow: onClick ? 6 : 3,
      },
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" alignItems="center" mb={1}>
        <Avatar
          sx={{
            bgcolor: `${color}.main`,
            color: `${color}.contrastText`,
            mr: 2,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const PaymentStatusChip = ({ status, amount, expected }) => {
  const theme = useTheme();

  const getStatusDetails = () => {
    if (status === "paid") {
      return {
        label: "Paid",
        color: "success",
        icon: <CheckCircle fontSize="small" />,
      };
    }
    if (status === "partial") {
      return {
        label: `Partial (KSh ${amount?.toLocaleString()}/${expected?.toLocaleString()})`,
        color: "warning",
        icon: <Warning fontSize="small" />,
      };
    }
    if (status === "overdue") {
      return {
        label: "Overdue",
        color: "error",
        icon: <ErrorIcon fontSize="small" />,
      };
    }
    return {
      label: "Pending",
      color: "info",
      icon: <Info fontSize="small" />,
    };
  };

  const details = getStatusDetails();

  return (
    <Chip
      icon={details.icon}
      label={details.label}
      color={details.color}
      size="small"
      sx={{
        fontWeight: 600,
        px: 1,
        borderRadius: 1,
      }}
    />
  );
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State from Redux
  const { plots, isLoading: plotsLoading } = useSelector(
    (state) => state.plots
  );
  const {
    payments,
    monthlyPayments = [],
    summary,
    isLoading: paymentsLoading,
  } = useSelector((state) => state.payments);

  const { locations, isLoading: locationsLoading } = useSelector(
    (state) => state.locations
  );

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [currentItem, setCurrentItem] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "plotNumber",
    direction: "asc",
  });
  const [filter, setFilter] = useState("all");

  // Form states
  const [plotForm, setPlotForm] = useState({
    plotNumber: "",
    bagsRequired: 0,
    location: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    plot: "",
    expectedAmount: "",
    paidAmount: "",
    dueDate: new Date(),
    isPaid: false,
  });
  const [locationForm, setLocationForm] = useState({
    name: "",
  });
  const [userAssignment, setUserAssignment] = useState({
    userIds: [],
  });

  // Fetch initial data
  useEffect(() => {
    dispatch(getPlots());
    dispatch(getLocations());
    dispatch(
      getPaymentsByMonth({
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
      })
    );
  }, [dispatch]);

  // Fetch summary when month changes
  useEffect(() => {
    const month = selectedMonth.getMonth() + 1;
    const year = selectedMonth.getFullYear();
    dispatch(getMonthlySummary({ month, year }));
    dispatch(getPaymentsByMonth({ month, year }));
  }, [selectedMonth, dispatch]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedLocation(null);
    setSelectedPlot(null);
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSelectedPlot(null);
  };

  // Handle plot selection
  const handlePlotSelect = (plot) => {
    setSelectedPlot(plot);
    dispatch(getPaymentsByPlot(plot._id));
  };

  // Handle dialog open
  const handleDialogOpen = (type, item = null) => {
    setDialogType(type);
    setCurrentItem(item);

    if (type === "editPlot" && item) {
      setPlotForm({
        plotNumber: item.plotNumber,
        bagsRequired: item.bagsRequired,
        location: item.location?._id || "",
      });
    } else if (type === "addPayment" && item) {
      setPaymentForm({
        plot: item._id,
        expectedAmount: "",
        paidAmount: "",
        dueDate: new Date(),
        isPaid: false,
      });
    } else if (type === "editPayment" && item) {
      setPaymentForm({
        plot: item.plot?._id || "",
        expectedAmount: item.expectedAmount,
        paidAmount: item.paidAmount,
        dueDate: new Date(item.dueDate),
        isPaid: item.isPaid,
      });
    } else if (type === "editLocation" && item) {
      setLocationForm({
        name: item.name,
      });
    } else if (type === "assignUsers" && item) {
      setUserAssignment({
        userIds: item.users?.map((user) => user._id) || [],
      });
    }

    setOpenDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setDialogType("");
    setCurrentItem(null);
    setPlotForm({
      plotNumber: "",
      bagsRequired: 0,
      location: "",
    });
    setPaymentForm({
      plot: "",
      expectedAmount: "",
      paidAmount: "",
      dueDate: new Date(),
      isPaid: false,
    });
    setLocationForm({
      name: "",
    });
    setUserAssignment({
      userIds: [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      switch (dialogType) {
        // Payment Cases
        case "addPayment":
          await dispatch(
            createPayment({
              plot: paymentForm.plot,
              expectedAmount: paymentForm.expectedAmount,
              paidAmount: paymentForm.paidAmount || 0,
              dueDate: paymentForm.dueDate,
              isPaid: paymentForm.isPaid,
            })
          ).unwrap();
          // Refresh payments for the current plot or month
          if (selectedPlot) {
            await dispatch(getPaymentsByPlot(selectedPlot._id));
          } else {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            await dispatch(getPaymentsByMonth({ month, year }));
            await dispatch(getMonthlySummary({ month, year }));
          }
          break;

        case "editPayment":
          await dispatch(
            updatePayment({
              paymentId: currentItem._id,
              paymentData: {
                expectedAmount: paymentForm.expectedAmount,
                paidAmount: paymentForm.paidAmount,
                dueDate: paymentForm.dueDate,
                isPaid: paymentForm.isPaid,
              },
            })
          ).unwrap();
          // Refresh payments
          if (selectedPlot) {
            await dispatch(getPaymentsByPlot(selectedPlot._id));
          } else {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            await dispatch(getPaymentsByMonth({ month, year }));
          }
          break;

        // Plot Cases
        case "addPlot":
          await dispatch(createPlot(plotForm)).unwrap();
          await dispatch(getPlots()); // Refresh plots list
          if (plotForm.location) {
            await dispatch(getLocations()); // Refresh locations if needed
          }
          break;

        case "editPlot":
          await dispatch(
            updatePlot({ plotId: currentItem._id, plotData: plotForm })
          ).unwrap();
          await dispatch(getPlots()); // Refresh plots list
          if (plotForm.location !== currentItem.location?._id) {
            await dispatch(getLocations()); // Refresh locations if changed
          }
          break;

        // Location Cases
        case "addLocation":
          await dispatch(createLocation(locationForm)).unwrap();
          await dispatch(getLocations()); // Refresh locations list
          break;

        case "editLocation":
          await dispatch(
            updateLocation({
              locationId: currentItem._id,
              locationData: locationForm,
            })
          ).unwrap();
          await dispatch(getLocations()); // Refresh locations list
          await dispatch(getPlots()); // Refresh plots as they depend on locations
          break;

        // User Assignment Case
        case "assignUsers":
          await dispatch(
            addUsersToPlot({
              plotId: currentItem._id,
              userIds: userAssignment.userIds,
            })
          ).unwrap();
          await dispatch(getPlots()); // Refresh plots to show updated assignments
          break;

        default:
          break;
      }

      setSnackbar({
        open: true,
        message: "Operation successful!",
        severity: "success",
      });
      handleDialogClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "An error occurred",
        severity: "error",
      });
    }
  };
  // Handle delete
  const handleDelete = async (type, id) => {
    try {
      switch (type) {
        case "plot":
          await dispatch(deletePlot(id)).unwrap();
          setSnackbar({
            open: true,
            message: "Plot deleted successfully",
            severity: "success",
          });
          break;
        case "payment":
          await dispatch(deletePayment(id)).unwrap();
          setSnackbar({
            open: true,
            message: "Payment schedule deleted successfully",
            severity: "success",
          });
          break;
        case "location":
          await dispatch(deleteLocation(id)).unwrap();
          setSnackbar({
            open: true,
            message: "Location deleted successfully",
            severity: "success",
          });
          break;
        default:
          break;
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || "An error occurred",
        severity: "error",
      });
    }
  };

  // Handle transfer payments
  const handleTransferPayments = async (plotId) => {
    try {
      await dispatch(transferPayments(plotId)).unwrap();
      setSnackbar({
        open: true,
        message: "Payments transferred successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || "An error occurred",
        severity: "error",
      });
    }
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort and filter plots
  const filteredPlots = plots
    .filter((plot) => {
      // Filter by selected location
      if (selectedLocation && plot.location?._id !== selectedLocation._id)
        return false;

      // Filter by search term
      if (
        searchTerm &&
        !plot.plotNumber.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  // Filter payments based on status
  const filteredPayments = (
    selectedPlot ? payments || [] : monthlyPayments || []
  ).filter((payment) => {
    if (filter === "all") return true;
    if (filter === "paid") return payment.isPaid;
    if (filter === "pending")
      return !payment.isPaid && new Date(payment.dueDate) > new Date();
    if (filter === "overdue")
      return !payment.isPaid && new Date(payment.dueDate) < new Date();
    if (filter === "partial")
      return (
        payment.paidAmount > 0 && payment.paidAmount < payment.expectedAmount
      );
    return true;
  });

  // Calculate summary stats
  const totalPlots = plots.length;
  const totalPayments = monthlyPayments.length;
  const totalLocations = locations.length;
  const totalCollectors = [
    ...new Set(plots.flatMap((plot) => plot.users?.map((user) => user._id))),
  ].length;

  // Get payment status
  const getPaymentStatus = (payment) => {
    if (payment.isPaid) return "paid";
    if (payment.paidAmount > 0) return "partial";
    if (new Date(payment.dueDate) < new Date()) return "overdue";
    return "pending";
  };

  return (
    <Box
      sx={{
        p: isMobile ? 1 : 3,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        sx={{ color: theme.palette.text.primary }}
      >
        Payment Management
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Home />}
            title="Total Plots"
            value={totalPlots}
            color="primary"
            onClick={() => {
              setActiveTab(1);
              setSelectedLocation(null);
              setSelectedPlot(null);
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Receipt />}
            title="Total Payments"
            value={totalPayments}
            color="secondary"
            onClick={() => {
              setActiveTab(0);
              setSelectedLocation(null);
              setSelectedPlot(null);
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<LocationOn />}
            title="Locations"
            value={totalLocations}
            color="info"
            onClick={() => {
              setActiveTab(1);
              setSelectedLocation(null);
              setSelectedPlot(null);
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<People />}
            title="Collectors"
            value={totalCollectors}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Monthly Summary */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: 3,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #2c3e50 0%, #4a6491 100%)"
              : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: theme.palette.mode === "dark" ? "#fff" : "inherit" }}
            >
              Monthly Summary
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {isMobile ? (
                <MobileDatePicker
                  views={["month", "year"]}
                  value={selectedMonth}
                  onChange={(newValue) => setSelectedMonth(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                      }}
                    />
                  )}
                />
              ) : (
                <DatePicker
                  views={["month", "year"]}
                  value={selectedMonth}
                  onChange={(newValue) => setSelectedMonth(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                      }}
                    />
                  )}
                />
              )}
            </LocalizationProvider>
          </Box>

          {summary ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant="subtitle2"
                  color={
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.7)"
                      : "text.secondary"
                  }
                >
                  Expected Amount
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#fff" : "inherit",
                  }}
                >
                  KSh {summary.totalExpected?.toLocaleString() || "0"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant="subtitle2"
                  color={
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.7)"
                      : "text.secondary"
                  }
                >
                  Amount Paid
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  KSh {summary.totalPaid?.toLocaleString() || "0"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant="subtitle2"
                  color={
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.7)"
                      : "text.secondary"
                  }
                >
                  Outstanding
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  KSh {summary.outstandingAmount?.toLocaleString() || "0"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant="subtitle2"
                  color={
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.7)"
                      : "text.secondary"
                  }
                >
                  Completion Rate
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#fff" : "inherit",
                  }}
                >
                  {summary.amountCompletionRate?.toFixed(1) || "0"}%
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #2c3e50 0%, #4a6491 100%)"
                : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            sx={{
              "& .MuiTab-root": {
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(0,0,0,0.7)",
                "&.Mui-selected": {
                  color:
                    theme.palette.mode === "dark"
                      ? "#fff"
                      : theme.palette.primary.main,
                  fontWeight: "bold",
                },
              },
            }}
          >
            <Tab label="Payments" icon={<AttachMoney />} iconPosition="start" />
            <Tab
              label="Plots & Locations"
              icon={<Home />}
              iconPosition="start"
            />
            <Tab label="Reports" icon={<BarChart />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Payments Tab */}
          {activeTab === 0 && (
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="bold">
                  {selectedPlot
                    ? `Payments for Plot ${selectedPlot.plotNumber}`
                    : "All Payments by Location"}
                </Typography>
                <Box display="flex" gap={1}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      label="Filter"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Payments</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="partial">Partial</MenuItem>
                    </Select>
                  </FormControl>
                  {selectedPlot && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() =>
                        handleDialogOpen("addPayment", selectedPlot)
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      Add Payment
                    </Button>
                  )}
                </Box>
              </Box>

              {selectedPlot ? (
                <TableContainer
                  component={Paper}
                  sx={{ borderRadius: 3, boxShadow: 1 }}
                >
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor:
                            theme.palette.grey[
                              theme.palette.mode === "dark" ? 800 : 100
                            ],
                        }}
                      >
                        <TableCell>Expected (KSh)</TableCell>
                        <TableCell>Paid (KSh)</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.length > 0 ? (
                        payments.map((payment) => (
                          <TableRow key={payment._id} hover>
                            <TableCell>
                              {payment.expectedAmount?.toLocaleString() || "0"}
                            </TableCell>
                            <TableCell>
                              {payment.paidAmount?.toLocaleString() || "0"}
                            </TableCell>
                            <TableCell>
                              {new Date(payment.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <PaymentStatusChip
                                status={getPaymentStatus(payment)}
                                amount={payment.paidAmount}
                                expected={payment.expectedAmount}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDialogOpen("editPayment", payment)
                                    }
                                    sx={{
                                      backgroundColor:
                                        theme.palette.primary.light,
                                      color: theme.palette.primary.contrastText,
                                      "&:hover": {
                                        backgroundColor:
                                          theme.palette.primary.main,
                                      },
                                    }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleDelete("payment", payment._id)
                                    }
                                    sx={{
                                      backgroundColor:
                                        theme.palette.error.light,
                                      color: theme.palette.error.contrastText,
                                      "&:hover": {
                                        backgroundColor:
                                          theme.palette.error.main,
                                      },
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            {paymentsLoading ? (
                              <CircularProgress />
                            ) : (
                              <Typography color="text.secondary">
                                No payments found for this plot
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <GroupedPaymentsTable
                  payments={filteredPayments}
                  plots={plots}
                  locations={locations}
                  onEdit={(payment) => handleDialogOpen("editPayment", payment)}
                  onDelete={(id) => handleDelete("payment", id)}
                />
              )}
            </Box>
          )}

          {/* Plots & Locations Tab */}
          {activeTab === 1 && (
            <Box>
              {!selectedLocation ? (
                <>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Locations
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => handleDialogOpen("addLocation")}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Location
                    </Button>
                  </Box>

                  <Grid container spacing={3}>
                    {locations.map((location) => (
                      <Grid item xs={12} sm={6} md={4} key={location._id}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            boxShadow: 3,
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": {
                              transform: "translateY(-4px)",
                            },
                          }}
                          onClick={() => handleLocationSelect(location)}
                        >
                          <CardContent>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="h6" fontWeight="bold">
                                {location.name}
                              </Typography>
                              <Chip
                                label={`${location.plots?.length || 0} plots`}
                                color="primary"
                                size="small"
                              />
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              mt={1}
                            >
                              Click to view plots
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              ) : !selectedPlot ? (
                <>
                  <Box display="flex" alignItems="center" mb={3}>
                    <IconButton
                      onClick={() => setSelectedLocation(null)}
                      sx={{ mr: 1 }}
                    >
                      <ChevronRight />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                      Plots in {selectedLocation.name}
                    </Typography>
                  </Box>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                  >
                    <TextField
                      placeholder="Search plots..."
                      variant="outlined"
                      size="small"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        width: 300,
                        borderRadius: 2,
                      }}
                    />
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<FilterList />}
                        sx={{ borderRadius: 2 }}
                      >
                        Filters
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleDialogOpen("addPlot")}
                        sx={{ borderRadius: 2 }}
                      >
                        Add Plot
                      </Button>
                    </Box>
                  </Box>

                  <TableContainer
                    component={Paper}
                    sx={{ borderRadius: 3, boxShadow: 1 }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor:
                              theme.palette.grey[
                                theme.palette.mode === "dark" ? 800 : 100
                              ],
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              Plot Number
                              <IconButton
                                size="small"
                                onClick={() => handleSort("plotNumber")}
                              >
                                <Sort fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>Bags Required</TableCell>
                          <TableCell>Collectors</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredPlots.length > 0 ? (
                          filteredPlots.map((plot) => (
                            <TableRow
                              key={plot._id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() => handlePlotSelect(plot)}
                            >
                              <TableCell>{plot.plotNumber}</TableCell>
                              <TableCell>{plot.bagsRequired}</TableCell>
                              <TableCell>
                                {plot.users?.length > 0 ? (
                                  <Box display="flex" gap={1} flexWrap="wrap">
                                    {plot.users.slice(0, 2).map((user) => (
                                      <Chip
                                        key={user._id}
                                        label={user.name}
                                        size="small"
                                      />
                                    ))}
                                    {plot.users.length > 2 && (
                                      <Chip
                                        label={`+${plot.users.length - 2}`}
                                        size="small"
                                      />
                                    )}
                                  </Box>
                                ) : (
                                  "None assigned"
                                )}
                              </TableCell>
                              <TableCell>
                                <Box display="flex" gap={1}>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDialogOpen("editPlot", plot);
                                      }}
                                      sx={{
                                        backgroundColor:
                                          theme.palette.primary.light,
                                        color:
                                          theme.palette.primary.contrastText,
                                        "&:hover": {
                                          backgroundColor:
                                            theme.palette.primary.main,
                                        },
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete("plot", plot._id);
                                      }}
                                      sx={{
                                        backgroundColor:
                                          theme.palette.error.light,
                                        color: theme.palette.error.contrastText,
                                        "&:hover": {
                                          backgroundColor:
                                            theme.palette.error.main,
                                        },
                                      }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              align="center"
                              sx={{ py: 4 }}
                            >
                              {plotsLoading ? (
                                <CircularProgress />
                              ) : (
                                <Typography color="text.secondary">
                                  No plots found
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <>
                  <Box display="flex" alignItems="center" mb={3}>
                    <IconButton
                      onClick={() => setSelectedPlot(null)}
                      sx={{ mr: 1 }}
                    >
                      <ChevronRight />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                      Plot {selectedPlot.plotNumber} Details
                    </Typography>
                  </Box>

                  <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            mb={2}
                          >
                            Plot Information
                          </Typography>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                          >
                            <Typography color="text.secondary">
                              Plot Number:
                            </Typography>
                            <Typography>{selectedPlot.plotNumber}</Typography>
                          </Box>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                          >
                            <Typography color="text.secondary">
                              Location:
                            </Typography>
                            <Typography>
                              {selectedPlot.location?.name || "N/A"}
                            </Typography>
                          </Box>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                          >
                            <Typography color="text.secondary">
                              Bags Required:
                            </Typography>
                            <Typography>{selectedPlot.bagsRequired}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <Typography variant="subtitle1" fontWeight="bold">
                              Assigned Collectors
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<People />}
                              onClick={() =>
                                handleDialogOpen("assignUsers", selectedPlot)
                              }
                            >
                              Manage
                            </Button>
                          </Box>
                          {selectedPlot.users?.length > 0 ? (
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              {selectedPlot.users.map((user) => (
                                <Chip
                                  key={user._id}
                                  avatar={
                                    <Avatar>{user.name.charAt(0)}</Avatar>
                                  }
                                  label={user.name}
                                  onDelete={() =>
                                    dispatch(
                                      removeUserFromPlot({
                                        plotId: selectedPlot._id,
                                        userId: user._id,
                                      })
                                    )
                                  }
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography color="text.secondary">
                              No collectors assigned
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      Payment Schedules
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<TransferWithinAStation />}
                        onClick={() => handleTransferPayments(selectedPlot._id)}
                        sx={{ borderRadius: 2 }}
                      >
                        Transfer Unpaid
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() =>
                          handleDialogOpen("addPayment", selectedPlot)
                        }
                        sx={{ borderRadius: 2 }}
                      >
                        Add Payment
                      </Button>
                    </Box>
                  </Box>

                  <TableContainer
                    component={Paper}
                    sx={{ borderRadius: 3, boxShadow: 1 }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor:
                              theme.palette.grey[
                                theme.palette.mode === "dark" ? 800 : 100
                              ],
                          }}
                        >
                          <TableCell>Expected (KSh)</TableCell>
                          <TableCell>Paid (KSh)</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.length > 0 ? (
                          payments.map((payment) => (
                            <TableRow key={payment._id} hover>
                              <TableCell>
                                {payment.expectedAmount?.toLocaleString() ||
                                  "0"}
                              </TableCell>
                              <TableCell>
                                {payment.paidAmount?.toLocaleString() || "0"}
                              </TableCell>
                              <TableCell>
                                {new Date(payment.dueDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <PaymentStatusChip
                                  status={getPaymentStatus(payment)}
                                  amount={payment.paidAmount}
                                  expected={payment.expectedAmount}
                                />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" gap={1}>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleDialogOpen("editPayment", payment)
                                      }
                                      sx={{
                                        backgroundColor:
                                          theme.palette.primary.light,
                                        color:
                                          theme.palette.primary.contrastText,
                                        "&:hover": {
                                          backgroundColor:
                                            theme.palette.primary.main,
                                        },
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleDelete("payment", payment._id)
                                      }
                                      sx={{
                                        backgroundColor:
                                          theme.palette.error.light,
                                        color: theme.palette.error.contrastText,
                                        "&:hover": {
                                          backgroundColor:
                                            theme.palette.error.main,
                                        },
                                      }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              align="center"
                              sx={{ py: 4 }}
                            >
                              {paymentsLoading ? (
                                <CircularProgress />
                              ) : (
                                <Typography color="text.secondary">
                                  No payments found for this plot
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}

          {/* Reports Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Reports & Analytics
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                        Payment Status Distribution
                      </Typography>
                      {/* Placeholder for chart */}
                      <Box
                        height={300}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        bgcolor="grey.100"
                        borderRadius={2}
                      >
                        <Typography color="text.secondary">
                          Pie Chart: Payment Status Distribution
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                        Monthly Collection Trend
                      </Typography>
                      {/* Placeholder for chart */}
                      <Box
                        height={300}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        bgcolor="grey.100"
                        borderRadius={2}
                      >
                        <Typography color="text.secondary">
                          Line Chart: Monthly Collection Trend
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                        Overdue Payments by Location
                      </Typography>
                      {/* Placeholder for chart */}
                      <Box
                        height={400}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        bgcolor="grey.100"
                        borderRadius={2}
                      >
                        <Typography color="text.secondary">
                          Bar Chart: Overdue Payments by Location
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog
        open={openDialog && dialogType.includes("Payment")}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogType.startsWith("add") ? "Add New Payment" : "Edit Payment"}
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              label="Plot Number"
              value={
                plots.find((p) => p._id === paymentForm.plot)?.plotNumber || ""
              }
              disabled
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Expected Amount (KSh)"
              type="number"
              value={paymentForm.expectedAmount}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  expectedAmount: e.target.value,
                })
              }
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">KSh</InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Paid Amount (KSh)"
              type="number"
              value={paymentForm.paidAmount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, paidAmount: e.target.value })
              }
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">KSh</InputAdornment>
                ),
              }}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                margin="normal"
                fullWidth
                label="Due Date"
                value={paymentForm.dueDate}
                onChange={(newValue) =>
                  setPaymentForm({ ...paymentForm, dueDate: newValue })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    margin="normal"
                    required
                    sx={{ mb: 2 }}
                  />
                )}
              />
            </LocalizationProvider>

            <FormControlLabel
              control={
                <Checkbox
                  checked={paymentForm.isPaid}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, isPaid: e.target.checked })
                  }
                  color="primary"
                />
              }
              label="Mark as paid"
              sx={{ mb: 2 }}
            />

            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={handleDialogClose} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ borderRadius: 2 }}
              >
                {dialogType.startsWith("add") ? "Add Payment" : "Save Changes"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Plot Dialog */}
      <Dialog
        open={
          openDialog &&
          dialogType.includes("Plot") &&
          !dialogType.includes("assign")
        }
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogType.startsWith("add") ? "Add New Plot" : "Edit Plot"}
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              label="Plot Number"
              value={plotForm.plotNumber}
              onChange={(e) =>
                setPlotForm({ ...plotForm, plotNumber: e.target.value })
              }
              required
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Bags Required"
              type="number"
              value={plotForm.bagsRequired}
              onChange={(e) =>
                setPlotForm({ ...plotForm, bagsRequired: e.target.value })
              }
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel>Location</InputLabel>
              <Select
                value={plotForm.location}
                onChange={(e) =>
                  setPlotForm({ ...plotForm, location: e.target.value })
                }
                label="Location"
                required
              >
                {locations.map((location) => (
                  <MenuItem key={location._id} value={location._id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={handleDialogClose} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ borderRadius: 2 }}
              >
                {dialogType.startsWith("add") ? "Add Plot" : "Save Changes"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog
        open={openDialog && dialogType.includes("assignUsers")}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Assign Collectors to Plot {currentItem?.plotNumber}
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
              <InputLabel>Collectors</InputLabel>
              <Select
                multiple
                value={userAssignment.userIds}
                onChange={(e) =>
                  setUserAssignment({
                    ...userAssignment,
                    userIds: e.target.value,
                  })
                }
                label="Collectors"
                required
              >
                {/* In a real app, you would map through actual users */}
                <MenuItem value="user1">Collector 1</MenuItem>
                <MenuItem value="user2">Collector 2</MenuItem>
                <MenuItem value="user3">Collector 3</MenuItem>
                <MenuItem value="user4">Collector 4</MenuItem>
                <MenuItem value="user5">Collector 5</MenuItem>
              </Select>
            </FormControl>

            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={handleDialogClose} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ borderRadius: 2 }}
              >
                Assign Collectors
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Location Dialog */}
      <Dialog
        open={openDialog && dialogType.includes("Location")}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogType.startsWith("add") ? "Add New Location" : "Edit Location"}
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              label="Location Name"
              value={locationForm.name}
              onChange={(e) =>
                setLocationForm({ ...locationForm, name: e.target.value })
              }
              required
              sx={{ mb: 2 }}
            />

            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={handleDialogClose} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ borderRadius: 2 }}
              >
                {dialogType.startsWith("add") ? "Add Location" : "Save Changes"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          boxShadow: 3,
        }}
        onClick={() => {
          if (activeTab === 0) {
            if (selectedPlot) {
              handleDialogOpen("addPayment", selectedPlot);
            }
          } else if (activeTab === 1) {
            if (selectedLocation) {
              handleDialogOpen("addPlot");
            } else {
              handleDialogOpen("addLocation");
            }
          }
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default AdminDashboard;
