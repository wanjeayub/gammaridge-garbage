import {
  getPaymentsByPlot,
  createPayment,
  updatePayment,
  deletePayment,
  transferPayments,
  getMonthlySummary,
  getAllPayments, // Add this to your paymentSlice
} from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import { getLocations } from "../../features/locations/locationSlice";

import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";
import Modal from "react-modal";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaFilter,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";

// Utility functions
const getPaymentStatus = (payment) => {
  if (payment.isPaid) return "paid";
  const dueDate = new Date(payment.dueDate);
  const today = new Date();
  return dueDate < today ? "overdue" : "pending";
};

const formatCurrency = (amount) => {
  return `Ksh ${amount.toLocaleString()}`;
};

// Components
const StatCard = ({ title, value, icon, color = "blue" }) => (
  <div
    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start`}
  >
    <div className={`p-3 rounded-lg bg-${color}-50 mr-4`}>{icon}</div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-semibold mt-1">
        {typeof value === "number" ? formatCurrency(value) : value}
      </p>
    </div>
  </div>
);

const PaymentStatusBadge = ({ status }) => {
  const statusConfig = {
    paid: { color: "green", text: "Paid" },
    pending: { color: "yellow", text: "Pending" },
    overdue: { color: "red", text: "Overdue" },
  };

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full bg-${statusConfig[status].color}-100 text-${statusConfig[status].color}-800`}
    >
      {statusConfig[status].text}
    </span>
  );
};

const PaymentManagement = () => {
  const dispatch = useDispatch();
  const { payments, isLoading, isError, message, summary } = useSelector(
    (state) => state.payments
  );
  const { plots } = useSelector((state) => state.plots);
  const { locations } = useSelector((state) => state.locations);

  // State management
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [transferModalIsOpen, setTransferModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    _id: "",
    expectedAmount: 0,
    paidAmount: 0,
    dueDate: "",
    isPaid: false,
  });
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  // Data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(getLocations()),
          dispatch(getPlots()),
          dispatch(getAllPayments()),
        ]);
        fetchMonthlySummary();
      } catch (error) {
        toast.error("Failed to load data: " + error.message);
      }
    };
    loadData();
  }, [dispatch]);

  const fetchMonthlySummary = useCallback(() => {
    dispatch(getMonthlySummary({ month: selectedMonth, year: selectedYear }));
  }, [dispatch, selectedMonth, selectedYear]);

  // Update summary when month/year changes
  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedMonth, selectedYear, fetchMonthlySummary]);

  // Calculate totals for a plot
  const calculatePlotTotals = useCallback(
    (plot) => {
      const plotPayments = payments.filter(
        (payment) =>
          payment.plot === plot._id &&
          new Date(payment.dueDate).getMonth() ===
            new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth() &&
          new Date(payment.dueDate).getFullYear() === parseInt(selectedYear)
      );

      return plotPayments.reduce(
        (totals, payment) => {
          totals.expected += payment.expectedAmount || 0;
          totals.paid += payment.paidAmount || 0;
          totals.balance = totals.expected - totals.paid;
          totals.paymentCount += 1;
          if (payment.isPaid) totals.paidCount += 1;
          if (!payment.isPaid && new Date(payment.dueDate) < new Date()) {
            totals.overdueCount += 1;
          }
          return totals;
        },
        {
          expected: 0,
          paid: 0,
          balance: 0,
          paymentCount: 0,
          paidCount: 0,
          overdueCount: 0,
        }
      );
    },
    [payments, selectedMonth, selectedYear]
  );

  // Calculate totals for a location
  const calculateLocationTotals = useCallback(
    (locationId) => {
      const locationPlots = plots.filter(
        (plot) => plot.location?._id === locationId
      );

      return locationPlots.reduce(
        (totals, plot) => {
          const plotTotals = calculatePlotTotals(plot);
          totals.expected += plotTotals.expected;
          totals.paid += plotTotals.paid;
          totals.balance += plotTotals.balance;
          totals.paymentCount += plotTotals.paymentCount;
          totals.paidCount += plotTotals.paidCount;
          totals.overdueCount += plotTotals.overdueCount;
          return totals;
        },
        {
          expected: 0,
          paid: 0,
          balance: 0,
          paymentCount: 0,
          paidCount: 0,
          overdueCount: 0,
        }
      );
    },
    [plots, calculatePlotTotals]
  );

  // Modal handlers
  const openPaymentFormModal = (payment, plot) => {
    setIsEdit(!!payment);
    setCurrentPayment(
      payment || {
        _id: "",
        expectedAmount: 0,
        paidAmount: 0,
        dueDate: "",
        isPaid: false,
      }
    );
    setSelectedPlot(plot);
    setModalIsOpen(true);
  };

  const openTransferModal = (plot) => {
    setSelectedPlot(plot);
    setTransferModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setTransferModalIsOpen(false);
    setSelectedPlot(null);
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentPayment((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlot) return;

    try {
      if (isEdit) {
        await dispatch(updatePayment(currentPayment));
      } else {
        await dispatch(
          createPayment({
            ...currentPayment,
            plot: selectedPlot._id,
          })
        );
      }
      toast.success(`Payment ${isEdit ? "updated" : "created"} successfully`);
      closeModal();
      fetchMonthlySummary();
    } catch (error) {
      toast.error(`Failed to ${isEdit ? "update" : "create"} payment`);
    }
  };

  const handleDelete = async (paymentId, plotId) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        await dispatch(deletePayment(paymentId));
        toast.success("Payment deleted successfully");
        fetchMonthlySummary();
      } catch (error) {
        toast.error("Failed to delete payment");
      }
    }
  };

  const handleTransfer = async () => {
    if (!selectedPlot) return;

    try {
      await dispatch(transferPayments(selectedPlot._id));
      toast.success("Payments transferred successfully");
      closeModal();
      fetchMonthlySummary();
    } catch (error) {
      toast.error("Failed to transfer payments");
    }
  };

  // Filter payments based on status
  const filterPayments = (payments) => {
    return payments.filter((payment) => {
      if (statusFilter === "all") return true;
      const status = getPaymentStatus(payment);
      return status === statusFilter;
    });
  };

  // Filter locations and plots based on search term
  const filteredLocations = locations.filter((location) => {
    const locationMatches = location.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const filteredPlots = plots.filter(
      (plot) =>
        plot.location?._id === location._id &&
        plot.plotNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return locationMatches || filteredPlots.length > 0;
  });

  // Toggle location expansion
  const toggleLocation = (locationId) => {
    setExpandedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Months and years for dropdowns
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - 2 + i).toString()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search locations or plots..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Expected"
          value={summary?.totalExpected || 0}
          icon={<FaMoneyBillWave className="text-blue-600 text-xl" />}
          color="blue"
        />
        <StatCard
          title="Total Paid"
          value={summary?.totalPaid || 0}
          icon={<FaMoneyBillWave className="text-green-600 text-xl" />}
          color="green"
        />
        <StatCard
          title="Total Balance"
          value={(summary?.totalExpected || 0) - (summary?.totalPaid || 0)}
          icon={<FaMoneyBillWave className="text-red-600 text-xl" />}
          color="red"
        />
        <StatCard
          title="Completion Rate"
          value={`${summary?.paymentCompletionRate?.toFixed(1) || 0}%`}
          icon={<FaCalendarAlt className="text-purple-600 text-xl" />}
          color="purple"
        />
      </div>

      {/* Month/year selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
          {selectedMonth} {selectedYear} Payments
        </h3>
        <div className="flex space-x-2">
          <select
            className="text-sm border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <select
            className="text-sm border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Location accordions */}
      <div className="space-y-4">
        {filteredLocations.map((location) => {
          const locationPlots = plots.filter(
            (plot) => plot.location?._id === location._id
          );
          const locationTotals = calculateLocationTotals(location._id);

          return (
            <div
              key={location._id}
              className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100"
            >
              <div
                className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleLocation(location._id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-lg">
                      {location.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {location.name}
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="text-sm text-gray-500">
                        {locationPlots.length} plots
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        Expected: {formatCurrency(locationTotals.expected)}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        Paid: {formatCurrency(locationTotals.paid)}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          locationTotals.balance > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        Balance: {formatCurrency(locationTotals.balance)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {expandedLocations.includes(location._id) ? (
                    <FaChevronUp className="text-gray-500 text-lg" />
                  ) : (
                    <FaChevronDown className="text-gray-500 text-lg" />
                  )}
                </div>
              </div>

              {expandedLocations.includes(location._id) && (
                <div className="border-t border-gray-100">
                  {locationPlots.map((plot) => {
                    const totals = calculatePlotTotals(plot);
                    const firstUser = plot.users?.[0] || {};
                    const plotPayments = payments.filter(
                      (payment) =>
                        payment.plot === plot._id &&
                        new Date(payment.dueDate).getMonth() ===
                          new Date(
                            `${selectedMonth} 1, ${selectedYear}`
                          ).getMonth() &&
                        new Date(payment.dueDate).getFullYear() ===
                          parseInt(selectedYear)
                    );

                    return (
                      <div
                        key={plot._id}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <div className="p-4 bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-700 font-medium">
                                  {plot.plotNumber}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-800">
                                  {firstUser.name || "No user assigned"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {firstUser.mobile || "-"}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <div className="text-center sm:text-right">
                                <p className="text-sm text-gray-500">
                                  Expected
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(totals.expected)}
                                </p>
                              </div>
                              <div className="text-center sm:text-right">
                                <p className="text-sm text-gray-500">Paid</p>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(totals.paid)}
                                </p>
                              </div>
                              <div className="text-center sm:text-right">
                                <p className="text-sm text-gray-500">Balance</p>
                                <p
                                  className={`font-medium ${
                                    totals.balance > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {formatCurrency(totals.balance)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Payment schedule table */}
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-gray-700">
                                Payment Schedule ({totals.paidCount}/
                                {totals.paymentCount} paid)
                              </h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPaymentFormModal(null, plot);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center space-x-1 hover:bg-blue-700 transition-colors"
                                >
                                  <FaPlus className="w-3 h-3" />
                                  <span>Add Payment</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTransferModal(plot);
                                  }}
                                  className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm flex items-center space-x-1 hover:bg-purple-700 transition-colors"
                                  title="Transfer unpaid payments"
                                >
                                  <FaExchangeAlt className="w-3 h-3" />
                                  <span>Transfer</span>
                                </button>
                              </div>
                            </div>

                            {plotPayments.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expected
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Paid
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {filterPayments(plotPayments).map(
                                      (payment) => {
                                        const status =
                                          getPaymentStatus(payment);
                                        return (
                                          <tr
                                            key={payment._id}
                                            className="hover:bg-gray-50"
                                          >
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                              {format(
                                                parseISO(payment.dueDate),
                                                "MMM dd, yyyy"
                                              )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                              {formatCurrency(
                                                payment.expectedAmount
                                              )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                              {formatCurrency(
                                                payment.paidAmount
                                              )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <PaymentStatusBadge
                                                status={status}
                                              />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPaymentFormModal(
                                                      payment,
                                                      plot
                                                    );
                                                  }}
                                                  className="p-1.5 text-blue-600 hover:text-blue-900 rounded-md hover:bg-blue-50 transition-colors"
                                                  title="Edit payment"
                                                >
                                                  <FaEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(
                                                      payment._id,
                                                      plot._id
                                                    );
                                                  }}
                                                  className="p-1.5 text-red-600 hover:text-red-900 rounded-md hover:bg-red-50 transition-colors"
                                                  title="Delete payment"
                                                >
                                                  <FaTrash className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      }
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center text-gray-500">
                                No payments found for {selectedMonth}{" "}
                                {selectedYear}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Form Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Payment Form"
        className="modal"
        overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEdit ? "Edit Payment" : "Add Payment Schedule"}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
          </div>

          {selectedPlot && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-blue-800">
                Plot: {selectedPlot.plotNumber} ({selectedPlot.location?.name})
              </p>
              <p className="text-xs text-blue-600 mt-1">
                User: {selectedPlot.users?.[0]?.name || "Not assigned"}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Amount (Ksh)
                </label>
                <input
                  type="number"
                  name="expectedAmount"
                  value={currentPayment.expectedAmount || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount (Ksh)
                </label>
                <input
                  type="number"
                  name="paidAmount"
                  value={currentPayment.paidAmount || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={currentPayment.dueDate || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPaid"
                  checked={currentPayment.isPaid || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Mark as Paid
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
              >
                {isLoading ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Transfer Payments Modal */}
      <Modal
        isOpen={transferModalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Transfer Payments"
        className="modal"
        overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Transfer Unpaid Payments
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
          </div>

          {selectedPlot && (
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to transfer all unpaid payments for plot{" "}
                <span className="font-semibold">{selectedPlot.plotNumber}</span>{" "}
                to next month?
              </p>
              <p className="text-sm text-gray-500">
                This will create new payment schedules for the next month with
                the same expected amounts.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70"
            >
              {isLoading ? "Transferring..." : "Confirm Transfer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentManagement;
