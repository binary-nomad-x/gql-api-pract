# AGENTS.md

## Project Overview

This project is a TypeScript GraphQL API using:

* Prisma ORM
* PostgreSQL
* Apollo GraphQL Server
* TypeScript
* Node.js

Follow existing architecture and coding patterns unless explicitly instructed otherwise.

---

# Critical Safety Rules

## Never Modify Data Without Permission

Do not execute any operation that creates, updates, deletes, truncates, resets, seeds, migrates, or otherwise modifies data without explicit user approval.

Always ask for confirmation first.

Examples:

* prisma.user.create()
* prisma.user.update()
* prisma.user.delete()
* prisma.user.upsert()
* prisma.$executeRaw()
* prisma.$queryRaw() that modifies data
* INSERT
* UPDATE
* DELETE
* TRUNCATE
* DROP
* ALTER
* CREATE PROCEDURE
* ALTER PROCEDURE
* EXEC procedure
* CREATE FUNCTION
* ALTER FUNCTION

Allowed without confirmation:

* SELECT queries
* prisma.findMany()
* prisma.findFirst()
* prisma.findUnique()
* prisma.count()
* prisma.aggregate()
* prisma.groupBy()

---

## Never Run Destructive Prisma Commands

Never execute any of the following without explicit approval:

* prisma migrate dev
* prisma migrate reset
* prisma migrate deploy
* prisma db push
* prisma db pull
* prisma db seed
* prisma migrate diff
* prisma migrate resolve
* npm run seed
* npm run seed:reset
* npm run seed:fresh
* npm run db:reset
* npm run db:rebuild
* npm run setup

Always explain:

1. What command will run.
2. What data may be affected.
3. Wait for approval.

---

## Never Run NPM Scripts Automatically

Do not execute any npm, pnpm, yarn, or bun script without approval.

Examples:

* npm run setup
* npm run build
* npm run seed
* npm run db:reset
* npm run db:rebuild

Always ask first.

---

## Database Changes

Before generating migrations:

1. Explain proposed schema changes.
2. Show migration plan.
3. Wait for approval.

Do not generate or execute migrations automatically.

---

## Stored Procedures & Functions

Do not create, alter, drop, or execute:

* Procedures
* Functions
* Triggers
* Views

Without explicit approval.

---

# Development Standards

## TypeScript

* Use strict typing.
* Avoid any whenever possible.
* Prefer interfaces for contracts.
* Prefer enums over magic strings.

## GraphQL

* Keep resolvers thin.
* Move business logic into services.
* Validate inputs before service calls.
* Avoid duplicated resolver logic.

## Prisma

* Use select when possible.
* Avoid over-fetching.
* Avoid N+1 queries.
* Add indexes for frequently queried fields.
* Use transactions where appropriate.

## Services

* Keep methods focused.
* Extract reusable business logic into services.
* Prefer composition over duplication.

## Code Quality

* Keep methods reasonably small.
* Avoid deeply nested conditions.
* Prefer early returns.
* Follow existing project conventions.

---

# Agent Behavior

When unsure:

* Ask first.
* Do not assume.
* Do not execute destructive actions.
* Do not modify production-related data.
* Do not run database-changing commands.

Read-only analysis is allowed.

Data-changing actions require approval.
