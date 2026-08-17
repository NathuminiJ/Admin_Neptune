import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { classNames } from '../utils/format';
import { OctagonalIconContainer } from './OctagonalIconContainer';

export type StatCardTone = 'green' | 'deep' | 'amber' | 'blue' | 'slate' | 'red' | 'outline';

interface StatisticCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatCardTone;
  hint?: string;
  hintTone?: 'up' | 'down' | 'flat';
}

export function StatisticCard({
  label,
  value,
  icon: Icon,
  tone = 'green',
  hint,
  hintTone = 'flat',
}: StatisticCardProps) {
  return (
    <div className="stat-card">
      <OctagonalIconContainer tone={tone}>
        <Icon />
      </OctagonalIconContainer>
      <div style={{ minWidth: 0 }}>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && (
          <span className={classNames('stat-hint', hintTone)}>
            {hintTone === 'up' && <ArrowUpRight />}
            {hintTone === 'down' && <ArrowDownRight />}
            {hintTone === 'flat' && <Minus />}
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}