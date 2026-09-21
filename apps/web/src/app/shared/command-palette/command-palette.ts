import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { TasksService } from '../../core/tasks/tasks.service';
import { CommandPaletteService } from './command-palette.service';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge';

export interface CommandItem {
  id: string;
  type: 'action' | 'task';
  title: string;
  subtitle?: string;
  badge?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  imports: [PriorityBadgeComponent],
  templateUrl: './command-palette.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'handleKeyboardEvent($event)' },
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);
  private readonly tasksService = inject(TasksService);
  private readonly commandPaletteService = inject(CommandPaletteService);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly query = signal<string>('');
  readonly selectedIndex = signal<number>(0);

  readonly isOpen = this.commandPaletteService.isOpen;
  readonly shortcutLabel = this.commandPaletteService.shortcutLabel;

  readonly quickActions: CommandItem[] = [
    {
      id: 'create-task',
      type: 'action',
      title: 'Create New Task',
      subtitle: 'Open task creation form',
      action: () => this.navigate('/tasks/new'),
    },
    {
      id: 'view-tasks',
      type: 'action',
      title: 'Go to Tasks Board',
      subtitle: 'View all tasks',
      action: () => this.navigate('/tasks'),
    },
    {
      id: 'view-settings',
      type: 'action',
      title: 'Go to Settings',
      subtitle: 'Manage user settings',
      action: () => this.navigate('/settings'),
    },
  ];

  readonly items = computed<CommandItem[]>(() => {
    const q = this.query().toLowerCase().trim();
    const tasks = this.tasksService.tasks();

    const matchingActions = this.quickActions.filter((a) => {
      return (
        a.title.toLowerCase().includes(q) ||
        a.subtitle?.toLowerCase().includes(q)
      );
    });

    const matchingTasks: CommandItem[] = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      )
      .slice(0, 10)
      .map((t) => ({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: t.status,
        badge: t.priority,
        action: () => this.navigate(`/tasks/${t.id}`),
      }));

    return [...matchingActions, ...matchingTasks];
  });

  constructor() {
    effect(() => {
      const input = this.searchInput();
      if (input) {
        input.nativeElement.focus();
      }
    });
  }

  closePalette () {
    this.commandPaletteService.close();
  }

  handleKeyboardEvent(e: KeyboardEvent) {
    const handledKeys = ['Escape', 'ArrowDown', 'ArrowUp', 'Enter'];
    if (!handledKeys.includes(e.key)) return;

    e.preventDefault();

    switch (e.key) {
      case 'Escape': {
        this.commandPaletteService.close();
        break;
      }
      case 'ArrowDown': {
        const nextIndex = (this.selectedIndex() + 1) % (this.items().length || 1);
        this.selectedIndex.set(nextIndex);
        break;
      }
      case 'ArrowUp': {
        const total = this.items().length || 1;
        const prevIndex = (this.selectedIndex() - 1 + total) % total;
        this.selectedIndex.set(prevIndex);
        break;
      }
      case 'Enter': {
        const selected = this.items()[this.selectedIndex()];
        if (selected) selected.action();
        break;
      }
    }
  }

  onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.query.set(value);
    this.selectedIndex.set(0);
  }

  private navigate(path: string) {
    this.commandPaletteService.close();
    this.router.navigateByUrl(path);
  }
}
