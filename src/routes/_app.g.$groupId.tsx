import { convexQuery } from '@convex-dev/react-query'
import { msg, plural } from '@lingui/core/macro'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { DEFAULT_LOCALE, isLocale } from '../../convex/lib/locale'
import { createI18n } from '../lib/i18n'
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
    const locale = isLocale(group.locale) ? group.locale : DEFAULT_LOCALE
    return { group: { name: group.name, participantCount: group.participants.length, locale } }
  },
  head: ({ loaderData, match }) => {
    const group = loaderData?.group
    // The tab title follows the viewer's language...
    const title = group ? `${group.name} · Kwittly` : match.context.i18n._(msg`Group not found · Kwittly`)
    // ...but link previews (WhatsApp, iMessage, Slack) are fetched by the app's
    // servers, not by the person who will read them: use the group's language.
    // Name and size only, no amounts.
    const preview = group && createI18n(group.locale)
    const count = group?.participantCount ?? 0
    const description = preview
      ? preview._(
          msg`${plural(count, { one: '# participant', other: '# participants' })} · Join the group to share expenses on Kwittly.`,
        )
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
