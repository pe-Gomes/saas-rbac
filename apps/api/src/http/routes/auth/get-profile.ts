import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { db } from '@/infra/db'
import { auth } from '@/http/middlewares/auth'
import { z } from 'zod'

export async function getUserProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/profile',
      {
        schema: {
          tags: ['auth'],
          summary: 'Get Authenticated User Profile',
          security: [
            {
              bearerAuth: [],
            },
          ],
          response: {
            200: z.object({
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                avatarUrl: z.string().nullable(),
              }),
            }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()

        const user = await db.user.findUnique({
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
          where: { id: userId },
        })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        return res.status(200).send({ user })
      },
    )
}
