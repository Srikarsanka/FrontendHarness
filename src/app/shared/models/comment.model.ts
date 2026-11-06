import { User } from './user.model';

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author?: User | null;
  createdAt: string;
}
