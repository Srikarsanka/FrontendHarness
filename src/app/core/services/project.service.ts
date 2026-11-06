import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Project } from '@shared/models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  addMember(projectId: string, userId: string): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects/${projectId}/members`, { userId });
  }

  removeMember(projectId: string, userId: string): Observable<Project> {
    return this.http.delete<Project>(`${this.apiUrl}/projects/${projectId}/members/${userId}`);
  }
}
