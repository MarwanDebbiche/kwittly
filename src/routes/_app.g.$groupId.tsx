import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { GroupPage } from '../pages/GroupPage'

export const Route = createFileRoute('/_app/g/$groupId')({
  // Runs on the server for the first page load: the group, its balances and
  // expenses are embedded in the HTML, then kept live in the browser.
  loader: async ({ context: { queryClient }, params }) => {
    const group = await queryClient.ensureQueryData(convexQuery(api.groups.get, { groupId: params.groupId }))
    if (!group) return { group: null }
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.balances.get, { groupId: group._id })),
      queryClient.ensureQueryData(convexQuery(api.expenses.list, { groupId: group._id })),
    ])
    return { group: { name: group.name, participantCount: group.participants.length } }
  },
  // Link previews (WhatsApp, iMessage, Slack): name and size only, no amounts.
  head: ({ loaderData }) => {
    const group = loaderData?.group
    const title = group ? `${group.name} · Kwittly` : 'Groupe introuvable · Kwittly'
    const description = group
      ? `${group.participantCount} participant${group.participantCount > 1 ? 's' : ''} · Rejoins le groupe pour partager les dépenses sur Kwittly.`
      : undefined
    return {
      meta: [
        { title },
        // Shared by link, never meant to be found through search engines.
        { name: 'robots', content: 'noindex' },
        ...(group
          ? [
              { property: 'og:title', content: group.name },
              { property: 'og:description', content: description },
              { property: 'og:type', content: 'website' },
              { name: 'description', content: description },
            ]
          : []),
      ],
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { groupId } = Route.useParams()
  return <GroupPage key={groupId} groupId={groupId} />
}
