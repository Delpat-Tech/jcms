import React, { useState } from "react";
import Layout from "../components/shared/Layout";
import { FileUploader, ImageUploader } from "../components/content/Uploaders";

export default function MediaPage() {
	const user = JSON.parse(localStorage.getItem("user") || "null");
	const [file, setFile] = useState(null);
	const [image, setImage] = useState(null);

	return (
		<Layout title="Media" user={user}>
			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<FileUploader onSelect={setFile} />
					{file ? <div className="mt-2 text-sm text-gray-600">Selected: {file.name}</div> : null}
				</div>
				<div>
					<ImageUploader onSelect={setImage} />
					{image ? <div className="mt-2 text-sm text-gray-600">Selected: {image.name}</div> : null}
				</div>
			</div>
		</Layout>
	);
}
