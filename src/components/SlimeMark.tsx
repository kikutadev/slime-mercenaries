export function SlimeMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="slime-mark-body" x1="18" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8DE4F3" />
          <stop offset="1" stopColor="#48AFD2" />
        </linearGradient>
      </defs>
      <path
        d="M32 7c10.2 0 18.6 7.4 20.4 17.2 6 4.1 8.6 10.1 7 16.7C57.1 50.6 46.5 57 32 57S6.9 50.6 4.6 40.9c-1.6-6.6 1-12.6 7-16.7C13.4 14.4 21.8 7 32 7Z"
        fill="url(#slime-mark-body)"
      />
      <ellipse cx="24" cy="33" rx="4.2" ry="5.1" fill="#173B4A" />
      <ellipse cx="40" cy="33" rx="4.2" ry="5.1" fill="#173B4A" />
      <circle cx="22.8" cy="31.5" r="1.3" fill="#fff" />
      <circle cx="38.8" cy="31.5" r="1.3" fill="#fff" />
      <path d="M28 42c2.7 2 5.3 2 8 0" fill="none" stroke="#173B4A" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="24" cy="18" rx="7" ry="4" fill="#D6FAFF" opacity=".58" transform="rotate(-22 24 18)" />
    </svg>
  );
}
