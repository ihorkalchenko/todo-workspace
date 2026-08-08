export interface Comment {
  readonly id: number;
  readonly taskId: number;
  readonly userId: number;
  readonly content: string;
  readonly createdAt: string;
  readonly user?: {
    readonly name: string;
  };
}
