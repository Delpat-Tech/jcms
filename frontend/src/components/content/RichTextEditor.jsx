import React, { useRef, useEffect } from "react";

function RichTextEditor({ value = "", onChange, className = "" }) {
	const ref = useRef(null);

	useEffect(() => {
		if (ref.current && ref.current.innerHTML !== value) {
			ref.current.innerHTML = value;
		}
	}, [value]);

	return (
		<div
			ref={ref}
			className={`prose max-w-none min-h-[160px] w-full rounded-md border bg-white p-3 text-sm shadow-sm focus:outline-none ${className}`}
			contentEditable
			suppressContentEditableWarning
			onInput={(e) => onChange && onChange(e.currentTarget.innerHTML)}
		/>
	);
}

export default RichTextEditor;
