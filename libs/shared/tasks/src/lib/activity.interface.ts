export interface Activity {
  readonly id: number;
  readonly taskId: number;
  readonly userId: number;
  readonly action: string;
  readonly details: string | null;
  readonly createdAt: string;
  readonly user?: {
    readonly name: string;
  }
}
