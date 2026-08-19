import { useState } from "react";
import type { ToastState } from "../lib/types";

export const useToast = (duration = 4000) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), duration);
  };
  const hideToast = () => setToast(null);
  return { toast, showToast, hideToast };
};
