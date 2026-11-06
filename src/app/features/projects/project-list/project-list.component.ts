import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { StatusColorPipe } from '@shared/pipes/status-color.pipe';
import { ProjectService } from '@core/services/project.service';
import { Project, ProjectStatus } from '@shared/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusColorPipe
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  projects = signal<Project[]>([]);
  loading = signal(true);
  selectedStatus = signal<string>('ALL');

  statuses = ['ALL', ...Object.values(ProjectStatus)];

  filteredProjects = computed(() => {
    const status = this.selectedStatus();
    if (status === 'ALL') {
      return this.projects();
    }
    return this.projects().filter(p => p.status === status);
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  navigateToProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  navigateToBoard(id: string): void {
    this.router.navigate(['/projects', id, 'board']);
  }

  createProject(): void {
    this.router.navigate(['/projects/new']);
  }
}
