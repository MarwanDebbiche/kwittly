import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { useConvexAuth } from 'convex/react'
import type { FunctionReference } from 'convex/server'
import { useState } from 'react'

/**
 * A query whose result depends on who is logged in (null when logged out).
 *
 * For logged-in users, the server renders it with the session cookie. In the
 * browser, the Convex client starts unauthenticated until the session is
 * confirmed, so its first answer is a provisional null: keep the last known
 * value while auth is still loading instead of flashing the logged-out state.
 */
export function useAccountQuery<T>(query: FunctionReference<'query', 'public', Record<string, never>, T | null>) {
  const { isLoading } = useConvexAuth()
  const { data } = useQuery(convexQuery(query, {}))
  // "Storing information from previous renders" pattern from the React docs.
  const [lastKnown, setLastKnown] = useState<T | undefined>(data ?? undefined)
  if (data !== null && data !== undefined && data !== lastKnown) setLastKnown(data)
  if (isLoading && (data === null || data === undefined)) return lastKnown
  return data
}
