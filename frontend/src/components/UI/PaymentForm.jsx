import React from "react";
import { FaTimes } from "react-icons/fa";
import { useFormik } from "formik";
import * as Yup from "yup";

const paymentSchema = Yup.object().shape({
  expectedAmount: Yup.number()
    .required("Required")
    .min(1, "Must be at least Ksh 1"),
  paidAmount: Yup.number()
    .required("Required")
    .min(0, "Cannot be negative")
    .test(
      "paid-less-than-expected",
      "Paid amount cannot exceed expected amount",
      function (value) {
        return value <= this.parent.expectedAmount;
      }
    ),
  dueDate: Yup.date()
    .required("Due date is required")
    .min(new Date(), "Due date cannot be in the past"),
});

const PaymentForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  plotInfo,
}) => {
  const formik = useFormik({
    initialValues: {
      expectedAmount: initialValues?.expectedAmount || 0,
      paidAmount: initialValues?.paidAmount || 0,
      dueDate: initialValues?.dueDate || "",
      isPaid: initialValues?.isPaid || false,
    },
    validationSchema: paymentSchema,
    onSubmit: (values) => onSubmit(values),
  });

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {initialValues ? "Edit Payment" : "Add Payment"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 focus:outline-none"
          aria-label="Close modal"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      {plotInfo && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <p className="text-sm font-medium text-blue-800">
            Plot: {plotInfo.plotNumber} ({plotInfo.locationName})
          </p>
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-4">
          {/* Expected Amount */}
          <div>
            <label
              htmlFor="expectedAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Expected Amount (Ksh)
            </label>
            <input
              id="expectedAmount"
              name="expectedAmount"
              type="number"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.expectedAmount}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.expectedAmount && formik.errors.expectedAmount
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              disabled={isSubmitting}
              step="0.01"
            />
            {formik.touched.expectedAmount && formik.errors.expectedAmount && (
              <p className="mt-1 text-sm text-red-600">
                {formik.errors.expectedAmount}
              </p>
            )}
          </div>

          {/* Paid Amount */}
          <div>
            <label
              htmlFor="paidAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Paid Amount (Ksh)
            </label>
            <input
              id="paidAmount"
              name="paidAmount"
              type="number"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.paidAmount}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.paidAmount && formik.errors.paidAmount
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              disabled={isSubmitting}
              step="0.01"
            />
            {formik.touched.paidAmount && formik.errors.paidAmount && (
              <p className="mt-1 text-sm text-red-600">
                {formik.errors.paidAmount}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Due Date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.dueDate}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.dueDate && formik.errors.dueDate
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {formik.touched.dueDate && formik.errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">
                {formik.errors.dueDate}
              </p>
            )}
          </div>

          {/* Payment Status */}
          <div className="flex items-center">
            <input
              id="isPaid"
              name="isPaid"
              type="checkbox"
              checked={formik.values.isPaid}
              onChange={formik.handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label
              htmlFor="isPaid"
              className="ml-2 block text-sm text-gray-900"
            >
              Mark as Paid
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formik.isValid}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(PaymentForm);
