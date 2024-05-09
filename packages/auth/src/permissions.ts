import { AbilityBuilder } from '@casl/ability'
import { AppAbility } from '@/auth/.'
import { User } from '@/auth/models/user'
import { Role } from './roles'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(user, { can }) {},
  MEMBER(user, { can }) {},
  BILLING(_, { can }) {},
}
