import { useConvexConnectionState } from 'convex/react'

/** Failed reconnection attempts before telling the user instead of loading forever. */
const RETRIES_BEFORE_ERROR = 2

/**
 * True while the Convex WebSocket cannot connect. Data loaded over it would
 * otherwise stay "loading" forever; this turns back to false on its own once
 * Convex is reachable again (the client keeps retrying).
 */
export function useConvexUnreachable() {
  const { isWebSocketConnected, connectionRetries } = useConvexConnectionState()
  return !isWebSocketConnected && connectionRetries >= RETRIES_BEFORE_ERROR
}
