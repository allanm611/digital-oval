import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import ToastComponent, {
  Toast,
  ToastType,
} from "../shared/components/ui/Toast";

interface ToastContextType {
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
  ) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration?: number) => {
      const id = Math.random().toString(36).substr(2, 9);
      // Ensure message is always a string or undefined (never an object that renders as "[object Object]")
      const safeMessage = message ? String(message) : undefined;
      const toast: Toast = { id, type, title, message: safeMessage, duration };

      setToasts((prev) => [...prev, toast]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => showToast("success", title, message),
    [showToast],
  );
  const error = useCallback(
    (title: string, message?: string) => {
      // Silent mode: suppress error toasts for presentations, but log to console
      if (import.meta.env.VITE_SILENT_MODE === "true") {
        console.error(title, message);
        return;
      }
      showToast("error", title, message);
    },
    [showToast],
  );
  const warning = useCallback(
    (title: string, message?: string) => showToast("warning", title, message),
    [showToast],
  );
  const info = useCallback(
    (title: string, message?: string) => showToast("info", title, message),
    [showToast],
  );

  const contextValue = useMemo(
    () => ({ showToast, success, error, warning, info }),
    [showToast, success, error, warning, info],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[10100] space-y-2">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
