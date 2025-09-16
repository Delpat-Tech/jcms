import React from "react";

function FormField({ label, htmlFor, error, children }) {
	return (
		<div className="space-y-1">
			{label ? (
				<label htmlFor={htmlFor} className="block text-xs font-medium text-gray-700">
					{label}
				</label>
			) : null}
			{children}
			{error ? <p className="text-xs text-red-600">{error}</p> : null}
		</div>
	);
}

export default FormField;
