import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const storedTheme = localStorage.getItem("theme");
document.documentElement.dataset.theme = storedTheme === "dark" ? "dark" : "light";

const container = document.getElementById("root")!;
createRoot(container).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
    