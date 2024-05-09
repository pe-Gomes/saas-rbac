import { defineAbilityFor } from '@saas/auth'

const ability = defineAbilityFor({ role: 'ADMIN' })

const userCanInviteSomeone = ability.can('invite', 'User')
const userCanDeleteSomeone = ability.can('delete', 'User')

console.log(userCanInviteSomeone)
console.log(userCanDeleteSomeone)
