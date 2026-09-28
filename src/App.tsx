import { useRoute } from './lib/router'
import { GroupPage } from './pages/GroupPage'
import { GroupsPage } from './pages/GroupsPage'
import { NewGroupPage } from './pages/NewGroupPage'

export default function App() {
  const route = useRoute()
  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28">
      {route.name === 'home' && <GroupsPage />}
      {route.name === 'new' && <NewGroupPage />}
      {route.name === 'group' && <GroupPage key={route.id} groupId={route.id} />}
    </div>
  )
}
