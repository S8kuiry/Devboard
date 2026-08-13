export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/** A task as filled out in the form — no id until the server assigns one. */
export interface TaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  ownerEmail: string;
  assignedEmails: string[];
}

/** A task that exists server-side, so it always carries an id. */
export interface Task extends TaskDraft {
  id: number;
}
