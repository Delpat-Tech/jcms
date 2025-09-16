import React, { useState } from "react";
import Layout from "../components/shared/Layout";
import RichTextEditor from "../components/content/RichTextEditor";
import Button from "../components/ui/Button";

export default function ContentPage() {
	const user = JSON.parse(localStorage.getItem("user") || "null");
	const [value, setValue] = useState("<p>Start writing...</p>");

	return (
		<Layout title="Content" user={user}>
			<div className="space-y-4">
				<RichTextEditor value={value} onChange={setValue} />
				<div className="flex justify-end gap-2">
					<Button variant="secondary">Preview</Button>
					<Button>Publish</Button>
				</div>
			</div>
		</Layout>
	);
}
