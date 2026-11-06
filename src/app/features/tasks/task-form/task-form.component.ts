import { Component, ChangeDetectionStrategy, inject, signal, OnInit, Optional, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { ProjectService } from '@core/services/project.service';
import { NotificationService } from '@core/services/notification.service';
import { TaskStatus, TaskPriority, IssueType } from '@shared/models/task.model';
import { User } from '@shared/models/user.model';
import { Project } from '@shared/models/project.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);
  private readonly projectService = inject(ProjectService);
  private readonly notification = inject(NotificationService);

  constructor(
    @Optional() public dialogRef?: MatDialogRef<TaskFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: { projectId?: string; taskId?: string }
  ) {}

  loading = signal(false);
  isEditMode = signal(false);
  users = signal<User[]>([]);
  projects = signal<Project[]>([]);
  labels = signal<string[]>([]);
  taskId = '';

  issueTypes: { type: IssueType; label: string; icon: string; css: string }[] = [
    { type: 'STORY', label: 'Story', icon: 'bookmark', css: 'story' },
    { type: 'TASK', label: 'Task', icon: 'check_box', css: 'task' },
    { type: 'BUG', label: 'Bug', icon: 'bug_report', css: 'bug' },
    { type: 'EPIC', label: 'Epic', icon: 'bolt', css: 'epic' }
  ];

  storyPointsOptions = [1, 2, 3, 5, 8, 13, 21];
  statuses = Object.values(TaskStatus);
  priorities = Object.values(TaskPriority);
  separatorKeyCodes = [ENTER, COMMA] as const;

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    issueType: ['STORY', Validators.required],
    storyPoints: [3],
    status: [TaskStatus.TODO, Validators.required],
    priority: [TaskPriority.MEDIUM, Validators.required],
    projectId: ['', Validators.required],
    assigneeId: [''],
    dueDate: [null]
  });

  ngOnInit(): void {
    this.userService.getUsers().subscribe(users => this.users.set(users));
    this.projectService.getProjects().subscribe(projects => {
      this.projects.set(projects);
      if (!this.taskForm.get('projectId')?.value && projects.length > 0) {
        const initialProjId = this.dialogData?.projectId || projects[0].id;
        this.taskForm.patchValue({ projectId: initialProjId });
      }
    });

    const routeId = this.route.snapshot?.paramMap?.get('id');
    const editId = this.dialogData?.taskId || routeId;
    if (editId) {
      this.isEditMode.set(true);
      this.taskId = editId;
      this.loadTask(editId);
    }

    if (this.dialogData?.projectId) {
      this.taskForm.patchValue({ projectId: this.dialogData.projectId });
    }
  }

  private loadTask(id: string): void {
    this.loading.set(true);
    this.taskService.getTask(id).subscribe({
      next: (task) => {
        this.taskForm.patchValue({
          title: task.title,
          description: task.description,
          issueType: task.issueType || 'STORY',
          storyPoints: task.storyPoints || 3,
          status: task.status,
          priority: task.priority,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? new Date(task.dueDate) : null
        });
        this.labels.set(task.labels || []);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load task.');
        this.loading.set(false);
      }
    });
  }

  addLabel(event: { value: string; chipInput?: { clear: () => void } }): void {
    const value = (event.value || '').trim();
    if (value && !this.labels().includes(value)) {
      this.labels.update(l => [...l, value]);
    }
    event.chipInput?.clear();
  }

  removeLabel(label: string): void {
    this.labels.update(l => l.filter(item => item !== label));
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formData = { ...this.taskForm.value, labels: this.labels() };

    if (formData.dueDate) {
      formData.dueDate = new Date(formData.dueDate).toISOString();
    }

    const request$ = this.isEditMode()
      ? this.taskService.updateTask(this.taskId, formData)
      : this.taskService.createTask(formData);

    request$.subscribe({
      next: (task) => {
        this.notification.success(this.isEditMode() ? 'Issue updated!' : `Issue ${task.key || ''} created!`);
        if (this.dialogRef) {
          this.dialogRef.close(task);
        } else {
          this.router.navigate(['/tasks', task.id]);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to save issue.');
      }
    });
  }

  cancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else if (this.isEditMode()) {
      this.router.navigate(['/tasks', this.taskId]);
    } else {
      const projectId = this.taskForm.get('projectId')?.value;
      if (projectId) {
        this.router.navigate(['/projects', projectId, 'board']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }
}
