# Project Overview
This is the "web" application of the Todo Workspace, built with **Angular (v21+)** and managed within an **Nx workspace**. It is a task management application featuring a dashboard, task listing, task details, and settings.

## Core Technologies
- **Framework:** Angular (Standalone Components)
- **State Management:** Angular Signals
- **Routing:** Angular Router with lazy loading and component input binding
- **Styling:** Vanilla CSS (`src/styles.css`)
- **Build System:** Nx / Angular CLI

## Architecture
- `src/main.ts`: Application entry point.
- `src/app/app.config.ts`: Global application configuration (router, error listeners).
- `src/app/core/`: Core business logic, interfaces, and services (e.g., `TasksService`).
- `src/app/pages/`: Feature components organized by route (Login, Dashboard, Tasks, Settings).
- `src/app/shared/`: Shared utilities and cross-cutting concerns.
- `src/app/app.routes.ts`: Central routing configuration with lazy-loaded features.

# Building and Running
Since this project is part of an Nx workspace, use the following commands:

- **Development Server:** `nx serve web`
- **Build:** `nx build web`
- **Testing:** `nx test web`
- **Linting:** `nx lint web`

# Development Conventions
- **Component Strategy:** Use standalone components. Prefer `ChangeDetectionStrategy.OnPush` for better performance.
- **Standalone Component** Do not include `standalone: true` in component decorators, as it is the framework default starting in v20.
- **State:** Leverage Angular Signals (`signal`, `computed`, `effect`) for reactive state management.
- **Data Fetching:** Prefer using the `rxResource()` API over `resource()`. This aligns with the RxJS-based services used throughout the application.
- **File Structure:** Components typically separate logic (`.ts`) and templates (`.html`).
- **Routing:** All feature modules should be lazy-loaded in `app.routes.ts`.
- **Quotes:** Use single quotes for all imports in components, directives, and other files. Avoid double quotes.
- **Services:** Logic should reside in services (like `TasksService`) within the `core` directory.
- **Observables:** Always use the `takeUntilDestroyed()` operator from `@angular/core/rxjs-interop` when manually subscribing to Observables (e.g., `valueChanges`) within a component, directive, or service. This ensures subscriptions are automatically cleaned up when the context is destroyed.
- **Naming:** Follow the project's specific naming convention where component files are named directly after the feature (e.g., `dashboard.ts` and `dashboard.html`) rather than the standard `.component.ts` suffix.
