import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from '@todo-workspace/tasks';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  private _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  constructor() {
    this.loadTasks();
  }

  getTask(id: number) {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(data: Pick<Task, 'title' | 'description'>) {
    this.http.post<Task>(this.apiUrl, data).subscribe(newTask => {
      this._tasks.update(list => [...list, newTask]);
    });
  }

  updateTask(id: number, data: Partial<Task>) {
    this.http.patch<Task>(`${this.apiUrl}/${id}`, data).subscribe(updatedTask => {
      this._tasks.update(list => list.map(task => task.id === id ? updatedTask : task));
    })
  }

  deleteTask(id: number) {
    this.http.delete<Task>(`${this.apiUrl}/${id}`).subscribe(() => {
      this._tasks.update(list => list.filter(task => task.id !== id));
    })
  }

  private loadTasks(): void {
    this.http.get<Task[]>(this.apiUrl).subscribe(tasks => this._tasks.set(tasks));
  }
}
