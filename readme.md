# 1. Install dependencies
npm install

# 2. Install additional packages
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken @types/express

# 3. Create database (PostgreSQL)
createdb graphql_api

# 4. Run Prisma migration
npx prisma migrate dev --name init

# 5. Generate Prisma client
npx prisma generate

# 6. Start development server
npm run dev
