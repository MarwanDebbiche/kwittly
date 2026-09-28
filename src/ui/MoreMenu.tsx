import { useLingui } from '@lingui/react/macro'
import { Ellipsis, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type MoreMenuItem = { label: string; icon: LucideIcon; onSelect: () => void; destructive?: boolean }

/** "⋯" button opening a small menu of secondary actions. */
export function MoreMenu({ items }: { items: MoreMenuItem[] }) {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => ref.current?.contains(e.target as Node) || setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        className="btn-ghost px-2.5"
        onClick={() => setOpen(!open)}
        aria-label={t`More actions`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Ellipsis className="size-5" />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-30 mt-1 w-56 p-1.5 shadow-lg">
          {items.map(({ label, icon: Icon, onSelect, destructive }) => (
            <button
              key={label}
              role="menuitem"
              className={`btn-ghost w-full justify-start whitespace-nowrap ${destructive ? 'text-owe hover:bg-owe/10 hover:text-owe' : 'text-ink'}`}
              onClick={() => {
                setOpen(false)
                onSelect()
              }}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
