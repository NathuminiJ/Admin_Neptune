import { classNames } from '../utils/format';

type BadgeStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'ACTIVE'
  | 'INACTIVE';

const TONES: Record<BadgeStatus, string> = {
  PENDING: 'badge-amber',
  ACCEPTED: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-slate',
  SCHEDULED: 'badge-amber',
  IN_PROGRESS: 'badge-blue',
  ACTIVE: 'badge-green',
  INACTIVE: 'badge-slate',
};

const LABELS: Record<BadgeStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

interface StatusBadgeProps {
  status: BadgeStatus | string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const tone = TONES[status as BadgeStatus] ?? 'badge-slate';
  return (
    <span className={classNames('badge', tone, className)}>
      <span className="badge-dot" />
      {label ?? LABELS[status as BadgeStatus] ?? status}
    </span>
  );
}