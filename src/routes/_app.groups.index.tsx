import { msg } from '@lingui/core/macro'
import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { summaryItems } from '../lib/myGroups'
import type { SavedGroup } from '../lib/savedGroups'
import { GroupsPage } from '../pages/GroupsPage'

export const Route = createFileRoute('/_app/groups/')({
  // Logged-in users: the account's groups were prefetched by the _app layout
  // on the server; fetch their summaries so the list is in the HTML.
  loader: async ({ context: { queryClient } }) => {
    if (typeof window !== 'undefined') return
    const mine = queryClient.getQueryData<SavedGroup[] | null>(convexQuery(api.memberships.mine, {}).queryKey)
    if (!mine?.length) return
    try {
      await queryClient.ensureQueryData(convexQuery(api.groups.summaries, { items: summaryItems(mine) }))
    } catch (error) {
      // Only a head start: the list loads in the browser once Convex is reachable.
      console.warn('Group summaries prefetch failed:', error)
    }
  },
  head: ({ match }) => ({ meta: [{ title: match.context.i18n._(msg`My groups · Kwittly`) }] }),
  component: GroupsPage,
})
