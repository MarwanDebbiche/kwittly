import { ChevronDown } from 'lucide-react'

/** Native select styled as a filter chip; highlighted when a value is set. */
export function PillSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string | undefined
  onChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  const active = Boolean(value)
  return (
    <label className={`chip relative pr-8 ${active ? 'chip-on' : ''}`}>
      <span className="whitespace-nowrap">{active ? options.find((o) => o.value === value)?.label : placeholder}</span>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-4 opacity-60" />
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
