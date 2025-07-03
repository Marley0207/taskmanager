import axios from 'axios';
import { IProject, IProjectMember } from './project.model';

const apiUrl = 'services/taskmanager/api/projects';

export const getProjects = () => axios.get<IProject[]>(apiUrl);

export const getProjectsByWorkGroup = (workGroupId: number) => axios.get<IProject[]>(`${apiUrl}/by-work-group/${workGroupId}`);

export const getMyProjects = () => axios.get<IProject[]>(`${apiUrl}/my-projects`);

export const getProject = (id: number) => axios.get<IProject>(`${apiUrl}/${id}`);

export const createProject = (entity: IProject) => axios.post<IProject>(apiUrl, entity);

export const updateProject = (entity: IProject) => axios.put<IProject>(`${apiUrl}/${entity.id}`, entity);

export const deleteProject = (id: number) => axios.delete(`${apiUrl}/${id}`);

// Funciones para gestionar miembros asignados al proyecto
export const getProjectMembers = (id: number) => axios.get<IProjectMember[]>(`${apiUrl}/${id}/members`);

export const addMemberToProject = (projectId: number, userLogin: string) =>
  axios.put<IProject>(`${apiUrl}/${projectId}/assign-user/${userLogin}`);

export const removeMemberFromProject = (projectId: number, username: string) => axios.delete(`${apiUrl}/${projectId}/members/${username}`);

// Función para obtener miembros disponibles del work group para asignar al proyecto
export const getAvailableWorkGroupMembers = (workGroupId: number) =>
  axios.get(`/services/taskmanager/api/work-groups/${workGroupId}/members`);

export const patchProject = (id: number, patch: Partial<IProject>) => axios.patch(`/services/taskmanager/api/projects/${id}`, patch);
