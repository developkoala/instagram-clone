import { createContext, useCallback, useMemo, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  onClick?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, onClick?: () => void) => void;
  removeToast: (id: string) => void;
  toasts: ToastItem[];
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000, onClick?: () => void) => {
    const id = Math.random().toString(36).slice(2);
    const item: ToastItem = { id, message, type, onClick };
    setToasts((prev) => [...prev, item]);
    // auto dismiss
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast, removeToast, toasts }), [showToast, removeToast, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};





