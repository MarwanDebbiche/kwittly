import type { FunctionReturnType } from 'convex/server'
import type { api } from '../../convex/_generated/api'

export type Group = NonNullable<FunctionReturnType<typeof api.groups.get>>
export type Expense = FunctionReturnType<typeof api.expenses.list>[number]
export type BalancesData = FunctionReturnType<typeof api.balances.get>
