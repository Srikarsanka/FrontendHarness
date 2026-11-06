export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER'
}
