import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard.component';
import { ProjectService } from '@core/services/project.service';
import { TaskService } from '@core/services/task.service';
import { AuthService } from '@core/auth/auth.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getProjects']);
    projectServiceSpy.getProjects.and.returnValue(of([]));

    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['getMyTasks']);
    taskServiceSpy.getMyTasks.and.returnValue(of([]));

    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: signal({ id: '1', firstName: 'John', lastName: 'Doe', email: 'a@b.com', role: 'DEVELOPER', createdAt: '' }),
      isAuthenticated: signal(true)
    });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    expect(component.loading()).toBeFalse();
    expect(component.projects()).toEqual([]);
    expect(component.myTasks()).toEqual([]);
  });

  it('should compute overdue tasks as empty when no tasks', () => {
    expect(component.overdueTasks().length).toBe(0);
  });

  it('should show welcome message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome back, John');
  });
});
