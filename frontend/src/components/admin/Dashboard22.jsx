import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  getPaymentsByMonth,
  createPayment,
  updatePayment,
  deletePayment,
  getMonthlySummary,
  clearPaymentErrors,
} from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import { getLocations } from "../../features/locations/locationSlice";
import { format } from "date-fns";

const PaymentDashboard = () => {
  const dispatch = useDispatch();
  const {
    monthlyPayments,
    monthlySummary,
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

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle payment creation
  const handleCreatePayment = (plot) => {
    setCurrentPlot(plot);
    setCurrentPayment(null);
    setShowPaymentForm(true);
    setFormData({
      expectedAmount: "",
      paidAmount: "0",
      dueDate: format(new Date(), "yyyy-MM-dd"),
    });
  };

  // Handle payment update
  const handlePayNow = (payment) => {
    setCurrentPayment(payment);
    setCurrentPlot(payment.plot);
    setShowPaymentForm(true);
    setFormData({
      expectedAmount: payment.expectedAmount,
      paidAmount: payment.paidAmount,
      dueDate: format(new Date(payment.dueDate), "yyyy-MM-dd"),
    });
  };

  // Handle payment deletion
  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        await dispatch(deletePayment(paymentId)).unwrap();
        toast.success("Payment deleted successfully");

        // Refresh data
        const [year, month] = selectedMonth.split("-");
        dispatch(getPaymentsByMonth({ month: parseInt(month), year }));
        dispatch(getMonthlySummary({ month: parseInt(month), year }));
      } catch (error) {
        toast.error("Failed to delete payment");
      }
    }
  };

  // Submit payment
  const submitPayment = async (e) => {
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

      // Refresh data
      const [year, month] = selectedMonth.split("-");
      dispatch(getPaymentsByMonth({ month: parseInt(month), year }));
      dispatch(getMonthlySummary({ month: parseInt(month), year }));
    } catch (error) {
      toast.error("Payment operation failed");
      console.error("Payment operation failed:", error);
    }
  };

  // Group payments by plot ID for easy lookup
  const paymentsByPlotId = monthlyPayments.reduce((acc, payment) => {
    acc[payment.plot._id] = payment;
    return acc;
  }, {});

  // Group plots by location
  const plotsByLocation = locations.reduce((acc, location) => {
    acc[location._id] = plots.filter(
      (plot) => plot.location?._id === location._id
    );
    return acc;
  }, {});

  // Format currency in KSH
  const formatCurrency = (amount) => {
    return `Ksh ${amount?.toFixed(2) || "0.00"}`;
  };

  if (isError) {
    toast.error(message);
    dispatch(clearPaymentErrors());
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

      {/* Month Selector and Summary */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full md:w-auto">
          <label
            htmlFor="month"
            className="block text-sm font-medium text-gray-700"
          >
            Select Month:
          </label>
          <input
            type="month"
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="mt-1 block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {monthlySummary && (
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">
              {monthlySummary.monthName} {monthlySummary.year} Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <h3 className="font-medium text-blue-800">Total Expected</h3>
                <p className="text-xl font-bold">
                  {formatCurrency(monthlySummary.totalExpected)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <h3 className="font-medium text-green-800">Total Paid</h3>
                <p className="text-xl font-bold">
                  {formatCurrency(monthlySummary.totalPaid)}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <h3 className="font-medium text-yellow-800">Outstanding</h3>
                <p className="text-xl font-bold">
                  {formatCurrency(monthlySummary.outstandingAmount)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <h3 className="font-medium text-purple-800">Completion</h3>
                <p className="text-xl font-bold">
                  {Math.round(monthlySummary.amountCompletionRate)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Locations Accordion */}
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
                {/* Plots Table */}
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
                        const primaryUser = plot.users?.[0];

                        return (
                          <tr
                            key={plot._id}
                            className={!payment ? "bg-yellow-50" : ""}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {plot.plotNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {primaryUser?.name || "Unassigned"}
                                {plot.users?.length > 1 && (
                                  <span className="ml-1 text-xs text-gray-500">
                                    +{plot.users.length - 1} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {primaryUser?.mobile || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {primaryUser?.email || "N/A"}
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
                                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                  Add
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePayNow(payment)}
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                  >
                                    Pay
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCurrentPayment(payment);
                                      setCurrentPlot(plot);
                                      setShowPaymentForm(true);
                                      setFormData({
                                        expectedAmount: payment.expectedAmount,
                                        paidAmount: payment.paidAmount,
                                        dueDate: format(
                                          new Date(payment.dueDate),
                                          "yyyy-MM-dd"
                                        ),
                                      });
                                    }}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeletePayment(payment._id)
                                    }
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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

export default PaymentDashboard;
