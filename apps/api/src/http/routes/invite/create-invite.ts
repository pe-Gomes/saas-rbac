import { FastifyInstance } from 'fastify'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '@/http/middlewares/auth'
import { RoleSchema } from '@saas/auth'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { db } from '@/infra/db'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['invite'],
          summary: 'Create an invite',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            email: z.string().email(),
            role: RoleSchema,
          }),
          response: {
            201: z.object({
              inviteId: z.string().uuid(),
            }),
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
        const { slug } = req.params

        const userId = await req.getCurrentUserId()
        const { organization, membership } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Invite')) {
          throw new UnauthorizedError('You are not allowed to create invites.')
        }

        const { email, role } = req.body

        const [_, domain] = email.split('@')

        if (
          organization.shouldAttachUsersByDomain &&
          organization.domain === domain
        ) {
          throw new BadRequestError(
            `Users with "${domain}" will join your organization automatically on login.`,
          )
        }

        const inviteExists = await db.invite.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: organization.id,
            },
          },
        })

        if (inviteExists) {
          throw new BadRequestError(
            'User already invited to this organization.',
          )
        }

        const memberExists = await db.member.findFirst({
          where: {
            organizationId: organization.id,
            user: {
              email,
            },
          },
        })

        if (memberExists) {
          throw new BadRequestError(
            'User is already a member of this organization.',
          )
        }

        const { id: inviteId } = await db.invite.create({
          data: {
            email,
            organizationId: organization.id,
            role,
            authorId: userId,
          },
        })

        return res.status(201).send({ inviteId })
      },
    )
}
