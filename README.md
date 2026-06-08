# Todo Workspace

A full-stack task management application managed with [Nx](https://nx.dev).

## Project Structure

- **`apps/web`**: Angular (v21+) frontend using Standalone Components, Signals, and `rxResource`.
- **`apps/api`**: NestJS backend with Drizzle ORM.
- **`libs/shared`**: Shared TypeScript interfaces used across the workspace.

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm

### Installation
```sh
npm install
```

### Development
To start both the frontend and backend:
```sh
npx nx run-many -t serve
```

Or run them individually:
```sh
# Frontend
npx nx serve web

# Backend
npx nx serve api
```

## Core Tasks

| Task | Command |
| :--- | :--- |
| **Build Web** | `npx nx build web` |
| **Build API** | `npx nx build api` |
| **Test** | `npx nx test` |
| **Lint** | `npx nx lint` |
| **Generate Migrations** | `npx nx db-generate api` |
| **Run Migrations** | `npx nx db-migrate api` |
| **Seed Database** | `npx nx db-seed api` |

## Tech Stack

- **Frontend**: Angular v21, Signals, `OnPush` Change Detection.
- **Backend**: NestJS, Drizzle ORM, PostgreSQL.
- **Tooling**: Nx, ESLint, Prettier.
