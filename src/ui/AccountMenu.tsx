import { Link, useNavigate } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { clearDeviceGroups } from '../lib/savedGroups'
import { Avatar } from './Avatar'

export function AccountMenu() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => ref.current?.contains(e.target as Node) || setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (isLoading) return <span className="size-9" />
  if (!isAuthenticated || !session)
    return (
      <Link to="/login" className="btn-ghost">
        Se connecter
      </Link>
    )

  async function logOut() {
    await authClient.signOut()
    // Explicit logout wipes the device; an expired session keeps the cached list instead.
    clearDeviceGroups()
    navigate({ to: '/' })
  }

  const email = session.user.email
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-full" aria-label="Mon compte" aria-expanded={open}>
        <Avatar name={email} />
      </button>
      {open && (
        <div className="card absolute right-0 z-30 mt-2 w-64 p-1.5 shadow-lg">
          <p className="truncate px-3 py-2 text-sm text-muted">{email}</p>
          <button onClick={logOut} className="btn-ghost w-full justify-start text-ink">
            <LogOut className="size-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}
