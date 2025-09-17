import React, { useState, useEffect, useRef } from "react";

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
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
        <header className="sticky top-0 z-[70] w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-14 w-full items-center justify-between px-2 sm:px-3">
                <div className="flex items-center gap-3">
                    <button
                        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
                        onClick={onMenuClick}
                        aria-label="Open menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    {/* Tenant logo placeholder (left of brand) */}
                    <div className="h-10 w-24 rounded-sm bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-medium border border-gray-300">
                        Tenant Logo
                    </div>
                    {/* Brand logo */}
                    <img
                        src="/logo.png"
                        alt="JCMS"
                        className="h-12 w-auto object-contain"
                    />
                    {/* Divider */}
                    <span className="mx-2 h-5 w-px bg-gray-200" />
                    {/* Current page title */}
                    <h1 className="text-sm font-medium text-gray-700">{title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative" ref={notifDropdownRef}>
                        <button
                            aria-label="Notifications"
                            className="relative inline-flex items-center justify-center w-9 h-9 rounded-md border text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
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
                            <div className="absolute right-0 top-full mt-1 w-80 max-w-[90vw] bg-white border rounded-md shadow-lg z-50">
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
                            className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1"
                        >
                            <span className="hidden text-sm text-gray-600 sm:inline">{username}</span>
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

export default Header;
