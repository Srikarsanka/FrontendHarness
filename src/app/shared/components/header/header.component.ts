import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/auth/auth.service';
import { ProjectService } from '@core/services/project.service';
import { Project } from '@shared/models/project.model';
import { TaskFormComponent } from '@features/tasks/task-form/task-form.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  recentProjects = signal<Project[]>([]);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.projectService.getProjects().subscribe({
        next: (projects) => this.recentProjects.set(projects.slice(0, 5)),
        error: () => {}
      });
    }
  }

  openCreateIssue(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '650px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((createdTask) => {
      if (createdTask) {
        // If on board or project page, optionally navigate
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
