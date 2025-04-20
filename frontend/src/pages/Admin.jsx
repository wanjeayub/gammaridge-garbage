import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";

function Admin() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "admin") {
      toast.error("Unauthorized access");
      navigate("/user");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null;
  }

  const adminLinks = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Locations", path: "/admin/locations" },
    { name: "Plots", path: "/admin/plots" },
    { name: "Assign Households", path: "/admin/assign" },
    { name: "Payment Schedules", path: "/admin/payments" },
    { name: "Plots Debug", path: "/admin/debug" },
    { name: "Reports", path: "/admin/reports" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar links={adminLinks} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Admin;
