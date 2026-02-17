import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  transferPayments,
  getPaymentsByMonth,
  createPayment,
  updatePayment,
  deletePayment,
  getMonthlySummary,
  clearPaymentErrors,
  transferAllPayments,
} from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import { getLocations } from "../../features/locations/locationSlice";
import { format, parseISO, isValid } from "date-fns";

// Constants
const DEBOUNCE_DELAY = 300;
const TOAST_CONFIG = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

const PaymentDashboard22 = () => {
  const dispatch = useDispatch();
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  const {
    monthlyPayments,
    summary,
    isLoading: paymentsLoading,
    isError,
    message,
  } = useSelector((state) => state.payments);
  const { plots, isLoading: plotsLoading } = useSelector(
    (state) => state.plots,
  );
  const { locations, isLoading: locationsLoading } = useSelector(
    (state) => state.locations,
  );

  // State for UI controls
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [currentPlot, setCurrentPlot] = useState(null);
  const [formData, setFormData] = useState({
    expectedAmount: "",
    paidAmount: "0",
    dueDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferringPlots, setTransferringPlots] = useState(new Set());

  // Set up mounted ref cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch data when selectedMonth changes with debounce
  useEffect(() => {
    const loadData = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const [year, month] = selectedMonth.split("-");
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (
          isNaN(monthNum) ||
          isNaN(yearNum) ||
          monthNum < 1 ||
          monthNum > 12
        ) {
          toast.error("Invalid month selection");
          return;
        }

        await Promise.all([
          dispatch(
            getPaymentsByMonth({ month: monthNum, year: yearNum }),
          ).unwrap(),
          dispatch(
            getMonthlySummary({ month: monthNum, year: yearNum }),
          ).unwrap(),
          dispatch(getPlots()).unwrap(),
          dispatch(getLocations()).unwrap(),
        ]);
      } catch (error) {
        if (error.name !== "AbortError" && isMounted.current) {
          toast.error(error.message || "Failed to load data", TOAST_CONFIG);
        }
      }
    };

    const debounceTimer = setTimeout(loadData, DEBOUNCE_DELAY);
    return () => clearTimeout(debounceTimer);
  }, [dispatch, selectedMonth]);

  // Handle errors
  useEffect(() => {
    if (isError && message && isMounted.current) {
      toast.error(message, TOAST_CONFIG);
      dispatch(clearPaymentErrors());
    }
  }, [isError, message, dispatch]);

  // Format currency in KSH
  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || isNaN(amount))
      return "Ksh 0.00";
    return `Ksh ${Number(amount).toFixed(2)}`;
  }, []);

  // Validate payment form
  const validatePaymentForm = useCallback((data) => {
    const errors = {};
    const expected = parseFloat(data.expectedAmount);
    const paid = parseFloat(data.paidAmount);

    if (isNaN(expected) || expected <= 0) {
      errors.expectedAmount = "Expected amount must be greater than 0";
    }

    if (isNaN(paid) || paid < 0) {
      errors.paidAmount = "Paid amount must be a positive number";
    }

    if (paid > expected) {
      errors.paidAmount = "Paid amount cannot exceed expected amount";
    }

    if (!data.dueDate) {
      errors.dueDate = "Due date is required";
    } else {
      const dueDate = new Date(data.dueDate);
      if (!isValid(dueDate)) {
        errors.dueDate = "Invalid due date";
      }
    }

    return errors;
  }, []);

  const handleTransferPayments = useCallback(
    async (plotId) => {
      if (transferringPlots.has(plotId)) return;

      if (
        !window.confirm(
          "Transfer all payments to next month? This will overwrite any existing transferred payments for next month.",
        )
      ) {
        return;
      }

      setTransferringPlots((prev) => new Set(prev).add(plotId));

      try {
        const result = await dispatch(transferPayments(plotId)).unwrap();

        toast.success(
          `Successfully transferred ${result.count} payment(s) to ${result.month}`,
          TOAST_CONFIG,
        );

        // Refresh data
        const [year, month] = selectedMonth.split("-");
        await Promise.all([
          dispatch(
            getPaymentsByMonth({
              month: parseInt(month),
              year: parseInt(year),
            }),
          ).unwrap(),
          dispatch(
            getMonthlySummary({ month: parseInt(month), year: parseInt(year) }),
          ).unwrap(),
        ]);
      } catch (error) {
        toast.error(
          error.message || "Failed to transfer payments",
          TOAST_CONFIG,
        );
      } finally {
        if (isMounted.current) {
          setTransferringPlots((prev) => {
            const newSet = new Set(prev);
            newSet.delete(plotId);
            return newSet;
          });
        }
      }
    },
    [dispatch, selectedMonth, transferringPlots],
  );

  const handleTransferAllPayments = useCallback(async () => {
    if (paymentsLoading) return;

    if (
      !window.confirm(
        "Transfer ALL payments to next month? This will overwrite any existing transferred payments for next month across all plots.",
      )
    ) {
      return;
    }

    try {
      const result = await dispatch(transferAllPayments()).unwrap();

      toast.success(
        `Successfully transferred ${result.totalTransferred} payments across ${result.results.length} plots to ${result.month}`,
        TOAST_CONFIG,
      );

      // Refresh data
      const [year, month] = selectedMonth.split("-");
      await Promise.all([
        dispatch(
          getPaymentsByMonth({ month: parseInt(month), year: parseInt(year) }),
        ).unwrap(),
        dispatch(
          getMonthlySummary({ month: parseInt(month), year: parseInt(year) }),
        ).unwrap(),
      ]);
    } catch (error) {
      toast.error(error.message || "Failed to transfer payments", TOAST_CONFIG);
    }
  }, [dispatch, selectedMonth, paymentsLoading]);

  // Handle form input changes with validation
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    setFormErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }, []);

  // Handle payment creation
  const handleCreatePayment = useCallback((plot) => {
    setCurrentPlot(plot);
    setCurrentPayment(null);
    setFormErrors({});
    setShowPaymentForm(true);
    setFormData({
      expectedAmount: "",
      paidAmount: "0",
      dueDate: format(new Date(), "yyyy-MM-dd"),
    });
  }, []);

  // Handle payment update
  const handlePayNow = useCallback((payment) => {
    setCurrentPayment(payment);
    setCurrentPlot(payment.plot);
    setFormErrors({});
    setShowPaymentForm(true);
    setFormData({
      expectedAmount: payment.expectedAmount.toString(),
      paidAmount: payment.paidAmount.toString(),
      dueDate: format(parseISO(payment.dueDate), "yyyy-MM-dd"),
    });
  }, []);

  // Handle payment edit
  const handleEditPayment = useCallback((payment, plot) => {
    setCurrentPayment(payment);
    setCurrentPlot(plot);
    setFormErrors({});
    setShowPaymentForm(true);
    setFormData({
      expectedAmount: payment.expectedAmount.toString(),
      paidAmount: payment.paidAmount.toString(),
      dueDate: format(parseISO(payment.dueDate), "yyyy-MM-dd"),
    });
  }, []);

  // Handle payment deletion
  const handleDeletePayment = useCallback(
    async (paymentId) => {
      if (!window.confirm("Are you sure you want to delete this payment?")) {
        return;
      }

      try {
        await dispatch(deletePayment(paymentId)).unwrap();
        toast.success("Payment deleted successfully", TOAST_CONFIG);

        const [year, month] = selectedMonth.split("-");
        await Promise.all([
          dispatch(
            getPaymentsByMonth({
              month: parseInt(month),
              year: parseInt(year),
            }),
          ).unwrap(),
          dispatch(
            getMonthlySummary({ month: parseInt(month), year: parseInt(year) }),
          ).unwrap(),
        ]);
      } catch (error) {
        toast.error(error.message || "Failed to delete payment", TOAST_CONFIG);
      }
    },
    [dispatch, selectedMonth],
  );

  // Submit payment
  const submitPayment = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate form
      const errors = validatePaymentForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error("Please fix the errors in the form", TOAST_CONFIG);
        return;
      }

      setIsSubmitting(true);

      try {
        const paymentData = {
          expectedAmount: parseFloat(formData.expectedAmount),
          paidAmount: parseFloat(formData.paidAmount),
          dueDate: formData.dueDate,
          isPaid:
            parseFloat(formData.paidAmount) >=
            parseFloat(formData.expectedAmount),
        };

        if (currentPayment) {
          await dispatch(
            updatePayment({
              paymentId: currentPayment._id,
              paymentData,
            }),
          ).unwrap();
          toast.success("Payment updated successfully", TOAST_CONFIG);
        } else {
          await dispatch(
            createPayment({
              plot: currentPlot._id,
              ...paymentData,
            }),
          ).unwrap();
          toast.success("Payment created successfully", TOAST_CONFIG);
        }

        setShowPaymentForm(false);

        const [year, month] = selectedMonth.split("-");
        await Promise.all([
          dispatch(
            getPaymentsByMonth({
              month: parseInt(month),
              year: parseInt(year),
            }),
          ).unwrap(),
          dispatch(
            getMonthlySummary({ month: parseInt(month), year: parseInt(year) }),
          ).unwrap(),
        ]);
      } catch (error) {
        toast.error(error.message || "Payment operation failed", TOAST_CONFIG);
      } finally {
        if (isMounted.current) {
          setIsSubmitting(false);
        }
      }
    },
    [
      currentPayment,
      currentPlot,
      dispatch,
      formData,
      selectedMonth,
      validatePaymentForm,
    ],
  );

  // Memoized calculations
  const paymentsByPlotId = useMemo(() => {
    return (
      monthlyPayments?.reduce((acc, payment) => {
        if (payment?.plot?._id) {
          acc[payment.plot._id] = payment;
        }
        return acc;
      }, {}) || {}
    );
  }, [monthlyPayments]);

  const plotsByLocation = useMemo(() => {
    if (!locations || !plots) return {};

    return locations.reduce((acc, location) => {
      const locationPlots =
        plots.filter((plot) => plot.location?._id === location._id) || [];

      acc[location._id] = locationPlots.sort((a, b) => {
        const numA = parseInt(a.plotNumber.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.plotNumber.replace(/\D/g, "")) || 0;
        return numA - numB;
      });

      return acc;
    }, {});
  }, [locations, plots]);

  const isLoading = paymentsLoading || plotsLoading || locationsLoading;

  // Optimized User components
  const UserStack = useCallback(({ users }) => {
    const [expanded, setExpanded] = useState(false);

    if (!users?.length) {
      return <span className="text-sm text-gray-500">Unassigned</span>;
    }

    const visibleUsers = expanded ? users : users.slice(0, 2);

    return (
      <div className="flex flex-col space-y-1">
        {visibleUsers.map((user) => (
          <div
            key={user._id}
            className="text-sm text-gray-900 truncate max-w-[150px]"
            title={user.name}
          >
            {user.name}
          </div>
        ))}
        {users.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:text-blue-700 self-start focus:outline-none focus:underline"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : `+${users.length - 2} more`}
          </button>
        )}
      </div>
    );
  }, []);

  const UserNumberStack = useCallback(({ users }) => {
    const [expanded, setExpanded] = useState(false);

    if (!users?.length) {
      return <span className="text-sm text-gray-500">Unassigned</span>;
    }

    const visibleUsers = expanded ? users : users.slice(0, 2);

    return (
      <div className="flex flex-col space-y-1">
        {visibleUsers.map((user) => (
          <div
            key={user._id}
            className="text-sm text-gray-900 truncate max-w-[120px]"
            title={user.mobile}
          >
            {user.mobile}
          </div>
        ))}
        {users.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:text-blue-700 self-start focus:outline-none focus:underline"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : `+${users.length - 2} more`}
          </button>
        )}
      </div>
    );
  }, []);

  const SummaryCard = useCallback(({ title, value, color }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-800 border-blue-200",
      green: "bg-green-50 text-green-800 border-green-200",
      yellow: "bg-yellow-50 text-yellow-800 border-yellow-200",
      purple: "bg-purple-50 text-purple-800 border-purple-200",
    };

    return (
      <div className={`p-3 rounded border ${colorClasses[color]}`}>
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    );
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        {isLoading && <p className="text-sm text-gray-500 mt-1">Loading...</p>}
      </header>

      {/* Month Selector and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-end">
        <div className="w-full md:w-auto">
          <label
            htmlFor="month"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Month:
          </label>
          <input
            type="month"
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            disabled={isLoading}
            aria-label="Select month"
          />
        </div>

        <button
          onClick={handleTransferAllPayments}
          disabled={isLoading || paymentsLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto transition-colors duration-200"
          aria-label="Transfer all payments to next month"
        >
          {paymentsLoading ? "Processing..." : "Transfer All to Next Month"}
        </button>
      </div>

      {/* Summary Section */}
      <div className="mb-6 w-full">
        {summary ? (
          <div className="bg-white shadow rounded-lg p-4 w-full border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              {summary.monthName} {summary.year} Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard
                title="Total Expected"
                value={formatCurrency(summary.totalExpected)}
                color="blue"
              />
              <SummaryCard
                title="Total Paid"
                value={formatCurrency(summary.totalPaid)}
                color="green"
              />
              <SummaryCard
                title="Outstanding"
                value={formatCurrency(summary.outstandingAmount)}
                color="yellow"
              />
              <SummaryCard
                title="Completion"
                value={`${Math.round(summary.amountCompletionRate || 0)}%`}
                color="purple"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 w-full border border-gray-200">
            <p className="text-center text-gray-500">
              {isLoading ? "Loading summary..." : "No summary data available"}
            </p>
          </div>
        )}
      </div>

      {/* Locations and Plots */}
      <div className="space-y-4">
        {locations?.map((location) => (
          <div
            key={location._id}
            className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
          >
            <button
              onClick={() =>
                setExpandedLocation(
                  expandedLocation === location._id ? null : location._id,
                )
              }
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors duration-200"
              aria-expanded={expandedLocation === location._id}
              aria-controls={`location-${location._id}-plots`}
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {location.name}
              </h2>
              <svg
                className={`w-5 h-5 transform transition-transform duration-200 ${
                  expandedLocation === location._id ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedLocation === location._id && (
              <div
                id={`location-${location._id}-plots`}
                className="p-4 border-t"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plot Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plot Owner
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mobile
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expected
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plotsByLocation[location._id]?.map((plot) => {
                        const payment = paymentsByPlotId[plot._id];
                        const isTransferring = transferringPlots.has(plot._id);

                        let rowBgClass = "";
                        if (!payment) rowBgClass = "bg-yellow-50";
                        else if (payment.isPaid) rowBgClass = "bg-green-50";
                        else if (payment.paidAmount > 0)
                          rowBgClass = "bg-yellow-50";
                        else rowBgClass = "bg-red-50";

                        return (
                          <tr
                            key={plot._id}
                            className={`${rowBgClass} hover:bg-opacity-75 transition-colors duration-150`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {plot.plotNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <UserStack users={plot.users} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <UserNumberStack users={plot.users} />
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]"
                              title={plot.users?.[0]?.email}
                            >
                              {plot.users?.[0]?.email || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {payment
                                ? formatCurrency(payment.expectedAmount)
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {payment
                                ? formatCurrency(payment.paidAmount)
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {payment ? (
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    payment.isPaid
                                      ? "bg-green-100 text-green-800"
                                      : payment.paidAmount > 0
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {payment.isPaid
                                    ? "Paid"
                                    : payment.paidAmount > 0
                                      ? "Partial"
                                      : "Unpaid"}
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  No Payment
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                              {!payment ? (
                                <button
                                  onClick={() => handleCreatePayment(plot)}
                                  disabled={isLoading}
                                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                  aria-label={`Add payment for plot ${plot.plotNumber}`}
                                >
                                  Add
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePayNow(payment)}
                                    disabled={isLoading || payment.isPaid}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    aria-label={`Pay for plot ${plot.plotNumber}`}
                                  >
                                    Pay
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleTransferPayments(plot._id)
                                    }
                                    disabled={isLoading || isTransferring}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    aria-label={`Transfer payments for plot ${plot.plotNumber}`}
                                  >
                                    {isTransferring ? "..." : "Transfer"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleEditPayment(payment, plot)
                                    }
                                    disabled={isLoading}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    aria-label={`Edit payment for plot ${plot.plotNumber}`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeletePayment(payment._id)
                                    }
                                    disabled={isLoading}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    aria-label={`Delete payment for plot ${plot.plotNumber}`}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentForm && currentPlot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPaymentForm(false);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {currentPayment ? "Update" : "Create"} Payment for Plot{" "}
              {currentPlot.plotNumber}
            </h2>

            <form onSubmit={submitPayment} noValidate>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="expectedAmount"
                >
                  Expected Amount (Ksh) *
                </label>
                <input
                  type="number"
                  id="expectedAmount"
                  name="expectedAmount"
                  value={formData.expectedAmount}
                  onChange={handleInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    formErrors.expectedAmount ? "border-red-500" : ""
                  }`}
                  required
                  step="0.01"
                  min="0.01"
                  disabled={isSubmitting}
                  aria-describedby={
                    formErrors.expectedAmount
                      ? "expectedAmount-error"
                      : undefined
                  }
                />
                {formErrors.expectedAmount && (
                  <p
                    id="expectedAmount-error"
                    className="text-red-500 text-xs mt-1"
                  >
                    {formErrors.expectedAmount}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="paidAmount"
                >
                  Paid Amount (Ksh) *
                </label>
                <input
                  type="number"
                  id="paidAmount"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    formErrors.paidAmount ? "border-red-500" : ""
                  }`}
                  required
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                  aria-describedby={
                    formErrors.paidAmount ? "paidAmount-error" : undefined
                  }
                />
                {formErrors.paidAmount && (
                  <p
                    id="paidAmount-error"
                    className="text-red-500 text-xs mt-1"
                  >
                    {formErrors.paidAmount}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dueDate"
                >
                  Due Date *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    formErrors.dueDate ? "border-red-500" : ""
                  }`}
                  required
                  disabled={isSubmitting}
                  aria-describedby={
                    formErrors.dueDate ? "dueDate-error" : undefined
                  }
                />
                {formErrors.dueDate && (
                  <p id="dueDate-error" className="text-red-500 text-xs mt-1">
                    {formErrors.dueDate}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Processing..."
                    : currentPayment
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PaymentDashboard22;
