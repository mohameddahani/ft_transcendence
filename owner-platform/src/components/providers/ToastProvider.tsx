"use client";

import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const noop = () => {};
    window.console.error = noop;
    window.console.warn = noop;

    const preventRejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
    };
    const preventError = (e: ErrorEvent) => {
      e.preventDefault();
    };

    window.addEventListener("unhandledrejection", preventRejection);
    window.addEventListener("error", preventError);

    return () => {
      window.removeEventListener("unhandledrejection", preventRejection);
      window.removeEventListener("error", preventError);
    };
  }, []);

  return (
    <ToastContainer
      theme="dark"
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      style={{ zIndex: 99999, top: "52px" }}
    />
  );
}
