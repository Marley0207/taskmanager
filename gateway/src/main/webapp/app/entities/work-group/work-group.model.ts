export interface IWorkGroup {
  id?: number;
  name: string;
  description?: string;
  owner?: {
    id: number;
    login: string;
    firstName?: string;
    lastName?: string;
  };
  deleted?: boolean;
}

export interface IWorkGroupMember {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: 'OWNER' | 'MODERADOR' | 'MIEMBRO';
}

export const defaultValue: Readonly<IWorkGroup> = {
  name: '',
  deleted: false,
};
