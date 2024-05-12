import { Role } from '@prisma/client'
import { defineAbilityFor, userSchema } from '@saas/auth'

export function getUserPermissions(id: string, role: Role) {
  const authUser = userSchema.parse({ id, role })
  const permissions = defineAbilityFor(authUser)

  return permissions
}
