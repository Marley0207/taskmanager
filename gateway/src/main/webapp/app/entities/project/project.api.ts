import axios from 'axios';
import { IProject, IProjectMember } from './project.model';

const apiUrl = 'services/taskmanager/api/projects';

export const getProjects = () => axios.get<IProject[]>(apiUrl);

export const getProjectsByWorkGroup = (workGroupId: number) => axios.get<IProject[]>(`${apiUrl}/by-work-group/${workGroupId}`);

// Funciones wrapper que filtran automáticamente los proyectos eliminados
export const getActiveProjects = async () => {
  const response = await axios.get<IProject[]>(apiUrl);
  return { ...response, data: response.data.filter(project => !project.deleted) };
};

export const getActiveProjectsByWorkGroup = async (workGroupId: number) => {
  const response = await axios.get<IProject[]>(`${apiUrl}/by-work-group/${workGroupId}`);
  return { ...response, data: response.data.filter(project => !project.deleted) };
};

export const getMyProjects = () => axios.get<IProject[]>(`${apiUrl}/my-projects`);

export const getProject = (id: number) => axios.get<IProject>(`${apiUrl}/${id}`);

export const createProject = (entity: IProject) => axios.post<IProject>(apiUrl, entity);

export const updateProject = (entity: IProject) => axios.put<IProject>(`${apiUrl}/${entity.id}`, entity);

export const deleteProject = (id: number) => axios.delete(`${apiUrl}/${id}`);

// Nueva función para soft delete - usar el endpoint DELETE que ya tiene la lógica implementada
export const softDeleteProject = async (id: number) => {
  // Usar el endpoint DELETE que ya marca deleted = true en el backend
  return axios.delete(`${apiUrl}/${id}`);
};

// Funciones para gestionar miembros asignados al proyecto
export const getProjectMembers = (id: number) => axios.get<IProjectMember[]>(`${apiUrl}/${id}/members`);

export const addMemberToProject = (projectId: number, userLogin: string) =>
  axios.put<IProject>(`${apiUrl}/${projectId}/assign-user/${userLogin}`);

export const removeMemberFromProject = (projectId: number, username: string) => axios.delete(`${apiUrl}/${projectId}/members/${username}`);

// Función para obtener miembros disponibles del work group para asignar al proyecto
export const getAvailableWorkGroupMembers = (workGroupId: number) =>
  axios.get(`/services/taskmanager/api/work-groups/${workGroupId}/members`);

export const patchProject = (id: number, patch: Partial<IProject>) => axios.patch(`/services/taskmanager/api/projects/${id}`, patch);
