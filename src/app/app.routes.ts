import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./features/projects/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/projects/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: ':id/board',
        loadComponent: () => import('./features/tasks/task-board/task-board.component').then(m => m.TaskBoardComponent)
      }
    ]
  },
  {
    path: 'tasks/:id',
    loadComponent: () => import('./features/tasks/task-detail/task-detail.component').then(m => m.TaskDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
