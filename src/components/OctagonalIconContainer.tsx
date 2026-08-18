import type { ReactNode } from 'react';
import { classNames } from '../utils/format';

type Tone = 'green' | 'deep' | 'light' | 'amber' | 'blue' | 'slate' | 'red' | 'outline' | 'white';

interface OctagonalIconContainerProps {
  tone?: Tone;
  small?: boolean;
  octagonal?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Reusable octagonal icon holder — a recurring NEPTUNE design element.
 */
export function OctagonalIconContainer({
  tone = 'green',
  small = false,
  octagonal = true,
  className,
  children,
}: OctagonalIconContainerProps) {
  return (
    <span
      className={classNames('oct-icon', `oct-${tone}`, small && 'small', octagonal && 'octagonal', className)}
    >
      {children}
    </span>
  );
}