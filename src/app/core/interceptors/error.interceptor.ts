import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      } else if (error.status === 403) {
        notification.error('Access denied. You do not have permission to perform this action.');
      } else if (error.status === 404) {
        notification.error('Resource not found.');
      } else if (error.status === 0) {
        notification.error('Unable to connect to server. Please check your network connection.');
      } else if (error.status >= 500) {
        notification.error('A server error occurred. Please try again later.');
      } else {
        const message = error.error?.message || error.message || 'An unexpected error occurred.';
        notification.error(message);
      }

      return throwError(() => error);
    })
  );
};
