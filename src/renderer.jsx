import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Layout from "./app/_layout";
import Activate from './app/activate.jsx';
import React from "react";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <Layout />
  </BrowserRouter>
);