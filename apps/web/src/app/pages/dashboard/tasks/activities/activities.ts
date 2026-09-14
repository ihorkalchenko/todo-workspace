import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Task } from '@todo-workspace/tasks';
import { ActivitiesService } from '../../../../core/activities/activities.service';

@Component({
  selector: 'app-activities',
  imports: [DatePipe],
  templateUrl: './activities.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ActivitiesComponent {
  private readonly activitiesService = inject(ActivitiesService);

  readonly task = input.required<Task | null | undefined>();
  readonly activities = this.activitiesService.activities;
  readonly isLoading = this.activitiesService.isLoading;
  readonly hasMore = this.activitiesService.hasMore;
  readonly page = this.activitiesService.page;

  constructor() {
    effect(() => {
      const task = this.task();

      if (task) {
        this.activitiesService.loadActivities(task.id, 1);
      } else {
        this.activitiesService.clearActivities();
      }
    });
  }

  loadMore() {
    const task = this.task();
    const page = this.page();

    if (task && this.hasMore() && !this.isLoading()) {
      this.activitiesService.loadActivities(task.id, page + 1);
    }
  }
}
