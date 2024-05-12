import { db } from '@/infra/db'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getUserProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/profile',
    {
      schema: {
        tags: ['auth'],
        summary: 'Get Authenticated User Profile',
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
      const { sub } = await req.jwtVerify<{ sub: string }>()

      const user = await db.user.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
        where: { id: sub },
      })

      if (!user) {
        throw new BadRequestError('User not found.')
      }

      return res.status(200).send({ user })
    },
  )
}
