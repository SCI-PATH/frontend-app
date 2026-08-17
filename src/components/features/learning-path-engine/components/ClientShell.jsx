"use client";

import { useEffect, useState } from "react";
import ErrorBoundary from "./ErrorBoundary.jsx";
import UserErrorModal from "./UserErrorModal.jsx";
import { notifyUserFacingError, registerUserErrorModal } from "../errors.js";

/**
 * Shared client shell: error modal + unhandled error logging.
 * Same behavior as the old Vite main.jsx Shell.
 */
export default function ClientShell({ children }) {
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  useEffect(() => {
    registerUserErrorModal(setErrorModalOpen);
  }, []);

  useEffect(() => {
    function onUnhandledRejection(ev) {
      ev.preventDefault();
      notifyUserFacingError(ev.reason ?? new Error(String(ev.reason)), "unhandledrejection", {});
    }
    function onWindowError(ev) {
      if (ev.target && ev.target !== window) return;
      notifyUserFacingError(ev.error ?? new Error(ev.message || "window-error"), "window-error", {});
    }
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return (
    <>
      <UserErrorModal open={errorModalOpen} onClose={() => setErrorModalOpen(false)} />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
