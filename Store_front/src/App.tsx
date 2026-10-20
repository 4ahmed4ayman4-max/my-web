import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./app/router";
import "./index.css";

export default function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
