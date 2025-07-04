export interface IProject {
  id?: number;
  title: string;
  description?: string;
  workGroup: {
    id: number;
    name: string;
  };
  assignedMembers?: IProjectMember[];
  members?: IProjectMember[];
  createdBy?: {
    id: number;
    login: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
}

export interface IProjectMember {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const defaultValue: Readonly<IProject> = {
  title: '',
  description: '',
  workGroup: {
    id: 0,
    name: '',
  },
  assignedMembers: [],
  members: [],
  deleted: false,
};
