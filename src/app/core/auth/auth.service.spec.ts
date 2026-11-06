import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginRequest, RegisterRequest } from '@shared/models/auth.model';
import { UserRole } from '@shared/models/user.model';
import { environment } from '@env';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockAuthResponse = {
    token: 'mock-jwt-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.DEVELOPER,
      createdAt: new Date().toISOString()
    }
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    localStorage.clear();
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and store token', () => {
    const loginReq: LoginRequest = { email: 'test@example.com', password: 'password' };

    service.login(loginReq).subscribe(response => {
      expect(response.token).toBe('mock-jwt-token');
      expect(service.currentUser()).toEqual(mockAuthResponse.user);
      expect(service.isAuthenticated()).toBeTrue();
      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
  });

  it('should register and store token', () => {
    const registerReq: RegisterRequest = {
      email: 'new@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
      role: UserRole.DEVELOPER
    };

    service.register(registerReq).subscribe(response => {
      expect(response.token).toBe('mock-jwt-token');
      expect(service.isAuthenticated()).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('auth_user', JSON.stringify(mockAuthResponse.user));

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return stored token', () => {
    localStorage.setItem('auth_token', 'stored-token');
    expect(service.getToken()).toBe('stored-token');
  });

  it('should restore user from localStorage on init', () => {
    localStorage.setItem('auth_token', 'stored-token');
    localStorage.setItem('auth_user', JSON.stringify(mockAuthResponse.user));

    const newService = new AuthService();
    expect(newService.currentUser()).toEqual(mockAuthResponse.user);
    expect(newService.isAuthenticated()).toBeTrue();
  });
});
