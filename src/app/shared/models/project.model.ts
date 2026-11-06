import { User } from './user.model';

export interface Project {
  id: string;
  key?: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  memberIds: string[];
  memberCount: number;
  owner?: User;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}
