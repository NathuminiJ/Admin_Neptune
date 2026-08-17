import { ClipboardList, Inbox, RefreshCw, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { classNames } from '../utils/format';

/* --------------------------------------------------------------------------
   EMPTY STATE
   -------------------------------------------------------------------------- */

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'inbox' | 'clipboard';
  action?: ReactNode;
}

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search or filters, or add a new record to get started.',
  icon = 'inbox',
  action,
}: EmptyStateProps) {
  const Icon = icon === 'clipboard' ? ClipboardList : Inbox;
  return (
    <div className="state">
      <div className="state-icon octagonal">
        <Icon />
      </div>
      <div className="state-title">{title}</div>
      <div className="state-desc">{description}</div>
      {action && <div className="state-actions">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   LOADING STATE
   -------------------------------------------------------------------------- */

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading data…' }: LoadingStateProps) {
  return (
    <div className="state">
      <span className="spinner-oct" aria-hidden="true" />
      <div className="state-title" style={{ fontWeight: 600, fontSize: 13 }}>
        {label}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   ERROR STATE
   -------------------------------------------------------------------------- */

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'The data could not be loaded. This is a preview of the error state — retry once the Neptune API is connected.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state state-error">
      <div className="state-icon octagonal">
        <TriangleAlert />
      </div>
      <div className="state-title">{title}</div>
      <div className="state-desc">{message}</div>
      {onRetry && (
        <div className="state-actions">
          <button className="btn btn-secondary" onClick={onRetry}>
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   SUCCESS STATE
   -------------------------------------------------------------------------- */

interface SuccessStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function SuccessState({
  title = 'Saved successfully',
  description = 'The changes have been recorded. This is a preview of the success state.',
  className,
}: SuccessStateProps) {
  return (
    <div className={classNames('state state-success', className)}>
      <div className="state-icon octagonal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="state-title">{title}</div>
      <div className="state-desc">{description}</div>
    </div>
  );
}