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

export interface PaginatedActivities {
  readonly data: Activity[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}
