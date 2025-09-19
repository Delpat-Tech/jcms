// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import MediaPage from "./pages/MediaPage";
import RegisterTenant from "./pages/RegisterTenant.jsx";
import ErrorBoundary from "./components/util/ErrorBoundary";
import { ToastProvider } from "./components/util/Toasts";
import { ThemeProvider } from "./contexts/ThemeContext";

// SuperAdmin Pages
import SuperAdminOverview from "./superadmin/overview/page.tsx";
import SuperAdminUsers from "./superadmin/users/page.tsx";
import SuperAdminRoles from "./superadmin/roles/page.tsx";
import SuperAdminAnalytics from "./superadmin/analytics/page.tsx";
import SuperAdminTenants from "./superadmin/tenants/page.tsx";
import SuperAdminSettings from "./superadmin/settings/page.tsx";
import SuperAdminMediaPage from "./superadmin/media/page.tsx";

// Admin Pages
import AdminOverview from "./admin/overview/page.tsx";
import AdminUsers from "./admin/users/page.tsx";
import AdminContent from "./admin/content/page.tsx";
import AdminMedia from "./admin/media/page.tsx";
import AdminAnalytics from "./admin/analytics/page.tsx";
import AdminProfile from "./admin/profile/page.tsx";

// User/Editor Pages
import EditorOverview from "./editor/overview/page.tsx";
import EditorContent from "./editor/content/page.tsx";
import EditorMedia from "./editor/media/page.tsx";
import EditorProfile from "./editor/profile/page.tsx";
import EditorHelp from "./editor/help/page.tsx";

function App() {
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user") || 'null';
  const user = JSON.parse(storedUser);
  const role = user?.role?.toLowerCase();

  const DashboardComponent = () => {
    if (role === "superadmin") return <Navigate to="/superadmin/overview" />;
    if (role === "admin") return <Navigate to="/admin/overview" />;
    if (role === "editor") return <Navigate to="/user/overview" />;
    return <Navigate to="/" />;
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<DashboardComponent />} />
            <Route path="/dashboard/media" element={<MediaPage />} />
            <Route path="/register" element={<RegisterTenant />} />
            
            {/* SuperAdmin Routes */}
            <Route path="/superadmin/overview" element={<SuperAdminOverview />} />
            <Route path="/superadmin/users" element={<SuperAdminUsers />} />
            <Route path="/superadmin/roles" element={<SuperAdminRoles />} />
            <Route path="/superadmin/analytics" element={<SuperAdminAnalytics />} />
            <Route path="/superadmin/tenants" element={<SuperAdminTenants />} />
            <Route path="/superadmin/media" element={<SuperAdminMediaPage />} />
            <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
            
            {/* Admin Routes */}
            <Route path="/admin/overview" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/media" element={<AdminMedia />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            
            {/* User/Editor Routes */}
            <Route path="/user/overview" element={<EditorOverview />} />
            <Route path="/user/content" element={<EditorContent />} />
            <Route path="/user/media" element={<EditorMedia />} />
            <Route path="/user/profile" element={<EditorProfile />} />
            <Route path="/user/help" element={<EditorHelp />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
