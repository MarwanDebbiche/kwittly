import { Trans, useLingui } from '@lingui/react/macro'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import { useAccountQuery } from '../lib/accountQuery'
import { authClient } from '../lib/auth-client'
import { clearDeviceGroups } from '../lib/savedGroups'
import { Avatar } from './Avatar'

export function AccountMenu() {
  const { t } = useLingui()
  const user = useAccountQuery(api.users.current)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => ref.current?.contains(e.target as Node) || setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (user === undefined) return <span className="size-9" />
  if (user === null)
    return (
      <Link to="/login" className="btn-ghost">
        <Trans>Log in</Trans>
      </Link>
    )

  async function logOut() {
    await authClient.signOut()
    // Explicit logout wipes the device; an expired session keeps the cached list instead.
    clearDeviceGroups()
    navigate({ to: '/' })
  }

  const email = user.email
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-full" aria-label={t`My account`} aria-expanded={open}>
        <Avatar name={email} />
      </button>
      {open && (
        <div className="card absolute right-0 z-30 mt-2 w-64 p-1.5 shadow-lg">
          <p className="truncate px-3 py-2 text-sm text-muted">{email}</p>
          <button onClick={logOut} className="btn-ghost w-full justify-start text-ink">
            <LogOut className="size-4" /> <Trans>Log out</Trans>
          </button>
        </div>
      )}
    </div>
  )
}
