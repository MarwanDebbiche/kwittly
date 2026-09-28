import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'

export function CreateGroup() {
  const createGroup = useMutation(api.groups.create)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [participants, setParticipants] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const names = participants
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (!name.trim() || names.length === 0) return
    const groupId = await createGroup({ name: name.trim(), currency, participants: names })
    window.location.hash = `#/g/${groupId}`
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold">Nouveau groupe</h1>
      <input
        className="input"
        placeholder="Nom du groupe (ex : Week-end à Lisbonne)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input"
        placeholder="Participants, séparés par des virgules"
        value={participants}
        onChange={(e) => setParticipants(e.target.value)}
      />
      <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {['EUR', 'USD', 'GBP', 'CHF'].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <button className="btn">Créer le groupe</button>
    </form>
  )
}
