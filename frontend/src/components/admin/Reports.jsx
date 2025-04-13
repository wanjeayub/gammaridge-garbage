import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMonthlySummary } from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import { getUsers } from "../../features/users/userSlice";
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
} from "recharts";

function Reports() {
  const dispatch = useDispatch();
  const { summary } = useSelector((state) => state.payments);
  const { plots } = useSelector((state) => state.plots);
  const { users } = useSelector((state) => state.users);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState("payments");

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
  }, [month, year, dispatch]);

  const handleGenerateReport = () => {
    dispatch(getMonthlySummary({ month: months[month - 1], year }))
      .unwrap()
      .catch(toast.error);
  };

  // Data for charts
  const paymentData = [
    {
      name: months[month - 1],
      Expected: summary?.totalExpected || 0,
      Collected: summary?.totalPaid || 0,
    },
  ];

  const userPlotData = plots.map((plot) => ({
    name: `Plot ${plot.plotNumber}`,
    Users: plot.users.length,
  }));

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">Collection Rate</p>
                <p className="text-2xl font-bold">
                  {summary?.paymentCount
                    ? `${Math.round(
                        (summary.totalPaid / summary.totalExpected) * 100
                      )}%`
                    : "0%"}
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
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportType === "users" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              User Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">Active Users</p>
                <p className="text-2xl font-bold">
                  {plots.reduce((sum, plot) => sum + plot.users.length, 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">Plots Occupied</p>
                <p className="text-2xl font-bold">
                  {plots.filter((plot) => plot.users.length > 0).length} /{" "}
                  {plots.length}
                </p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userPlotData.slice(0, 10)}
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
                  <Bar dataKey="Users" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Export Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition">
            Export Payments (CSV)
          </button>
          <button className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition">
            Export User List (PDF)
          </button>
          <button className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition">
            Export Plot Assignment (Excel)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
