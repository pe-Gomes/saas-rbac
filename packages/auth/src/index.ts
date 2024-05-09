import {
  createMongoAbility,
  ForcedSubject,
  CreateAbility,
  MongoAbility,
  AbilityBuilder,
} from '@casl/ability'
import { User } from '@/auth/models/user'
import { permissions } from './permissions'

const actions = ['manage', 'invite', 'delete'] as const
const subjects = ['User', 'all'] as const

type AppAbilities = [
  (typeof actions)[number],
  (
    | (typeof subjects)[number]
    | ForcedSubject<Exclude<(typeof subjects)[number], 'all'>>
  ),
]

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

const { build, can, cannot } = new AbilityBuilder(createAppAbility)

can('invite', 'User')
cannot('delete', 'User')

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

  return builder.build()
}
