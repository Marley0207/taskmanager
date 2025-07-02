import axios from 'axios';
import { ITask, IComment, ITaskMember } from './task.model';

const apiUrl = 'services/taskmanager/api/tasks';

export const getTasks = () => axios.get<ITask[]>(apiUrl);

export const getTasksByProject = (projectId: number) => axios.get<ITask[]>(`${apiUrl}/projects/${projectId}/tasks`);

export const getTasksByWorkGroup = (workGroupId: number) => axios.get<ITask[]>(`${apiUrl}/by-work-group/${workGroupId}`);

export const getMyTasks = () => axios.get<ITask[]>(`${apiUrl}/my-tasks`);

export const getTask = (id: number) => axios.get<ITask>(`${apiUrl}/${id}`);

export const createTask = (entity: any) => axios.post<ITask>(apiUrl, entity);

export const updateTask = (entity: ITask) => axios.put<ITask>(`${apiUrl}/${entity.id}`, entity);

export const deleteTask = (projectId: number, taskId: number) =>
  axios.delete(`/services/taskmanager/api/tasks/projects/${projectId}/tasks/${taskId}`);

// Funciones para gestionar miembros asignados a la tarea
export const getAssignedUsers = (taskId: number) => axios.get<ITaskMember[]>(`${apiUrl}/${taskId}/view-assigned-users`);

export const addMemberToTask = (taskId: number, userLogin: string) => axios.put<ITask>(`${apiUrl}/${taskId}/assign-user/${userLogin}`);

export const removeMemberFromTask = (taskId: number, userId: number) => axios.delete(`${apiUrl}/${taskId}/members/${userId}`);

// Función para actualizar todos los miembros asignados de una tarea
export const updateTaskMembers = (taskId: number, memberIds: number[]) =>
  axios.put(
    `${apiUrl}/${taskId}/members`,
    { memberIds },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

// Funciones para comentarios
export const getTaskComments = (taskId: number) => axios.get<IComment[]>(`services/taskmanager/api/comments/tasks/${taskId}/comments`);

export const addCommentToTask = (taskId: number, comment: IComment) => axios.post<IComment>(`${apiUrl}/${taskId}/comments`, comment);

export const updateComment = (commentId: number, comment: IComment) =>
  axios.put<IComment>(`services/taskmanager/api/comments/${commentId}`, comment);

export const deleteComment = (commentId: number) => axios.delete(`services/taskmanager/api/comments/${commentId}`);

export const patchComment = (commentId: number, patch: Partial<IComment>) =>
  axios.patch<IComment>(`services/taskmanager/api/comments/${commentId}`, patch, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

// Función para obtener miembros disponibles del work group para asignar a la tarea
export const getAvailableWorkGroupMembers = (workGroupId: number) =>
  axios.get(`services/taskmanager/api/work-groups/${workGroupId}/members`);

export const patchTask = (id: number, patch: Partial<ITask>) =>
  axios.patch(`${apiUrl}/${id}`, patch, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const archiveTask = (taskId: number) => axios.post<ITask>(`services/taskmanager/api/tasks/${taskId}/archive`);

export const createComment = (comment: IComment) => axios.post<IComment>('services/taskmanager/api/comments', comment);
