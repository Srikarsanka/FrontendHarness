import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { environment } from '@env';
import { TaskStatus, TaskPriority, Task, IssueType } from '@shared/models/task.model';

describe('TaskService - Unit Tests', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: Task = {
    id: 'task-101',
    key: 'PROJ-101',
    title: 'Unit Test Task for Enterprise CI',
    description: 'Verify service-level HTTP interactions',
    issueType: 'STORY' as IssueType,
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    storyPoints: 5,
    projectId: 'proj-1',
    projectName: 'Enterprise Task Manager',
    reporterId: 'user-1',
    assigneeId: 'user-2',
    labels: ['unit-test', 'ci'],
    dueDate: '2026-12-31',
    commentCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. Verify getTasks retrieves all tasks with optional search/filters', () => {
    service.getTasks({ search: 'Enterprise', status: TaskStatus.TODO }).subscribe(tasks => {
      expect(tasks).toEqual([mockTask]);
      expect(tasks.length).toBe(1);
    });

    const req = httpMock.expectOne(req =>
      req.url === `${environment.apiUrl}/tasks` &&
      req.params.get('search') === 'Enterprise' &&
      req.params.get('status') === TaskStatus.TODO
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('2. Verify getTaskById retrieves specific task', () => {
    service.getTaskById('task-101').subscribe(task => {
      expect(task).toEqual(mockTask);
      expect(task.id).toBe('task-101');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-101`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTask);
  });

  it('3. Verify createTask sends POST request', () => {
    const newTaskPayload: Partial<Task> = {
      title: 'New Automated Task',
      projectId: 'proj-1',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM
    };

    service.createTask(newTaskPayload).subscribe(created => {
      expect(created.id).toBe('task-101');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTaskPayload);
    req.flush(mockTask);
  });

  it('4. Verify updateTask sends PUT request', () => {
    const updatePayload: Partial<Task> = { title: 'Updated Title' };

    service.updateTask('task-101', updatePayload).subscribe(updated => {
      expect(updated.title).toBe(mockTask.title);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-101`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatePayload);
    req.flush({ ...mockTask, title: 'Updated Title' });
  });

  it('5. Verify deleteTask sends DELETE request', () => {
    service.deleteTask('task-101').subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-101`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('6. Verify updateTaskStatus sends PATCH request', () => {
    service.updateTaskStatus('task-101', TaskStatus.DONE).subscribe(task => {
      expect(task.status).toBe(TaskStatus.DONE);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-101/status?status=DONE`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockTask, status: TaskStatus.DONE });
  });

  it('7. Verify error handling on API failure', () => {
    service.getTaskById('invalid-id').subscribe({
      next: () => fail('Expected 404 error'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.statusText).toBe('Not Found');
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/invalid-id`);
    req.flush({ message: 'Task not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('8. Verify environment API URL is used', () => {
    service.getMyTasks().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/my-tasks`);
    expect(req.request.url.startsWith(environment.apiUrl)).toBeTrue();
    req.flush([]);
  });
});
