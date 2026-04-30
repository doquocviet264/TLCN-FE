"use client";

import { useState, useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: number;
}

export function Toast({ message, type, isVisible, onClose, autoClose = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && autoClose > 0) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, onClose]);

  if (!isVisible) return null;

  const config = {
    success: { icon: "ri-checkbox-circle-fill", iconColor: "text-emerald-500", border: "border-emerald-100", bg: "bg-white" },
    error:   { icon: "ri-close-circle-fill",    iconColor: "text-red-500",     border: "border-red-100", bg: "bg-white" },
    warning: { icon: "ri-alert-fill",           iconColor: "text-amber-500",   border: "border-amber-100", bg: "bg-white" },
    info:    { icon: "ri-information-fill",     iconColor: "text-blue-500",    border: "border-blue-100", bg: "bg-white" },
  }[type] || { icon: "ri-information-fill", iconColor: "text-slate-500", border: "border-slate-100", bg: "bg-white" };

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right fade-in duration-300">
      <div className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border ${config.border} ${config.bg} min-w-[300px] max-w-md`}>
        <i className={`${config.icon} ${config.iconColor} text-2xl leading-none`}></i>
        <div className="flex-1 pt-0.5">
          <p className="font-medium text-slate-800 text-sm leading-snug">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition flex-shrink-0 leading-none"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const showSuccess = (message: string) => showToast(message, "success");
  const showError = (message: string) => showToast(message, "error");
  const showWarning = (message: string) => showToast(message, "warning");
  const showInfo = (message: string) => showToast(message, "info");

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}