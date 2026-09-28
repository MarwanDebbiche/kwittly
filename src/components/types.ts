import type { FunctionReturnType } from 'convex/server'
import type { api } from '../../convex/_generated/api'

export type Group = NonNullable<FunctionReturnType<typeof api.groups.get>>
