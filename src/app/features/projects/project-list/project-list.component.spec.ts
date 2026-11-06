import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectListComponent } from './project-list.component';
import { ProjectService } from '@core/services/project.service';
import { of } from 'rxjs';
import { ProjectStatus } from '@shared/models/project.model';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  const mockProjects = [
    {
      id: '1', name: 'Project A', description: 'Desc A', status: ProjectStatus.ACTIVE,
      ownerId: 'u1', memberIds: ['u1'], memberCount: 1,
      owner: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN', createdAt: '' },
      startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: '2', name: 'Project B', description: 'Desc B', status: ProjectStatus.PLANNING,
      ownerId: 'u1', memberIds: ['u1'], memberCount: 1,
      owner: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN', createdAt: '' },
      startDate: '2024-02-01', endDate: '2024-11-30', createdAt: '2024-02-01', updatedAt: '2024-02-01'
    }
  ];

  beforeEach(async () => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getProjects']);
    projectServiceSpy.getProjects.and.returnValue(of(mockProjects));

    await TestBed.configureTestingModule({
      imports: [ProjectListComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects', () => {
    expect(component.projects().length).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should filter by status', () => {
    component.onStatusFilter(ProjectStatus.ACTIVE);
    expect(component.filteredProjects().length).toBe(1);
    expect(component.filteredProjects()[0].name).toBe('Project A');
  });

  it('should show all projects when filter is ALL', () => {
    component.onStatusFilter('ALL');
    expect(component.filteredProjects().length).toBe(2);
  });
});
