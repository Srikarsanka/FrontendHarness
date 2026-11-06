import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { StatusColorPipe } from '@shared/pipes/status-color.pipe';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { TaskService } from '@core/services/task.service';
import { ProjectService } from '@core/services/project.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/auth/auth.service';
import { Task, TaskStatus, IssueType, TaskPriority } from '@shared/models/task.model';
import { Project } from '@shared/models/project.model';
import { User } from '@shared/models/user.model';
import { TaskFormComponent } from '../task-form/task-form.component';

interface BoardColumn {
  id: TaskStatus;
  title: string;
  tasks: () => Task[];
  storyPoints: () => number;
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatChipsModule,
    LoadingSpinnerComponent,
    StatusColorPipe,
    RelativeTimePipe
  ],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskBoardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  readonly authService = inject(AuthService);

  tasks = signal<Task[]>([]);
  project = signal<Project | null>(null);
  loading = signal(true);
  projectId = '';

  // Quick Filters
  searchQuery = signal<string>('');
  onlyMyIssues = signal<boolean>(false);
  selectedIssueType = signal<string>('ALL');
  selectedAssigneeId = signal<string | null>(null);

  // Filtered Task Collection
  filteredTasks = computed(() => {
    let list = this.tasks();
    const query = this.searchQuery().toLowerCase().trim();
    const myIssues = this.onlyMyIssues();
    const currentUserId = this.authService.currentUser()?.id;
    const type = this.selectedIssueType();
    const assignee = this.selectedAssigneeId();

    if (query) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.key && t.key.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    if (myIssues && currentUserId) {
      list = list.filter(t => t.assigneeId === currentUserId);
    }

    if (type !== 'ALL') {
      list = list.filter(t => (t.issueType || 'STORY') === type);
    }

    if (assignee) {
      list = list.filter(t => t.assigneeId === assignee);
    }

    return list;
  });

  // Assignees present on this board for quick avatar filters
  boardAssignees = computed(() => {
    const map = new Map<string, User>();
    for (const t of this.tasks()) {
      if (t.assignee && t.assignee.id) {
        map.set(t.assignee.id, t.assignee);
      }
    }
    return Array.from(map.values());
  });

  // Column tasks & story points
  todoTasks = computed(() => this.filteredTasks().filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.BACKLOG));
  inProgressTasks = computed(() => this.filteredTasks().filter(t => t.status === TaskStatus.IN_PROGRESS));
  inReviewTasks = computed(() => this.filteredTasks().filter(t => t.status === TaskStatus.IN_REVIEW));
  doneTasks = computed(() => this.filteredTasks().filter(t => t.status === TaskStatus.DONE));

  columns: BoardColumn[] = [
    {
      id: TaskStatus.TODO,
      title: 'TO DO',
      tasks: this.todoTasks,
      storyPoints: computed(() => this.todoTasks().reduce((sum, t) => sum + (t.storyPoints || 0), 0))
    },
    {
      id: TaskStatus.IN_PROGRESS,
      title: 'IN PROGRESS',
      tasks: this.inProgressTasks,
      storyPoints: computed(() => this.inProgressTasks().reduce((sum, t) => sum + (t.storyPoints || 0), 0))
    },
    {
      id: TaskStatus.IN_REVIEW,
      title: 'CODE REVIEW',
      tasks: this.inReviewTasks,
      storyPoints: computed(() => this.inReviewTasks().reduce((sum, t) => sum + (t.storyPoints || 0), 0))
    },
    {
      id: TaskStatus.DONE,
      title: 'DONE',
      tasks: this.doneTasks,
      storyPoints: computed(() => this.doneTasks().reduce((sum, t) => sum + (t.storyPoints || 0), 0))
    }
  ];

  columnIds = this.columns.map(c => c.id);

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.loadProject();
      this.loadTasks();
    }
  }

  loadProject(): void {
    this.projectService.getProject(this.projectId).subscribe({
      next: (proj) => this.project.set(proj),
      error: () => {}
    });
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load tasks for this board');
      }
    });
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    const newStatus = event.container.id as TaskStatus;

    // Optimistic UI update
    this.tasks.update(tasks =>
      tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
    );

    this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
      next: () => {
        this.notification.success(`Moved ${task.key || 'task'} to ${newStatus.replace('_', ' ')}`);
      },
      error: () => {
        this.tasks.update(tasks =>
          tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t)
        );
        this.notification.error('Failed to update task status.');
      }
    });
  }

  openCreateTask(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '650px',
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  navigateToTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  toggleOnlyMyIssues(): void {
    this.onlyMyIssues.update(val => !val);
  }

  filterByAssignee(assigneeId: string): void {
    if (this.selectedAssigneeId() === assigneeId) {
      this.selectedAssigneeId.set(null);
    } else {
      this.selectedAssigneeId.set(assigneeId);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.onlyMyIssues.set(false);
    this.selectedIssueType.set('ALL');
    this.selectedAssigneeId.set(null);
  }

  hasActiveFilters = computed(() => {
    return !!this.searchQuery() || this.onlyMyIssues() || this.selectedIssueType() !== 'ALL' || !!this.selectedAssigneeId();
  });

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

  isOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
  }
}
