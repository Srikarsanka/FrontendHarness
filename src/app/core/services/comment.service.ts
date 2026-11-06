import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Comment } from '@shared/models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getComments(taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  addComment(taskId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/tasks/${taskId}/comments`, { content });
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${id}`);
  }
}
