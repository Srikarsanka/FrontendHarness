import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { StatusColorPipe } from '@shared/pipes/status-color.pipe';
import { ProjectService } from '@core/services/project.service';
import { TaskService } from '@core/services/task.service';
import { AuthService } from '@core/auth/auth.service';
import { Project } from '@shared/models/project.model';
import { Task, TaskStatus, IssueType } from '@shared/models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTabsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RelativeTimePipe,
    StatusColorPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  projects = signal<Project[]>([]);
  myTasks = signal<Task[]>([]);
  loading = signal(true);

  overdueTasks = computed(() => {
    const now = new Date();
    return this.myTasks().filter(t =>
      t.dueDate &&
      new Date(t.dueDate) < now &&
      t.status !== TaskStatus.DONE &&
      t.status !== TaskStatus.CANCELLED
    );
  });

  completedTasks = computed(() =>
    this.myTasks().filter(t => t.status === TaskStatus.DONE)
  );

  recentTasks = computed(() =>
    [...this.myTasks()]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 8)
  );

  ngOnInit(): void {
    forkJoin({
      projects: this.projectService.getProjects(),
      tasks: this.taskService.getMyTasks()
    }).subscribe({
      next: ({ projects, tasks }) => {
        this.projects.set(projects);
        this.myTasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  navigateToProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  navigateToBoard(id: string): void {
    this.router.navigate(['/projects', id, 'board']);
  }

  navigateToTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  navigateToNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  getIssueTypeIcon(type?: IssueType): string {
    switch (type) {
      case 'BUG': return 'bug_report';
      case 'TASK': return 'check_box';
      case 'EPIC': return 'bolt';
      case 'STORY':
      default:
        return 'bookmark';
    }
  }
}
