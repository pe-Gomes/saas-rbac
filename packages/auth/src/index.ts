import {
  createMongoAbility,
  CreateAbility,
  MongoAbility,
  AbilityBuilder,
} from '@casl/ability'
import { z } from 'zod'
import { User } from '@/auth/models/user'
import { permissions } from '@/auth/permissions'
import { BillingSubject } from '@/auth/subjects/billing'
import { UserSubject } from '@/auth/subjects/user'
import { ProjectSubject } from '@/auth/subjects/project'

const AppAbilities = z.union([
  ProjectSubject,
  UserSubject,
  BillingSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

export type AppAbility = MongoAbility<z.infer<typeof AppAbilities>>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

const { build } = new AbilityBuilder(createAppAbility)

/**
 * The ability represents the permissions of each subject in the system created
 * by the CASL library.
 * @deprecated Use `defineAbilityFor` instead.
 */
export const ability = build()

/**
 * Defines the abilities (permissions) for a given user based on their role.
 * This function dynamically assigns permissions to the user by invoking a role-specific
 * function from the `permissions` object. These functions are expected to use the `AbilityBuilder`
 * to define what actions the user can or cannot perform.
 *
 * @param user - The user object for whom abilities are being defined. The user must have a `role` property.
 * @returns An instance of `AppAbility` which represents the defined abilities for the user.
 * @throws {Error} Throws an error if the permissions function for the user's role is not found.
 */
export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permissions for ${user.role} were not found.`)
  }

  permissions[user.role](user, builder)

  return builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })
}
