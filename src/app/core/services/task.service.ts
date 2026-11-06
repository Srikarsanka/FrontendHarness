import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Task, TaskStatus } from '@shared/models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/project/${projectId}`);
  }

  getMyTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/my-tasks`);
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task);
  }

  updateTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}/status?status=${status}`, {});
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }
}
