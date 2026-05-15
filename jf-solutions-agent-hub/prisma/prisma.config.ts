import { defineConfig } from '@prisma/internals'

export default defineConfig({
  schema: './schema.prisma',
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db',
})
