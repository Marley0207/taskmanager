import axios from 'axios';
import { IWorkGroup, IWorkGroupMember } from './work-group.model';

const apiUrl = 'services/taskmanager/api/work-groups';

export const getWorkGroups = () => axios.get<IWorkGroup[]>(apiUrl);

export const getMyWorkGroups = () => axios.get<IWorkGroup[]>(`${apiUrl}/my-groups`);

export const getWorkGroup = (id: number) => axios.get<IWorkGroup>(`${apiUrl}/${id}`);

export const createWorkGroup = (entity: IWorkGroup) => axios.post<IWorkGroup>(apiUrl, entity);

export const updateWorkGroup = (entity: IWorkGroup) => axios.put<IWorkGroup>(`${apiUrl}/${entity.id}`, entity);

export const deleteWorkGroup = (id: number) => axios.delete(`${apiUrl}/${id}`);

// Funciones para gestionar miembros del grupo
export const getWorkGroupMembers = (id: number) => axios.get<IWorkGroupMember[]>(`/services/taskmanager/api/work-groups/${id}/members`);

export const getAvailableUsers = () => axios.get('/services/taskmanager/api/users');

export const addMemberToWorkGroup = (workGroupId: number, userLogin: string) =>
  axios.post(`/services/taskmanager/api/work-groups/${workGroupId}/members?userLogin=${userLogin}`);

export const removeMemberFromWorkGroup = (workGroupId: number, userId: number) =>
  axios.delete(`/services/taskmanager/api/work-groups/${workGroupId}/members/${userId}`);

// Funciones para gestión de roles
export const promoteUserToModerator = (workGroupId: number, userLogin: string) =>
  axios.put(`/services/taskmanager/api/work-groups/${workGroupId}/promote/${userLogin}`);

export const demoteModeratorToMember = (workGroupId: number, userLogin: string) =>
  axios.put(`/services/taskmanager/api/work-groups/${workGroupId}/demote/${userLogin}`);

export const updateMemberRole = (workGroupId: number, userLogin: string, role: string) => {
  if (role === 'MODERADOR') {
    return promoteUserToModerator(workGroupId, userLogin);
  } else if (role === 'MIEMBRO') {
    return demoteModeratorToMember(workGroupId, userLogin);
  }
  throw new Error(`Rol no soportado: ${role}`);
};

export const transferOwnership = (workGroupId: number, newOwnerLogin: string) =>
  axios.put(`/services/taskmanager/api/work-groups/${workGroupId}/transfer-ownership?newOwnerLogin=${newOwnerLogin}`);

// Función para que un usuario salga del grupo (leave group)
export const leaveWorkGroup = (workGroupId: number) => axios.delete(`/services/taskmanager/api/work-groups/${workGroupId}/leave`);
