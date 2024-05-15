import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { RoleSchema } from '@saas/auth'
import { z } from 'zod'

export async function getUserPendingInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/invites',
      {
        schema: {
          tags: ['invite'],
          summary: 'Get a user pending invites',
          security: [
            {
              bearerAuth: [],
            },
          ],
          response: {
            400: z.object({
              invites: z.array(
                z.object({
                  id: z.string().uuid(),
                  email: z.string().email(),
                  role: RoleSchema,
                  createdAt: z.date(),
                  organization: z.object({
                    name: z.string(),
                    avatarUrl: z.string().url().nullable(),
                  }),
                  author: z
                    .object({
                      name: z.string().nullable(),
                      avatarUrl: z.string().url().nullable(),
                    })
                    .nullable(),
                }),
              ),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()

        const user = await db.user.findUnique({ where: { id: userId } })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        const invites = await db.invite.findMany({
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            organization: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
            author: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            email: user.email,
          },
        })

        return res.status(200).send({ invites })
      },
    )
}
