// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EditorDashboard from "./pages/EditorDashboard";

function App() {
  const user = JSON.parse(localStorage.getItem("user") || 'null');
  const role = user?.role?.toLowerCase();

  const DashboardComponent = () => {
    if (role === "superadmin") return <SuperAdminDashboard />;
    if (role === "admin") return <AdminDashboard />;
    if (role === "editor") return <EditorDashboard />;
    return <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardComponent />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
