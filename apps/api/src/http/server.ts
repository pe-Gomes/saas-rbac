import { env } from '@saas/env'

import { fastify } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyJWT from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createAccount } from './routes/auth/create-account'
import { authenticateWithPassword } from './routes/auth/authenticate-password'
import { getUserProfile } from './routes/auth/get-profile'
import { errorHandler } from './error-handler'
import { requestPasswordRecovery } from './routes/auth/request-password-recovery'
import { passwordReset } from './routes/auth/password-reset'
import { authenticateWithGitHub } from './routes/auth/authenticate-github'
import { createOrganization } from './routes/org/create-org'
import { getUserMembership } from './routes/org/get-membership'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

app.register(fastifyCors)

// Swagger Configuration
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'SaaS RBAC API',
      description: 'Full-stack SaaS app with multi-tenancy & RBAC',
      version: '0.1.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer Token',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})
app.register(ScalarApiReference, {
  routePrefix: '/docs',
  configuration: {
    title: 'SaaS RBAC API',
    theme: 'purple',
  },
})
//app.register(swagger)

app.register(fastifyJWT, {
  secret: env.JWT_SECRET,
})

// Application routes
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getUserProfile)
app.register(requestPasswordRecovery)
app.register(passwordReset)
app.register(authenticateWithGitHub)
app.register(createOrganization)
app.register(getUserMembership)

// Await for the Fastify App
app.ready()

app.listen({ port: env.PORT }).then(() => {
  console.log('HTTP Server listening on port 3333')
})
