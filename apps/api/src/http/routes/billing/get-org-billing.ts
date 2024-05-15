import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '@/http/middlewares/auth'
import { z } from 'zod'
import { getUserMembership } from '../org/get-membership'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { db } from '@/infra/db'

export async function getOrganizationBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/billing',
      {
        schema: {
          tags: ['billing'],
          summary: 'Get billing details about an organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              billing: z.object({
                members: z.object({
                  amount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                projects: z.object({
                  amount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                totalPrice: z.number(),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params

        const userId = await req.getCurrentUserId()
        const { organization, membership } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Billing')) {
          throw new UnauthorizedError(
            'You are not allowed to get billing from this organization.',
          )
        }

        const [memberAmount, projectAmount] = await Promise.all([
          db.member.count({
            where: {
              organizationId: organization.id,
              role: { not: 'BILLING' },
            },
          }),
          db.project.count({
            where: {
              organizationId: organization.id,
            },
          }),
        ])

        return res.status(200).send({
          billing: {
            members: {
              amount: memberAmount,
              unit: 10,
              price: 10 * memberAmount,
            },
            projects: {
              amount: memberAmount,
              unit: 1,
              price: 1 * memberAmount,
            },
            totalPrice: 10 * memberAmount + 1 * projectAmount,
          },
        })
      },
    )
}
