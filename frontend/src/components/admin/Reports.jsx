// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { getMonthlySummary } from "../../features/payments/paymentSlice";
// import { getPlots } from "../../features/plots/plotSlice";
// import { getUsers } from "../../features/users/userSlice";
// import {
//   getExpenseSummary,
//   getExpensesByMonth,
//   createExpense,
//   deleteExpense,
// } from "../../features/expenses/expenseSlice";
// import expenseService from "../../features/expenses/expenseService";
// import { toast } from "react-hot-toast";
// import moment from "moment";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// const COLORS = [
//   "#0088FE",
//   "#00C49F",
//   "#FFBB28",
//   "#FF8042",
//   "#8884D8",
//   "#82CA9D",
// ];

// function Reports() {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);

//   // Updated selectors with default values
//   const {
//     summary = {
//       totalExpected: 0,
//       totalPaid: 0,
//       paymentCount: 0,
//       paidCount: 0,
//       partiallyPaidCount: 0,
//       unpaidCount: 0,
//       paymentCompletionRate: 0,
//       amountCompletionRate: 0,
//     },
//     loading: paymentsLoading,
//     error: paymentsError,
//   } = useSelector((state) => state.payments) || {};

//   const {
//     plots = [],
//     loading: plotsLoading,
//     error: plotsError,
//   } = useSelector((state) => state.plots) || {};

//   const {
//     users = [],
//     loading: usersLoading,
//     error: usersError,
//   } = useSelector((state) => state.users) || {};

//   const {
//     summary: expenseSummary = {
//       totalAmount: 0,
//       count: 0,
//       byCategory: [],
//     },
//     expenses = [],
//     loading: expensesLoading,
//     error: expensesError,
//   } = useSelector((state) => state.expenses) || {};

//   const [month, setMonth] = useState(new Date().getMonth() + 1);
//   const [year, setYear] = useState(new Date().getFullYear());
//   const [reportType, setReportType] = useState("payments");
//   const [showExpenseForm, setShowExpenseForm] = useState(false);
//   const [expenseData, setExpenseData] = useState({
//     description: "",
//     amount: 0,
//     category: "Fuel",
//     date: new Date().toISOString().split("T")[0],
//   });

//   const months = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];

//   // Handle errors
//   useEffect(() => {
//     if (paymentsError) toast.error(`Payments: ${paymentsError}`);
//     if (plotsError) toast.error(`Plots: ${plotsError}`);
//     if (usersError) toast.error(`Users: ${usersError}`);
//     if (expensesError) toast.error(`Expenses: ${expensesError}`);
//   }, [paymentsError, plotsError, usersError, expensesError]);

//   useEffect(() => {
//     dispatch(getMonthlySummary({ month: months[month - 1], year }));
//     dispatch(getPlots());
//     dispatch(getUsers());
//     dispatch(getExpenseSummary({ month: months[month - 1], year }));
//     dispatch(getExpensesByMonth({ month: months[month - 1], year }));
//   }, [month, year, dispatch]);

//   const handleGenerateReport = () => {
//     dispatch(getMonthlySummary({ month: months[month - 1], year }))
//       .unwrap()
//       .catch((error) =>
//         toast.error(error.message || "Failed to load payment summary")
//       );

//     dispatch(getExpenseSummary({ month: months[month - 1], year }))
//       .unwrap()
//       .catch((error) =>
//         toast.error(error.message || "Failed to load expense summary")
//       );
//   };

//   const handleExpenseSubmit = (e) => {
//     e.preventDefault();
//     dispatch(createExpense(expenseData))
//       .unwrap()
//       .then(() => {
//         setShowExpenseForm(false);
//         setExpenseData({
//           description: "",
//           amount: 0,
//           category: "Fuel",
//           date: new Date().toISOString().split("T")[0],
//         });
//         dispatch(getExpenseSummary({ month: months[month - 1], year }));
//         dispatch(getExpensesByMonth({ month: months[month - 1], year }));
//       })
//       .catch((error) => {
//         toast.error(error.message || "Failed to create expense");
//       });
//   };

//   const handleEditExpense = (expense) => {
//     setExpenseData({
//       _id: expense._id,
//       description: expense.description,
//       amount: expense.amount,
//       category: expense.category,
//       date: new Date(expense.date).toISOString().split("T")[0],
//     });
//     setShowExpenseForm(true);
//   };

//   const handleDeleteExpense = (expenseId) => {
//     if (window.confirm("Are you sure you want to delete this expense?")) {
//       dispatch(deleteExpense(expenseId))
//         .unwrap()
//         .then(() => {
//           toast.success("Expense deleted successfully");
//           dispatch(getExpenseSummary({ month: months[month - 1], year }));
//           dispatch(getExpensesByMonth({ month: months[month - 1], year }));
//         })
//         .catch((error) => {
//           toast.error(error.message || "Failed to delete expense");
//         });
//     }
//   };

//   const handleExportExpenses = async (format) => {
//     try {
//       await expenseService.exportExpenses(
//         format,
//         { month: months[month - 1], year },
//         user.token
//       );
//       toast.success(`Expenses exported as ${format.toUpperCase()}`);
//     } catch (error) {
//       toast.error(error.message || "Failed to export expenses");
//     }
//   };

//   // Data for charts with fallback values
//   const paymentData = [
//     {
//       name: months[month - 1],
//       Expected: summary.totalExpected,
//       Collected: summary.totalPaid,
//       Expenses: expenseSummary.totalAmount,
//       Profit: summary.totalPaid - expenseSummary.totalAmount,
//     },
//   ];

//   const userPlotData = plots.map((plot) => ({
//     name: `Plot ${plot.plotNumber}`,
//     Users: plot.users?.length || 0,
//   }));

//   const expenseByCategoryData = expenseSummary.byCategory;

//   // Loading state
//   const isLoading =
//     paymentsLoading || expensesLoading || plotsLoading || usersLoading;

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

//       <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Report Type
//             </label>
//             <select
//               value={reportType}
//               onChange={(e) => setReportType(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//             >
//               <option value="payments">Payments</option>
//               <option value="users">User Distribution</option>
//               <option value="expenses">Expenses</option>
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Month
//             </label>
//             <select
//               value={month}
//               onChange={(e) => setMonth(Number(e.target.value))}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//             >
//               {months.map((_, index) => (
//                 <option key={index} value={index + 1}>
//                   {months[index]}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Year
//             </label>
//             <select
//               value={year}
//               onChange={(e) => setYear(Number(e.target.value))}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//             >
//               {Array.from(
//                 { length: 5 },
//                 (_, i) => new Date().getFullYear() - i
//               ).map((y) => (
//                 <option key={y} value={y}>
//                   {y}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="flex items-end">
//             <button
//               onClick={handleGenerateReport}
//               className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
//             >
//               Generate Report
//             </button>
//           </div>
//         </div>

//         {reportType === "payments" && (
//           <div>
//             <h3 className="text-lg font-semibold text-gray-700 mb-4">
//               Payment Summary
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <p className="text-sm text-blue-700">Total Expected</p>
//                 <p className="text-2xl font-bold">
//                   Ksh {summary.totalExpected.toLocaleString()}
//                 </p>
//               </div>
//               <div className="bg-green-50 p-4 rounded-lg">
//                 <p className="text-sm text-green-700">Total Collected</p>
//                 <p className="text-2xl font-bold">
//                   Ksh {summary.totalPaid.toLocaleString()}
//                 </p>
//               </div>
//               <div className="bg-red-50 p-4 rounded-lg">
//                 <p className="text-sm text-red-700">Total Expenses</p>
//                 <p className="text-2xl font-bold">
//                   Ksh {expenseSummary.totalAmount.toLocaleString()}
//                 </p>
//               </div>
//               <div className="bg-purple-50 p-4 rounded-lg">
//                 <p className="text-sm text-purple-700">Net Profit</p>
//                 <p className="text-2xl font-bold">
//                   Ksh{" "}
//                   {(
//                     summary.totalPaid - expenseSummary.totalAmount
//                   ).toLocaleString(undefined, {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//               </div>
//             </div>

//             <div className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart
//                   data={paymentData}
//                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => value.toLocaleString()} />
//                   <Legend />
//                   <Bar dataKey="Expected" fill="#8884d8" />
//                   <Bar dataKey="Collected" fill="#82ca9d" />
//                   <Bar dataKey="Expenses" fill="#ff6b6b" />
//                   <Bar dataKey="Profit" fill="#4ecdc4" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         )}

//         {reportType === "users" && (
//           <div>
//             <h3 className="text-lg font-semibold text-gray-700 mb-4">
//               User Distribution
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <p className="text-sm text-blue-700">Total Users</p>
//                 <p className="text-2xl font-bold">{users.length}</p>
//               </div>
//               <div className="bg-green-50 p-4 rounded-lg">
//                 <p className="text-sm text-green-700">Active Users</p>
//                 <p className="text-2xl font-bold">
//                   {plots.reduce(
//                     (sum, plot) => sum + (plot.users?.length || 0),
//                     0
//                   )}
//                 </p>
//               </div>
//               <div className="bg-purple-50 p-4 rounded-lg">
//                 <p className="text-sm text-purple-700">Plots Occupied</p>
//                 <p className="text-2xl font-bold">
//                   {plots.filter((plot) => plot.users?.length > 0).length} /{" "}
//                   {plots.length}
//                 </p>
//               </div>
//             </div>

//             <div className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart
//                   data={userPlotData.slice(0, 10)}
//                   margin={{
//                     top: 5,
//                     right: 30,
//                     left: 20,
//                     bottom: 5,
//                   }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Bar dataKey="Users" fill="#8884d8" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         )}

//         {reportType === "expenses" && (
//           <div>
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold text-gray-700">
//                 Expense Summary
//               </h3>
//               <button
//                 onClick={() => setShowExpenseForm(true)}
//                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//               >
//                 Add Expense
//               </button>
//             </div>

//             {showExpenseForm && (
//               <div className="bg-gray-50 p-4 rounded-lg mb-6">
//                 <h4 className="text-md font-medium text-gray-700 mb-3">
//                   {expenseData._id ? "Edit Expense" : "Add New Expense"}
//                 </h4>
//                 <form onSubmit={handleExpenseSubmit}>
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Description
//                       </label>
//                       <input
//                         type="text"
//                         value={expenseData.description}
//                         onChange={(e) =>
//                           setExpenseData({
//                             ...expenseData,
//                             description: e.target.value,
//                           })
//                         }
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Amount (Ksh)
//                       </label>
//                       <input
//                         type="number"
//                         value={expenseData.amount}
//                         onChange={(e) =>
//                           setExpenseData({
//                             ...expenseData,
//                             amount: parseFloat(e.target.value) || 0,
//                           })
//                         }
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                         min="0"
//                         step="0.01"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Category
//                       </label>
//                       <select
//                         value={expenseData.category}
//                         onChange={(e) =>
//                           setExpenseData({
//                             ...expenseData,
//                             category: e.target.value,
//                           })
//                         }
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       >
//                         <option value="Fuel">Fuel</option>
//                         <option value="Maintenance">Maintenance</option>
//                         <option value="Salaries">Salaries</option>
//                         <option value="Supplies">Supplies</option>
//                         <option value="Utilities">Utilities</option>
//                         <option value="Other">Other</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Date
//                       </label>
//                       <input
//                         type="date"
//                         value={expenseData.date}
//                         onChange={(e) =>
//                           setExpenseData({
//                             ...expenseData,
//                             date: e.target.value,
//                           })
//                         }
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                         required
//                       />
//                     </div>
//                   </div>
//                   <div className="flex justify-end space-x-3">
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setShowExpenseForm(false);
//                         setExpenseData({
//                           description: "",
//                           amount: 0,
//                           category: "Fuel",
//                           date: new Date().toISOString().split("T")[0],
//                         });
//                       }}
//                       className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
//                     >
//                       {expenseData._id ? "Update Expense" : "Save Expense"}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               <div className="bg-red-50 p-4 rounded-lg">
//                 <p className="text-sm text-red-700">Total Expenses</p>
//                 <p className="text-2xl font-bold">
//                   Ksh {expenseSummary.totalAmount.toLocaleString()}
//                 </p>
//               </div>
//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <p className="text-sm text-blue-700">Expense Count</p>
//                 <p className="text-2xl font-bold">{expenseSummary.count}</p>
//               </div>
//               <div className="bg-purple-50 p-4 rounded-lg">
//                 <p className="text-sm text-purple-700">Average Expense</p>
//                 <p className="text-2xl font-bold">
//                   Ksh{" "}
//                   {expenseSummary.count > 0
//                     ? (
//                         expenseSummary.totalAmount / expenseSummary.count
//                       ).toLocaleString(undefined, {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })
//                     : "0.00"}
//                 </p>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//               <div className="h-64 md:h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={expenseByCategoryData}
//                       cx="50%"
//                       cy="50%"
//                       labelLine={false}
//                       outerRadius={80}
//                       fill="#8884d8"
//                       dataKey="totalAmount"
//                       nameKey="category"
//                       label={({ name, percent }) =>
//                         `${name}: ${(percent * 100).toFixed(0)}%`
//                       }
//                     >
//                       {expenseByCategoryData.map((entry, index) => (
//                         <Cell
//                           key={`cell-${index}`}
//                           fill={COLORS[index % COLORS.length]}
//                         />
//                       ))}
//                     </Pie>
//                     <Tooltip formatter={(value) => value.toLocaleString()} />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//               <div className="h-64 md:h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart
//                     data={expenseByCategoryData}
//                     layout="vertical"
//                     margin={{
//                       top: 5,
//                       right: 30,
//                       left: 20,
//                       bottom: 5,
//                     }}
//                   >
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis
//                       type="number"
//                       tickFormatter={(value) => value.toLocaleString()}
//                     />
//                     <YAxis dataKey="category" type="category" />
//                     <Tooltip formatter={(value) => value.toLocaleString()} />
//                     <Legend />
//                     <Bar dataKey="totalAmount" fill="#8884d8" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Description
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Category
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Amount (Ksh)
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {expenses.length > 0 ? (
//                     expenses.map((expense) => (
//                       <tr key={expense._id}>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {moment(expense.date).format("MMM D, YYYY")}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {expense.description}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {expense.category}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                           {expense.amount.toLocaleString(undefined, {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                           <button
//                             onClick={() => handleEditExpense(expense)}
//                             className="text-indigo-600 hover:text-indigo-900 mr-3"
//                           >
//                             Edit
//                           </button>
//                           <button
//                             onClick={() => handleDeleteExpense(expense._id)}
//                             className="text-red-600 hover:text-red-900"
//                           >
//                             Delete
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan="5"
//                         className="px-6 py-4 text-center text-sm text-gray-500"
//                       >
//                         No expenses recorded for this month
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h3 className="text-lg font-semibold text-gray-700 mb-4">
//           Export Data
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <button
//             onClick={() => handleExportExpenses("csv")}
//             className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition"
//           >
//             Export Expenses (CSV)
//           </button>
//           <button
//             onClick={() => handleExportExpenses("excel")}
//             className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition"
//           >
//             Export Expenses (Excel)
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Reports;
