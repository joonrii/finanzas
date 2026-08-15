"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import clsx from "clsx";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function toast(message: string, type: ToastType = "success") {
  const newToast: Toast = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(newToast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3000);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, [addToast]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            "pointer-events-auto mx-auto max-w-sm w-full flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl animate-fade-in-up relative overflow-hidden",
            t.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Barra de progreso */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
            <div
              className={clsx(
                "h-full animate-shrink",
                t.type === "success" ? "bg-emerald-500/50" : "bg-red-500/50"
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
