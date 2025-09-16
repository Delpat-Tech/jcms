import React from "react";
import Button from "../ui/Button";

export function FileUploader({ onSelect, label = "Upload File" }) {
	return (
		<label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-white p-6 text-center text-sm text-gray-600 hover:bg-gray-50">
			<span>{label}</span>
			<input type="file" className="hidden" onChange={(e) => onSelect && onSelect(e.target.files?.[0] || null)} />
			<Button variant="secondary" size="sm">Choose File</Button>
		</label>
	);
}

export function ImageUploader({ onSelect, label = "Upload Image" }) {
	return (
		<label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-white p-6 text-center text-sm text-gray-600 hover:bg-gray-50">
			<span>{label}</span>
			<input accept="image/*" type="file" className="hidden" onChange={(e) => onSelect && onSelect(e.target.files?.[0] || null)} />
			<Button variant="secondary" size="sm">Choose Image</Button>
		</label>
	);
}

export default { FileUploader, ImageUploader };
