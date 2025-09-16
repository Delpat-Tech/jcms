import React from "react";

function Modal({ open, onClose, title, children, footer }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative z-10 w-full max-w-lg rounded-lg border bg-white p-4 shadow-lg">
				{title ? <h3 className="mb-3 text-base font-semibold text-gray-900">{title}</h3> : null}
				<div className="text-sm text-gray-700">{children}</div>
				{footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
			</div>
		</div>
	);
}

export default Modal;
