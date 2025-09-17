import React, { useState } from "react";
import UserLayout from '../layout.tsx';
import RichTextEditor from "../../components/content/RichTextEditor.jsx";
import Button from "../../components/ui/Button.jsx";

export default function UserContentPage() {
  const [value, setValue] = useState("<p>Start writing...</p>");

  return (
    <UserLayout title="Content Editor">
      <div className="space-y-4">
        <RichTextEditor value={value} onChange={setValue} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary">Preview</Button>
          <Button>Publish</Button>
        </div>
      </div>
    </UserLayout>
  );
}
