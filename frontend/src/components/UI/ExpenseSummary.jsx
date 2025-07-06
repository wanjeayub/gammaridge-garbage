import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpenseSummary = ({ summary, month, year }) => {
  if (!summary) return null;

  const { totalAmount, averageAmount, count, maxExpense, minExpense } =
    summary.summary;

  const chartData = {
    labels: summary.byCategory.map((cat) => cat._id),
    datasets: [
      {
        data: summary.byCategory.map((cat) => cat.totalAmount),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#8AC24A",
          "#607D8B",
        ],
        hoverBackgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#8AC24A",
          "#607D8B",
        ],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Expense Summary for {month} {year}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <Doughnut
            data={chartData}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || "";
                      const value = context.raw || 0;
                      const percentage = ((value / totalAmount) * 100).toFixed(
                        2
                      );
                      return `${label}: Ksh${value.toFixed(
                        2
                      )} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">
              Total Expenses
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              Ksh {totalAmount.toFixed(2)}
            </p>
            <p className="text-sm text-blue-500">{count} transactions</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">
              Average Expense
            </h3>
            <p className="text-2xl font-bold text-green-600">
              Ksh {averageAmount.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800">
                Highest Expense
              </h3>
              <p className="text-xl font-bold text-yellow-600">
                Ksh {maxExpense.toFixed(2)}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-red-800">
                Lowest Expense
              </h3>
              <p className="text-xl font-bold text-red-600">
                Ksh{minExpense.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSummary;
