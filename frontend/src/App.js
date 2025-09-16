// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EditorDashboard from "./pages/EditorDashboard";
import ContentPage from "./pages/ContentPage";
import MediaPage from "./pages/MediaPage";
import UsersPage from "./pages/UsersPage";
import ErrorBoundary from "./components/util/ErrorBoundary";
import { ToastProvider } from "./components/util/Toasts";

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
    <ToastProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<DashboardComponent />} />
            <Route path="/dashboard/content" element={<ContentPage />} />
            <Route path="/dashboard/media" element={<MediaPage />} />
            <Route path="/dashboard/users" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
