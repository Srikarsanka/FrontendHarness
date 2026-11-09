import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { TaskFormComponent } from './task-form.component';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { ProjectService } from '@core/services/project.service';
import { NotificationService } from '@core/services/notification.service';
import { TaskStatus, TaskPriority, IssueType, Task } from '@shared/models/task.model';

describe('TaskFormComponent - Unit Tests', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockProjectService: jasmine.SpyObj<ProjectService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockExistingTask: Task = {
    id: 'task-100',
    key: 'PROJ-100',
    title: 'Existing High Priority Bug',
    description: 'Detailed description of the bug',
    issueType: 'BUG' as IssueType,
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    storyPoints: 5,
    projectId: 'proj-1',
    projectName: 'Alpha Project',
    reporterId: 'user-1',
    assigneeId: 'user-2',
    labels: ['bug', 'urgent'],
    dueDate: '2026-12-31T00:00:00Z',
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', ['getTask', 'createTask', 'updateTask']);
    mockUserService = jasmine.createSpyObj('UserService', ['getUsers']);
    mockProjectService = jasmine.createSpyObj('ProjectService', ['getProjects']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockUserService.getUsers.and.returnValue(of([
      { id: 'user-1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith', role: 'DEVELOPER' } as any
    ]));
    mockProjectService.getProjects.and.returnValue(of([
      { id: 'proj-1', key: 'PROJ', name: 'Alpha Project' } as any
    ]));
    mockTaskService.createTask.and.returnValue(of(mockExistingTask));
    mockTaskService.updateTask.and.returnValue(of(mockExistingTask));

    await TestBed.configureTestingModule({
      imports: [
        TaskFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: UserService, useValue: mockUserService },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. Form initializes with default values', () => {
    expect(component.taskForm).toBeDefined();
    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('issueType')?.value).toBe('STORY');
    expect(component.taskForm.get('status')?.value).toBe(TaskStatus.TODO);
    expect(component.taskForm.get('priority')?.value).toBe(TaskPriority.MEDIUM);
    expect(component.taskForm.get('storyPoints')?.value).toBe(3);
  });

  it('2. Validate required title field', () => {
    const titleControl = component.taskForm.get('title');
    titleControl?.setValue('');
    expect(titleControl?.valid).toBeFalse();
    expect(titleControl?.hasError('required')).toBeTrue();

    titleControl?.setValue('AB'); // Under minLength 3
    expect(titleControl?.valid).toBeFalse();
    expect(titleControl?.hasError('minlength')).toBeTrue();

    titleControl?.setValue('Valid Task Title');
    expect(titleControl?.valid).toBeTrue();
  });

  it('3. Validate priority selection', () => {
    const priorityControl = component.taskForm.get('priority');
    expect(priorityControl?.valid).toBeTrue();

    priorityControl?.setValue(TaskPriority.CRITICAL);
    expect(priorityControl?.value).toBe(TaskPriority.CRITICAL);
    expect(priorityControl?.valid).toBeTrue();

    priorityControl?.setValue(null);
    expect(priorityControl?.valid).toBeFalse();
    expect(priorityControl?.hasError('required')).toBeTrue();
  });

  it('4. Validate status selection', () => {
    const statusControl = component.taskForm.get('status');
    expect(statusControl?.valid).toBeTrue();

    statusControl?.setValue(TaskStatus.DONE);
    expect(statusControl?.value).toBe(TaskStatus.DONE);
    expect(statusControl?.valid).toBeTrue();

    statusControl?.setValue(null);
    expect(statusControl?.valid).toBeFalse();
    expect(statusControl?.hasError('required')).toBeTrue();
  });

  it('5. Verify form submission with valid data', () => {
    component.taskForm.patchValue({
      title: 'Deploy new auth module',
      description: 'Implement JWT refresh token mechanism',
      issueType: 'TASK',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      projectId: 'proj-1'
    });

    expect(component.taskForm.valid).toBeTrue();
    component.onSubmit();

    expect(mockTaskService.createTask).toHaveBeenCalled();
    expect(mockNotificationService.success).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks', mockExistingTask.id]);
  });

  it('6. Verify edit mode loads existing task', () => {
    mockTaskService.getTask.and.returnValue(of(mockExistingTask));

    // Simulate route having id param
    (component as any).route = {
      snapshot: {
        paramMap: {
          get: (key: string) => (key === 'id' ? 'task-100' : null)
        }
      }
    };

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditMode()).toBeTrue();
    expect(mockTaskService.getTask).toHaveBeenCalledWith('task-100');
    expect(component.taskForm.get('title')?.value).toBe('Existing High Priority Bug');
    expect(component.taskForm.get('priority')?.value).toBe(TaskPriority.HIGH);
    expect(component.taskForm.get('status')?.value).toBe(TaskStatus.IN_PROGRESS);
  });
});
