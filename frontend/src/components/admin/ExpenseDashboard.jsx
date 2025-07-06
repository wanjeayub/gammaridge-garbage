import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  createExpense,
  getExpensesByMonth,
  getExpenseSummary,
  getAvailableMonths,
  updateExpense,
  deleteExpense,
  exportExpenses,
  setCurrentMonth,
  reset,
} from "../../features/expenses/expenseSlice";
import ExpenseForm from "../UI/ExpenseForm";
import ExpenseList from "../UI/ExpenseList";
import ExpenseSummary from "../UI/ExpenseSummary";
import ExpenseFilters from "../UI/ExpenseFilters";
import MonthSelector from "../UI/MonthSelector";
import Spinner from "../UI/Spinner";
import moment from "moment";

const ExpenseDashboard = () => {
  const dispatch = useDispatch();
  const {
    expenses,
    summary,
    availableMonths,
    currentMonth,
    currentYear,
    isLoading,
    isError,
    isSuccess,
    message,
  } = useSelector((state) => state.expense);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: moment().format("YYYY-MM-DD"),
  });

  const [editMode, setEditMode] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const { description, amount, category, date } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onFilterChange = (e) => {
    setFilters((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: moment().format("YYYY-MM-DD"),
    });
    setEditMode(false);
    setCurrentExpenseId(null);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!description || !amount || !category || !date) {
      toast.error("Please fill all fields");
      return;
    }

    const expenseData = {
      description,
      amount: parseFloat(amount),
      category,
      date,
    };

    if (editMode && currentExpenseId) {
      dispatch(updateExpense({ id: currentExpenseId, expenseData }));
    } else {
      dispatch(createExpense(expenseData));
    }

    resetForm();
  };

  const onEdit = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: moment(expense.date).format("YYYY-MM-DD"),
    });
    setEditMode(true);
    setCurrentExpenseId(expense._id);
  };

  const onDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      dispatch(deleteExpense(id));
    }
  };

  const onExport = (format) => {
    dispatch(
      exportExpenses({ format, month: currentMonth, year: currentYear })
    );
  };

  const onMonthChange = (month, year) => {
    dispatch(setCurrentMonth({ month, year }));
  };

  const applyFilters = () => {
    dispatch(getExpensesByMonth({ month: currentMonth, year: currentYear }));
    dispatch(
      getExpenseSummary({
        month: currentMonth,
        year: currentYear,
        compare: false,
      })
    );
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      minAmount: "",
      maxAmount: "",
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success(message || "Operation successful");
    }

    dispatch(getAvailableMonths());
    applyFilters();
    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  useEffect(() => {
    applyFilters();
  }, [currentMonth, currentYear]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
        <MonthSelector
          currentMonth={currentMonth}
          currentYear={currentYear}
          availableMonths={availableMonths}
          onMonthChange={onMonthChange}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ExpenseForm
            formData={formData}
            onChange={onChange}
            onSubmit={onSubmit}
            editMode={editMode}
            resetForm={resetForm}
          />

          {summary && (
            <ExpenseSummary
              summary={summary}
              month={currentMonth}
              year={currentYear}
            />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ExpenseFilters
            filters={filters}
            onFilterChange={onFilterChange}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
            onExport={onExport}
          />

          <ExpenseList
            expenses={expenses}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboard;
