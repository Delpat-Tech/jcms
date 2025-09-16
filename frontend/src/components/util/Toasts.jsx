import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);

	const addToast = useCallback((toast) => {
		const id = Math.random().toString(36).slice(2);
		setToasts((t) => [...t, { id, ...toast }]);
		setTimeout(() => {
			setToasts((t) => t.filter((x) => x.id !== id));
		}, toast.duration || 3000);
	}, []);

	return (
		<ToastContext.Provider value={{ addToast }}>
			{children}
			<div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
				{toasts.map((t) => (
					<div key={t.id} className={`pointer-events-auto rounded-md border bg-white p-3 text-sm shadow ${t.variant === "error" ? "border-red-200" : "border-gray-200"}`}>
						<div className="font-medium text-gray-900">{t.title}</div>
						{t.description ? <div className="text-gray-600">{t.description}</div> : null}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToasts() {
	return useContext(ToastContext);
}

export default { ToastProvider, useToasts };
