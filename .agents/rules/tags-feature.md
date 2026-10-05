# Tags & Custom Labels Feature Guidelines

This rule provides context and architecture guidelines for AI agents working on the **Tags & Custom Labels** feature within the Todo Workspace (`apps/api` and `apps/web`).

---

## 1. Domain & Shared Contracts (`libs/shared/tasks`)

- **Interfaces & Types**:
  - `Tag`: `{ id: number; name: string; color: string; userId?: number; }`
  - `CreateTagDto`: `{ name: string; color: string; }`
  - `UpdateTagDto`: `{ name?: string; color?: string; }`
  - `Task`: Extended with optional `tags?: Tag[]`.
- **Re-exports**: Always re-export tag types from `libs/shared/tasks/src/index.ts`.

---

## 2. Backend Architecture (`apps/api`)

### Database Schemas (`apps/api/src/app/db/schemas`)
- **`tags.schema.ts`**: Table `tags` storing user-scoped tags (`id`, `name`, `color`, `user_id`, `created_at`).
- **`task-tags.schema.ts`**: Junction table `task_tags` (`task_id`, `tag_id`) with composite primary key.
- **`tasks.schema.ts`**: Contains `taskTags: many(taskTags)` in `tasksRelations`.

### API Module & Endpoints (`/api/tags`)
- **`TagsModule`**: Registered in `AppModule` imports.
- **`TagsController`**: Endpoints protected by `@UseGuards(JwtAuthGuard)`:
  - `GET /api/tags`: Fetches custom tags for `req.user.id`.
  - `POST /api/tags`: Creates a tag for `req.user.id` using `CreateTagDto`.
  - `DELETE /api/tags/:id`: Deletes a user tag.

### Tasks Module Integration (`apps/api/src/app/modules/tasks`)
- **DTOs**: Use `CreateTaskDto` and `UpdateTaskDto` with `@IsArray()` and `@IsNumber({}, { each: true })` for `tagIds?: number[]`.
- **`TasksService`**:
  - `getTasks()` & `getTask()` query `taskTags` with `{ tag: true }` and map them into the returned `tags` array.
  - `createTask()` inserts into `task_tags` if `tagIds` are provided.
  - `updateTask()` syncs `task_tags` (deletes old, inserts new) and tracks tag diffs (`isTagsChanged`) to log `changes.push('tags')` in `schema.activities`.

---

## 3. Frontend Architecture (`apps/web`)

- **State Management**: `TagsService` using Angular 21 Signals and `rxResource` (`rxResource({ loader: () => tagsDataService.getTags() })`).
- **Components**:
  - `TagBadgeComponent`: Colored pill badge for displaying tags.
  - `TagManagerComponent`: Inline/modal management UI with color picker.
  - `TaskCardComponent`: Renders active tags attached to board tasks.
  - `TaskSearchComponent`: Filters board tasks by selected tag IDs.

---

## 4. Testing & Verification Rules

- **Unit Tests**:
  - `tags.service.spec.ts`: Test `findAllForUser`, `create`, and `delete` (including `NotFoundException`).
  - `tasks.service.spec.ts`: Mock Drizzle `select`, `delete`, and `insert` queries on `schema.taskTags` when testing `createTask` and `updateTask`.
- **Commands**:
  - Run tests: `npx nx test api`
  - Generate migrations: `npx nx db-generate api`
  - Apply migrations: `npx nx db-migrate api`
