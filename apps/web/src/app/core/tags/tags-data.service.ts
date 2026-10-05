import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateTagDto, Tag } from '@todo-workspace/tasks';

@Injectable({
  providedIn: 'root',
})
export class TagsDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tags';

  getTags() {
    return this.http.get<Tag[]>(this.apiUrl);
  }

  createTag(dto: CreateTagDto) {
    return this.http.post<Tag>(this.apiUrl, dto);
  }

  deleteTag(id: number) {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }
}
