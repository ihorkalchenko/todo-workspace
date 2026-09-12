import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedActivities } from '@todo-workspace/tasks';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  getActivities(taskId: number, page = 1, limit = 5) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedActivities>(`${this.apiUrl}/${taskId}/activities`, { params });
  }
}
