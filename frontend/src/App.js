// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import MediaPage from "./pages/MediaPage";
import RegisterTenant from "./pages/RegisterTenant.jsx";
import ErrorBoundary from "./components/util/ErrorBoundary";
import { ToastProvider } from "./components/util/Toasts";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGuard from "./components/auth/AuthGuard";

// SuperAdmin Pages
import SuperAdminOverview from "./superadmin/overview/page.jsx";
import SuperAdminUsers from "./superadmin/users/page.tsx";
import SuperAdminRoles from "./superadmin/roles/page.tsx";
import SuperAdminAnalytics from "./superadmin/analytics/page.tsx";
import SuperAdminTenants from "./superadmin/tenants/page.tsx";
import SuperAdminSettings from "./superadmin/settings/page.tsx";
import SuperAdminMediaPage from "./superadmin/media/page.tsx";
import SuperAdminProfile from "./superadmin/profile/page.tsx";

// Admin Pages
import AdminOverview from "./admin/overview/page.tsx";
import AdminUsers from "./admin/users/page.tsx";
import AdminContent from "./admin/content/page.tsx";
import AdminMedia from "./admin/media/page.tsx";
import AdminAnalytics from "./admin/analytics/page.jsx";
import AdminProfile from "./admin/profile/page.tsx";
import AdminSubscriptions from "./admin/subscriptions/page.jsx";

// User/Editor Pages
import EditorOverview from "./editor/overview/page.jsx";
import EditorContent from "./editor/content/page.jsx";
import EditorMedia from "./editor/media/page.jsx";

import EditorProfile from "./editor/profile/page.jsx";
import EditorHelp from "./editor/help/page.jsx";
import SubscriptionPage from "./pages/SubscriptionDashboard.jsx";
import PublicContentPage from "./pages/PublicContent.jsx";
import SubscribePage from "./pages/SubscribePage.jsx";
import ContentPage from "./pages/ContentPage.jsx";
import DocsPage from "./pages/DocsPage.jsx";

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
            {/* Public content route */}
            <Route path="/g/:idOrSlug" element={<PublicContentPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/dashboard" element={<DashboardComponent />} />
            <Route path="/dashboard/media" element={<MediaPage />} />
            <Route path="/register" element={<RegisterTenant />} />
            <Route path="/subscription" element={<AuthGuard><SubscriptionPage /></AuthGuard>} />
            <Route path="/subscribe" element={<AuthGuard><SubscribePage /></AuthGuard>} />
            
            {/* SuperAdmin Routes */}
            <Route path="/superadmin/overview" element={<AuthGuard requiredRole="superadmin"><SuperAdminOverview /></AuthGuard>} />
            <Route path="/superadmin/users" element={<AuthGuard requiredRole="superadmin"><SuperAdminUsers /></AuthGuard>} />
            <Route path="/superadmin/roles" element={<AuthGuard requiredRole="superadmin"><SuperAdminRoles /></AuthGuard>} />
            <Route path="/superadmin/analytics" element={<AuthGuard requiredRole="superadmin"><SuperAdminAnalytics /></AuthGuard>} />
            <Route path="/superadmin/tenants" element={<AuthGuard requiredRole="superadmin"><SuperAdminTenants /></AuthGuard>} />
            <Route path="/superadmin/media" element={<AuthGuard requiredRole="superadmin"><SuperAdminMediaPage /></AuthGuard>} />
            <Route path="/superadmin/settings" element={<AuthGuard requiredRole="superadmin"><SuperAdminSettings /></AuthGuard>} />
            <Route path="/superadmin/profile" element={<AuthGuard requiredRole="superadmin"><SuperAdminProfile /></AuthGuard>} />
            
            {/* Admin Routes */}
            <Route path="/admin/overview" element={<AuthGuard requiredRole="admin"><AdminOverview /></AuthGuard>} />
            <Route path="/admin/users" element={<AuthGuard requiredRole="admin"><AdminUsers /></AuthGuard>} />
            <Route path="/admin/content" element={<AuthGuard requiredRole="admin"><AdminContent /></AuthGuard>} />
            <Route path="/admin/media" element={<AuthGuard requiredRole="admin"><AdminMedia /></AuthGuard>} />
            <Route path="/admin/subscriptions" element={<AuthGuard requiredRole="admin"><AdminSubscriptions /></AuthGuard>} />
            <Route path="/admin/analytics" element={<AuthGuard requiredRole="admin"><AdminAnalytics /></AuthGuard>} />
            <Route path="/admin/profile" element={<AuthGuard requiredRole="admin"><AdminProfile /></AuthGuard>} />
            
            {/* Content Management Routes */}
            <Route path="/content" element={<AuthGuard><ContentPage /></AuthGuard>} />
            
            {/* User/Editor Routes */}
            <Route path="/user/overview" element={<AuthGuard requiredRole="editor"><EditorOverview /></AuthGuard>} />
            <Route path="/user/content" element={<AuthGuard requiredRole="editor"><EditorContent /></AuthGuard>} />
            <Route path="/user/media" element={<AuthGuard requiredRole="editor"><EditorMedia /></AuthGuard>} />

            <Route path="/user/profile" element={<AuthGuard requiredRole="editor"><EditorProfile /></AuthGuard>} />
            <Route path="/user/help" element={<AuthGuard requiredRole="editor"><EditorHelp /></AuthGuard>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
