import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { User } from '@shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }
}
