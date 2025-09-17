// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import ErrorBoundary from "./components/util/ErrorBoundary";
import { ToastProvider } from "./components/util/Toasts";

// SuperAdmin Pages
import SuperAdminOverview from "./superadmin/overview/page.tsx";
import SuperAdminUsers from "./superadmin/users/page.tsx";
import SuperAdminRoles from "./superadmin/roles/page.tsx";
import SuperAdminAnalytics from "./superadmin/analytics/page.tsx";
import SuperAdminTenants from "./superadmin/tenants/page.tsx";
import SuperAdminSettings from "./superadmin/settings/page.tsx";

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
  const user = JSON.parse(localStorage.getItem("user") || 'null');
  const role = user?.role?.toLowerCase();

  const DashboardComponent = () => {
    if (role === "superadmin") return <Navigate to="/superadmin/overview" />;
    if (role === "admin") return <Navigate to="/admin/overview" />;
    if (role === "editor") return <Navigate to="/user/overview" />;
    return <Navigate to="/" />;
  };

  return (
    <ToastProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<DashboardComponent />} />
            
            {/* SuperAdmin Routes */}
            <Route path="/superadmin/overview" element={<SuperAdminOverview />} />
            <Route path="/superadmin/users" element={<SuperAdminUsers />} />
            <Route path="/superadmin/roles" element={<SuperAdminRoles />} />
            <Route path="/superadmin/analytics" element={<SuperAdminAnalytics />} />
            <Route path="/superadmin/tenants" element={<SuperAdminTenants />} />
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
  );
}

export default App;
