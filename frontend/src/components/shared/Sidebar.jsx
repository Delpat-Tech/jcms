import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, FileText, Image as ImageIcon, Users as UsersIcon, Settings, Shield, BarChart2, User as UserIcon, HelpCircle } from "react-feather";

// Simple chevron icon for collapse/expand
const ChevronLeft = ({ className = "" }) => (
  <svg className={className} width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.5 15l-5-5 5-5"/></svg>
);

// Default Feather icons per route/label
const FeatherIcon = ({ name, active }) => {
  const cls = `h-5 w-5 ${active ? "text-indigo-700" : "text-gray-400 group-hover:text-indigo-700"}`;
  switch ((name || "").toLowerCase()) {
    case "dashboard":
    case "/dashboard":
      return <Home className={cls} />;
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
      return <Shield className={cls} />;
    case "system settings":
    case "settings":
    case "/dashboard/settings":
      return <Settings className={cls} />;
    case "analytics":
    case "/dashboard/analytics":
      return <BarChart2 className={cls} />;
    case "profile":
    case "/user/profile":
      return <UserIcon className={cls} />;
    case "help":
    case "/user/help":
      return <HelpCircle className={cls} />;
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

  return (
    <li>
      <Link
        to={href}
        onClick={onLinkClick}
        className={`flex items-center px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out group w-full h-[40px] ${
          isActive
            ? "bg-indigo-50 text-indigo-700 font-medium shadow-inner"
            : "text-gray-700 hover:text-indigo-700 hover:bg-indigo-50"
        } ${isTextHidden ? "justify-center" : ""}`}
        aria-current={isActive ? "page" : undefined}
        title={isTextHidden ? label : undefined}
      >
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

  const toggleDesktopSidebar = () => {
    if (!isMobileView) setIsDesktopCollapsed((prev) => !prev);
  };

  const sidebarBaseClasses = "z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out";
  let sidebarDynamicClasses = "";
  if (isMobileView) {
    sidebarDynamicClasses = `fixed h-full top-0 left-0 ${isOpen ? "w-[200px] translate-x-0" : "w-0 -translate-x-full border-transparent overflow-hidden"}`;
  } else {
    sidebarDynamicClasses = `sticky top-0 h-screen ${isDesktopCollapsed ? "w-[72px]" : "w-[200px]"}`;
  }

  const handleNavItemClick = () => {
    if (onLinkClick) onLinkClick();
    if (isMobileView && isOpen && onClose) onClose();
  };

  return (
    <>
      {isMobileView && isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${sidebarBaseClasses} ${sidebarDynamicClasses}`}>
        {/* Desktop Toggle Button */}
        {!isMobileView && (
          <button
            onClick={toggleDesktopSidebar}
            className={`absolute top-1/2 -translate-y-1/2 -right-[14px] z-[51] bg-white hover:bg-indigo-50 text-gray-400 hover:text-indigo-700 border border-gray-200 w-7 h-7 flex items-center justify-center rounded-full shadow-lg transition-colors duration-200 ease-in-out transform ${isDesktopCollapsed ? "rotate-180" : "rotate-0"} transition-transform duration-200 ease-in-out group`}
            aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className={`flex-grow overflow-y-auto overflow-x-hidden transition-all duration-100 ease-in-out ${currentTextHiddenState && !isMobileView ? "px-0" : "px-3"} py-4`}>
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
