import { FastifyInstance } from 'fastify'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '@/http/middlewares/auth'
import { RoleSchema } from '@saas/auth'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { db } from '@/infra/db'

export async function revokeInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/invites/:inviteId',
      {
        schema: {
          tags: ['invite'],
          summary: 'Revoke an invite',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
            inviteId: z.string(),
          }),
          response: {
            204: z.null(),
            400: z.object({
              message: z.string(),
            }),
            401: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug, inviteId } = req.params

        const userId = await req.getCurrentUserId()
        const { membership, organization } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('delete', 'Invite')) {
          throw new UnauthorizedError('You are not allowed to delete invites.')
        }

        const invite = await db.invite.findUnique({
          where: {
            id: inviteId,
            organizationId: organization.id,
          },
        })

        if (!invite) {
          throw new BadRequestError(
            'Invite not found, expired or accepted by user.',
          )
        }

        await db.invite.delete({ where: { id: inviteId } })

        return res.status(204).send()
      },
    )
}
