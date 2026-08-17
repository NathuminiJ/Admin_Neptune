import type { SVGProps } from 'react';

/** Stylised three-wheeler (tuk-tuk) icon — not available in lucide. */
export function TukIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.5 11.2c3.4 0 5.9.7 7.7 2.4 1.3 1.2 3.1 2 6.3 2h.5a2 2 0 0 0 2-2v-1.1" />
      <path d="M3.5 11.2V13.7h2.6" />
      <path d="M20 12.5h-4.2l-2.4-3.2H8.4a1.7 1.7 0 0 0-1.7 1.7v1.2" />
      <circle cx="6.7" cy="16.6" r="2.1" />
      <circle cx="17.3" cy="16.6" r="2.1" />
    </svg>
  );
}