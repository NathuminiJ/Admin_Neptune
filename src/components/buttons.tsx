import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '../utils/format';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

function BaseButton({ className, children, loading, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={classNames('btn', className)}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function PrimaryButton(props: ButtonProps) {
  return <BaseButton className="btn-primary" {...props} />;
}

export function SuccessButton(props: ButtonProps) {
  return <BaseButton className="btn-success-flat" {...props} />;
}

export function SecondaryButton(props: ButtonProps) {
  return <BaseButton className="btn-secondary" {...props} />;
}

export function DangerButton(props: ButtonProps) {
  return <BaseButton className="btn-danger" {...props} />;
}

export function GhostButton(props: ButtonProps) {
  return <BaseButton className="btn-ghost" {...props} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  danger?: boolean;
  children: ReactNode;
}

export function IconButton({ label, danger, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={classNames('btn-icon', danger && 'danger', className)}
      {...rest}
    >
      {children}
    </button>
  );
}