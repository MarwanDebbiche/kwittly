import { useEffect, useState } from 'react'
import type { Id } from '../convex/_generated/dataModel'
import { CreateGroup } from './components/CreateGroup'
import { GroupPage } from './components/GroupPage'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHashRoute()
  const groupId = hash.match(/^#\/g\/(.+)$/)?.[1] as Id<'groups'> | undefined

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <a href="#/" className="text-xl font-bold text-emerald-600">
          splitmate
        </a>
        <main className="mt-6">{groupId ? <GroupPage groupId={groupId} /> : <CreateGroup />}</main>
      </div>
    </div>
  )
}
