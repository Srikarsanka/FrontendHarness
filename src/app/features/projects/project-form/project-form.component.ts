import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '@core/services/project.service';
import { NotificationService } from '@core/services/notification.service';
import { ProjectStatus } from '@shared/models/project.model';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly notification = inject(NotificationService);

  loading = signal(false);
  isEditMode = signal(false);
  projectId = '';

  statuses = Object.values(ProjectStatus);

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    key: ['', [Validators.maxLength(10)]],
    description: [''],
    status: [ProjectStatus.PLANNING, Validators.required],
    startDate: [null],
    endDate: [null]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.projectId = id;
      this.loadProject(id);
    }
  }

  private loadProject(id: string): void {
    this.loading.set(true);
    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.projectForm.patchValue({
          name: project.name,
          key: project.key || '',
          description: project.description,
          status: project.status,
          startDate: project.startDate ? new Date(project.startDate) : null,
          endDate: project.endDate ? new Date(project.endDate) : null
        });
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load project.');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formData = this.projectForm.value;

    if (formData.startDate) {
      formData.startDate = new Date(formData.startDate).toISOString();
    }
    if (formData.endDate) {
      formData.endDate = new Date(formData.endDate).toISOString();
    }

    const request$ = this.isEditMode()
      ? this.projectService.updateProject(this.projectId, formData)
      : this.projectService.createProject(formData);

    request$.subscribe({
      next: (project) => {
        this.notification.success(this.isEditMode() ? 'Project updated!' : 'Project created!');
        this.router.navigate(['/projects', project.id]);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to save project.');
      }
    });
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/projects', this.projectId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
