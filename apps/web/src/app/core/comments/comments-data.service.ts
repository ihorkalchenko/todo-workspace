import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Comment, PaginatedComments } from '@todo-workspace/tasks';

@Injectable({
  providedIn: 'root',
})
export class CommentsDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  getComments(taskId: number, page = 1, limit = 5) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedComments>(`${this.apiUrl}/${taskId}/comments`, { params });
  }

  createComment(taskId: number, content: string) {
    return this.http.post<Comment>(`${this.apiUrl}/${taskId}/comments`, { content });
  }

  deleteComment(taskId: number, commentId: number) {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${taskId}/comments/${commentId}`);
  }
}
