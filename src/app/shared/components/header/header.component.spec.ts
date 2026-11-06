import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './header.component';
import { AuthService } from '@core/auth/auth.service';
import { signal } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: signal({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DEVELOPER',
        createdAt: ''
      }),
      isAuthenticated: signal(true)
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render app title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('D&B Task Manager');
  });

  it('should show nav links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Projects');
  });

  it('should call logout on authService', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
