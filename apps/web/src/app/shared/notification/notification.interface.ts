export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  readonly id: string;
  readonly type: NotificationType;
  readonly message: string;
}
