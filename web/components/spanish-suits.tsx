export function OrosSuit({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="22" fill="currentColor" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

export function CopasSuit({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 14h28v4c0 12-8 20-14 24-6-4-14-12-14-24v-4z"
        fill="currentColor"
      />
      <rect x="28" y="42" width="8" height="8" rx="1" fill="currentColor" />
      <rect x="22" y="50" width="20" height="4" rx="2" fill="currentColor" />
    </svg>
  )
}

export function EspadasSuit({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="30" y="6" width="4" height="40" rx="1" fill="currentColor" />
      <polygon points="32,6 22,20 42,20" fill="currentColor" />
      <rect x="20" y="42" width="24" height="4" rx="2" fill="currentColor" />
      <rect x="28" y="46" width="8" height="6" rx="1" fill="currentColor" />
      <rect x="24" y="52" width="16" height="3" rx="1.5" fill="currentColor" />
    </svg>
  )
}

export function BastosSuit({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="29" y="10" width="6" height="44" rx="3" fill="currentColor" />
      <circle cx="32" cy="12" r="6" fill="currentColor" />
      <ellipse cx="22" cy="22" rx="5" ry="4" fill="currentColor" transform="rotate(-30 22 22)" />
      <ellipse cx="42" cy="22" rx="5" ry="4" fill="currentColor" transform="rotate(30 42 22)" />
    </svg>
  )
}

export function SpanishSuitsRow({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <OrosSuit className={className} />
      <CopasSuit className={className} />
      <EspadasSuit className={className} />
      <BastosSuit className={className} />
    </div>
  )
}
