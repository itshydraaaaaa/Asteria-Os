'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type ToastMessage = {
  id: string;
  type: 'ok' | 'warn' | 'error' | 'info';
  title: string;
  message?: string;
  autoDismiss?: boolean;
};

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let activeToasts: ToastMessage[] = [];

export function pushToast(toast: Omit<ToastMessage, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newToast: ToastMessage = { id, autoDismiss: toast.type !== 'error', ...toast };
  activeToasts = [newToast, ...activeToasts].slice(0, 5);
  toastListeners.forEach((fn) => fn([...activeToasts]));

  if (newToast.autoDismiss) {
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  }
}

export function dismissToast(id: string) {
  activeToasts = activeToasts.filter((t) => t.id !== id);
  toastListeners.forEach((fn) => fn([...activeToasts]));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const borderTone =
          t.type === 'error'
            ? 'border-os-err bg-os-surface shadow-[0_0_16px_rgba(239,68,68,0.2)]'
            : t.type === 'warn'
            ? 'border-os-warn bg-os-surface'
            : t.type === 'ok'
            ? 'border-os-ok bg-os-surface'
            : 'border-os-accent bg-os-surface';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-xs shadow-lg transition-all ${borderTone}`}
          >
            {t.type === 'error' && <AlertTriangle className="h-4 w-4 shrink-0 text-os-err mt-0.5" />}
            {t.type === 'warn' && <AlertTriangle className="h-4 w-4 shrink-0 text-os-warn mt-0.5" />}
            {t.type === 'ok' && <CheckCircle className="h-4 w-4 shrink-0 text-os-ok mt-0.5" />}
            {t.type === 'info' && <Info className="h-4 w-4 shrink-0 text-os-accent mt-0.5" />}

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-os-text">{t.title}</div>
              {t.message && <div className="mt-0.5 text-[11px] text-os-dim">{t.message}</div>}
            </div>

            <button
              onClick={() => dismissToast(t.id)}
              className="text-os-dim hover:text-os-text transition-colors p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
