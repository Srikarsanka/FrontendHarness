 import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { AuthService } from '@core/auth/auth.service';
import { TaskService } from '@core/services/task.service';
import { ProjectService } from '@core/services/project.service';
import { UserService } from '@core/services/user.service';
import { NotificationService } from '@core/services/notification.service';
import { TaskFormComponent } from './task-form/task-form.component';
import { environment } from '@env';
import { Task, TaskStatus, TaskPriority, IssueType } from '@shared/models/task.model';

describe('Frontend Integration Tests - Component -> Service -> Interceptor -> HTTP', () => {
  let httpMock: HttpTestingController;
  let taskService: TaskService;
  let authService: AuthService;
  let router: Router;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockTask: Task = {
    id: 'integration-task-1',
    key: 'INT-1',
    title: 'Integrated Task Flow',
    description: 'Testing full client integration stack',
    issueType: 'STORY' as IssueType,
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    storyPoints: 5,
    projectId: 'proj-int-1',
    projectName: 'Integration Project',
    reporterId: 'user-1',
    assigneeId: 'user-1',
    labels: ['integration', 'test'],
    dueDate: '2026-12-31T00:00:00Z',
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        ReactiveFormsModule,
        NoopAnimationsModule,
        TaskFormComponent
      ],
      providers: [
        TaskService,
        AuthService,
        ProjectService,
        UserService,
        { provide: NotificationService, useValue: notificationService },
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    taskService = TestBed.inject(TaskService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('1. Component-service-API integration test', () => {
    expect(taskService).toBeTruthy();
    expect(authService).toBeTruthy();
    expect(router).toBeTruthy();
  });

  it('2. Verify task creation flow from component to HTTP request', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Flush initial project and user lookups from ngOnInit
    const userReq = httpMock.expectOne(`${environment.apiUrl}/users`);
    userReq.flush([]);
    const projReq = httpMock.expectOne(`${environment.apiUrl}/projects`);
    projReq.flush([{ id: 'proj-int-1', key: 'INT', name: 'Integration' }]);

    component.taskForm.patchValue({
      title: 'Integrated Task Flow',
      projectId: 'proj-int-1',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      issueType: 'STORY'
    });

    component.onSubmit();

    const createReq = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body.title).toBe('Integrated Task Flow');
    createReq.flush(mockTask);

    expect(notificationService.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'integration-task-1']);
  });

  it('3. Verify task deletion flow', () => {
    taskService.deleteTask('integration-task-1').subscribe(res => {
      expect(res).toBeUndefined();
    });

    const deleteReq = httpMock.expectOne(`${environment.apiUrl}/tasks/integration-task-1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
  });

  it('4. Verify status update flow', () => {
    taskService.updateTaskStatus('integration-task-1', TaskStatus.IN_PROGRESS).subscribe(updated => {
      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
    });

    const patchReq = httpMock.expectOne(`${environment.apiUrl}/tasks/integration-task-1/status?status=IN_PROGRESS`);
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...mockTask, status: TaskStatus.IN_PROGRESS });
  });

  it('5. Verify search filter triggers service call', () => {
    taskService.getTasks({ search: 'Integrated', priority: 'HIGH' }).subscribe(tasks => {
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Integrated Task Flow');
    });

    const searchReq = httpMock.expectOne(req =>
      req.url === `${environment.apiUrl}/tasks` &&
      req.params.get('search') === 'Integrated' &&
      req.params.get('priority') === 'HIGH'
    );
    expect(searchReq.request.method).toBe('GET');
    searchReq.flush([mockTask]);
  });

  it('6. Verify error response updates component error state', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Flush initial lookups
    httpMock.expectOne(`${environment.apiUrl}/users`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/projects`).flush([]);

    component.taskForm.patchValue({
      title: 'Will Fail on Server',
      projectId: 'proj-1',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      issueType: 'STORY'
    });

    component.onSubmit();

    const createReq = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    createReq.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(component.loading()).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('7. Verify auth token included in outgoing requests', () => {
    localStorage.setItem('auth_token', 'mock-valid-jwt-token');

    const httpClient = TestBed.inject(HttpClient);
    httpClient.get(`${environment.apiUrl}/tasks/my-tasks`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/my-tasks`);
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-valid-jwt-token');
    req.flush([]);
  });

  it('8. Verify 401 response redirects to login', () => {
    localStorage.setItem('auth_token', 'expired-token');

    const httpClient = TestBed.inject(HttpClient);
    httpClient.get(`${environment.apiUrl}/tasks/my-tasks`).subscribe({
      next: () => fail('Should have failed with 401'),
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/my-tasks`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('9. Verify concurrent requests handled cleanly', fakeAsync(() => {
    let tasksResult: Task[] = [];
    let singleResult: Task | null = null;

    forkJoin({
      all: taskService.getTasks(),
      single: taskService.getTaskById('integration-task-1')
    }).subscribe(res => {
      tasksResult = res.all;
      singleResult = res.single;
    });

    const req1 = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    const req2 = httpMock.expectOne(`${environment.apiUrl}/tasks/integration-task-1`);

    req1.flush([mockTask]);
    req2.flush(mockTask);
    tick();

    expect(tasksResult.length).toBe(1);
    expect(singleResult).not.toBeNull();
    expect((singleResult as any)?.id).toBe('integration-task-1');
  }));
});
