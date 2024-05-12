import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '@/infra/db'
import { env } from '@saas/env'
import { z } from 'zod'

export async function authenticateWithGitHub(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/oauth/github',
    {
      schema: {
        tags: ['auth', 'oauth'],
        summary: 'Authenticate with GitHub',
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({ token: z.string() }),
        },
      },
    },
    async (req, res) => {
      const { code } = req.body

      const url = new URL('https://github.com/login/oauth/access_token')
      url.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
      url.searchParams.set('client_secret', env.GITHUB_CLIENT_SECRET)
      url.searchParams.set(
        'redirect_uri',
        'http://localhost:3000/api/auth/callback/github',
      )
      url.searchParams.set('code', code)

      const accessTokenResponse = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const accessTokenData = await accessTokenResponse.json()

      const { access_token: accessToken } = z
        .object({
          access_token: z.string(),
          token_type: z.string(),
          scope: z.string(),
        })
        .parse(accessTokenData)

      console.log({ accessToken })

      const getUserData = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const userDataBody = await getUserData.json()

      console.log({ userDataBody })

      const {
        id: githubId,
        name,
        avatar_url: avatarUrl,
        email,
      } = z
        .object({
          id: z.number().int().transform(String),
          avatar_url: z.string().url(),
          name: z.string().nullable(),
          email: z.string().email().nullable(),
        })
        .parse(userDataBody)

      /**
       * GitHub provide the ability to users hide their primary email address.
       * That behavior persists even when the scope of user:email is requested.
       *
       * To counter that mesure it is possible to make another request to get
       * the user's email address.
       */
      const emailDataResponse = z.array(
        z.object({
          email: z.string().email(),
          primary: z.boolean(),
          verified: z.boolean(),
          visibility: z.string().nullable(),
        }),
      )
      let emailData = [] as z.infer<typeof emailDataResponse>

      if (!email) {
        const emailRequest = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const emailRequestBody = await emailRequest.json()

        emailData = emailDataResponse.parse(emailRequestBody)
      }

      const validateEmail = emailData[0]?.email ?? email

      let user = await db.user.findUnique({ where: { email: validateEmail } })

      if (!user) {
        user = await db.user.create({
          data: {
            name,
            email: validateEmail,
            avatarUrl,
          },
        })
      }

      let account = await db.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })

      if (!account) {
        await db.account.create({
          data: {
            provider: 'GITHUB',
            providerAccountId: githubId,
            userId: user.id,
          },
        })
      }

      const token = await res.jwtSign(
        {
          sub: user.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        },
      )

      return res.status(201).send({ token })
    },
  )
}
