import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/infra/db'
import { hashPassword } from '@/lib/hash-password'
import { BadRequestError } from '../_errors/bad-request-error'

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
        tags: ['user'],
        summary: 'Create a new user',
        body: createUserSchema,
        response: {
          201: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
            }),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (req, res) => {
      const { name, email, password } = req.body

      const userExists = await db.user.findFirst({ where: { email } })

      if (userExists) {
        throw new BadRequestError('User with same e-amil already exists.')
      }

      const passwordHash = await hashPassword(password)

      const [_, domain] = email.split('@')

      const isDomainAttachedToOrg = await db.organization.findFirst({
        where: { domain, shouldAttachUsersByDomain: true },
      })

      const { id } = await db.user.create({
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

      return res.status(201).send({
        user: {
          id,
          name,
          email,
        },
      })
    },
  )
}
