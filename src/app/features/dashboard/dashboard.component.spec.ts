import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { DashboardComponent } from './dashboard.component';
import { ProjectService } from '@core/services/project.service';
import { TaskService } from '@core/services/task.service';
import { AuthService } from '@core/auth/auth.service';
import { Task, TaskStatus, TaskPriority, IssueType } from '@shared/models/task.model';
import { Project, ProjectStatus } from '@shared/models/project.model';

describe('DashboardComponent - Unit Tests', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let projectServiceSpy: jasmine.SpyObj<ProjectService>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let mockAuthService: any;

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      key: 'DNB-1',
      title: 'Fix Authentication Token Leak',
      description: 'Fix the token leak issue',
      issueType: 'BUG' as IssueType,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      storyPoints: 5,
      projectId: 'proj-1',
      projectName: 'Task Manager Core',
      reporterId: 'user-1',
      assigneeId: 'user-1',
      labels: [],
      dueDate: new Date(Date.now() - 86400000).toISOString(), // Overdue
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      key: 'DNB-2',
      title: 'Write Angular Unit Tests',
      description: 'Write comprehensive unit tests',
      issueType: 'TASK' as IssueType,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      storyPoints: 3,
      projectId: 'proj-1',
      projectName: 'Task Manager Core',
      reporterId: 'user-1',
      assigneeId: 'user-1',
      labels: [],
      dueDate: '',
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      key: 'DNB',
      name: 'Task Manager Core',
      description: 'Core project management application',
      status: ProjectStatus.ACTIVE,
      ownerId: 'user-1',
      memberIds: [],
      memberCount: 0,
      startDate: '',
      endDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getProjects']);
    taskServiceSpy = jasmine.createSpyObj('TaskService', ['getMyTasks']);

    mockAuthService = {
      currentUser: signal({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@dnb.com',
        role: 'DEVELOPER',
        createdAt: ''
      }),
      isAuthenticated: signal(true),
      getToken: () => null
    };

    projectServiceSpy.getProjects.and.returnValue(of(mockProjects));
    taskServiceSpy.getMyTasks.and.returnValue(of(mockTasks));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('1. Verify component renders successfully', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    const titleElement = fixture.debugElement.query(By.css('.workspace-header h1'));
    expect(titleElement.nativeElement.textContent).toContain('Your Work');
  });

  it('2. Verify task list displays tasks', () => {
    fixture.detectChanges();
    expect(component.myTasks().length).toBe(2);
    expect(component.myTasks()[0].title).toBe('Fix Authentication Token Leak');
    expect(component.myTasks()[1].title).toBe('Write Angular Unit Tests');
  });

  it('3. Verify empty state when no tasks exist', () => {
    taskServiceSpy.getMyTasks.and.returnValue(of([]));
    projectServiceSpy.getProjects.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.myTasks().length).toBe(0);
    expect(component.projects().length).toBe(0);
    expect(component.loading()).toBeFalse();
  });

  it('4. Verify loading state indicator', () => {
    component.loading.set(true);
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('app-loading-spinner'));
    expect(spinner).toBeTruthy();
  });

  it('5. Verify error display and graceful handling on API failure', () => {
    taskServiceSpy.getMyTasks.and.returnValue(throwError(() => new Error('Service Unavailable')));
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(component.myTasks()).toEqual([]);
  });

  it('6. Verify task count calculation', () => {
    fixture.detectChanges();
    expect(component.myTasks().length).toBe(2);
    expect(component.completedTasks().length).toBe(1);
    expect(component.overdueTasks().length).toBe(1);
    expect(component.projects().length).toBe(1);
  });
});
