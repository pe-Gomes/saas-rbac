import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function requestPasswordRecovery(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/recovery',
    {
      schema: {
        tags: ['auth'],
        summary: 'Request password recovery',
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (req, res) => {
      const { email } = req.body

      const user = await db.user.findFirst({ where: { email } })

      if (!user) {
        return res.status(201).send()
      }

      const token = await db.token.create({
        data: {
          type: 'PASSWORD_RECOVER',
          userId: user.id,
        },
      })

      console.log(token.id)
      // TODO: send email with token or temporary password
    },
  )
}
