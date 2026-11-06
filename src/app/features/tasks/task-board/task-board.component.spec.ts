import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TaskBoardComponent } from './task-board.component';
import { TaskService } from '@core/services/task.service';
import { NotificationService } from '@core/services/notification.service';
import { TaskStatus, TaskPriority } from '@shared/models/task.model';

describe('TaskBoardComponent', () => {
  let component: TaskBoardComponent;
  let fixture: ComponentFixture<TaskBoardComponent>;

  const mockTasks = [
    {
      id: '1', title: 'Task 1', description: '', status: TaskStatus.TODO,
      priority: TaskPriority.HIGH, projectId: 'p1', projectName: 'Project 1',
      assigneeId: 'u1', assignee: null, reporterId: 'u2', labels: [],
      dueDate: '', commentCount: 0, createdAt: '', updatedAt: ''
    },
    {
      id: '2', title: 'Task 2', description: '', status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM, projectId: 'p1', projectName: 'Project 1',
      assigneeId: 'u1', assignee: null, reporterId: 'u2', labels: [],
      dueDate: '', commentCount: 0, createdAt: '', updatedAt: ''
    },
    {
      id: '3', title: 'Task 3', description: '', status: TaskStatus.DONE,
      priority: TaskPriority.LOW, projectId: 'p1', projectName: 'Project 1',
      assigneeId: 'u2', assignee: null, reporterId: 'u1', labels: [],
      dueDate: '', commentCount: 0, createdAt: '', updatedAt: ''
    }
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['getTasksByProject', 'updateTaskStatus']);
    taskServiceSpy.getTasksByProject.and.returnValue(of(mockTasks));
    taskServiceSpy.updateTaskStatus.and.returnValue(of(mockTasks[0]));

    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'p1' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks and distribute to columns', () => {
    expect(component.tasks().length).toBe(3);
    expect(component.todoTasks().length).toBe(1);
    expect(component.inProgressTasks().length).toBe(1);
    expect(component.doneTasks().length).toBe(1);
    expect(component.backlogTasks().length).toBe(0);
  });

  it('should render all 5 columns', () => {
    expect(component.columns.length).toBe(5);
  });

  it('should detect overdue tasks', () => {
    const overdueTask = { ...mockTasks[0], dueDate: '2020-01-01', status: TaskStatus.TODO };
    expect(component.isOverdue(overdueTask as any)).toBeTrue();
  });

  it('should not mark done tasks as overdue', () => {
    const doneTask = { ...mockTasks[0], dueDate: '2020-01-01', status: TaskStatus.DONE };
    expect(component.isOverdue(doneTask as any)).toBeFalse();
  });
});
