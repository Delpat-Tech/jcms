import React from "react";
import ImageList from "./components/ImageList";
import CollectionViewer from "./components/CollectionViewer";
import JsonUploadTest from "./components/JsonUploadTest";

function App() {
  return (
    <div className="App">
      <h1>CMS Data Viewer</h1>
      <JsonUploadTest />
      <hr style={{ margin: "40px 0" }} />
      <ImageList />
      <hr style={{ margin: "40px 0" }} />
      <CollectionViewer />   
    </div>
  );
}

export default App;
