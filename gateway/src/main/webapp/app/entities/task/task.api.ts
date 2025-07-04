import axios from 'axios';
import { ITask, IComment, ITaskMember } from './task.model';

const apiUrl = 'services/taskmanager/api/tasks';

export const getTasks = () => axios.get<ITask[]>(apiUrl);

export const getTasksByProject = (projectId: number) => axios.get<ITask[]>(`${apiUrl}/projects/${projectId}/tasks`);

export const getTasksByWorkGroup = (workGroupId: number) => axios.get<ITask[]>(`${apiUrl}/by-work-group/${workGroupId}`);

export const getMyTasks = () => axios.get<ITask[]>(`${apiUrl}/my-tasks`);

// Funciones wrapper que filtran automáticamente las tareas eliminadas
export const getActiveTasks = async () => {
  const response = await axios.get<ITask[]>(apiUrl);
  return { ...response, data: response.data.filter(task => !task.deleted) };
};

export const getActiveTasksByProject = async (projectId: number) => {
  const response = await axios.get<ITask[]>(`${apiUrl}/projects/${projectId}/tasks`);
  return { ...response, data: response.data.filter(task => !task.deleted) };
};

export const getActiveTasksByWorkGroup = async (workGroupId: number) => {
  const response = await axios.get<ITask[]>(`${apiUrl}/by-work-group/${workGroupId}`);
  return { ...response, data: response.data.filter(task => !task.deleted) };
};

export const getMyActiveTasks = async () => {
  const response = await axios.get<ITask[]>(`${apiUrl}/my-tasks`);
  return { ...response, data: response.data.filter(task => !task.deleted) };
};

export const getTask = (id: number) => axios.get<ITask>(`${apiUrl}/${id}`);

export const createTask = (entity: any) => axios.post<ITask>(apiUrl, entity);

export const updateTask = (entity: ITask) => axios.put<ITask>(`${apiUrl}/${entity.id}`, entity);

export const deleteTask = (projectId: number, taskId: number) =>
  axios.delete(`/services/taskmanager/api/tasks/projects/${projectId}/tasks/${taskId}`);

// Nueva función para soft delete - actualizar el campo deleted a true
export const softDeleteTask = async (projectId: number, taskId: number) => {
  // Primero obtener la tarea completa
  const taskResponse = await axios.get<ITask>(`${apiUrl}/${taskId}`);
  const task = taskResponse.data;

  // Crear un objeto con solo los campos necesarios, excluyendo las subtareas
  const updatedTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    archived: task.archived,
    deleted: true, // Marcar como eliminada
    workGroupId: task.workGroupId,
    parentTaskId: task.parentTaskId,
    // No incluir subTasks, project, workGroup, assignedMembers, comments para evitar conflictos
  };

  // Enviar la actualización usando PATCH
  return axios.patch<ITask>(`${apiUrl}/${taskId}`, updatedTask, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Funciones para gestionar miembros asignados a la tarea
export const getAssignedUsers = (taskId: number) => axios.get<ITaskMember[]>(`${apiUrl}/${taskId}/view-assigned-users`);

export const addMemberToTask = (taskId: number, userLogin: string) => axios.put<ITask>(`${apiUrl}/${taskId}/assign-user/${userLogin}`);

export const removeMemberFromTask = (projectId: number, taskId: number, username: string) =>
  axios.delete(`/services/taskmanager/api/tasks/projects/${projectId}/tasks/${taskId}/members/${username}`);

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

// Nuevos endpoints para tareas archivadas
export const getArchivedTasksByProject = (projectId: number) =>
  axios.get<ITask[]>(`services/taskmanager/api/tasks/archived/project/${projectId}`);

export const deleteArchivedTask = (taskId: number) => axios.delete(`${apiUrl}/${taskId}/archived`);

export const getMembersOfArchivedTask = (taskId: number) => axios.get(`/services/taskmanager/api/tasks/archived/${taskId}/members`);

// Endpoints para subtareas
export const getSubtasks = (parentTaskId: number) => axios.get<ITask[]>(`${apiUrl}/${parentTaskId}/subtasks`);

export const getParentTask = (taskId: number) => axios.get<ITask>(`${apiUrl}/${taskId}/parent`);

export const createSubTask = (parentTaskId: number, subTaskDTO: ITask) =>
  axios.post<ITask>(`${apiUrl}/${parentTaskId}/subtasks`, subTaskDTO);

export const moveTaskToSubtask = (taskId: number, parentTaskId: number) =>
  axios.put<ITask>(`${apiUrl}/${taskId}/move-to-parent/${parentTaskId}`);

export const removeFromParent = (taskId: number) => axios.put<ITask>(`${apiUrl}/${taskId}/remove-from-parent`);
