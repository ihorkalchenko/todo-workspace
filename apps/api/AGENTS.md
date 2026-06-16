# Project Overview
This is the NestJS backend application of the Todo Workspace, managed within an **Nx workspace**. It provides the REST API endpoints for authentication, task management, and user profiles, using **Drizzle ORM** and **PostgreSQL**.

## Core Technologies
- **Framework:** NestJS (v11+)
- **ORM:** Drizzle ORM
- **Database Driver:** `pg` (node-postgres connection pool)
- **Validation:** `class-validator` and `class-transformer` via a global NestJS `ValidationPipe`
- **Security & Authentication:** Passport.js with JWT strategy (extracting tokens via cookies)
- **Build System:** Nx / Webpack / TypeScript

## Architecture
- `src/main.ts`: Application entry point. Configures the global `api` prefix, registers `cookie-parser` middleware, and sets up a global `ValidationPipe` with strict validation rules.
- `src/app/app.module.ts`: Root application module that binds global configuration, database, and feature modules together.
- `src/app/db/`:
  - `db.module.ts`: Configures and exports the global `DRIZZLE` injection token using a PostgreSQL client connection pool.
  - `schemas/`: Defines database tables, relationships, and PostgreSQL enums (e.g. `users.schema.ts`, `tasks.schema.ts`).
  - `migrations/`: Stores generated Drizzle SQL migration files.
  - `seed.ts`: Seed script to prepopulate database records.
- `src/app/modules/`: Business domain modules:
  - `auth/`: Sign-up, sign-in, and log-out endpoints; JWT generation and extraction; Passport JWT strategies and guards.
  - `users/`: Profile retrieval, updating, and querying user records.
  - `tasks/`: CRUD operations on tasks.

# Building and Running
Since this project is part of an Nx workspace, use the following commands:

- **Development Server:** `nx serve api`
- **Build:** `nx build api`
- **Generate Migrations:** `npx nx db-generate api`
- **Run Migrations:** `npx nx db-migrate api`
- **Seed Database:** `npx nx db-seed api`

# Development Conventions
- **Database Operations:** Access the database by injecting the Drizzle DB instance using the `@Inject(DRIZZLE)` token and `NodePgDatabase<typeof schema>` type.
- **DTOs & Validation:** Always use DTOs (Data Transfer Objects) with validation decorators from `class-validator` for requests containing body or query parameters. Enable strict validation (the global pipe forbids non-whitelisted properties).
- **Authentication Guards:** Protect endpoints using `@UseGuards(JwtAuthGuard)`. The guard automatically reads the JWT token from cookies and appends the user context to the request (`req.user`).
- **Error Handling:** Avoid manual try/catch formatting for standard HTTP errors. Instead, throw appropriate built-in NestJS exceptions (e.g., `ConflictException`, `NotFoundException`, `UnauthorizedException`, or `BadRequestException`).
- **Shared Contracts:** Reference shared types/interfaces from `@todo-workspace/shared-interfaces` (`libs/shared`) to ensure synchronization between NestJS endpoints and Angular services.
- **Quotes:** Use single quotes for imports, module decorators, and method strings unless template strings or JSON structures demand otherwise.
