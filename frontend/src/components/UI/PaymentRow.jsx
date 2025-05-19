import React from "react";
import PropTypes from "prop-types";
import { format, parseISO } from "date-fns";
import { FaEdit, FaTrash } from "react-icons/fa";
import PaymentStatusBadge from "../ui/PaymentStatusBadge";

const PaymentRow = ({ payment, onEdit, onDelete }) => {
  const status = payment.isPaid
    ? "paid"
    : new Date(payment.dueDate) < new Date()
    ? "overdue"
    : "pending";

  return (
    <div className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-3">
          <p className="text-sm text-gray-500">
            {format(parseISO(payment.dueDate), "MMM dd, yyyy")}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">
            Ksh {payment.expectedAmount?.toLocaleString() || "0"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">
            Ksh {payment.paidAmount?.toLocaleString() || "0"}
          </p>
        </div>
        <div className="col-span-2">
          <PaymentStatusBadge status={status} />
        </div>
        <div className="col-span-3 text-right">
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onEdit(payment)}
              className="p-1.5 text-blue-600 hover:text-blue-900 rounded-md hover:bg-blue-50 transition-colors"
              aria-label={`Edit payment for ${format(
                parseISO(payment.dueDate),
                "MMM dd, yyyy"
              )}`}
            >
              <FaEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(payment._id)}
              className="p-1.5 text-red-600 hover:text-red-900 rounded-md hover:bg-red-50 transition-colors"
              aria-label={`Delete payment for ${format(
                parseISO(payment.dueDate),
                "MMM dd, yyyy"
              )}`}
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

PaymentRow.propTypes = {
  payment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    expectedAmount: PropTypes.number.isRequired,
    paidAmount: PropTypes.number.isRequired,
    dueDate: PropTypes.string.isRequired,
    isPaid: PropTypes.bool.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default React.memo(PaymentRow);
