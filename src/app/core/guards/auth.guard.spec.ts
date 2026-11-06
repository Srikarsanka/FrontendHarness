import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: jasmine.createSpy().and.returnValue(false)
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should allow access when authenticated', () => {
    (Object.getOwnPropertyDescriptor(authServiceSpy, 'isAuthenticated')?.get as jasmine.Spy)?.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('should redirect to login when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
