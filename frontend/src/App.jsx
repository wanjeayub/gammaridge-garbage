import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import User from "./pages/User";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// Admin routes
import AdminDashboard from "./components/admin/Dashboard";
import AdminUsers from "./components/admin/Users";
import AdminLocations from "./components/admin/Locations";
import AdminPlots from "./components/admin/Plots";
import AdminAssignHouseholds from "./components/admin/AssignHouseholdModal";
import AdminPayments from "./components/admin/PaymentManagement";
import AdminReports from "./components/admin/Reports";

// User routes
import UserDashboard from "./components/user/Dashboard";
import UserProfile from "./components/user/Profile";
import UserPayments from "./components/user/Payments";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<Admin />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="plots" element={<AdminPlots />} />
          <Route path="assign" element={<AdminAssignHouseholds />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        <Route path="/user" element={<User />}>
          <Route index element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="payments" element={<UserPayments />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
