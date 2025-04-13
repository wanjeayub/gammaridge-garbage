import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  getPaymentsByPlot,
  createPayment,
  updatePayment,
  deletePayment,
  transferPayments,
  reset,
} from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import Modal from "react-modal";
import { FaEdit, FaTrash, FaPlus, FaExchangeAlt } from "react-icons/fa";

Modal.setAppElement("#root");

function PaymentManagement() {
  const dispatch = useDispatch();
  const { payments, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.payments
  );
  const { plots } = useSelector((state) => state.plots);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState("");
  const [currentPayment, setCurrentPayment] = useState({
    _id: "",
    expectedAmount: "",
    paidAmount: "",
    dueDate: "",
    isPaid: false,
  });

  useEffect(() => {
    dispatch(getPlots());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPlot) {
      dispatch(getPaymentsByPlot(selectedPlot));
    }
  }, [selectedPlot, dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success(message || "Operation successful");
      closeModal();
    }

    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  const openModal = (payment = null) => {
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
      if (!selectedPlot) {
        toast.error("Please select a plot first");
        return;
      }
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

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handlePlotChange = (e) => {
    setSelectedPlot(e.target.value);
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
      plot: selectedPlot,
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
      dispatch(deletePayment(paymentId));
    }
  };

  const handleTransfer = () => {
    if (window.confirm("Transfer unpaid payments to next month?")) {
      dispatch(transferPayments(selectedPlot));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
        <div className="flex space-x-4">
          <select
            value={selectedPlot}
            onChange={handlePlotChange}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Plot</option>
            {plots.map((plot) => (
              <option key={plot._id} value={plot._id}>
                {plot.plotNumber} ({plot.location?.name})
              </option>
            ))}
          </select>
          {selectedPlot && (
            <>
              <button
                onClick={() => openModal()}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <FaPlus className="mr-2" /> Add Payment
              </button>
              <button
                onClick={handleTransfer}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <FaExchangeAlt className="mr-2" /> Transfer Unpaid
              </button>
            </>
          )}
        </div>
      </div>

      {selectedPlot && (
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
              {payments.map((payment) => (
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
                      onClick={() => openModal(payment)}
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
      )}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Payment Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {isEdit ? "Edit Payment" : "Add Payment"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="expectedAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Expected Amount
              </label>
              <input
                type="number"
                id="expectedAmount"
                name="expectedAmount"
                value={currentPayment.expectedAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="paidAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Paid Amount
              </label>
              <input
                type="number"
                id="paidAmount"
                name="paidAmount"
                value={currentPayment.paidAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={currentPayment.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="isPaid"
                name="isPaid"
                checked={currentPayment.isPaid}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isPaid"
                className="ml-2 block text-sm text-gray-900"
              >
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
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default PaymentManagement;
