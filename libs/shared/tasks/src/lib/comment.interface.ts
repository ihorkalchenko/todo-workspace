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

export interface PaginatedComments {
  readonly data: Comment[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}
