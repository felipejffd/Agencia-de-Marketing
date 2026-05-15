export default {
  schema: './schema.prisma',
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db',
}
