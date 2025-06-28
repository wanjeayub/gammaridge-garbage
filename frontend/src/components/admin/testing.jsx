import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
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
import { format } from "date-fns";

const PaymentDashboard22 = () => {
  const dispatch = useDispatch();
  const {
    monthlyPayments,
    summary,
    isLoading: paymentsLoading,
    isError,
    message,
  } = useSelector((state) => state.payments);
  const { plots } = useSelector((state) => state.plots);
  const { locations } = useSelector((state) => state.locations);

  // State for UI controls
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
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

  // Fetch data when selectedMonth changes
  useEffect(() => {
    const loadData = async () => {
      try {
        const [year, month] = selectedMonth.split("-");
        await Promise.all([
          dispatch(getPaymentsByMonth({ month: parseInt(month), year })),
          dispatch(getMonthlySummary({ month: parseInt(month), year })),
          dispatch(getPlots()),
          dispatch(getLocations()),
        ]);
      } catch (error) {
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, [dispatch, selectedMonth]);

  // Handle errors
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(clearPaymentErrors());
    }
  }, [isError, message, dispatch]);

  // Format currency in KSH
  const formatCurrency = useCallback((amount) => {
    return `Ksh ${amount?.toFixed(2) || "0.00"}`;
  }, []);

  const handleTransferPayments = useCallback(
    async (plotId) => {
      if (
        window.confirm(
          "Transfer all payments to next month? This will overwrite any existing transferred payments for next month."
        )
      ) {
        try {
          const result = await dispatch(transferPayments(plotId)).unwrap();

          toast.success(
            `Successfully transferred ${result.count} payment(s) to ${result.month}`,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );

          // Refresh data
          const [year, month] = selectedMonth.split("-");
          await dispatch(getPaymentsByMonth({ month: parseInt(month), year }));
          await dispatch(getMonthlySummary({ month: parseInt(month), year }));
        } catch (error) {
          toast.error(error.message || "Failed to transfer payments", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    },
    [dispatch, selectedMonth]
  );

  const handleTransferAllPayments = useCallback(async () => {
    if (
      window.confirm(
        "Transfer ALL payments to next month? This will overwrite any existing transferred payments for next month across all plots."
      )
    ) {
      try {
        const result = await dispatch(transferAllPayments()).unwrap();

        toast.success(
          `Successfully transferred ${result.totalTransferred} payments across ${result.results.length} plots to ${result.month}`,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        // Refresh data
        const [year, month] = selectedMonth.split("-");
        await dispatch(getPaymentsByMonth({ month: parseInt(month), year }));
        await dispatch(getMonthlySummary({ month: parseInt(month), year }));
      } catch (error) {
        toast.error(error.message || "Failed to transfer payments", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
  }, [dispatch, selectedMonth]);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  // Handle payment creation
  const handleCreatePayment = useCallback((plot) => {
    setCurrentPlot(plot);
    setCurrentPayment(null);
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
    setShowPaymentForm(true);
    setFormData({
      expectedAmount: payment.expectedAmount,
      paidAmount: payment.paidAmount,
      dueDate: format(new Date(payment.dueDate), "yyyy-MM-dd"),
    });
  }, []);

  // Handle payment edit
  const handleEditPayment = useCallback((payment, plot) => {
    setCurrentPayment(payment);
    setCurrentPlot(plot);
    setShowPaymentForm(true);
    setFormData({
      expectedAmount: payment.expectedAmount,
      paidAmount: payment.paidAmount,
      dueDate: format(new Date(payment.dueDate), "yyyy-MM-dd"),
    });
  }, []);

  // Handle payment deletion
  const handleDeletePayment = useCallback(
    async (paymentId) => {
      if (window.confirm("Are you sure you want to delete this payment?")) {
        try {
          await dispatch(deletePayment(paymentId)).unwrap();
          toast.success("Payment deleted successfully");
          const [year, month] = selectedMonth.split("-");
          dispatch(getPaymentsByMonth({ month: parseInt(month), year }));
          dispatch(getMonthlySummary({ month: parseInt(month), year }));
        } catch (error) {
          toast.error("Failed to delete payment");
        }
      }
    },
    [dispatch, selectedMonth]
  );

  // Submit payment
  const submitPayment = useCallback(
    async (e) => {
      e.preventDefault();
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
            })
          ).unwrap();
          toast.success("Payment updated successfully");
        } else {
          await dispatch(
            createPayment({
              plot: currentPlot._id,
              ...paymentData,
            })
          ).unwrap();
          toast.success("Payment created successfully");
        }

        setShowPaymentForm(false);
        const [year, month] = selectedMonth.split("-");
        dispatch(getPaymentsByMonth({ month: parseInt(month), year }));
        dispatch(getMonthlySummary({ month: parseInt(month), year }));
      } catch (error) {
        toast.error("Payment operation failed");
        console.error("Payment operation failed:", error);
      }
    },
    [currentPayment, currentPlot, dispatch, formData, selectedMonth]
  );

  // Group payments by plot ID for easy lookup
  const paymentsByPlotId = useMemo(() => {
    return (
      monthlyPayments?.reduce((acc, payment) => {
        acc[payment.plot._id] = payment;
        return acc;
      }, {}) || {}
    );
  }, [monthlyPayments]);

  // Group plots by location and sort them by plotNumber
  const plotsByLocation = useMemo(() => {
    return (
      locations?.reduce((acc, location) => {
        const locationPlots =
          plots?.filter((plot) => plot.location?._id === location._id) || [];
        acc[location._id] = locationPlots.sort((a, b) => {
          const numA = parseInt(a.plotNumber.replace(/\D/g, ""));
          const numB = parseInt(b.plotNumber.replace(/\D/g, ""));
          return numA - numB;
        });
        return acc;
      }, {}) || {}
    );
  }, [locations, plots]);

  const UserStack = useCallback(({ users }) => {
    const [expanded, setExpanded] = useState(false);

    if (!users || users.length === 0) {
      return <span className="text-sm text-gray-500">Unassigned</span>;
    }

    const visibleUsers = expanded ? users : users.slice(0, 2);

    return (
      <div className="flex flex-col space-y-1">
        {visibleUsers.map((user) => (
          <div key={user._id} className="text-sm text-gray-900">
            {user.name}
          </div>
        ))}
        {users.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:text-blue-700 self-start"
          >
            {expanded ? "Show less" : `+${users.length - 2} more`}
          </button>
        )}
      </div>
    );
  }, []);

  const UserNumberStack = useCallback(({ users }) => {
    const [expanded, setExpanded] = useState(false);

    if (!users || users.length === 0) {
      return <span className="text-sm text-gray-500">Unassigned</span>;
    }

    const visibleUsers = expanded ? users : users.slice(0, 2);

    return (
      <div className="flex flex-col space-y-1">
        {visibleUsers.map((user) => (
          <div key={user._id} className="text-sm text-gray-900">
            {user.mobile}
          </div>
        ))}
        {users.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:text-blue-700 self-start"
          >
            {expanded ? "Show less" : `+${users.length - 2} more`}
          </button>
        )}
      </div>
    );
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

      {/* Month Selector */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-end">
        {/* Month Selector */}
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
          />
        </div>

        {/* Transfer All Button */}
        <button
          onClick={handleTransferAllPayments}
          disabled={paymentsLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm shadow-md disabled:opacity-50 w-full md:w-auto"
        >
          {paymentsLoading ? "Processing..." : "Transfer All to Next Month"}
        </button>
      </div>
      {/* Summary Section */}
      <div className="mb-6 w-full">
        {summary ? (
          <div className="bg-white shadow rounded-lg p-4 w-full">
            <h2 className="text-lg font-semibold mb-2">
              {summary.monthName} {summary.year} Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                value={`${Math.round(summary.amountCompletionRate)}%`}
                color="purple"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-4 w-full">
            <p className="text-center text-gray-500">
              {paymentsLoading
                ? "Loading summary..."
                : "No summary data available"}
            </p>
          </div>
        )}
      </div>

      {/* Locations and Plots */}
      <div className="space-y-4">
        {locations.map((location) => (
          <div
            key={location._id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedLocation(
                  expandedLocation === location._id ? null : location._id
                )
              }
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
            >
              <h2 className="text-lg font-semibold">{location.name}</h2>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  expandedLocation === location._id ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
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
              <div className="p-4 border-t">
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
                        return (
                          <tr
                            key={plot._id}
                            className={
                              !payment
                                ? "bg-yellow-50"
                                : payment.isPaid
                                ? "bg-green-300 hover:bg-green-100"
                                : payment.paidAmount > 0
                                ? "bg-yellow-50 hover:bg-yellow-100"
                                : "bg-red-50 hover:bg-red-100"
                            }
                          >
                            {/* Table cells */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {plot.plotNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <UserStack users={plot.users} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <UserNumberStack users={plot.users} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm shadow-md"
                                >
                                  Add
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePayNow(payment)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-md"
                                  >
                                    Pay
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleTransferPayments(plot._id)
                                    }
                                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm shadow-md"
                                  >
                                    Transfer
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleEditPayment(payment, plot)
                                    }
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm shadow-md"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeletePayment(payment._id)
                                    }
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm shadow-md"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {currentPayment ? "Update" : "Create"} Payment for Plot{" "}
              {currentPlot.plotNumber}
            </h2>
            <form onSubmit={submitPayment}>
              {/* Form fields */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="expectedAmount"
                >
                  Expected Amount (Ksh)
                </label>
                <input
                  type="number"
                  id="expectedAmount"
                  name="expectedAmount"
                  value={formData.expectedAmount}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="paidAmount"
                >
                  Paid Amount (Ksh)
                </label>
                <input
                  type="number"
                  id="paidAmount"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="dueDate"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {currentPayment ? "Update" : "Create"} Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-800",
    green: "bg-green-50 text-green-800",
    yellow: "bg-yellow-50 text-yellow-800",
    purple: "bg-purple-50 text-purple-800",
  };

  return (
    <div className={`p-3 rounded ${colorClasses[color]}`}>
      <h3 className="font-medium">{title}</h3>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

export default PaymentDashboard22;
