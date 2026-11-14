import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';

export const ToastHost: React.FC = () => {
  const { toasts, dismissToast } = useEventSphere();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'success'
            ? CheckCircle2
            : toast.tone === 'warning'
              ? AlertTriangle
              : Info;
        const iconColor =
          toast.tone === 'success'
            ? 'text-emerald-600 dark:text-emerald-400'
            : toast.tone === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-blue-600 dark:text-blue-400';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-lg transition-all duration-150"
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                {toast.title}
              </p>
              {toast.detail && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {toast.detail}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
