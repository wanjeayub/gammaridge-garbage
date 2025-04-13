import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";

function User() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "user") {
      toast.error("Unauthorized access");
      navigate("/admin");
    }
  }, [user, navigate]);

  if (!user || user.role !== "user") {
    return null;
  }

  const userLinks = [
    { name: "Dashboard", path: "/user" },
    { name: "My Profile", path: "/user/profile" },
    { name: "My Payments", path: "/user/payments" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar links={userLinks} />
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

export default User;
