import { db } from '@/infra/db'
import { comparePassword } from '@/lib/hash-password'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with password',
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          201: z.object({ token: z.string() }),
          401: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (req, res) => {
      const { email, password } = req.body

      const user = await db.user.findFirst({ where: { email } })

      if (!user) {
        return res.status(401).send({ message: 'Invalid credentials.' })
      }

      if (user?.passwordHash === null) {
        return res
          .status(400)
          .send({ message: 'User does not have a password, use social login.' })
      }

      const isPasswordValid = await comparePassword(password, user.passwordHash)

      if (!isPasswordValid) {
        return res.status(401).send({ message: 'Invalid credentials.' })
      }

      const token = await res.jwtSign({ sub: user.id }, { expiresIn: '7d' })

      return res.status(201).send({ token })
    },
  )
}
