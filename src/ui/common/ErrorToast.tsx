import { useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';

export function ErrorToast() {
  const err = useProjectStore((s) => s.errorMessage);
  const setError = useProjectStore((s) => s.setError);

  useEffect(() => {
    if (!err) return;
    const t = window.setTimeout(() => setError(null), 6000);
    return () => window.clearTimeout(t);
  }, [err, setError]);

  if (!err) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-red-600 text-white px-4 py-3 rounded-md shadow-xl max-w-md animate-fade-in" role="alert">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">⚠</span>
        <div className="flex-1 text-sm">{err}</div>
        <button
          onClick={() => setError(null)}
          className="text-white/80 hover:text-white text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
