import { IPriority } from '../priority/priority.model';

export interface ITask {
  id?: number;
  title: string;
  description?: string;
  priority: IPriority;
  status: TaskStatus;
  project: {
    id: number;
    title: string;
    members?: { id: string; login: string }[];
  };
  workGroup: {
    id: number;
    name: string;
  };
  workGroupId?: number;
  assignedMembers?: ITaskMember[];
  comments?: IComment[];
  createdBy?: {
    id: number;
    login: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
  parentTaskId?: number | null;
  subTaskIds?: number[];
  deleted?: boolean;
}

export interface IComment {
  id?: number;
  content: string;
  authorId: number;
  taskId: number;
  createdAt?: string;
  author?: {
    id: number;
    login: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface ITaskMember {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  WORKING_ON_IT = 'WORKING_ON_IT',
  DONE = 'DONE',
}

export const defaultValue: Readonly<ITask> = {
  title: '',
  description: '',
  priority: {
    id: 2, // ID de NORMAL en la base de datos
    name: 'NORMAL',
    hidden: false,
  },
  status: TaskStatus.NOT_STARTED,
  project: {
    id: 0,
    title: '',
  },
  workGroup: {
    id: 0,
    name: '',
  },
  assignedMembers: [],
  comments: [],
  deleted: false,
};

export const defaultComment: Readonly<IComment> = {
  content: '',
  authorId: 0,
  taskId: 0,
};
