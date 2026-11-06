import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { environment } from '@env';
import { TaskStatus, TaskPriority } from '@shared/models/task.model';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'A test task',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    projectId: 'proj1',
    projectName: 'Project 1',
    assigneeId: 'user1',
    assignee: null,
    reporterId: 'user2',
    labels: ['bug'],
    dueDate: '2024-06-01',
    commentCount: 2,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should get tasks by project', () => {
    service.getTasksByProject('proj1').subscribe(tasks => {
      expect(tasks.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/project/proj1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should get my tasks', () => {
    service.getMyTasks().subscribe(tasks => {
      expect(tasks.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/my-tasks`);
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should get a single task', () => {
    service.getTask('1').subscribe(task => {
      expect(task.id).toBe('1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTask);
  });

  it('should create a task', () => {
    const newTask = { title: 'New Task', projectId: 'proj1' };
    service.createTask(newTask).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTask);
    req.flush(mockTask);
  });

  it('should update a task', () => {
    const update = { title: 'Updated' };
    service.updateTask('1', update).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockTask);
  });

  it('should update task status', () => {
    service.updateTaskStatus('1', TaskStatus.IN_PROGRESS).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: TaskStatus.IN_PROGRESS });
    req.flush(mockTask);
  });

  it('should delete a task', () => {
    service.deleteTask('1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
