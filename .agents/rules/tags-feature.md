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
  - `DELETE /api/tags/:id`: Deletes a user tag and returns `{ success: true }`.

### Tasks Module Integration (`apps/api/src/app/modules/tasks`)
- **DTOs**: Use `CreateTaskDto` and `UpdateTaskDto` with `@IsArray()` and `@IsNumber({}, { each: true })` for `tagIds?: number[]`.
- **`TasksService`**:
  - `getTasks()` & `getTask()` query `taskTags` with `{ tag: true }` and map them into the returned `tags` array.
  - `createTask()` inserts into `task_tags` if `tagIds` are provided, then fetches full task with tags.
  - `updateTask()` syncs `task_tags` (deletes old, inserts new), tracks tag diffs (`isTagChanged`) to log `changes.push('tags')` in `schema.activities`, and returns the refreshed task with tags.

---

## 3. Frontend Architecture (`apps/web`)

### State Management (`@ngrx/signals`)
- **`TagsService`**: SignalStore (`tags`, `isLoading`) with `loadTags()`, `createTag()`, `deleteTag()`.
  - When `deleteTag(id)` succeeds, it immediately calls `TasksService.removeTagFromTasks(id)` to prevent stale tag badges on task cards.
- **`TasksService`**: Contains `removeTagFromTasks(tagId: number)` to strip deleted tags from tasks in memory.

### Components
- **`TagBadgeComponent`**: Colored pill badge for rendering tag labels (supports optional removal output).
- **`TagManagerComponent`**: Management UI with signal forms (`@angular/forms/signals`) for adding/deleting tags with color selection.
- **`TagSelectComponent`**: Custom form control implementing `ControlValueAccessor` (`NG_VALUE_ACCESSOR`). Used as `<app-tag-select formControlName="tagIds" />` in `TaskDetailsPage`. Includes automatic reactive pruning if a selected tag is deleted from the store.
- **`TaskCard`**: Renders attached tags as badges.
- **`TaskSearchComponent`**: Multi-select tag filter with automatic pruning of deleted tags.
- **`TasksPage`**: Computed signal `allTasks` filters board tasks based on `selectedTagIds`.

---

## 4. Testing & Verification Rules

- **API Unit Tests**:
  - `tags.service.spec.ts`: Test `findAllForUser`, `create`, and `delete` (including `NotFoundException`).
  - `tasks.service.spec.ts`: Mock Drizzle `select`, `delete`, and `insert` queries on `schema.taskTags` when testing `createTask` and `updateTask`.
- **Web Unit Tests**:
  - `tags.service.spec.ts`: Verify store methods, side effects, error swallowing, and cross-store notifications.
  - `tasks.service.spec.ts`: Test `removeTagFromTasks` tag pruning from tasks.
  - `tag-select.spec.ts`: Test `ControlValueAccessor` (`writeValue`, `registerOnChange`, `setDisabledState`), tag toggle, and pruning effect.
  - `tag-manager.spec.ts`: Test signal form validation, DOM submission, and tag deletion.
- **Verification Commands**:
  - `npx nx test api`
  - `npx nx test web --watch=false`
  - `npx nx db-generate api`
  - `npx nx db-migrate api`
