import { createFileRoute } from '@tanstack/react-router'
import { GroupPage } from '../pages/GroupPage'

export const Route = createFileRoute('/_app/g/$groupId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { groupId } = Route.useParams()
  return <GroupPage key={groupId} groupId={groupId} />
}
