import { classNames } from '../utils/format';

interface NeptuneLogoProps {
  /** Pixel size of the brand mark. */
  size?: number;
  /** Show the NEPTUNE wordmark next to the mark. */
  wordmark?: boolean;
  /** Text tone: dark on light surfaces, light on dark surfaces. */
  tone?: 'dark' | 'light';
  /** Optional small subtitle under the wordmark (e.g. WASTE COLLECTION). */
  subtitle?: string;
}

/** NEPTUNE brand mark — the official NEPTUNE mark. */
export function NeptuneMark({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/neptune-mark.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ flex: 'none', display: 'block' }}
    />
  );
}

export function NeptuneLogo({
  size = 40,
  wordmark = false,
  tone = 'dark',
  subtitle,
}: NeptuneLogoProps) {
  return (
    <span className="np-logo">
      <NeptuneMark size={size} />
      {wordmark && (
        <span className="np-logo-text">
          <span className={classNames('np-logo-name', `tone-${tone}`)}>NEPTUNE</span>
          {subtitle && (
            <span className={classNames('np-logo-sub', `tone-${tone}`)}>{subtitle}</span>
          )}
        </span>
      )}
    </span>
  );
}