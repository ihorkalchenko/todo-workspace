import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';

import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-container',
  imports: [NgClass],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationContainer {
  private readonly notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;

  remove(id: string) {
    this.notificationService.remove(id);
  }
}
