import { classNames, initials } from '../utils/format';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  octagonal?: boolean;
  tone?: 'deep' | 'green-100' | 'green-200' | 'white';
  className?: string;
}

export function Avatar({
  name,
  size = 'md',
  octagonal = false,
  tone = 'deep',
  className,
}: AvatarProps) {
  return (
    <span
      className={classNames(
        'avatar',
        size === 'sm' && 'avatar-sm',
        size === 'lg' && 'avatar-lg',
        size === 'lg' && 'octagonal',
        octagonal && 'octagonal',
        tone === 'green-100' && 'avatar-green-100',
        tone === 'green-200' && 'avatar-green-200',
        tone === 'white' && 'avatar-white',
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}