const TINTS = [
  'bg-amber-200 text-amber-900',
  'bg-rose-200 text-rose-900',
  'bg-sky-200 text-sky-900',
  'bg-violet-200 text-violet-900',
  'bg-emerald-200 text-emerald-900',
  'bg-orange-200 text-orange-900',
  'bg-teal-200 text-teal-900',
  'bg-fuchsia-200 text-fuchsia-900',
]

function tintFor(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return TINTS[Math.abs(hash) % TINTS.length]
}

const SIZES = { sm: 'size-6 text-[10px]', md: 'size-9 text-sm', lg: 'size-12 text-base' }

export function Avatar({ name, size = 'md', ring }: { name: string; size?: keyof typeof SIZES; ring?: boolean }) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${tintFor(name)} ${
        ring ? 'ring-2 ring-surface' : ''
      }`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const extra = names.length - max
  return (
    <span className="flex -space-x-1.5">
      {names.slice(0, max).map((name, i) => (
        <Avatar key={i} name={name} size="sm" ring />
      ))}
      {extra > 0 && (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-line text-[10px] font-semibold text-muted ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </span>
  )
}
