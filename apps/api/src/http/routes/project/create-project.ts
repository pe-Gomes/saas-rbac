import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { createSlug } from '@/lib/create-slug'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/projects',
      {
        schema: {
          tags: ['project'],
          summary: 'Create a new project',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string(),
          }),
          response: {
            201: z.object({
              projectId: z.string().uuid(),
            }),
            400: z.object({
              message: z.string().uuid(),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { slug } = req.params

        const { organization, membership } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Project')) {
          throw new UnauthorizedError('You are not allowed to create projects.')
        }

        const { name, description } = req.body

        const project = await db.project.create({
          data: {
            name: name,
            slug: createSlug(name),
            description,
            organizationId: organization.id,
            ownerId: userId,
          },
        })

        return res.status(201).send({
          projectId: project.id,
        })
      },
    )
}
