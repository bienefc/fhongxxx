"use client";
import { useState, createContext, useContext, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType }

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = {
    success: "border-green-700 bg-green-900/80 text-green-200",
    error: "border-red-700 bg-red-900/80 text-red-200",
    info: "border-surface-600 bg-surface-800 text-gray-200",
  };

  return (
    <ToastContext.Provider value={addToast}>
      <div className="fixed bottom-4 right-4 z-[200] space-y-2 w-80">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 shadow-xl", colors[t.type])}
            >
              <Icon size={17} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{t.message}</p>
              <button
                onClick={() => setToasts((x) => x.filter((i) => i.id !== t.id))}
                className="opacity-60 hover:opacity-100 ml-auto"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
