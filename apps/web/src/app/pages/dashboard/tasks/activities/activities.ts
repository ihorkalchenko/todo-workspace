import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { ActivitiesService } from '../../../../core/activities/activities.service';
import { Task } from '@todo-workspace/tasks';
import { DatePipe } from '@angular/common';

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
  readonly loading = this.activitiesService.isLoading;
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

    if (task && this.hasMore() && !this.loading()) {
      const nextPage = page + 1;
      this.activitiesService.loadActivities(task.id, nextPage);
    }
  }
}
