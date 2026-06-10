export default function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
      <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
      <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.83 -1.67 3.5 -3c.67 -1.67 .5 -5.83 -1.5 -11.5c-1.46 -1.02 -3 -1.34 -4.5 -1.5l-.97 1.92a11.9 11.9 0 0 0 -4.06 0l-.97 -1.92c-1.5 .16 -3.04 .48 -4.5 1.5c-2 5.67 -2.17 9.83 -1.5 11.5c.67 1.33 2 3 3.5 3c.5 0 2 -2 2 -3" />
      <path d="M7 16.5c3.5 1 6.5 1 10 0" />
    </svg>
  );
}
