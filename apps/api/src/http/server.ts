import 'dotenv/config'
import { env } from '@/env'

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

import { swagger } from './routes/swagger'
import { createAccount } from './routes/auth/create-account'
import { authenticateWithPassword } from './routes/auth/authenticate-password'
import { getUserProfile } from './routes/auth/get-profile'
import { errorHandler } from './error-handler'

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
    servers: [],
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
app.register(swagger)

app.register(fastifyJWT, {
  secret: env.JWT_SECRET,
})

// Application routes
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getUserProfile)

// Await for the Fastify App
app.ready()

app.listen({ port: env.PORT }).then(() => {
  console.log('HTTP Server listening on port 3333')
})
