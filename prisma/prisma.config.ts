import path from 'node:path'
import type { PrismaConfig } from 'prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Create the adapter for database connections
const connectionString = process.env.DATABASE_URL!

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export default {
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),
  migrate: {
    adapter,
  },
} satisfies PrismaConfig
