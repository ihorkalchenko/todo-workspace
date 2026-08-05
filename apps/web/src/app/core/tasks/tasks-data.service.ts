import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task, TaskStatus } from '@todo-workspace/tasks';

@Injectable({
  providedIn: 'root',
})
export class TasksDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  getTasks() {
    return this.http.get<Task[]>(this.apiUrl);
  }

  getTask(id: number) {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(data: Pick<Task, 'title' | 'description'>) {
    return this.http.post<Task>(this.apiUrl, data);
  }

  updateTask(id: number, data: Partial<Task>) {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, data);
  }

  deleteTask(id: number) {
    return this.http.delete<Task>(`${this.apiUrl}/${id}`);
  }

  moveTask(id: number, status: TaskStatus, order: number) {
    return this.http.patch(`${this.apiUrl}/${id}/move`, { status, order });
  }
}
