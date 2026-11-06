import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { StatusColorPipe } from '@shared/pipes/status-color.pipe';
import { TaskService } from '@core/services/task.service';
import { CommentService } from '@core/services/comment.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/auth/auth.service';
import { Task, TaskStatus, IssueType, TaskPriority } from '@shared/models/task.model';
import { Comment } from '@shared/models/comment.model';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
    RelativeTimePipe,
    StatusColorPipe
  ],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly commentService = inject(CommentService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  readonly authService = inject(AuthService);

  task = signal<Task | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  newCommentText = '';
  submittingComment = signal(false);

  taskStatuses = Object.values(TaskStatus);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTask(id);
    }
  }

  loadTask(id: string): void {
    this.taskService.getTask(id).subscribe({
      next: (task) => {
        this.task.set(task);
        this.loadComments(id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load task.');
      }
    });
  }

  private loadComments(taskId: string): void {
    this.commentService.getComments(taskId).subscribe({
      next: (comments) => this.comments.set(comments),
      error: () => {}
    });
  }

  editTask(): void {
    const t = this.task();
    if (t) {
      const dialogRef = this.dialog.open(TaskFormComponent, {
        width: '650px',
        data: { taskId: t.id, projectId: t.projectId }
      });

      dialogRef.afterClosed().subscribe((updated) => {
        if (updated) {
          this.loadTask(t.id);
        }
      });
    }
  }

  deleteTask(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Issue',
        message: 'Are you sure you want to delete this issue? This will also remove all comments and attachments.',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const t = this.task();
        if (t) {
          this.taskService.deleteTask(t.id).subscribe({
            next: () => {
              this.notification.success('Issue deleted.');
              this.router.navigate(['/projects', t.projectId, 'board']);
            },
            error: () => this.notification.error('Failed to delete issue.')
          });
        }
      }
    });
  }

  updateStatus(status: TaskStatus): void {
    const t = this.task();
    if (t) {
      this.taskService.updateTaskStatus(t.id, status).subscribe({
        next: (updatedTask) => {
          this.task.set(updatedTask);
          this.notification.success(`Status updated to ${status.replace('_', ' ')}`);
        },
        error: () => this.notification.error('Failed to update status.')
      });
    }
  }

  assignToMe(): void {
    const currentUser = this.authService.currentUser();
    const t = this.task();
    if (currentUser && t) {
      this.taskService.updateTask(t.id, { assigneeId: currentUser.id }).subscribe({
        next: (updated) => {
          this.task.set(updated);
          this.notification.success('Assigned to you');
        },
        error: () => this.notification.error('Failed to update assignee')
      });
    }
  }

  addComment(): void {
    const t = this.task();
    if (!t || !this.newCommentText.trim()) return;

    this.submittingComment.set(true);
    this.commentService.addComment(t.id, this.newCommentText.trim()).subscribe({
      next: (comment) => {
        this.comments.update(c => [comment, ...c]);
        this.newCommentText = '';
        this.submittingComment.set(false);
        this.notification.success('Comment added');
      },
      error: () => {
        this.submittingComment.set(false);
        this.notification.error('Failed to add comment.');
      }
    });
  }

  deleteComment(commentId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment?',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.commentService.deleteComment(commentId).subscribe({
          next: () => {
            this.comments.update(c => c.filter(comment => comment.id !== commentId));
            this.notification.success('Comment deleted.');
          },
          error: () => this.notification.error('Failed to delete comment.')
        });
      }
    });
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

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.CRITICAL: return 'keyboard_double_arrow_up';
      case TaskPriority.HIGH: return 'keyboard_arrow_up';
      case TaskPriority.LOW: return 'keyboard_arrow_down';
      case TaskPriority.MEDIUM:
      default:
        return 'drag_handle';
    }
  }

  goBack(): void {
    const t = this.task();
    if (t) {
      this.router.navigate(['/projects', t.projectId, 'board']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
