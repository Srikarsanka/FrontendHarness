import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { StatusColorPipe } from '@shared/pipes/status-color.pipe';
import { ProjectService } from '@core/services/project.service';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/auth/auth.service';
import { Project } from '@shared/models/project.model';
import { Task } from '@shared/models/task.model';
import { User } from '@shared/models/user.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDividerModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RelativeTimePipe,
    StatusColorPipe
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  readonly authService = inject(AuthService);

  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  members = signal<User[]>([]);
  allUsers = signal<User[]>([]);
  loading = signal(true);

  isOwner = computed(() => {
    const p = this.project();
    const u = this.authService.currentUser();
    return !!p && !!u && p.ownerId === u.id;
  });

  availableUsers = computed(() => {
    const memberIds = this.project()?.memberIds || [];
    return this.allUsers().filter(u => !memberIds.includes(u.id));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProjectData(id);
    }
  }

  private loadProjectData(id: string): void {
    this.loading.set(true);
    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.project.set(project);
        forkJoin({
          tasks: this.taskService.getTasksByProject(id),
          users: this.userService.getUsers()
        }).subscribe({
          next: ({ tasks, users }) => {
            this.tasks.set(tasks);
            this.allUsers.set(users);
            const memberIds = project.memberIds || [];
            this.members.set(users.filter(u => memberIds.includes(u.id)));
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load project.');
      }
    });
  }

  editProject(): void {
    const p = this.project();
    if (p) {
      this.router.navigate(['/projects', p.id, 'edit']);
    }
  }

  deleteProject(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: 'Are you sure you want to delete this project? This action cannot be undone.',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const p = this.project();
        if (p) {
          this.projectService.deleteProject(p.id).subscribe({
            next: () => {
              this.notification.success('Project deleted successfully.');
              this.router.navigate(['/projects']);
            },
            error: () => this.notification.error('Failed to delete project.')
          });
        }
      }
    });
  }

  addMember(userId: string): void {
    if (!userId) return;
    const p = this.project();
    if (p) {
      this.projectService.addMember(p.id, userId).subscribe({
        next: (updatedProject) => {
          this.project.set(updatedProject);
          const user = this.allUsers().find(u => u.id === userId);
          if (user) {
            this.members.update(m => [...m, user]);
          }
          this.notification.success('Member added successfully.');
        },
        error: () => this.notification.error('Failed to add member.')
      });
    }
  }

  removeMember(userId: string): void {
    const p = this.project();
    if (p) {
      this.projectService.removeMember(p.id, userId).subscribe({
        next: (updatedProject) => {
          this.project.set(updatedProject);
          this.members.update(m => m.filter(member => member.id !== userId));
          this.notification.success('Member removed.');
        },
        error: () => this.notification.error('Failed to remove member.')
      });
    }
  }

  navigateToBoard(): void {
    const p = this.project();
    if (p) {
      this.router.navigate(['/projects', p.id, 'board']);
    }
  }

  navigateToTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  createTask(): void {
    const p = this.project();
    if (p) {
      this.router.navigate(['/projects', p.id, 'board']);
    }
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}
