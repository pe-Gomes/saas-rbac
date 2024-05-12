import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { createSlug } from '@/lib/create-slug'

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations',
      {
        schema: {
          tags: ['organization'],
          summary: 'Create a new organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          body: z.object({
            name: z.string(),
            domain: z.string().optional(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            200: z.object({
              organizationId: z.string(),
            }),
            400: z.object({
              message: z.string().uuid(),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()

        const { name, domain, shouldAttachUsersByDomain } = req.body

        if (domain) {
          const domainExists = await db.organization.findUnique({
            where: { domain },
          })

          if (domainExists) {
            throw new BadRequestError('Domain is already in use.')
          }
        }

        const organization = await db.organization.create({
          data: {
            name,
            domain,
            slug: createSlug(name),
            shouldAttachUsersByDomain: shouldAttachUsersByDomain,
            ownerId: userId,
            members: {
              create: [
                {
                  userId,
                  role: 'ADMIN',
                },
              ],
            },
          },
        })

        return res.status(201).send({
          organizationId: organization.id,
        })
      },
    )
}
