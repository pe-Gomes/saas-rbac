import { AbilityBuilder } from '@casl/ability'
import { AppAbility } from '@/auth/.'
import { User } from '@/auth/models/user'

type Roles = 'ADMIN' | 'MEMBER'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Roles, PermissionsByRole> = {
  ADMIN(_, { can }) {
    can('manage', 'all')
  },
  MEMBER(_, { can }) {
    can('invite', 'User')
  },
}
