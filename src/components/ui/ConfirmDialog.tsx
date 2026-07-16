'use client';

import { AlertTriangle, X } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          </div>
          <button type="button" onClick={onCancel} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancelar</button>
          <button type="button" onClick={onConfirm} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
