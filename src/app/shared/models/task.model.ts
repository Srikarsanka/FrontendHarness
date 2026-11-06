import { User } from './user.model';

export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC';

export interface Task {
  id: string;
  key?: string;
  title: string;
  description: string;
  issueType?: IssueType;
  storyPoints?: number;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  assigneeId?: string;
  assignee?: User | null;
  reporterId: string;
  labels: string[];
  dueDate: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}
