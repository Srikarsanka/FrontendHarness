import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { UserRole } from '@shared/models/user.model';

export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const notification = inject(NotificationService);

    const user = authService.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    notification.error('Access denied. You do not have the required permissions.');
    router.navigate(['/dashboard']);
    return false;
  };
}
