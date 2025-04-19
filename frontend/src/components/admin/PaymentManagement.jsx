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
} from "react-icons/fa";

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
  const [currentPayment, setCurrentPayment] = useState({
    _id: "",
    expectedAmount: "",
    paidAmount: "",
    dueDate: "",
    isPaid: false,
  });
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [viewPaymentsModalOpen, setViewPaymentsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(getLocations());
    dispatch(getPlots());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPlot) {
      dispatch(getPaymentsByPlot(selectedPlot._id));
    }
  }, [selectedPlot, dispatch]);

  const openPaymentFormModal = (payment = null) => {
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
    setModalIsOpen(true);
  };

  const openViewPaymentsModal = (plot) => {
    setSelectedPlot(plot);
    setViewPaymentsModalOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setViewPaymentsModalOpen(false);
  };

  const toggleLocation = (locationId) => {
    setExpandedLocation(expandedLocation === locationId ? null : locationId);
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
      dispatch(updatePayment({ paymentId: currentPayment._id, paymentData }));
    } else {
      dispatch(createPayment(paymentData));
    }
  };

  const handleDelete = (paymentId) => {
    if (
      window.confirm("Are you sure you want to delete this payment schedule?")
    ) {
      dispatch(deletePayment(paymentId))
        .then(() => {
          toast.success("Payment schedule deleted successfully");
          dispatch(getPaymentsByPlot(selectedPlot._id)); // Refresh payments
        })
        .catch(() => {
          toast.error("Failed to delete payment schedule");
        });
    }
  };

  const calculatePlotTotals = (plot) => {
    if (!plot.paymentSchedules) return { expected: 0, paid: 0 };

    return plot.paymentSchedules.reduce(
      (totals, payment) => {
        totals.expected += payment.expectedAmount || 0;
        totals.paid += payment.paidAmount || 0;
        return totals;
      },
      { expected: 0, paid: 0 }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Payment Management by Location
      </h1>

      <div className="space-y-4">
        {locations.map((location) => (
          <div
            key={location._id}
            className="bg-white shadow-md rounded-lg overflow-hidden"
          >
            <div
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleLocation(location._id)}
            >
              <h2 className="text-lg font-semibold">{location.name}</h2>
              {expandedLocation === location._id ? (
                <FaChevronUp className="text-gray-500" />
              ) : (
                <FaChevronDown className="text-gray-500" />
              )}
            </div>

            {expandedLocation === location._id && (
              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plot Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plots
                      .filter((plot) => plot.location?._id === location._id)
                      .map((plot) => {
                        const totals = calculatePlotTotals(plot);
                        const firstUser = plot.users?.[0] || {};

                        return (
                          <tr key={plot._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {plot.plotNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {firstUser.name || "No user assigned"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {firstUser.mobile || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Ksh {totals.expected.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Ksh {totals.paid.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openViewPaymentsModal(plot)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                title="View Payment Schedules"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPlot(plot);
                                  openPaymentFormModal();
                                }}
                                className="text-primary-600 hover:text-primary-900"
                                title="Add Payment Schedule"
                              >
                                <FaPlus />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Payment Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Payment Form Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {isEdit ? "Edit Payment" : "Add Payment"}
          </h2>
          {selectedPlot && (
            <p className="text-sm text-gray-600 mb-4">
              For Plot: {selectedPlot.plotNumber} ({selectedPlot.location?.name}
              )
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Amount
              </label>
              <input
                type="number"
                name="expectedAmount"
                value={currentPayment.expectedAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid Amount
              </label>
              <input
                type="number"
                name="paidAmount"
                value={currentPayment.paidAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={currentPayment.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                name="isPaid"
                checked={currentPayment.isPaid}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Mark as Paid
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Payments Modal */}
      <Modal
        isOpen={viewPaymentsModalOpen}
        onRequestClose={closeModal}
        contentLabel="Payment Schedules Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Payment Schedules for Plot {selectedPlot?.plotNumber}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={() => {
                openPaymentFormModal();
                setViewPaymentsModalOpen(false);
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FaPlus className="mr-2" /> Add Payment Schedule
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
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
                {payments
                  .filter((payment) => payment.plot === selectedPlot?._id)
                  .map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Ksh {payment.expectedAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Ksh {payment.paidAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.isPaid
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            openPaymentFormModal(payment);
                            setViewPaymentsModalOpen(false);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(payment._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PaymentManagement;
