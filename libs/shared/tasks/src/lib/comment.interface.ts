export interface Comment {
  readonly id: number;
  readonly taskId: number;
  readonly userId: number;
  readonly parentId?: number | null;
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string | null;
  readonly user?: {
    readonly name: string;
  };
  readonly replies?: Comment[];
}

export interface PaginatedComments {
  readonly data: Comment[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}
