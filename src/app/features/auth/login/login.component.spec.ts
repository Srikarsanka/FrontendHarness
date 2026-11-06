import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should validate email format', () => {
    component.loginForm.patchValue({ email: 'invalid', password: 'password' });
    expect(component.loginForm.get('email')?.hasError('email')).toBeTrue();
  });

  it('should be valid with correct data', () => {
    component.loginForm.patchValue({ email: 'test@example.com', password: 'password' });
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should call authService.login on valid submit', () => {
    const mockResponse = {
      token: 'token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', role: 'DEVELOPER', createdAt: '' }
    };
    authServiceSpy.login.and.returnValue(of(mockResponse as any));

    component.loginForm.patchValue({ email: 'test@example.com', password: 'password' });
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalled();
  });

  it('should show error on failed login', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

    component.loginForm.patchValue({ email: 'test@example.com', password: 'wrong' });
    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
  });
});
