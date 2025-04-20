import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  getPaymentsByPlot,
  createPayment,
  updatePayment,
  deletePayment,
} from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import { getLocations } from "../../features/locations/locationSlice";
import Modal from "react-modal";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import { format } from "date-fns";

Modal.setAppElement("#root");

function PaymentManagement() {
  const dispatch = useDispatch();
  const { payments, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.payments
  );
  const { plots } = useSelector((state) => state.plots);
  const { locations } = useSelector((state) => state.locations);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [expandedPlot, setExpandedPlot] = useState(null);
  const [currentPayment, setCurrentPayment] = useState({
    _id: "",
    expectedAmount: "",
    paidAmount: "",
    dueDate: "",
    isPaid: false,
  });
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(getLocations());
    dispatch(getPlots());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPlot) {
      dispatch(getPaymentsByPlot(selectedPlot._id));
    }
  }, [selectedPlot, dispatch]);

  const openPaymentFormModal = (payment = null, plot = null) => {
    if (payment) {
      setIsEdit(true);
      setCurrentPayment({
        _id: payment._id,
        expectedAmount: payment.expectedAmount,
        paidAmount: payment.paidAmount,
        dueDate: payment.dueDate.split("T")[0],
        isPaid: payment.isPaid,
      });
    } else {
      setIsEdit(false);
      setCurrentPayment({
        _id: "",
        expectedAmount: "",
        paidAmount: "",
        dueDate: new Date().toISOString().split("T")[0],
        isPaid: false,
      });
    }
    if (plot) setSelectedPlot(plot);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const toggleLocation = (locationId) => {
    setExpandedLocation(expandedLocation === locationId ? null : locationId);
  };

  const togglePlot = (plotId) => {
    setExpandedPlot(expandedPlot === plotId ? null : plotId);
    if (expandedPlot !== plotId) {
      const plot = plots.find((p) => p._id === plotId);
      setSelectedPlot(plot);
    }
  };

  const handleChange = (e) => {
    setCurrentPayment({
      ...currentPayment,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const paymentData = {
      plot: selectedPlot._id,
      expectedAmount: currentPayment.expectedAmount,
      paidAmount: currentPayment.paidAmount,
      dueDate: currentPayment.dueDate,
      isPaid: currentPayment.isPaid,
    };

    if (isEdit) {
      dispatch(
        updatePayment({ paymentId: currentPayment._id, paymentData })
      ).then(() => {
        toast.success("Payment updated successfully");
        dispatch(getPaymentsByPlot(selectedPlot._id));
      });
    } else {
      dispatch(createPayment(paymentData)).then(() => {
        toast.success("Payment created successfully");
        dispatch(getPaymentsByPlot(selectedPlot._id));
      });
    }
    closeModal();
  };

  const handleDelete = async (paymentId, plotId) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        const result = await dispatch(deletePayment(paymentId));

        if (result.error) {
          throw result.error;
        }

        toast.success("Payment deleted successfully");

        if (plotId) {
          dispatch(getPaymentsByPlot(plotId));
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete payment");
        console.error("Delete payment error:", error);
      }
    }
  };

  const calculatePlotTotals = (plot) => {
    if (!plot.paymentSchedules) return { expected: 0, paid: 0, balance: 0 };
    return plot.paymentSchedules.reduce(
      (totals, payment) => {
        totals.expected += payment.expectedAmount || 0;
        totals.paid += payment.paidAmount || 0;
        totals.balance = totals.expected - totals.paid;
        return totals;
      },
      { expected: 0, paid: 0, balance: 0 }
    );
  };

  const filteredLocations = locations.filter((location) => {
    // Filter by search term
    const locationMatches = location.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filter plots within this location
    const filteredPlots = plots.filter(
      (plot) =>
        plot.location?._id === location._id &&
        plot.plotNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return locationMatches || filteredPlots.length > 0;
  });

  const getPaymentStatus = (payment) => {
    if (payment.isPaid) return "paid";
    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    return dueDate < today ? "overdue" : "pending";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative">
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
          <div className="relative">
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Expected</h3>
          <p className="text-2xl font-semibold mt-2">
            Ksh{" "}
            {plots
              .reduce(
                (sum, plot) => sum + calculatePlotTotals(plot).expected,
                0
              )
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Paid</h3>
          <p className="text-2xl font-semibold mt-2">
            Ksh{" "}
            {plots
              .reduce((sum, plot) => sum + calculatePlotTotals(plot).paid, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Balance</h3>
          <p className="text-2xl font-semibold mt-2">
            Ksh{" "}
            {plots
              .reduce((sum, plot) => sum + calculatePlotTotals(plot).balance, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Location Accordions */}
      <div className="space-y-4">
        {filteredLocations.map((location) => (
          <div
            key={location._id}
            className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100"
          >
            <div
              className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleLocation(location._id)}
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {location.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {
                    plots.filter((plot) => plot.location?._id === location._id)
                      .length
                  }{" "}
                  plots
                </p>
              </div>
              <div className="flex items-center">
                {expandedLocation === location._id ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
              </div>
            </div>

            {expandedLocation === location._id && (
              <div className="border-t border-gray-100">
                {plots
                  .filter((plot) => plot.location?._id === location._id)
                  .map((plot) => {
                    const totals = calculatePlotTotals(plot);
                    const firstUser = plot.users?.[0] || {};
                    const plotPayments = payments.filter(
                      (payment) => payment.plot === plot._id
                    );

                    return (
                      <div
                        key={plot._id}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <div
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => togglePlot(plot._id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
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
                          <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row sm:items-center sm:space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Expected</p>
                              <p className="font-medium">
                                Ksh {totals.expected.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Paid</p>
                              <p className="font-medium">
                                Ksh {totals.paid.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Balance</p>
                              <p
                                className={`font-medium ${
                                  totals.balance > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                Ksh {totals.balance.toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentFormModal(null, plot);
                              }}
                              className="mt-2 sm:mt-0 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center space-x-1 hover:bg-blue-700 transition-colors"
                            >
                              <FaPlus className="w-3 h-3" />
                              <span>Add Payment</span>
                            </button>
                          </div>
                        </div>

                        {expandedPlot === plot._id && (
                          <div className="bg-gray-50 p-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">
                              Payment Schedule
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead>
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
                                  {plotPayments.map((payment) => {
                                    const status = getPaymentStatus(payment);
                                    return (
                                      <tr key={payment._id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                          {format(
                                            new Date(payment.dueDate),
                                            "MMM dd, yyyy"
                                          )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                          Ksh{" "}
                                          {payment.expectedAmount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                          Ksh{" "}
                                          {payment.paidAmount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span
                                            className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                                              status === "paid"
                                                ? "bg-green-100 text-green-800"
                                                : status === "overdue"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                          >
                                            {status === "paid"
                                              ? "Paid"
                                              : status === "overdue"
                                              ? "Overdue"
                                              : "Pending"}
                                          </span>
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
                                                  selectedPlot._id
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
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
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
                  value={currentPayment.expectedAmount}
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
                  value={currentPayment.paidAmount}
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
                  value={currentPayment.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPaid"
                  checked={currentPayment.isPaid}
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
    </div>
  );
}

export default PaymentManagement;
