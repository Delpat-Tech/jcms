import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, FileText, Image as ImageIcon, Users as UsersIcon, Settings, BarChart2, HelpCircle, Layers, Key, UserCheck, CreditCard } from "react-feather";

// Chevron icon (kept here for potential future use)

// Default Feather icons per route/label
const FeatherIcon = ({ name, active }) => {
  const cls = `h-5 w-5 ${active ? "text-indigo-700" : "text-gray-400 group-hover:text-indigo-700"}`;
  switch ((name || "").toLowerCase()) {
    case "overview":
      return <Home className={cls} />;
    case "dashboard":
    case "/dashboard":
      return <Home className={cls} />;
    case "tenants":
    case "/superadmin/tenants":
      return <Layers className={cls} />;
    case "content":
    case "/dashboard/content":
      return <FileText className={cls} />;
    case "media":
    case "/dashboard/media":
      return <ImageIcon className={cls} />;
    case "users":
    case "/dashboard/users":
      return <UsersIcon className={cls} />;
    case "roles":
    case "/dashboard/roles":
      return <Key className={cls} />;
    case "system settings":
    case "settings":
    case "/dashboard/settings":
      return <Settings className={cls} />;
    case "analytics":
    case "/dashboard/analytics":
      return <BarChart2 className={cls} />;
    case "profile":
    case "/user/profile":
      return <UserCheck className={cls} />;
    case "help":
    case "/user/help":
      return <HelpCircle className={cls} />;
    case "subscription":
      return <CreditCard className={cls} />;
    default:
      return <Home className={cls} />;
  }
};

// Props for each item in the menuItems array
/**
 * @typedef {Object} MenuItemProps
 * @property {string} href
 * @property {string} label
 * @property {React.ReactNode=} icon
 * @property {(pathname: string, href: string) => boolean=} isActiveCheck
 */

// NavItem Component
const NavItem = ({ href, label, icon, isActiveCheck, isTextHidden, onLinkClick }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const defaultIsActiveCheck = (currentPath, targetHref) => {
    const normalize = (p) => (p || '').replace(/\/+$/, '');
    const current = normalize(currentPath);
    const target = normalize(targetHref);
    const isDashboardRoot = target === '/dashboard';
    if (isDashboardRoot) {
      return current === target; // exact match only for dashboard root
    }
    return current === target || current.startsWith(target + '/');
  };

  const isActive = isActiveCheck ? isActiveCheck(pathname, href) : defaultIsActiveCheck(pathname, href);
  const renderedIcon = icon || <FeatherIcon name={label || href} active={isActive} />;

  const handleClick = (e) => {
    if (href === '/subscription') {
      e.preventDefault();
      window.location.href = '/subscription';
    } else {
      onLinkClick && onLinkClick();
    }
  };

  return (
    <li>
      <Link
        to={href}
        onClick={handleClick}
        className={`relative flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-150 ease-in-out group w-full h-[40px] ${
          isActive
            ? "bg-indigo-50 text-indigo-700 shadow-inner"
            : "text-gray-700 hover:text-indigo-700 hover:bg-indigo-50/70"
        } ${isTextHidden ? "justify-center" : "pl-4"}`}
        aria-current={isActive ? "page" : undefined}
        title={isTextHidden ? label : undefined}
      >
        {isActive && !isTextHidden && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-indigo-600" />
        )}
        <span className={`h-5 w-5 flex-shrink-0 ${!isTextHidden ? "mr-3" : "mr-0"}`}>{renderedIcon}</span>
        {!isTextHidden && <span className="truncate">{label}</span>}
      </Link>
    </li>
  );
};

// Sidebar main component
const Sidebar = ({
  title = "JCMS",
  collapsedIcon = <span className="text-2xl font-bold">S</span>,
  headerLink = "/dashboard",
  menuItems,
  isOpen = false,
  onClose,
  onLinkClick,
  user, // Accept user prop for future extensibility
}) => {
  // Provide default menuItems for backward compatibility
  const defaultMenuItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/content", label: "Content" },
    { href: "/dashboard/media", label: "Media" },
    { href: "/dashboard/users", label: "Users" },
  ];
  const items = menuItems && menuItems.length > 0 ? menuItems : defaultMenuItems;

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showExpandedContent, setShowExpandedContent] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobileView(mobile);
      if (!mobile && isOpen && onClose) {
        onClose();
      }
    };
    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => {
      window.removeEventListener("resize", checkMobileView);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, onClose]);

  // Apply CSS variable for sidebar width on desktop so layout can respond
  useEffect(() => {
    if (!isMobileView) {
      const width = isDesktopCollapsed ? "72px" : "200px";
      document.documentElement.style.setProperty("--sidebar-width", width);
    }
    return () => {
      // keep the last value; no-op on cleanup
    };
  }, [isDesktopCollapsed, isMobileView]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isMobileView) {
      setShowExpandedContent(isOpen);
    } else {
      if (isDesktopCollapsed) {
        timeoutRef.current = setTimeout(() => setShowExpandedContent(false), 100);
      } else {
        setShowExpandedContent(true);
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isDesktopCollapsed, isMobileView, isOpen]);

  const currentTextHiddenState = isMobileView ? !isOpen : !showExpandedContent;

  // Collapse toggle handled inline for simplicity on fixed sidebar

  const sidebarBaseClasses = "z-50 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-r border-gray-200/70 flex flex-col transition-all duration-300 ease-in-out shadow-xl lg:rounded-r-2xl";
  let sidebarDynamicClasses = "";
  if (isMobileView) {
    sidebarDynamicClasses = `fixed top-14 left-0 h-[calc(100vh-56px)] ${isOpen ? "w-[200px] translate-x-0" : "w-0 -translate-x-full border-transparent overflow-hidden"}`;
  } else {
    // Fixed sidebar on desktop below the header
    sidebarDynamicClasses = `fixed top-14 left-0 h-[calc(100vh-56px)] ${isDesktopCollapsed ? "w-[72px]" : "w-[200px]"}`;
  }

  const handleNavItemClick = () => {
    if (onLinkClick) onLinkClick();
    if (isMobileView && isOpen && onClose) onClose();
  };

  return (
    <>
      {isMobileView && isOpen && (
        <div className="fixed inset-x-0 top-14 bottom-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${sidebarBaseClasses} ${sidebarDynamicClasses} ${isMobileView ? 'overflow-hidden' : 'overflow-visible'}`}>
        {/* Desktop Toggle Button */}
        {/* Desktop Toggle Button */}
        {!isMobileView && (
          <button
            onClick={() => setIsDesktopCollapsed((prev) => !prev)}
            className={`absolute top-1/2 -translate-y-1/2 -right-3 z-[71] bg-white hover:bg-indigo-50 text-gray-400 hover:text-indigo-700 border border-gray-200 w-7 h-7 flex items-center justify-center rounded-full shadow-lg transition-colors duration-200 ease-in-out transform ${isDesktopCollapsed ? "rotate-180" : "rotate-0"}`}
            aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="h-4 w-4" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.5 15l-5-5 5-5"/></svg>
          </button>
        )}

        {/* Navigation */}
        <nav className={`flex-grow overflow-visible transition-all duration-100 ease-in-out ${currentTextHiddenState && !isMobileView ? "px-0" : "px-3"} py-4`}>
          <ul className={`space-y-1.5 ${currentTextHiddenState && !isMobileView ? "flex flex-col items-center" : ""}`}>
            {items.map((item) => (
              <NavItem key={item.href} {...item} isTextHidden={currentTextHiddenState} onLinkClick={handleNavItemClick} />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
