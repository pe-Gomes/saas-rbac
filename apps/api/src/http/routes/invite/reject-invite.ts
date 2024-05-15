import { FastifyInstance } from 'fastify'
import { BadRequestError } from '../_errors/bad-request-error'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function rejectInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/invites/:inviteId/reject',
      {
        schema: {
          tags: ['invite'],
          summary: 'Reject an invite',
          params: z.object({
            inviteId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
            400: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { inviteId } = req.params

        const invite = await db.invite.findUnique({
          where: {
            id: inviteId,
          },
        })

        if (!invite) {
          throw new BadRequestError('Invite not found or expired.')
        }

        const user = await db.user.findUnique({ where: { id: userId } })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        if (user.email !== invite.email) {
          throw new BadRequestError(
            'You cannot reject this invite because you are not the invited user.',
          )
        }

        await db.invite.delete({
          where: {
            id: inviteId,
          },
        })

        return res.status(204).send()
      },
    )
}
