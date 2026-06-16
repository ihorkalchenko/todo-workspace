import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  signal
} from '@angular/core';
import { Notification, NotificationType} from './notification.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  private containerRef?: ComponentRef<any>;

  readonly notifications = signal<Notification[]>([]);

  success(message: string): void {
    this.addNotification('success', message);
  }

  error(message: string): void {
    this.addNotification('error', message);
  }

  info(message: string): void {
    this.addNotification('info', message);
  }

  remove(id: string) {
    this.notifications.update(list => list.filter(n => n.id !== id));

    if (this.notifications().length === 0) {
      this.destroyContainer();
    }
  }

  private async addNotification(type: NotificationType, message: string) {
    await this.ensureContainerExists();

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = { id, type, message };

    this.notifications.update((list) => [...list, newNotification]);
    setTimeout(() => this.remove(id), 4000);
  }

  private async ensureContainerExists() {
    if (this.containerRef) return;

    const { NotificationContainer } = await import('./notification');

    this.containerRef = createComponent(NotificationContainer, { environmentInjector: this.injector });
    this.appRef.attachView(this.containerRef.hostView);

    const elem = this.containerRef.location.nativeElement as HTMLElement;
    document.body.appendChild(elem);
  }

  private destroyContainer() {
    if (this.containerRef) {
      this.appRef.detachView(this.containerRef.hostView);
      this.containerRef.destroy();
      this.containerRef = undefined;
    }
  }
}
