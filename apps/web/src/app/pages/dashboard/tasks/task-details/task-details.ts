import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TasksService } from '../../../../core/tasks/tasks.service';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskStatus, User } from '@todo-workspace/shared-interfaces';
import { UsersService } from '../../../../core/users/users.service';

@Component({
  selector: 'app-tasks-details',
  templateUrl: './task-details.html',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsPage {
  private readonly tasksService = inject(TasksService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);

  readonly id = input.required<string>();
  readonly isFullWidth = signal(false);
  readonly isDropdownOpen = signal(false);

  readonly isNew = computed(() => !this.id());

  readonly taskResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params: { id } }) =>
      !id ? of(null) : this.tasksService.getTask(Number(id)),
  });

  readonly userSearchInput = new FormControl('');

  private readonly debouncedSearchTerm = toSignal(
    this.userSearchInput.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    )
  );

  readonly usersResource = rxResource({
    params: () => ({ search: this.debouncedSearchTerm() }),
    stream: ({ params: { search } }) => {
     if (!search || search.length < 3) return of([]);

     return this.usersService.getUsers(search);
    }
  });

  readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['To Do' as TaskStatus, Validators.required],
    userId: [null as number | null, Validators.required],
  });

  readonly statuses: TaskStatus[] = ['To Do', 'Doing', 'Done'];

  constructor() {
    this.initTaskEffect();
  }

  toggleWidth() {
    this.isFullWidth.update(state => !state);
  }

  selectUser(user: User) {
    this.form.patchValue({ userId: user.id });
    this.userSearchInput.setValue(user.name, { emitEvent: false });
    this.isDropdownOpen.set(false);
  }

  onInputFocus(): void {
    if ((this.userSearchInput.value?.length ?? 0) >= 3) {
      this.isDropdownOpen.set(true);
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.id();
    const rawValue = this.form.getRawValue();
    const taskData = {
      title: rawValue.title!,
      description: rawValue.description!,
      userId: rawValue.userId!,
    }

    if (this.isNew()) {
      this.tasksService.createTask(taskData);
    } else {
      this.tasksService.updateTask(Number(id), {
        ...taskData,
        status: rawValue.status as TaskStatus,
      });
    }

    await this.router.navigate(['/tasks']);
  }

  private initTaskEffect() {
    effect(() => {
      const task = this.taskResource.value();

      if (task) {
        this.form.patchValue({
          title: task.title,
          description: task.description,
          status: task.status,
          userId: task.userId,
        });

        if (task.user?.name) {
          this.form.patchValue({ userId: task.userId });
          this.userSearchInput.setValue(task.user.name, { emitEvent: false });
        }
      }
    });
  }
}
