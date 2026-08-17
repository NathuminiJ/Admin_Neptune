import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { DangerButton, SecondaryButton } from './buttons';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={
        <>
          <span className={destructive ? 'oct-icon small octagonal oct-red' : 'oct-icon small octagonal oct-green'}>
            {destructive ? <Trash2 /> : <AlertTriangle />}
          </span>
          {title}
        </>
      }
      footer={
        <>
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
          {destructive ? (
            <DangerButton onClick={onConfirm}>{confirmLabel}</DangerButton>
          ) : (
            <button className="btn btn-primary" onClick={onConfirm}>
              {confirmLabel}
            </button>
          )}
        </>
      }
    >
      <p style={{ fontSize: 13.5, color: 'var(--np-ink-2)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}