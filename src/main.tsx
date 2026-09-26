import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
// import App from "./App.tsx";
import "./index.css";
import Shell from "./components/Shell/index.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <MantineProvider defaultColorScheme="auto">
    <React.StrictMode>
      <Shell />
    </React.StrictMode>
  </MantineProvider>
);
