import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
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
const REFRESH_DELAY = 500;

const PaymentDashboard22 = () => {
  const dispatch = useDispatch();
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const loadingToastRef = useRef(null);

  const {
    monthlyPayments,
    summary,
    isLoading: paymentsLoading,
    isError,
    message,
    isSuccess, // Add this if your slice provides it
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0); // Force re-render trigger

  // Modal states
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    plot: null,
    payment: null,
  });

  const [formData, setFormData] = useState({
    expectedAmount: "",
    paidAmount: "0",
    additionalPayment: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferringPlots, setTransferringPlots] = useState(new Set());

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
      }
    };
  }, []);

  // Core refresh function - memoized but with dataVersion dependency
  const refreshData = useCallback(
    async (showLoadingToast = false) => {
      if (!isMounted.current) return;

      // Cancel any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      try {
        setIsRefreshing(true);

        let loadingToast;
        if (showLoadingToast) {
          loadingToast = toast.loading("Refreshing data...");
          loadingToastRef.current = loadingToast;
        }

        const [year, month] = selectedMonth.split("-");
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Create new abort controller for this request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        await Promise.all([
          dispatch(
            getPaymentsByMonth({ month: monthNum, year: yearNum }),
          ).unwrap(),
          dispatch(
            getMonthlySummary({ month: monthNum, year: yearNum }),
          ).unwrap(),
        ]);

        if (loadingToast && isMounted.current) {
          toast.dismiss(loadingToast);
          loadingToastRef.current = null;
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        
        console.error("Error refreshing data:", error);
        if (isMounted.current) {
          toast.error(error.message || "Failed to refresh data");
        }
      } finally {
        if (isMounted.current) {
          setIsRefreshing(false);
        }
      }
    },
    [dispatch, selectedMonth], // Remove dataVersion to prevent loops, use trigger instead
  );

  // Trigger refresh without creating new function references
  const triggerRefresh = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  // Debounced refresh that uses the stable refreshData
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      refreshData(false);
    }, REFRESH_DELAY);
  }, [refreshData]);

  // Effect to handle dataVersion changes
  useEffect(() => {
    if (dataVersion > 0) {
      refreshData(false);
    }
  }, [dataVersion, refreshData]);

  // Initial data load - separate from refresh logic
  useEffect(() => {
    const loadData = async () => {
      if (!isMounted.current) return;

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

        const loadingToast = toast.loading("Loading payment data...");
        loadingToastRef.current = loadingToast;

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

        if (isMounted.current) {
          toast.dismiss(loadingToast);
          loadingToastRef.current = null;
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        
        if (isMounted.current) {
          toast.error(error.message || "Failed to load data");
        }
      }
    };

    const debounceTimer = setTimeout(loadData, DEBOUNCE_DELAY);
    return () => clearTimeout(debounceTimer);
  }, [dispatch, selectedMonth]); // Only re-run when month changes

  // Handle Redux errors
  useEffect(() => {
    if (isError && message && isMounted.current) {
      toast.error(message);
      dispatch(clearPaymentErrors());
    }
  }, [isError, message, dispatch]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || isNaN(amount))
      return "Ksh 0.00";
    return `Ksh ${Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  // Calculate completion percentage
  const calculateCompletion = useCallback((paid, expected) => {
    if (!expected || expected === 0) return 0;
    return Math.round((paid / expected) * 100);
  }, []);

  // Validate payment form
  const validatePaymentForm = useCallback(
    (data, type, currentPayment = null) => {
      const errors = {};

      if (type === "pay") {
        const additionalPayment = parseFloat(data.additionalPayment);

        if (isNaN(additionalPayment) || additionalPayment <= 0) {
          errors.additionalPayment = "Payment amount must be greater than 0";
        }

        if (currentPayment) {
          const newTotal = currentPayment.paidAmount + additionalPayment;
          if (newTotal > currentPayment.expectedAmount) {
            errors.additionalPayment = `Total paid (${formatCurrency(newTotal)}) would exceed expected amount (${formatCurrency(currentPayment.expectedAmount)})`;
          }
        }
      } else {
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
    },
    [formatCurrency],
  );

  const handleTransferPayments = useCallback(
    async (plotId) => {
      if (transferringPlots.has(plotId)) return;

      const plot = plots?.find((p) => p._id === plotId);
      const plotNumber = plot?.plotNumber || "Unknown";

      const confirmed = await new Promise((resolve) => {
        toast.custom(
          (t) => (
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col border border-gray-200">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg
                      className="h-6 w-6 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Transfer Payments - Plot {plotNumber}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Transfer all payments to next month? This will overwrite
                      any existing transferred payments for next month.
                    </p>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          resolve(true);
                        }}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          resolve(false);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
          { duration: Infinity },
        );
      });

      if (!confirmed) return;

      setTransferringPlots((prev) => new Set(prev).add(plotId));

      const processingToast = toast.loading(
        `Transferring payments for plot ${plotNumber}...`,
      );

      try {
        const result = await dispatch(transferPayments(plotId)).unwrap();

        toast.dismiss(processingToast);
        toast.success(
          `Successfully transferred ${result.count} payment(s) to ${result.month}`,
        );

        // Use triggerRefresh instead of direct call to ensure fresh data
        triggerRefresh();
      } catch (error) {
        toast.dismiss(processingToast);
        toast.error(error.message || "Failed to transfer payments");
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
    [dispatch, plots, triggerRefresh, transferringPlots],
  );

  const handleTransferAllPayments = useCallback(async () => {
    if (paymentsLoading) return;

    const confirmed = await new Promise((resolve) => {
      toast.custom(
        (t) => (
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col border border-gray-200">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg
                    className="h-6 w-6 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Transfer All Payments
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Transfer ALL payments to next month? This will overwrite any
                    existing transferred payments for next month across all
                    plots.
                  </p>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        resolve(true);
                      }}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      Transfer All
                    </button>
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        resolve(false);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
        { duration: Infinity },
      );
    });

    if (!confirmed) return;

    const processingToast = toast.loading("Transferring all payments...");

    try {
      const result = await dispatch(transferAllPayments()).unwrap();

      toast.dismiss(processingToast);
      toast.success(
        `Successfully transferred ${result.totalTransferred} payments across ${result.results.length} plots to ${result.month}`,
      );

      // Use triggerRefresh instead of direct call
      triggerRefresh();
    } catch (error) {
      toast.dismiss(processingToast);
      toast.error(error.message || "Failed to transfer payments");
    }
  }, [dispatch, paymentsLoading, triggerRefresh]);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }, []);

  // Modal handlers
  const openModal = useCallback((type, plot, payment = null) => {
    setModalState({
      isOpen: true,
      type,
      plot,
      payment,
    });

    setFormErrors({});

    if (type === "pay") {
      setFormData({
        expectedAmount: payment.expectedAmount.toString(),
        paidAmount: payment.paidAmount.toString(),
        additionalPayment: "",
        dueDate: format(parseISO(payment.dueDate), "yyyy-MM-dd"),
      });
    } else if (type === "edit") {
      setFormData({
        expectedAmount: payment.expectedAmount.toString(),
        paidAmount: payment.paidAmount.toString(),
        additionalPayment: "",
        dueDate: format(parseISO(payment.dueDate), "yyyy-MM-dd"),
      });
    } else if (type === "create") {
      setFormData({
        expectedAmount: "",
        paidAmount: "0",
        additionalPayment: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      type: null,
      plot: null,
      payment: null,
    });
    setFormErrors({});
    setFormData({
      expectedAmount: "",
      paidAmount: "0",
      additionalPayment: "",
      dueDate: format(new Date(), "yyyy-MM-dd"),
    });
  }, []);

  // Submit payment
  const submitPayment = useCallback(
    async (e) => {
      e.preventDefault();

      const errors = validatePaymentForm(
        formData,
        modalState.type,
        modalState.payment,
      );
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error("Please fix the errors in the form");
        return;
      }

      setIsSubmitting(true);
      const processingToast = toast.loading(
        modalState.type === "pay"
          ? "Processing payment..."
          : modalState.type === "edit"
            ? "Updating payment..."
            : "Creating payment...",
      );

      try {
        let paymentData;

        if (modalState.type === "pay") {
          const additionalPayment = parseFloat(formData.additionalPayment);
          const newPaidAmount = modalState.payment.paidAmount + additionalPayment;

          paymentData = {
            expectedAmount: modalState.payment.expectedAmount,
            paidAmount: newPaidAmount,
            dueDate: formData.dueDate,
            isPaid: newPaidAmount >= modalState.payment.expectedAmount,
          };
        } else if (modalState.type === "edit") {
          paymentData = {
            expectedAmount: parseFloat(formData.expectedAmount),
            paidAmount: parseFloat(formData.paidAmount),
            dueDate: formData.dueDate,
            isPaid:
              parseFloat(formData.paidAmount) >=
              parseFloat(formData.expectedAmount),
          };
        } else {
          paymentData = {
            expectedAmount: parseFloat(formData.expectedAmount),
            paidAmount: parseFloat(formData.paidAmount),
            dueDate: formData.dueDate,
            isPaid:
              parseFloat(formData.paidAmount) >=
              parseFloat(formData.expectedAmount),
          };
        }

        if (modalState.type === "pay" || modalState.type === "edit") {
          await dispatch(
            updatePayment({
              paymentId: modalState.payment._id,
              paymentData,
            }),
          ).unwrap();

          toast.dismiss(processingToast);

          if (modalState.type === "pay") {
            const additionalAmount = parseFloat(formData.additionalPayment);
            toast.success(
              `Payment of ${formatCurrency(additionalAmount)} recorded successfully. Total paid: ${formatCurrency(paymentData.paidAmount)}`,
            );
          } else {
            toast.success("Payment updated successfully");
          }
        } else {
          await dispatch(
            createPayment({
              plot: modalState.plot._id,
              ...paymentData,
            }),
          ).unwrap();

          toast.dismiss(processingToast);
          toast.success("Payment created successfully");
        }

        closeModal();
        
        // Trigger refresh instead of direct call
        triggerRefresh();
      } catch (error) {
        toast.dismiss(processingToast);
        toast.error(error.message || "Payment operation failed");
      } finally {
        if (isMounted.current) {
          setIsSubmitting(false);
        }
      }
    },
    [
      modalState,
      formData,
      validatePaymentForm,
      formatCurrency,
      closeModal,
      triggerRefresh,
      dispatch,
    ],
  );

  // Handle payment deletion
  const handleDeletePayment = useCallback(
    async (payment, plot) => {
      const confirmed = await new Promise((resolve) => {
        toast.custom(
          (t) => (
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col border border-gray-200">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg
                      className="h-6 w-6 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Delete Payment - Plot {plot.plotNumber}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Are you sure you want to delete this payment of{" "}
                      {formatCurrency(payment.expectedAmount)}? This action
                      cannot be undone.
                    </p>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          resolve(true);
                        }}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          resolve(false);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
          { duration: Infinity },
        );
      });

      if (!confirmed) return;

      const processingToast = toast.loading("Deleting payment...");

      try {
        await dispatch(deletePayment(payment._id)).unwrap();
        toast.dismiss(processingToast);
        toast.success("Payment deleted successfully");

        // Trigger refresh instead of direct call
        triggerRefresh();
      } catch (error) {
        toast.dismiss(processingToast);
        toast.error(error.message || "Failed to delete payment");
      }
    },
    [dispatch, formatCurrency, triggerRefresh],
  );

  // Memoized calculations - ensure they recalculate when data changes
  const paymentsByPlotId = useMemo(() => {
    if (!monthlyPayments || !Array.isArray(monthlyPayments)) return {};
    
    return monthlyPayments.reduce((acc, payment) => {
      if (payment?.plot?._id) {
        acc[payment.plot._id] = payment;
      }
      return acc;
    }, {});
  }, [monthlyPayments, dataVersion]); // Add dataVersion to force recalculation

  const plotsByLocation = useMemo(() => {
    if (!locations || !plots || !Array.isArray(locations) || !Array.isArray(plots)) return {};

    return locations.reduce((acc, location) => {
      const locationPlots =
        plots.filter((plot) => plot.location?._id === location._id) || [];

      acc[location._id] = locationPlots.sort((a, b) => {
        const numA = parseInt(a.plotNumber?.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.plotNumber?.replace(/\D/g, "")) || 0;
        return numA - numB;
      });

      return acc;
    }, {});
  }, [locations, plots, dataVersion]); // Add dataVersion

  const isLoading =
    paymentsLoading || plotsLoading || locationsLoading || isRefreshing;

  // User components
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

  const SummaryCard = useCallback(({ title, value, color, isLoading }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-800 border-blue-200",
      green: "bg-green-50 text-green-800 border-green-200",
      yellow: "bg-yellow-50 text-yellow-800 border-yellow-200",
      purple: "bg-purple-50 text-purple-800 border-purple-200",
    };

    return (
      <div
        className={`p-3 rounded border transition-all duration-300 ${colorClasses[color]} ${isLoading ? "opacity-50 animate-pulse" : ""}`}
      >
        <h3 className="font-medium text-sm flex items-center">
          {title}
          {isLoading && (
            <svg
              className="animate-spin ml-2 h-3 w-3 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
        </h3>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    );
  }, []);

  // Render modal
  const renderModal = () => {
    if (!modalState.isOpen) return null;

    const { type, plot, payment } = modalState;
    const plotNumber = plot?.plotNumber || "Unknown";
    const plotLocation = plot?.location?.name || "Unknown Location";
    const plotUsers = plot?.users || [];

    const getModalTitle = () => {
      switch (type) {
        case "pay":
          return `Record Payment - Plot ${plotNumber}`;
        case "edit":
          return `Edit Payment - Plot ${plotNumber}`;
        case "create":
          return `Create New Payment - Plot ${plotNumber}`;
        default:
          return "";
      }
    };

    const getPaymentSummary = () => {
      if (type === "pay" && payment) {
        const remaining = payment.expectedAmount - payment.paidAmount;
        return {
          expected: payment.expectedAmount,
          paid: payment.paidAmount,
          remaining: remaining,
          isFullyPaid: remaining <= 0,
          completion: calculateCompletion(
            payment.paidAmount,
            payment.expectedAmount,
          ),
        };
      }
      return null;
    };

    const paymentSummary = getPaymentSummary();

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {getModalTitle()}
            </h2>

            <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {plotLocation}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Plot:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {plotNumber}
                  </span>
                </div>
                {plotUsers.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Owner:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {plotUsers[0]?.name || "N/A"}
                      {plotUsers.length > 1 && ` +${plotUsers.length - 1} more`}
                    </span>
                  </div>
                )}
                {plotUsers[0]?.mobile && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Mobile:</span>
                    <span className="ml-2 text-gray-900">
                      {plotUsers[0].mobile}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {type === "pay" && paymentSummary && (
              <div
                className={`mt-3 p-3 rounded-lg border ${
                  paymentSummary.isFullyPaid
                    ? "bg-green-50 border-green-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected Amount:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(paymentSummary.expected)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid So Far:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(paymentSummary.paid)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Remaining:</span>
                    <span
                      className={`font-bold ${
                        paymentSummary.remaining > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(paymentSummary.remaining)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Completion:</span>
                    <span
                      className={`font-medium ${
                        paymentSummary.completion === 100
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {paymentSummary.completion}%
                    </span>
                  </div>
                </div>
                {paymentSummary.isFullyPaid && (
                  <p className="mt-2 text-xs text-green-600 bg-green-100 p-1 rounded text-center">
                    ✓ This plot is already fully paid
                  </p>
                )}
              </div>
            )}
          </div>

          <form onSubmit={submitPayment} noValidate>
            {(type === "create" || type === "edit") && (
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
                  placeholder="Enter expected amount"
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
            )}

            {type === "pay" ? (
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="additionalPayment"
                >
                  Additional Payment Amount (Ksh) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Ksh</span>
                  </div>
                  <input
                    type="number"
                    id="additionalPayment"
                    name="additionalPayment"
                    value={formData.additionalPayment}
                    onChange={handleInputChange}
                    className={`shadow appearance-none border rounded w-full py-2 pl-12 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formErrors.additionalPayment ? "border-red-500" : ""
                    }`}
                    required
                    step="0.01"
                    min="0.01"
                    max={paymentSummary?.remaining || 0}
                    disabled={isSubmitting || paymentSummary?.isFullyPaid}
                    placeholder="Enter payment amount"
                    autoFocus
                    aria-describedby={
                      formErrors.additionalPayment
                        ? "additionalPayment-error"
                        : undefined
                    }
                  />
                </div>
                {formErrors.additionalPayment && (
                  <p
                    id="additionalPayment-error"
                    className="text-red-500 text-xs mt-1"
                  >
                    {formErrors.additionalPayment}
                  </p>
                )}
                {paymentSummary && !paymentSummary.isFullyPaid && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum allowed: {formatCurrency(paymentSummary.remaining)}
                  </p>
                )}

                {formData.additionalPayment &&
                  !isNaN(parseFloat(formData.additionalPayment)) &&
                  payment && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs text-gray-600">
                        New total paid:{" "}
                        <span className="font-medium text-green-600">
                          {formatCurrency(
                            payment.paidAmount +
                              parseFloat(formData.additionalPayment),
                          )}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        New completion:{" "}
                        <span className="font-medium text-blue-600">
                          {calculateCompletion(
                            payment.paidAmount +
                              parseFloat(formData.additionalPayment),
                            payment.expectedAmount,
                          )}
                          %
                        </span>
                      </p>
                    </div>
                  )}
              </div>
            ) : type === "edit" ? (
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
                  placeholder="Enter paid amount"
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

                {formData.expectedAmount &&
                  formData.paidAmount &&
                  !isNaN(parseFloat(formData.paidAmount)) && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs text-gray-600">
                        Completion:{" "}
                        <span className="font-medium text-blue-600">
                          {calculateCompletion(
                            parseFloat(formData.paidAmount),
                            parseFloat(formData.expectedAmount),
                          )}
                          %
                        </span>
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="paidAmount"
                >
                  Initial Paid Amount (Ksh) *
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
                  placeholder="Enter initial paid amount"
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
            )}

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
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (type === "pay" && paymentSummary?.isFullyPaid)
                }
                className={`px-4 py-2 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                  type === "pay"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : type === "edit"
                      ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500"
                      : "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : type === "pay" ? (
                  "Record Payment"
                ) : type === "edit" ? (
                  "Update Payment"
                ) : (
                  "Create Payment"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Management
          </h1>
          {isRefreshing && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </div>
          )}
        </div>
        {isLoading && !isRefreshing && (
          <p className="text-sm text-gray-500 mt-1">Loading...</p>
        )}
      </header>

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

      <div className="mb-6 w-full">
        {summary ? (
          <div className="bg-white shadow rounded-lg p-4 w-full border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
              {summary.monthName} {summary.year} Summary
              {isRefreshing && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (updating...)
                </span>
              )}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard
                title="Total Expected"
                value={formatCurrency(summary.totalExpected)}
                color="blue"
                isLoading={isRefreshing}
              />
              <SummaryCard
                title="Total Paid"
                value={formatCurrency(summary.totalPaid)}
                color="green"
                isLoading={isRefreshing}
              />
              <SummaryCard
                title="Outstanding"
                value={formatCurrency(summary.outstandingAmount)}
                color="yellow"
                isLoading={isRefreshing}
              />
              <SummaryCard
                title="Completion"
                value={`${Math.round(summary.amountCompletionRate || 0)}%`}
                color="purple"
                isLoading={isRefreshing}
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

      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
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
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors duration-200 sticky top-0 z-10"
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
                  <div className="min-w-[800px] md:min-w-full">
                    <table className="w-full divide-y divide-gray-200">
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
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
                          const isTransferring = transferringPlots.has(
                            plot._id,
                          );

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
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                                data-label="Plot Code"
                              >
                                {plot.plotNumber}
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap"
                                data-label="Owner"
                              >
                                <UserStack users={plot.users} />
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                data-label="Mobile"
                              >
                                <UserNumberStack users={plot.users} />
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px] hidden md:table-cell"
                                data-label="Email"
                                title={plot.users?.[0]?.email}
                              >
                                {plot.users?.[0]?.email || "N/A"}
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600"
                                data-label="Expected"
                              >
                                {payment
                                  ? formatCurrency(payment.expectedAmount)
                                  : "N/A"}
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600"
                                data-label="Paid"
                              >
                                {payment
                                  ? formatCurrency(payment.paidAmount)
                                  : "N/A"}
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap"
                                data-label="Status"
                              >
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
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                                data-label="Actions"
                              >
                                <div className="flex flex-wrap gap-1">
                                  {!payment ? (
                                    <button
                                      onClick={() => openModal("create", plot)}
                                      disabled={isLoading}
                                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                      aria-label={`Add payment for plot ${plot.plotNumber}`}
                                    >
                                      Add
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() =>
                                          openModal("pay", plot, payment)
                                        }
                                        disabled={isLoading || payment.isPaid}
                                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label={`Pay for plot ${plot.plotNumber}`}
                                      >
                                        Pay
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleTransferPayments(plot._id)
                                        }
                                        disabled={isLoading || isTransferring}
                                        className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label={`Transfer payments for plot ${plot.plotNumber}`}
                                      >
                                        {isTransferring ? (
                                          <svg
                                            className="animate-spin h-3 w-3 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                          >
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                            ></circle>
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                          </svg>
                                        ) : (
                                          "Xfer"
                                        )}
                                      </button>
                                      <button
                                        onClick={() =>
                                          openModal("edit", plot, payment)
                                        }
                                        disabled={isLoading}
                                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label={`Edit payment for plot ${plot.plotNumber}`}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeletePayment(payment, plot)
                                        }
                                        disabled={isLoading}
                                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label={`Delete payment for plot ${plot.plotNumber}`}
                                      >
                                        Del
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {renderModal()}

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

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }

        @media (max-width: 768px) {
          .min-w-\\[800px\\] {
            min-width: 100%;
          }

          table {
            display: block;
          }

          thead {
            display: none;
          }

          tbody {
            display: block;
          }

          tr {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            padding: 12px;
            border: 1px solid #e5e7eb;
            margin-bottom: 8px;
            border-radius: 8px;
          }

          td {
            display: flex;
            flex-direction: column;
            padding: 4px !important;
            white-space: normal !important;
            border: none !important;
          }

          td:before {
            content: attr(data-label);
            font-weight: 600;
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 2px;
          }

          .divide-y > :not([hidden]) ~ :not([hidden]) {
            border-top-width: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentDashboard22;
