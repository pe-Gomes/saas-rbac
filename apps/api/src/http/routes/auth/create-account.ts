import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/infra/db'
import { hashPassword } from '@/lib/hash-password'

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        summary: 'Create a new user',
        body: createUserSchema,
        // TODO: Create responses schemas with zod
      },
    },
    async (req, res) => {
      const { name, email, password } = req.body

      const userExists = await db.user.findFirst({ where: { email } })

      if (userExists) {
        return res
          .status(400)
          .send({ message: 'user with same e-amil already exists.' })
      }

      const passwordHash = await hashPassword(password)

      if (!passwordHash) {
        return res.status(500).send({ message: 'Internal Server Error' })
      }

      const [_, domain] = email.split('@')

      const isDomainAttachedToOrg = await db.organization.findFirst({
        where: { domain, shouldAttachUsersByDomain: true },
      })

      const user = await db.user.create({
        data: {
          name,
          email,
          passwordHash,
          memberships: isDomainAttachedToOrg
            ? {
                create: {
                  organizationId: isDomainAttachedToOrg.id,
                },
              }
            : undefined,
        },
      })

      return res.status(201).send(user)
    },
  )
}
