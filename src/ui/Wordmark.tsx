export function Wordmark({ className = 'text-2xl' }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight text-ink ${className}`}>
      kwitt<span className="text-accent">ly</span>
    </span>
  )
}
