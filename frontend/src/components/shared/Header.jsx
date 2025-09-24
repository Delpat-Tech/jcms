import React, { useState, useEffect, useRef } from "react";
import TenantLogo from '../TenantLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationApi } from '../../api';

function Header({ title = "JCMS", user, onMenuClick }) {
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const userDropdownRef = useRef(null);
    const notifDropdownRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    useEffect(() => {
        function handleClickOutside(event) {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
                setShowNotifDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoadingNotifs(true);
            const res = await notificationApi.getAll();
            const data = await res.json();
            if (data?.success && Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
            } else if (Array.isArray(data)) {
                setNotifications(data);
            } else {
                setNotifications([]);
            }
        } catch (e) {
            setNotifications([]);
        } finally {
            setLoadingNotifs(false);
        }
    };

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/';
	};

    const username = user?.username || user?.name || "Guest";
    const unreadCount = notifications?.filter?.(n => !n.read && n.status !== 'read')?.length || 0;

    return (
        <header className="sticky lg:fixed top-0 z-[70] w-full border-b border-gray-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-sm">
            <div className="flex h-14 w-full items-center justify-between px-2 sm:px-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
                        onClick={onMenuClick}
                        aria-label="Open menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    {/* Tenant logo (left of brand) */}
                    <TenantLogo user={user} />
                    {/* Brand logo */}
                    <img
                        src="/logo.png"
                        alt="JCMS"
                        className="h-8 sm:h-10 md:h-12 w-auto object-contain shrink-0"
                    />
                    {/* Divider */}
                    <span className="mx-2 h-5 w-px bg-gray-200 hidden md:inline-block" />
                    {/* Current page title */}
                    <h1 className="hidden md:block text-sm font-medium text-gray-700 truncate md:max-w-none">{title}</h1>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Theme Toggle */}
                    <ThemeToggle />
                    {/* Notifications */}
                    <div className="relative" ref={notifDropdownRef}>
                        <button
                            aria-label="Notifications"
                            className="relative inline-flex items-center justify-center w-9 h-9 rounded-md border text-gray-600 hover:text-indigo-700 hover:border-indigo-300 shrink-0"
                            onClick={async () => {
                                const next = !showNotifDropdown;
                                setShowNotifDropdown(next);
                                if (next) await fetchNotifications();
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] h-4 min-w-[16px] px-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        {showNotifDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-80 max-w-[92vw] sm:max-w-[80vw] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border rounded-md shadow-lg z-50">
                                <div className="px-3 py-2 border-b flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Notifications</span>
                                    <span className="text-xs text-gray-500">{unreadCount} unread</span>
                                </div>
                                <div className="max-h-80 overflow-auto">
                                    {loadingNotifs ? (
                                        <div className="p-4 text-sm text-gray-500">Loading...</div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">No notifications</div>
                                    ) : (
                                        <ul className="divide-y">
                                            {notifications.map((n, idx) => (
                                                <li key={n._id || idx} className="p-3 hover:bg-gray-50">
                                                    <div className="flex items-start gap-2">
                                                        <span className={`mt-1 h-2 w-2 rounded-full ${n.read || n.status === 'read' ? 'bg-gray-300' : 'bg-indigo-600'}`} />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 truncate">{n.title || n.type || 'Notification'}</div>
                                                            {n.message || n.body ? (
                                                                <div className="text-sm text-gray-600 truncate">{n.message || n.body}</div>
                                                            ) : null}
                                                            {n.createdAt ? (
                                                                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="relative" ref={userDropdownRef}>
                        <button
                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                            className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1 shrink-0"
                        >
                            <span className="hidden text-sm text-gray-600 sm:inline max-w-[20vw] truncate">{username}</span>
                            <img
                                alt="avatar"
                                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`}
                                className="h-8 w-8 rounded-full border"
                            />
                        </button>
                        {showUserDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                <div className="py-1">
                                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                        <div className="font-medium">{username}</div>
                                        <div className="text-gray-500">{user?.email}</div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

function ThemeToggle() {
    const { isDarkMode, toggleTheme, settings } = useTheme();
    
    if (!settings.darkModeEnabled) return null;
    
    return (
        <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDarkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            )}
        </button>
    );
}

export default Header;
