import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMonthlySummary } from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import { getUsers } from "../../features/users/userSlice";
import {
  getExpenseSummary,
  getExpensesByMonth,
} from "../../features/expenses/expenseSlice";
import expenseService from "../../services/expenseService";
import { toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

function Reports() {
  const dispatch = useDispatch();
  const { summary } = useSelector((state) => state.payments);
  const { plots } = useSelector((state) => state.plots);
  const { users } = useSelector((state) => state.users);
  const { summary: expenseSummary, expenses } = useSelector(
    (state) => state.expenses
  );

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState("payments");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseData, setExpenseData] = useState({
    description: "",
    amount: 0,
    category: "Fuel",
    date: new Date().toISOString().split("T")[0],
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    dispatch(getMonthlySummary({ month: months[month - 1], year }));
    dispatch(getPlots());
    dispatch(getUsers());
    dispatch(getExpenseSummary({ month: months[month - 1], year }));
    dispatch(getExpensesByMonth({ month: months[month - 1], year }));
  }, [month, year, dispatch]);

  const handleGenerateReport = () => {
    dispatch(getMonthlySummary({ month: months[month - 1], year }))
      .unwrap()
      .catch(toast.error);
    dispatch(getExpenseSummary({ month: months[month - 1], year }))
      .unwrap()
      .catch(toast.error);
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    dispatch(createExpense(expenseData))
      .unwrap()
      .then(() => {
        setShowExpenseForm(false);
        setExpenseData({
          description: "",
          amount: 0,
          category: "Fuel",
          date: new Date().toISOString().split("T")[0],
        });
        dispatch(getExpenseSummary({ month: months[month - 1], year }));
        dispatch(getExpensesByMonth({ month: months[month - 1], year }));
      });
  };

  const handleExportExpenses = async (format) => {
    try {
      await expenseService.exportExpenses(
        format,
        { month: months[month - 1], year },
        user.token
      );
      toast.success(`Expenses exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Data for charts
  const paymentData = [
    {
      name: months[month - 1],
      Expected: summary?.totalExpected || 0,
      Collected: summary?.totalPaid || 0,
      Expenses: expenseSummary?.totalAmount || 0,
      Profit: (summary?.totalPaid || 0) - (expenseSummary?.totalAmount || 0),
    },
  ];

  const userPlotData = plots.map((plot) => ({
    name: `Plot ${plot.plotNumber}`,
    Users: plot.users.length,
  }));

  const expenseByCategoryData = expenseSummary?.byCategory || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="payments">Payments</option>
              <option value="users">User Distribution</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {months.map((_, index) => (
                <option key={index} value={index + 1}>
                  {months[index]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Generate Report
            </button>
          </div>
        </div>

        {reportType === "payments" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Payment Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">Total Expected</p>
                <p className="text-2xl font-bold">
                  Ksh {summary?.totalExpected || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">Total Collected</p>
                <p className="text-2xl font-bold">
                  Ksh {summary?.totalPaid || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700">Total Expenses</p>
                <p className="text-2xl font-bold">
                  Ksh {expenseSummary?.totalAmount || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">Net Profit</p>
                <p className="text-2xl font-bold">
                  Ksh{" "}
                  {(
                    (summary?.totalPaid || 0) -
                    (expenseSummary?.totalAmount || 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Expected" fill="#8884d8" />
                  <Bar dataKey="Collected" fill="#82ca9d" />
                  <Bar dataKey="Expenses" fill="#ff6b6b" />
                  <Bar dataKey="Profit" fill="#4ecdc4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportType === "users" && (
          <div>{/* Existing user distribution code remains the same */}</div>
        )}

        {reportType === "expenses" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Expense Summary
              </h3>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Expense
              </button>
            </div>

            {showExpenseForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">
                  Add New Expense
                </h4>
                <form onSubmit={handleExpenseSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={expenseData.description}
                        onChange={(e) =>
                          setExpenseData({
                            ...expenseData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (Ksh)
                      </label>
                      <input
                        type="number"
                        value={expenseData.amount}
                        onChange={(e) =>
                          setExpenseData({
                            ...expenseData,
                            amount: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={expenseData.category}
                        onChange={(e) =>
                          setExpenseData({
                            ...expenseData,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="Fuel">Fuel</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Supplies">Supplies</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={expenseData.date}
                        onChange={(e) =>
                          setExpenseData({
                            ...expenseData,
                            date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Save Expense
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700">Total Expenses</p>
                <p className="text-2xl font-bold">
                  Ksh {expenseSummary?.totalAmount || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">Expense Count</p>
                <p className="text-2xl font-bold">
                  {expenseSummary?.count || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">Average Expense</p>
                <p className="text-2xl font-bold">
                  Ksh{" "}
                  {expenseSummary?.count
                    ? (
                        expenseSummary.totalAmount / expenseSummary.count
                      ).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalAmount"
                      nameKey="category"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {expenseByCategoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseByCategoryData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalAmount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (Ksh)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.length > 0 ? (
                    expenses.map((expense) => (
                      <tr key={expense._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expense.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No expenses recorded for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Export Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExportExpenses("csv")}
            className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition"
          >
            Export Expenses (CSV)
          </button>
          <button
            onClick={() => handleExportExpenses("excel")}
            className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition"
          >
            Export Expenses (Excel)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
