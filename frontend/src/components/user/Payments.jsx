import { useEffect } from "react";
import { useSelector } from "react-redux";

function Payments() {
  const { user } = useSelector((state) => state.auth);
  const { plots } = useSelector((state) => state.plots);
  const { payments } = useSelector((state) => state.payments);

  // Get plots assigned to the user
  const userPlots = plots.filter((plot) =>
    plot.users.some((plotUser) => plotUser._id === user._id)
  );

  // Get payments for user's plots
  const userPayments = payments.filter((payment) =>
    userPlots.some((plot) => plot._id === payment.plot)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Payments</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plot
              </th>
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userPayments.length > 0 ? (
              userPayments.map((payment) => {
                const plot = plots.find((p) => p._id === payment.plot);
                return (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plot?.plotNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Ksh {payment.expectedAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Ksh {payment.paidAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.isPaid
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No payment records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Payment Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">Total Expected</p>
            <p className="text-2xl font-bold">
              Ksh {userPayments.reduce((sum, p) => sum + p.expectedAmount, 0)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">Total Paid</p>
            <p className="text-2xl font-bold">
              Ksh {userPayments.reduce((sum, p) => sum + p.paidAmount, 0)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700">Pending Payments</p>
            <p className="text-2xl font-bold">
              {userPayments.filter((p) => !p.isPaid).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payments;
