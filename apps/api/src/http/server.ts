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
import { getOneOrganization } from './routes/org/get-one-organization'
import { getManyOrganizations } from './routes/org/get-many-organizations'
import { updateOrganization } from './routes/org/update-org'
import { shutdownOrganization } from './routes/org/shutdown-org'
import { transferOrganization } from './routes/org/transfer-org'
import { createProject } from './routes/project/create-project'
import { deleteProject } from './routes/project/delete-project'
import { getOneProject } from './routes/project/get-one-project'
import { getOrganizationProjects } from './routes/project/get-org-projects'
import { updateProject } from './routes/project/update-project'
import { getOrganizationMembers } from './routes/member/get-org-members'
import { updateMemberRole } from './routes/member/update-member'
import { removeMember } from './routes/member/delete-member'
import { createInvite } from './routes/invite/create-invite'

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
app.register(getOneOrganization)
app.register(getManyOrganizations)
app.register(updateOrganization)
app.register(shutdownOrganization)
app.register(transferOrganization)
app.register(createProject)
app.register(deleteProject)
app.register(getOneProject)
app.register(getOrganizationProjects)
app.register(updateProject)
app.register(getOrganizationMembers)
app.register(updateMemberRole)
app.register(removeMember)
app.register(createInvite)

// Await for the Fastify App
app.ready()

app.listen({ port: env.PORT }).then(() => {
  console.log('HTTP Server listening on port 3333')
})
