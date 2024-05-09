import { defineAbilityFor, userSchema, projectSchema } from '@saas/auth'

const user = userSchema.parse({
  id: '1',
  role: 'MEMBER',
})

const project = projectSchema.parse({
  id: '1',
  ownerId: '1',
})

const ability = defineAbilityFor(user)

console.log(ability.can('get', 'Billing'))
console.log(ability.can('create', 'Invite'))
console.log(ability.can('delete', 'Project'))
console.log(ability.can('delete', project))
