import { RoleSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { BadRequestError } from '../_errors/bad-request-error'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function getInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/invites/:inviteId',
    {
      schema: {
        tags: ['invite'],
        summary: 'Get details about an invite',
        params: z.object({
          inviteId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            invite: z.object({
              id: z.string().uuid(),
              email: z.string().email(),
              role: RoleSchema,
              createdAt: z.date(),
              organization: z.object({
                name: z.string(),
                slug: z.string(),
              }),
              author: z
                .object({
                  id: z.string().uuid(),
                  name: z.string().nullable(),
                  avatarUrl: z.string().url().nullable(),
                })
                .nullable(),
            }),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (req, res) => {
      const { inviteId } = req.params

      const invite = await db.invite.findUnique({
        where: { id: inviteId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      })

      if (!invite) {
        throw new BadRequestError('Invite not found.')
      }

      return res.status(200).send({ invite })
    },
  )
}
