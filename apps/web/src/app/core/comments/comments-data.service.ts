import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Comment } from '@todo-workspace/tasks';

@Injectable({
  providedIn: 'root',
})
export class CommentsDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  getComments(taskId: number) {
    return this.http.get<Comment[]>(`${this.apiUrl}/${taskId}/comments`);
  }

  createComment(taskId: number, content: string) {
    return this.http.post<Comment>(`${this.apiUrl}/${taskId}/comments`, { content });
  }

  deleteComment(taskId: number, commentId: number) {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${taskId}/comments/${commentId}`);
  }
}
