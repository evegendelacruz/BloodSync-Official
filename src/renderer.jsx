import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Layout from "./app/_layout";


const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <Layout />
  </BrowserRouter>
);