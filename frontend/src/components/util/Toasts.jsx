// Toast system using framer-motion and flexible notification types
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Notification component
export function Notification({ type, title, message, showIcon = true, duration, onClose }) {
  React.useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Icon selection based on type
  const icons = {
    success: (
      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 10l4 4 6-8"/></svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01"/></svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 2v2m0 12v2m8-8h-2M4 10H2m15.07 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41-1.41"/></svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M6 14L14 6"/></svg>
    ),
    loading: (
      <svg className="h-5 w-5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
    ),
  };

  const typeStyles = {
    success: 'border-green-200 bg-green-50',
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
    loading: 'border-gray-200 bg-gray-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-start gap-3 rounded-md border p-3 shadow ${typeStyles[type] || 'border-gray-200 bg-white'}`}
    >
      {showIcon && icons[type] && <span className="mt-0.5">{icons[type]}</span>}
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{title}</div>
        {message && <div className="text-gray-700 text-xs mt-0.5">{message}</div>}
      </div>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-700 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M6 14L14 6"/></svg>
      </button>
    </motion.div>
  );
}

// Toast context and provider
const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
  const [notifications, setNotifications] = React.useState([]);
  const nextIdRef = React.useRef(1);

  const addNotification = React.useCallback((type, title, message, showIcon = true, duration) => {
    const newNotification = {
      id: nextIdRef.current++,
      type,
      title,
      message,
      showIcon,
      duration
    };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const addLoadingWithSuccess = React.useCallback((loadingTitle, loadingMessage, successTitle, successMessage, loadingDuration = 3000) => {
    const loadingId = nextIdRef.current++;
    const loadingNotification = {
      id: loadingId,
      type: 'loading',
      title: loadingTitle,
      message: loadingMessage,
      showIcon: true
    };
    setNotifications(prev => [...prev, loadingNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === loadingId ? {
        ...n,
        type: 'success',
        title: successTitle,
        message: successMessage,
        duration: 4000
      } : n));
    }, loadingDuration);
  }, []);

  const handleClose = React.useCallback(id => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Default position: bottom-right
  const [position, setPosition] = React.useState('bottom-right');
  const getPositionClasses = pos => {
    switch (pos) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'top-center': return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-center': return 'bottom-4 left-1/2 -translate-x-1/2';
      default: return 'top-4 right-4';
    }
  };

  return (
    <ToastContext.Provider value={{ addNotification, addLoadingWithSuccess, setPosition, position }}>
      {children}
      <div className={`fixed p-4 space-y-2 w-full max-w-sm z-50 ${getPositionClasses(position)}`}>
        <AnimatePresence>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              showIcon={notification.showIcon}
              duration={notification.duration}
              onClose={() => handleClose(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  return React.useContext(ToastContext);
}
