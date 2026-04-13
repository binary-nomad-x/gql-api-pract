import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Architectural Note: Environment variables ko process.env se pick karte waqt 
// check lazmi hai taake database connection fail na ho.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in the environment variables.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // High-level: Prisma 6+ mein direct client generation aur 
  // custom output paths ko handle karne ke liye options expand hue hain.
  datasource: {
    url: databaseUrl,
  },
});